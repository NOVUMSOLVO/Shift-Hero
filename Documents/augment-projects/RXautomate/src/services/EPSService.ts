import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import AuditService from './AuditService';

// Types for EPS Service
export interface Prescription {
  resourceType: string;
  id: string;
  status: PrescriptionStatus;
  intent: string;
  medicationReference?: {
    reference: string;
    display: string;
  };
  medicationCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
    display?: string;
  };
  authoredOn: string;
  requester: {
    reference: string;
    display?: string;
  };
  performer?: Array<{
    actor: {
      reference: string;
      display?: string;
    };
  }>;
  dosageInstruction?: Array<{
    text: string;
    timing?: {
      repeat?: {
        frequency: number;
        period: number;
        periodUnit: string;
      };
    };
    doseAndRate?: Array<{
      doseQuantity?: {
        value: number;
        unit: string;
        system: string;
        code: string;
      };
    }>;
  }>;
  dispenseRequest?: {
    validityPeriod?: {
      start: string;
      end: string;
    };
    quantity?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
    performer?: {
      reference: string;
      display?: string;
    };
  };
  substitution?: {
    allowedBoolean: boolean;
    reason?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
  };
}

export type PrescriptionStatus =
  | 'active'
  | 'on-hold'
  | 'cancelled'
  | 'completed'
  | 'entered-in-error'
  | 'stopped'
  | 'draft'
  | 'unknown';

export interface PrescriptionBundle {
  resourceType: string;
  type: string;
  total: number;
  link: Array<{
    relation: string;
    url: string;
  }>;
  entry: Array<{
    resource: Prescription;
  }>;
}

export interface NHSAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface PrescriptionUpdateRequest {
  resourceType: string;
  id: string;
  status: PrescriptionStatus;
  statusReason?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
}

export interface PrescriptionSearchParams {
  status?: PrescriptionStatus | PrescriptionStatus[];
  dateWritten?: string;
  dateWrittenFrom?: string;
  dateWrittenTo?: string;
  _count?: number;
  _sort?: string;
  searchTerm?: string;
  medicationName?: string;
  patientName?: string;
  nhsNumber?: string;
  prescriberId?: string;
  prescriptionId?: string;
  includeHistory?: boolean;
}

// Electronic Prescription Service (EPS) API service
export class EPSService {
  private clientId: string;
  private clientSecret: string;
  private apiKey: string;
  private baseUrl: string;
  private tokenUrl: string;
  private token: string | null;
  private tokenExpiry: Date | null;
  private headers: Record<string, string>;
  private cache: NodeCache;

