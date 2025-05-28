import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import AuditService from './AuditService';

/**
 * Summary Care Record (SCR) Service
 * 
 * This service provides access to patient Summary Care Records via the NHS Spine.
 * It includes functionality to retrieve medical history, allergies, and medications.
 */

// Types for SCR Service
export interface SCRRecord {
  resourceType: string;
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
  };
  patient: {
    reference: string;
    display: string;
  };
  allergies: Array<{
    code: string;
    display: string;
    severity: string;
    recordedDate: string;
  }>;
  medications: Array<{
    code: string;
    display: string;
    status: string;
    dosage: string;
    startDate: string;
    endDate?: string;
  }>;
  conditions: Array<{
    code: string;
    display: string;
    recordedDate: string;
    clinicalStatus: string;
  }>;
}

export interface SCRPermission {
  permissionType: 'explicit' | 'implied' | 'emergency';
  reason?: string;
  relationshipCode?: string;
}

export class SCRService {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;
  private cache: NodeCache;

  constructor() {
    this.apiKey = process.env.NHS_API_KEY || '';
    this.baseUrl = 'https://sandbox.api.service.nhs.uk/summary-care-record/FHIR/R4/';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // Initialize cache with TTL of 15 minutes for SCR data
    this.cache = new NodeCache({
      stdTTL: 900, // 15 minutes in seconds
      checkperiod: 300, // Check for expired keys every 5 minutes
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
   * Get patient's Summary Care Record
   * @param nhsNumber - The patient's NHS number
   * @param permission - The permission details for accessing the SCR
   * @returns Summary Care Record
   */
  async getPatientSCR(nhsNumber: string, permission: SCRPermission): Promise<SCRRecord> {
    // Check cache first
    const cacheKey = `scr_${nhsNumber}`;
    const cachedData = this.cache.get<SCRRecord>(cacheKey);
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

      // Add permission headers
      headers['X-Permission-Type'] = permission.permissionType;
      if (permission.reason) {
        headers['X-Permission-Reason'] = permission.reason;
      }
      if (permission.relationshipCode) {
        headers['X-Relationship-Code'] = permission.relationshipCode;
      }

      const response = await axios.get(
        `${this.baseUrl}Patient/${nhsNumber}/summary-care-record`,
        { headers }
      );

      // Cache the result
      this.cache.set(cacheKey, response.data);

      // Log successful API call
      AuditService.logActivity({
        action: 'GET_SCR',
        category: 'NHS_API',
        nhsNumber,
        details: JSON.stringify({
          requestId,
          permissionType: permission.permissionType,
          timestamp: new Date().toISOString(),
        }),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching SCR:', error);
      
      // Log error
      AuditService.logActivity({
        action: 'API_ERROR',
        category: 'NHS_API',
        nhsNumber,
        details: JSON.stringify({
          error: error.message,
          endpoint: 'summary-care-record',
          timestamp: new Date().toISOString(),
        }),
      });
      
      throw error;
    }
  }

  /**
   * Get patient's medication history from SCR
   * @param nhsNumber - The patient's NHS number
   * @param permission - The permission details for accessing the SCR
   * @returns Medication history
   */
  async getPatientMedications(nhsNumber: string, permission: SCRPermission): Promise<any> {
    try {
      const scr = await this.getPatientSCR(nhsNumber, permission);
      return scr.medications || [];
    } catch (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }
  }

  /**
   * Get patient's allergy information from SCR
   * @param nhsNumber - The patient's NHS number
   * @param permission - The permission details for accessing the SCR
   * @returns Allergy information
   */
  async getPatientAllergies(nhsNumber: string, permission: SCRPermission): Promise<any> {
    try {
      const scr = await this.getPatientSCR(nhsNumber, permission);
      return scr.allergies || [];
    } catch (error) {
      console.error('Error fetching allergies:', error);
      throw error;
    }
  }

  /**
   * Get patient's medical conditions from SCR
   * @param nhsNumber - The patient's NHS number
   * @param permission - The permission details for accessing the SCR
   * @returns Medical conditions
   */
  async getPatientConditions(nhsNumber: string, permission: SCRPermission): Promise<any> {
    try {
      const scr = await this.getPatientSCR(nhsNumber, permission);
      return scr.conditions || [];
    } catch (error) {
      console.error('Error fetching conditions:', error);
      throw error;
    }
  }
}

export default new SCRService();
