import { prisma } from '@/lib/db/prisma';

export type AuditAction =
  | 'GET_PATIENT'
  | 'CHECK_EXEMPTION'
  | 'VERIFY_ELIGIBILITY'
  | 'GET_PRESCRIPTION'
  | 'GET_PHARMACY_PRESCRIPTIONS'
  | 'GET_PATIENT_PRESCRIPTIONS'
  | 'UPDATE_PRESCRIPTION'
  | 'SEARCH_PRESCRIPTIONS'
  | 'SEND_NOTIFICATION'
  | 'API_ERROR'
  | 'AUTHENTICATION'
  | 'CACHE_OPERATION'
  | 'SYSTEM_EVENT';

export type AuditCategory =
  | 'NHS_API'
  | 'PRESCRIPTION'
  | 'PATIENT'
  | 'AUTHENTICATION'
  | 'SYSTEM';

export interface AuditLogEntry {
  action: AuditAction;
  category: AuditCategory;
  userId?: string;
  patientId?: string;
  nhsNumber?: string;
  prescriptionId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service for handling audit logging throughout the application
 * Provides a consistent interface for logging actions for compliance and debugging
 */
export class AuditService {
  /**
   * Log an action to the audit trail
   * @param entry - The audit log entry to record
   * @returns The created audit log record
   */
  async logAction(entry: AuditLogEntry) {
    try {
      // Sanitize details to ensure no sensitive information is logged
      const sanitizedDetails = this.sanitizeDetails(entry.details);

      // Create the audit log entry in the database
      const auditLog = await prisma.auditLog.create({
        data: {
          action: entry.action,
          category: entry.category || this.determineCategoryFromAction(entry.action),
          userId: entry.userId,
          patientId: entry.patientId,
          nhsNumber: entry.nhsNumber ? this.maskNhsNumber(entry.nhsNumber) : undefined,
          prescriptionId: entry.prescriptionId,
          details: sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          timestamp: new Date(),
        },
      });

      return auditLog;
    } catch (error) {
      // If audit logging fails, log to console but don't throw
      // This prevents audit failures from breaking application functionality
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  /**
   * Log an NHS API interaction
   * @param action - The API action performed
   * @param nhsNumber - The NHS number involved (will be partially masked in logs)
   * @param details - Additional details about the action
   * @param userId - The user who performed the action (if applicable)
   */
  async logNhsApiAction(action: AuditAction, nhsNumber: string, details?: any, userId?: string) {
    return this.logAction({
      action,
      category: 'NHS_API',
      nhsNumber,
      userId,
      details,
    });
  }

  /**
   * Log a prescription-related action
   * @param action - The action performed
   * @param prescriptionId - The prescription ID
   * @param userId - The user who performed the action
   * @param details - Additional details about the action
   */
  async logPrescriptionAction(action: AuditAction, prescriptionId: string, userId: string, details?: any) {
    return this.logAction({
      action,
      category: 'PRESCRIPTION',
      prescriptionId,
      userId,
      details,
    });
  }

  /**
   * Log a patient-related action
   * @param action - The action performed
   * @param patientId - The patient ID
   * @param userId - The user who performed the action
   * @param details - Additional details about the action
   */
  async logPatientAction(action: AuditAction, patientId: string, userId: string, details?: any) {
    return this.logAction({
      action,
      category: 'PATIENT',
      patientId,
      userId,
      details,
    });
  }

  /**
   * Log an authentication event
   * @param action - The authentication action
   * @param userId - The user ID
   * @param details - Additional details about the action
   * @param ipAddress - The IP address of the request
   * @param userAgent - The user agent of the request
   */
  async logAuthenticationAction(action: AuditAction, userId: string, details?: any, ipAddress?: string, userAgent?: string) {
    return this.logAction({
      action,
      category: 'AUTHENTICATION',
      userId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a system event
   * @param action - The system action
   * @param details - Additional details about the action
   */
  async logSystemEvent(action: AuditAction, details?: any) {
    return this.logAction({
      action,
      category: 'SYSTEM',
      details,
    });
  }

  /**
   * Determine the category based on the action
   * @param action - The action to categorize
   * @returns The appropriate category
   */
  private determineCategoryFromAction(action: AuditAction): AuditCategory {
    if (action.startsWith('GET_') || action === 'CHECK_EXEMPTION' || action === 'VERIFY_ELIGIBILITY') {
      return 'NHS_API';
    }

    if (action.includes('PRESCRIPTION')) {
      return 'PRESCRIPTION';
    }

    if (action.includes('PATIENT')) {
      return 'PATIENT';
    }

    if (action === 'AUTHENTICATION') {
      return 'AUTHENTICATION';
    }

    return 'SYSTEM';
  }

  /**
   * Mask an NHS number for privacy in logs
   * Only the last 4 digits are visible
   * @param nhsNumber - The NHS number to mask
   * @returns The masked NHS number
   */
  private maskNhsNumber(nhsNumber: string): string {
    if (!nhsNumber || nhsNumber.length < 4) {
      return nhsNumber;
    }

    const visiblePart = nhsNumber.slice(-4);
    const maskedPart = nhsNumber.slice(0, -4).replace(/\d/g, '*');

    return maskedPart + visiblePart;
  }

  /**
   * Sanitize details to remove sensitive information
   * @param details - The details to sanitize
   * @returns Sanitized details
   */
  private sanitizeDetails(details: any): any {
    if (!details) {
      return null;
    }

    // Convert to string if not an object
    if (typeof details !== 'object') {
      return String(details);
    }

    // Create a copy to avoid modifying the original
    const sanitized = { ...details };

    // List of sensitive fields to redact
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization', 'auth',
      'creditCard', 'card', 'cvv', 'pin', 'ssn', 'socialSecurity',
      'dob', 'dateOfBirth', 'birthDate', 'address', 'postcode',
      'zipCode', 'phoneNumber', 'email'
    ];

    // Redact sensitive fields
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

// Export a singleton instance
export default new AuditService();
