import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import AuditService from './AuditService';

// Types for NHS Spine Service
export interface PatientDetails {
  resourceType: string;
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    use: string;
    family: string;
    given: string[];
  }>;
  gender: string;
  birthDate: string;
  address?: Array<{
    use: string;
    line: string[];
    postalCode: string;
  }>;
  telecom?: Array<{
    system: string;
    value: string;
    use: string;
  }>;
}

export interface ExemptionDetails {
  exemptionStatus: boolean;
  exemptionType?: string;
  expiryDate?: string;
  certificateNumber?: string;
}

export interface EligibilityStatus {
  eligibilityStatus: boolean;
  eligibilityReason?: string;
  validFrom?: string;
  validTo?: string;
}

export interface NHSAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// NHS Spine API service for interacting with NHS Spine
export class NHSSpineService {
  private clientId: string;
  private clientSecret: string;
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;
  private tokenUrl: string;
  private token: string | null;
  private tokenExpiry: Date | null;
  private cache: NodeCache;

  constructor() {
    this.clientId = process.env.NHS_CLIENT_ID || '';
    this.clientSecret = process.env.NHS_CLIENT_SECRET || '';
    this.apiKey = process.env.NHS_API_KEY || '';
    this.baseUrl = 'https://sandbox.api.service.nhs.uk/';
    this.tokenUrl = 'https://api.service.nhs.uk/oauth2/token';
    this.token = null;
    this.tokenExpiry = null;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // Initialize cache with TTL of 1 hour for patient data, 15 minutes for exemption status
    this.cache = new NodeCache({
      stdTTL: 3600, // Default TTL in seconds
      checkperiod: 600, // Check for expired keys every 10 minutes
    });
  }

  /**
   * Get OAuth token for NHS API access
   * @returns OAuth token
   */
  private async getToken(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('scope', 'urn:nhsd:fhir:rest:read:patient urn:nhsd:fhir:rest:read:medication');

      const response = await axios.post<NHSAuthToken>(
        this.tokenUrl,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.token = response.data.access_token;
      // Set expiry time (usually 1 hour) with 5 minute buffer
      const expiresIn = (response.data.expires_in || 3600) - 300;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      // Update headers with new token
      this.headers['Authorization'] = `Bearer ${this.token}`;

      return this.token;
    } catch (error) {
      console.error('Error obtaining NHS API token:', error);
      throw new Error('Failed to authenticate with NHS API');
    }
  }

  /**
   * Generate a request ID for NHS API calls
   * @returns UUID v4 string
   */
  private generateRequestId(): string {
    return uuidv4();
  }

  /**
   * Handle NHS API errors with appropriate responses
   * @param error - The error from NHS API
   * @param context - Context of the operation
   * @param retryCount - Number of retries attempted (default: 0)
   * @param maxRetries - Maximum number of retries (default: 3)
   * @returns Standardized error response or retried operation result
   */
  private async handleNHSApiError(error: any, context: string, retryCount = 0, maxRetries = 3, retryOperation?: () => Promise<any>): Promise<any> {
    // Log error with context
    console.error(`NHS API Error (${context}):`, {
      message: error.message,
      statusCode: error.response?.status,
      errorCode: error.response?.data?.errorCode,
      details: error.response?.data,
      retryCount,
    });

    // Determine if error is retryable
    const isRetryable = [429, 503, 504].includes(error.response?.status);

    // Implement retry logic for retryable errors
    if (isRetryable && retryCount < maxRetries && retryOperation) {
      // Calculate exponential backoff delay: 2^retryCount * 1000ms + random jitter
      const backoffDelay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;

      console.log(`Retrying ${context} operation in ${Math.round(backoffDelay)}ms (attempt ${retryCount + 1}/${maxRetries})`);

      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, backoffDelay));