  constructor() {
    this.clientId = process.env.NHS_CLIENT_ID || '';
    this.clientSecret = process.env.NHS_CLIENT_SECRET || '';
    this.apiKey = process.env.NHS_API_KEY || '';
    this.baseUrl = process.env.NHS_API_BASE_URL
      ? `${process.env.NHS_API_BASE_URL}/electronic-prescriptions/FHIR/R4/`
      : 'https://sandbox.api.service.nhs.uk/electronic-prescriptions/FHIR/R4/';
    this.tokenUrl = process.env.NHS_AUTH_URL || 'https://api.service.nhs.uk/oauth2/token';
    this.token = null;
    this.tokenExpiry = null;
    this.headers = {
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // Initialize cache with TTL of 15 minutes for prescription data
    this.cache = new NodeCache({
      stdTTL: 900, // 15 minutes in seconds
      checkperiod: 300, // Check for expired keys every 5 minutes
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
      params.append('scope', 'urn:nhsd:fhir:rest:read:medication urn:nhsd:fhir:rest:write:medication');

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
  private async handleEpsApiError(error: any, context: string, retryCount = 0, maxRetries = 3, retryOperation?: () => Promise<any>): Promise<any> {
    // Log error with context
    console.error(`EPS API Error (${context}):`, {
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
        return this.handleEpsApiError(retryError, context, retryCount + 1, maxRetries, retryOperation);
      }
    }

    // If not retryable or max retries reached, create standardized error
    const enhancedError = new Error(
      `EPS API Error (${context}): ${error.response?.data?.message || error.message}`
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
   * Get prescription details by prescription ID
   * @param prescriptionId - The prescription ID
   * @returns Prescription details
   */
  async getPrescription(prescriptionId: string): Promise<Prescription> {
    // Check cache first
    const cacheKey = `prescription_${prescriptionId}`;
    const cachedData = this.cache.get<Prescription>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Define the operation as a function that can be retried
    const fetchPrescriptionOperation = async (): Promise<Prescription> => {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.get(
        `${this.baseUrl}MedicationRequest/${prescriptionId}`,
        { headers }
      );

      // Cache the result
      this.cache.set(cacheKey, response.data);

      // Log successful API call
      this.logActivity('GET_PRESCRIPTION', prescriptionId, {
        requestId,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    };

    try {
      return await fetchPrescriptionOperation();
    } catch (error) {
      return this.handleEpsApiError(error, 'getPrescription', 0, 3, fetchPrescriptionOperation);
    }
  }

  /**
   * Get all prescriptions for a pharmacy
   * @param pharmacyOdsCode - The pharmacy ODS code
   * @param params - Optional search parameters
   * @returns List of prescriptions
   */
  async getPharmacyPrescriptions(pharmacyOdsCode: string, params?: PrescriptionSearchParams): Promise<PrescriptionBundle> {
    // Generate cache key based on ODS code and search params
    const cacheKey = `pharmacy_prescriptions_${pharmacyOdsCode}_${JSON.stringify(params || {})}`;
    const cachedData = this.cache.get<PrescriptionBundle>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Define the operation as a function that can be retried
    const fetchPharmacyPrescriptionsOperation = async (): Promise<PrescriptionBundle> => {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      // Build query parameters
      const queryParams: Record<string, string> = {
        performer: pharmacyOdsCode,
      };

      // Add optional search parameters
      if (params) {
        if (params.status) {
          if (Array.isArray(params.status)) {
            queryParams.status = params.status.join(',');
          } else {
            queryParams.status = params.status;
          }
        }
        if (params.dateWritten) {
          queryParams.dateWritten = params.dateWritten;
        }
        if (params.dateWrittenFrom) {
          queryParams['dateWritten:ge'] = params.dateWrittenFrom;
        }
        if (params.dateWrittenTo) {
          queryParams['dateWritten:le'] = params.dateWrittenTo;
        }
        if (params._count) {
          queryParams._count = params._count.toString();
        }
        if (params._sort) {
          queryParams._sort = params._sort;
        }
      }

      const response = await axios.get(
        `${this.baseUrl}MedicationRequest`,
        {
          headers,
          params: queryParams
        }
      );

      // Cache the result
      this.cache.set(cacheKey, response.data);

      // Log successful API call
      this.logActivity('GET_PHARMACY_PRESCRIPTIONS', pharmacyOdsCode, {
        requestId,
        count: response.data.total,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    };

    try {
      return await fetchPharmacyPrescriptionsOperation();
    } catch (error) {
      return this.handleEpsApiError(error, 'getPharmacyPrescriptions', 0, 3, fetchPharmacyPrescriptionsOperation);
    }
  }

  /**
   * Get all prescriptions for a patient
   * @param nhsNumber - The patient's NHS number
   * @param params - Optional search parameters
   * @returns List of prescriptions
   */
  async getPatientPrescriptions(nhsNumber: string, params?: PrescriptionSearchParams): Promise<PrescriptionBundle> {
    // Generate cache key based on NHS number and search params
    const cacheKey = `patient_prescriptions_${nhsNumber}_${JSON.stringify(params || {})}`;
    const cachedData = this.cache.get<PrescriptionBundle>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Define the operation as a function that can be retried
    const fetchPatientPrescriptionsOperation = async (): Promise<PrescriptionBundle> => {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      // Build query parameters
      const queryParams: Record<string, string> = {
        subject: nhsNumber,
      };

      // Add optional search parameters
      if (params) {
        if (params.status) {
          if (Array.isArray(params.status)) {
            queryParams.status = params.status.join(',');
          } else {
            queryParams.status = params.status;
          }
        }
        if (params.dateWritten) {
          queryParams.dateWritten = params.dateWritten;
        }
        if (params.dateWrittenFrom) {
          queryParams['dateWritten:ge'] = params.dateWrittenFrom;
        }
        if (params.dateWrittenTo) {
          queryParams['dateWritten:le'] = params.dateWrittenTo;
        }
        if (params._count) {
          queryParams._count = params._count.toString();
        }
        if (params._sort) {
          queryParams._sort = params._sort;
        }
      }

      const response = await axios.get(
        `${this.baseUrl}MedicationRequest`,
        {
          headers,
          params: queryParams
        }
      );

      // Cache the result
      this.cache.set(cacheKey, response.data);

      // Log successful API call
      this.logActivity('GET_PATIENT_PRESCRIPTIONS', nhsNumber, {
        requestId,
        count: response.data.total,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    };

    try {
      return await fetchPatientPrescriptionsOperation();
    } catch (error) {
      return this.handleEpsApiError(error, 'getPatientPrescriptions', 0, 3, fetchPatientPrescriptionsOperation);
    }
  }

  /**
   * Update prescription status
   * @param prescriptionId - The prescription ID
   * @param status - The new status
   * @param statusReason - Optional reason for status change
   * @returns Updated prescription
   */
  async updatePrescriptionStatus(
    prescriptionId: string,
    status: PrescriptionStatus,
    statusReason?: { code: string; display: string; text?: string }
  ): Promise<Prescription> {
    // Define the operation as a function that can be retried
    const updatePrescriptionOperation = async (): Promise<Prescription> => {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      // First, get the current prescription to ensure we have the latest version
      const currentPrescription = await this.getPrescription(prescriptionId);

      // Prepare the update payload
      const updatePayload: PrescriptionUpdateRequest = {
        resourceType: "MedicationRequest",
        id: prescriptionId,
        status: status,
      };

      // Add status reason if provided
      if (statusReason) {
        updatePayload.statusReason = {
          coding: [{
            system: "https://fhir.nhs.uk/CodeSystem/prescription-status-reason",
            code: statusReason.code,
            display: statusReason.display,
          }],
          text: statusReason.text || statusReason.display,
        };
      }

      const response = await axios.put(
        `${this.baseUrl}MedicationRequest/${prescriptionId}`,
        updatePayload,
        { headers }
      );

      // Clear cache for this prescription
      this.cache.del(`prescription_${prescriptionId}`);

      // Log successful API call
      this.logActivity('UPDATE_PRESCRIPTION', prescriptionId, {
        requestId,
        oldStatus: currentPrescription.status,
        newStatus: status,
        statusReason: statusReason?.display,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    };

    try {
      return await updatePrescriptionOperation();
    } catch (error) {
      return this.handleEpsApiError(error, 'updatePrescriptionStatus', 0, 3, updatePrescriptionOperation);
    }
  }

  /**
   * Cancel a prescription
   * @param prescriptionId - The prescription ID
   * @param reason - Reason for cancellation
   * @returns Cancelled prescription
   */
  async cancelPrescription(
    prescriptionId: string,
    reason: { code: string; display: string; text?: string }
  ): Promise<Prescription> {
    return this.updatePrescriptionStatus(prescriptionId, 'cancelled', reason);
  }

  /**
   * Mark a prescription as completed (dispensed)
   * @param prescriptionId - The prescription ID
   * @returns Completed prescription
   */
  async completePrescription(prescriptionId: string): Promise<Prescription> {
    return this.updatePrescriptionStatus(prescriptionId, 'completed', {
      code: 'dispensed',
      display: 'Medication has been dispensed',
    });
  }

  /**
   * Search for prescriptions with advanced filtering
   * @param params - Search parameters
   * @returns List of matching prescriptions
   */
  async searchPrescriptions(params: PrescriptionSearchParams): Promise<PrescriptionBundle> {
    // Convert search params to API query parameters
    const queryParams: Record<string, string> = {};

    // Process status
    if (params.status) {
      if (Array.isArray(params.status)) {
        queryParams.status = params.status.join(',');
      } else {
        queryParams.status = params.status;
      }
    }

    // Process dates
    if (params.dateWritten) {
      queryParams.dateWritten = params.dateWritten;
    }
    if (params.dateWrittenFrom) {
      queryParams['dateWritten:ge'] = typeof params.dateWrittenFrom === 'string'
        ? params.dateWrittenFrom
        : params.dateWrittenFrom.toISOString().split('T')[0];
    }
    if (params.dateWrittenTo) {
      queryParams['dateWritten:le'] = typeof params.dateWrittenTo === 'string'
        ? params.dateWrittenTo
        : params.dateWrittenTo.toISOString().split('T')[0];
    }

    // Process pagination and sorting
    if (params._count) {
      queryParams._count = params._count.toString();
    }
    if (params._sort) {
      queryParams._sort = params._sort;
    }

    // Process specific search parameters
    if (params.prescriptionId) {
      queryParams.identifier = params.prescriptionId;
    }
    if (params.nhsNumber) {
      queryParams.subject = params.nhsNumber;
    }
    if (params.prescriberId) {
      queryParams.requester = params.prescriberId;
    }

    // Process text search parameters
    // Note: These may need to be adapted based on the actual API capabilities
    if (params.medicationName) {
      queryParams['medication.display'] = params.medicationName;
    }
    if (params.patientName) {
      queryParams['subject.display'] = params.patientName;
    }

    // Handle general search term - this is implementation-specific
    // and may need to be adapted based on the actual API capabilities
    if (params.searchTerm) {
      queryParams._content = params.searchTerm;
    }

    // Include history if requested
    if (params.includeHistory) {
      queryParams._include = 'MedicationRequest:history';
    }

    // Generate cache key based on search params
    const cacheKey = `search_prescriptions_${JSON.stringify(queryParams)}`;
    const cachedData = this.cache.get<PrescriptionBundle>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Define the operation as a function that can be retried
    const searchPrescriptionsOperation = async (): Promise<PrescriptionBundle> => {
      // Ensure we have a valid token
      await this.getToken();

      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.get(
        `${this.baseUrl}MedicationRequest`,
        {
          headers,
          params: queryParams
        }
      );

      // Cache the result
      this.cache.set(cacheKey, response.data);

      // Log successful API call
      this.logActivity('SEARCH_PRESCRIPTIONS', 'SYSTEM', {
        requestId,
        params: queryParams,
        count: response.data.total,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    };

    try {
      return await searchPrescriptionsOperation();
    } catch (error) {
      return this.handleEpsApiError(error, 'searchPrescriptions', 0, 3, searchPrescriptionsOperation);
    }
  }

  /**
   * Clear cache for a specific prescription
   * @param prescriptionId - The prescription ID
   */
  clearPrescriptionCache(prescriptionId: string): void {
    this.cache.del(`prescription_${prescriptionId}`);
  }

  /**
   * Clear cache for a pharmacy's prescriptions
   * @param pharmacyOdsCode - The pharmacy ODS code
   */
  clearPharmacyCache(pharmacyOdsCode: string): void {
    this.cache.del(new RegExp(`^pharmacy_prescriptions_${pharmacyOdsCode}_.*`));
  }

  /**
   * Clear cache for a patient's prescriptions
   * @param nhsNumber - The patient's NHS number
   */
  clearPatientPrescriptionCache(nhsNumber: string): void {
    this.cache.del(new RegExp(`^patient_prescriptions_${nhsNumber}_.*`));
  }

  /**
   * Log EPS API activity for audit purposes
   * @param action - The action performed
   * @param resourceId - The resource ID involved (prescription ID, NHS number, or ODS code)
   * @param details - Additional details about the action
   * @param userId - The user who performed the action (if applicable)
   */
  private async logActivity(action: string, resourceId: string, details?: any, userId?: string): Promise<void> {
    // Use the AuditService to log the activity
    if (action.includes('PRESCRIPTION')) {
      await AuditService.logPrescriptionAction(
        action as any, // Cast to AuditAction type
        resourceId,
        userId || 'SYSTEM',
        details
      );
    } else {
      await AuditService.logNhsApiAction(
        action as any, // Cast to AuditAction type
        resourceId,
        details,
        userId
      );
    }

    // Also log to console for development purposes
    console.log(`EPS API Activity: ${action}`, {
      resourceId: resourceId.includes('NHS') ? resourceId.slice(-4).padStart(resourceId.length, '*') : resourceId, // Mask NHS number in logs
      timestamp: new Date().toISOString(),
      details: details ? JSON.stringify(details) : null,
    });
  }
}

export default new EPSService();
