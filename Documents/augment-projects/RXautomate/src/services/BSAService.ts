import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import AuditService from './AuditService';

/**
 * NHS Business Services Authority (BSA) Service
 *
 * This service provides access to NHS BSA APIs for eligibility checking,
 * prescription exemption verification, and other BSA services.
 */

// Types for BSA Service
export interface EligibilityCheckRequest {
  nhsNumber: string;
  serviceType: 'prescription' | 'dental' | 'optical' | 'vaccination';
  checkDate: string; // YYYY-MM-DD format
}

export interface EligibilityCheckResponse {
  eligibilityStatus: boolean;
  eligibilityReason?: string;
  validFrom?: string;
  validTo?: string;
  certificateNumber?: string;
}

export interface ExemptionCheckResponse {
  exemptionStatus: boolean;
  exemptionType?: string;
  expiryDate?: string;
  certificateNumber?: string;
}

export class BSAService {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;
  private cache: NodeCache;

  constructor() {
    this.apiKey = process.env.NHS_API_KEY || '';
    this.baseUrl = 'https://sandbox.api.service.nhs.uk/bsa-eligibility/';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // Initialize cache with TTL of 1 hour for eligibility data
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour in seconds
      checkperiod: 600, // Check for expired keys every 10 minutes
    });
  }

  /**
   * Generate a request ID for NHS API calls
   * @returns UUID v4 string
   */
  private generateRequestId(): string {
    return uuidv4();
  }

  /**
   * Check patient eligibility for NHS services
   * @param request - Eligibility check request
   * @returns Eligibility status
   */
  async checkEligibility(request: EligibilityCheckRequest): Promise<EligibilityCheckResponse> {
    // Check cache first
    const cacheKey = `eligibility_${request.nhsNumber}_${request.serviceType}_${request.checkDate}`;
    const cachedData = this.cache.get<EligibilityCheckResponse>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.post(
        `${this.baseUrl}check-eligibility`,
        request,
        { headers }
      );

      // Cache the result
      this.cache.set(cacheKey, response.data);

      // Log successful API call
      await AuditService.logAction({
        action: 'CHECK_ELIGIBILITY' as any,
        category: 'NHS_API' as any,
        userId: 'system',
        details: {
          nhsNumber: request.nhsNumber,
          requestId,
          serviceType: request.serviceType,
          result: response.data.eligibilityStatus,
          timestamp: new Date().toISOString(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error checking eligibility:', error);

      // Log error
      await AuditService.logAction({
        action: 'API_ERROR' as any,
        category: 'NHS_API' as any,
        userId: 'system',
        details: {
          nhsNumber: request.nhsNumber,
          error: error.message,
          endpoint: 'check-eligibility',
          timestamp: new Date().toISOString(),
        },
      });

      throw error;
    }
  }

  /**
   * Check prescription exemption status
   * @param nhsNumber - The patient's NHS number
   * @returns Exemption status
   */
  async checkExemptionStatus(nhsNumber: string): Promise<ExemptionCheckResponse> {
    // Check cache first
    const cacheKey = `exemption_${nhsNumber}`;
    const cachedData = this.cache.get<ExemptionCheckResponse>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.get(
        `${this.baseUrl}prescription-exemption/exemptions/${nhsNumber}`,
        { headers }
      );

      // Cache the result with a shorter TTL (15 minutes)
      this.cache.set(cacheKey, response.data, 900);

      // Log successful API call
      await AuditService.logAction({
        action: 'CHECK_EXEMPTION' as any,
        category: 'NHS_API' as any,
        userId: 'system',
        details: {
          nhsNumber,
          requestId,
          result: response.data.exemptionStatus,
          timestamp: new Date().toISOString(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error checking exemption status:', error);

      // Log error
      await AuditService.logAction({
        action: 'API_ERROR' as any,
        category: 'NHS_API' as any,
        userId: 'system',
        details: {
          nhsNumber,
          error: error.message,
          endpoint: 'prescription-exemption',
          timestamp: new Date().toISOString(),
        },
      });

      throw error;
    }
  }

  /**
   * Track prescription status
   * @param prescriptionId - The prescription ID
   * @returns Prescription status
   */
  async trackPrescription(prescriptionId: string): Promise<any> {
    try {
      const requestId = this.generateRequestId();
      const headers = {
        ...this.headers,
        'X-Request-ID': requestId,
        'X-Correlation-ID': requestId,
      };

      const response = await axios.get(
        `${this.baseUrl}prescription-tracker/${prescriptionId}`,
        { headers }
      );

      // Log successful API call
      await AuditService.logAction({
        action: 'TRACK_PRESCRIPTION' as any,
        category: 'NHS_API' as any,
        userId: 'system',
        details: {
          prescriptionId,
          requestId,
          status: response.data.status,
          timestamp: new Date().toISOString(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error tracking prescription:', error);

      // Log error
      await AuditService.logAction({
        action: 'API_ERROR' as any,
        category: 'NHS_API' as any,
        userId: 'system',
        details: {
          prescriptionId,
          error: error.message,
          endpoint: 'prescription-tracker',
          timestamp: new Date().toISOString(),
        },
      });

      throw error;
    }
  }
}

export default new BSAService();