      // Retry the operation
      try {
        return await retryOperation();
      } catch (retryError) {
        // If retry fails, handle the error with incremented retry count
        return this.handleNHSApiError(retryError, context, retryCount + 1, maxRetries, retryOperation);
      }
    }

    // If not retryable or max retries reached, create standardized error
    const enhancedError = new Error(
      `NHS API Error (${context}): ${error.response?.data?.message || error.message}`
    );

    // Add additional properties to the error
    Object.assign(enhancedError, {
      statusCode: error.response?.status,
      errorCode: error.response?.data?.errorCode,
      retryable: isRetryable,
      context,
      retryCount,
      maxRetries,
    });

    // Log to audit trail for significant errors
    if (error.response?.status !== 429) { // Don't log rate limit errors to avoid spam
      this.logActivity('API_ERROR', 'SYSTEM', {
        context,
        statusCode: error.response?.status,
        errorCode: error.response?.data?.errorCode,
        retryCount,
        timestamp: new Date().toISOString(),
      });
    }

    throw enhancedError;
  }

  /**
   * Get patient details by NHS number
   * @param nhsNumber - The patient's NHS number
   * @returns Patient details
   */
  async getPatientByNhsNumber(nhsNumber: string): Promise<PatientDetails> {
    // Check cache first
    const cacheKey = `patient_${nhsNumber}`;
    const cachedData = this.cache.get<PatientDetails>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Define the operation as a function that can be retried
    const fetchPatientOperation = async (): Promise<PatientDetails> => {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.get(
        `${this.baseUrl}personal-demographics/FHIR/R4/Patient/${nhsNumber}`,
        { headers }
      );

      // Cache the result
      this.cache.set(cacheKey, response.data);

      // Log successful API call
      this.logActivity('GET_PATIENT', nhsNumber, {
        requestId,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    };

    try {
      return await fetchPatientOperation();
    } catch (error) {
      return this.handleNHSApiError(error, 'getPatientByNhsNumber', 0, 3, fetchPatientOperation);
    }
  }

  /**
   * Search for patients by demographics
   * @param params - Search parameters (family name, given name, birthdate)
   * @returns List of matching patients
   */
  async searchPatients(params: { family?: string; given?: string; birthdate?: string }): Promise<any> {
    try {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.get(
        `${this.baseUrl}personal-demographics/FHIR/R4/Patient`,
        {
          headers,
          params
        }
      );

      return response.data;
    } catch (error) {
      return this.handleNHSApiError(error, 'searchPatients');
    }
  }

  /**
   * Check patient exemption status
   * @param nhsNumber - The patient's NHS number
   * @returns Exemption status details
   */
  async checkExemptionStatus(nhsNumber: string): Promise<ExemptionDetails> {
    // Check cache first with shorter TTL for exemption status
    const cacheKey = `exemption_${nhsNumber}`;
    const cachedData = this.cache.get<ExemptionDetails>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Define the operation as a function that can be retried
    const checkExemptionOperation = async (): Promise<ExemptionDetails> => {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.get(
        `${this.baseUrl}prescription-exemption/1.0.0/exemptions/${nhsNumber}`,
        { headers }
      );

      // Cache the result with a shorter TTL (15 minutes)
      this.cache.set(cacheKey, response.data, 900);

      // Log successful API call
      this.logActivity('CHECK_EXEMPTION', nhsNumber, {
        requestId,
        exemptionType: response.data.exemptionType,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    };

    try {
      return await checkExemptionOperation();
    } catch (error) {
      return this.handleNHSApiError(error, 'checkExemptionStatus', 0, 3, checkExemptionOperation);
    }
  }

  /**
   * Verify patient eligibility for services
   * @param nhsNumber - The patient's NHS number
   * @param serviceType - The type of service to check eligibility for
   * @returns Eligibility status
   */
  async verifyEligibility(nhsNumber: string, serviceType: string): Promise<EligibilityStatus> {
    // Check cache first
    const cacheKey = `eligibility_${nhsNumber}_${serviceType}`;
    const cachedData = this.cache.get<EligibilityStatus>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Define the operation as a function that can be retried
    const verifyEligibilityOperation = async (): Promise<EligibilityStatus> => {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.post(
        `${this.baseUrl}eligibility/FHIR/R4/verify`,
        {
          patientNhsNumber: nhsNumber,
          serviceType: serviceType,
          checkDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        },
        { headers }
      );

      // Cache the result
      this.cache.set(cacheKey, response.data, 1800); // 30 minute TTL

      // Log successful API call
      this.logActivity('VERIFY_ELIGIBILITY', nhsNumber, {
        requestId,
        serviceType,
        eligibilityStatus: response.data.eligibilityStatus,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    };

    try {
      return await verifyEligibilityOperation();
    } catch (error) {
      return this.handleNHSApiError(error, 'verifyEligibility', 0, 3, verifyEligibilityOperation);
    }
  }

  /**
   * Get patient's GP details
   * @param nhsNumber - The patient's NHS number
   * @returns GP details
   */
  async getPatientGP(nhsNumber: string): Promise<any> {
    try {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.get(
        `${this.baseUrl}personal-demographics/FHIR/R4/Patient/${nhsNumber}/general-practitioner`,
        { headers }
      );

      return response.data;
    } catch (error) {
      return this.handleNHSApiError(error, 'getPatientGP');
    }
  }

  /**
   * Validate NHS number using modulus 11 algorithm
   * @param nhsNumber - The NHS number to validate
   * @returns Whether the NHS number is valid
   */
  validateNHSNumber(nhsNumber: string): boolean {
    // Remove any spaces
    nhsNumber = nhsNumber.replace(/\s/g, '');

    // Check if it's 10 digits
    if (!/^\d{10}$/.test(nhsNumber)) {
      return false;
    }

    // Apply the Modulus 11 algorithm
    const digits = nhsNumber.split('').map(Number);
    const checkDigit = digits.pop() as number;

    // Multiply each digit by its position weight (10 to 2)
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }

    // Calculate the remainder when divided by 11
    const remainder = sum % 11;

    // Calculate the expected check digit (11 - remainder, but 11 becomes 0)
    const expectedCheckDigit = (11 - remainder) % 11;

    // Compare with the actual check digit
    return checkDigit === expectedCheckDigit;
  }

  /**
   * Clear cache for a specific patient
   * @param nhsNumber - The patient's NHS number
   */
  clearPatientCache(nhsNumber: string): void {
    this.cache.del(`patient_${nhsNumber}`);
    this.cache.del(`exemption_${nhsNumber}`);
    this.cache.del(new RegExp(`^eligibility_${nhsNumber}_.*`));
  }

  /**
   * Log NHS API activity for audit purposes
   * @param action - The action performed
   * @param nhsNumber - The NHS number involved
   * @param details - Additional details about the action
   * @param userId - The user who performed the action (if applicable)
   */
  private async logActivity(action: string, nhsNumber: string, details?: any, userId?: string): Promise<void> {
    // Use the AuditService to log the activity
    await AuditService.logNhsApiAction(
      action as any, // Cast to AuditAction type
      nhsNumber,
      details,
      userId
    );

    // Also log to console for development purposes
    console.log(`NHS API Activity: ${action}`, {
      nhsNumber: nhsNumber.slice(-4).padStart(nhsNumber.length, '*'), // Mask NHS number in logs
      timestamp: new Date().toISOString(),
      details: details ? JSON.stringify(details) : null,
    });
  }
}

export default new NHSSpineService();
