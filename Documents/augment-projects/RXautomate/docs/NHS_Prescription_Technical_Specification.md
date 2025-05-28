# NHS Prescription Handling Technical Specification

## System Architecture

### Components Overview
```
┌─────────────────┐      ┌───────────────┐      ┌────────────────┐
│                 │      │               │      │                │
│  RXautomate     │◄────►│  NHS Spine    │◄────►│  NHS Digital   │
│  Application    │      │  Service      │      │  APIs          │
│                 │      │               │      │                │
└────────┬────────┘      └───────────────┘      └────────────────┘
         │
         │
┌────────▼────────┐      ┌───────────────┐      ┌────────────────┐
│                 │      │               │      │                │
│  Pharmacy       │◄────►│  EPS          │◄────►│  NHS BSA       │
│  System Service │      │  Service      │      │  Database      │
│                 │      │               │      │                │
└────────┬────────┘      └───────────────┘      └────────────────┘
         │
         │
┌────────▼────────┐      ┌───────────────┐
│                 │      │               │
│  Notification   │◄────►│  SMS Gateway  │
│  Service        │      │  Provider     │
│                 │      │               │
└─────────────────┘      └───────────────┘
```

## API Specifications

### NHS Spine Service API

#### Patient Lookup
```typescript
/**
 * Get patient details by NHS number
 * @param nhsNumber - The patient's NHS number (10 digits)
 * @returns Patient details including name, address, DOB, GP details
 */
async getPatientByNhsNumber(nhsNumber: string): Promise<PatientDetails>
```

#### Exemption Status Check
```typescript
/**
 * Check patient exemption status
 * @param nhsNumber - The patient's NHS number
 * @returns Exemption status details including type, certificate number, and expiry date
 */
async checkExemptionStatus(nhsNumber: string): Promise<ExemptionDetails>
```

#### Eligibility Verification
```typescript
/**
 * Verify patient eligibility for services
 * @param nhsNumber - The patient's NHS number
 * @param serviceType - The type of service to check eligibility for
 * @returns Eligibility status with details and reason codes
 */
async verifyEligibility(nhsNumber: string, serviceType: string): Promise<EligibilityStatus>
```

### Electronic Prescription Service (EPS) API

#### Prescription Retrieval
```typescript
/**
 * Get prescription details by prescription ID
 * @param prescriptionId - The prescription ID
 * @returns Complete prescription details including medications, dosages, and prescriber
 */
async getPrescription(prescriptionId: string): Promise<PrescriptionDetails>
```

#### Pharmacy Prescriptions
```typescript
/**
 * Get all prescriptions for a pharmacy
 * @param pharmacyOdsCode - The pharmacy ODS code
 * @param status - Optional filter by prescription status
 * @param fromDate - Optional filter for prescriptions from this date
 * @returns List of prescriptions assigned to the pharmacy
 */
async getPharmacyPrescriptions(
  pharmacyOdsCode: string, 
  status?: string, 
  fromDate?: Date
): Promise<PrescriptionList>
```

#### Patient Prescriptions
```typescript
/**
 * Get all prescriptions for a patient
 * @param nhsNumber - The patient's NHS number
 * @param status - Optional filter by prescription status
 * @param fromDate - Optional filter for prescriptions from this date
 * @returns List of prescriptions for the patient
 */
async getPatientPrescriptions(
  nhsNumber: string, 
  status?: string, 
  fromDate?: Date
): Promise<PrescriptionList>
```

#### Prescription Status Update
```typescript
/**
 * Update prescription status
 * @param prescriptionId - The prescription ID
 * @param status - The new status (PENDING, PROCESSING, DISPENSED, COLLECTED, CANCELLED)
 * @param statusReason - Optional reason for status change
 * @returns Updated prescription with new status
 */
async updatePrescriptionStatus(
  prescriptionId: string, 
  status: PrescriptionStatus, 
  statusReason?: string
): Promise<PrescriptionDetails>
```

### Notification Service API

#### Prescription Reminder
```typescript
/**
 * Send prescription reminder
 * @param patient - The patient object
 * @param prescription - The prescription object
 * @param reminderType - Type of reminder (READY, COLLECTION, EXPIRING)
 * @returns Notification response with message ID and status
 */
async sendPrescriptionReminder(
  patient: Patient, 
  prescription: Prescription, 
  reminderType: ReminderType
): Promise<NotificationResponse>
```

## Data Models

### Patient Model Extensions
```typescript
interface Patient {
  // Existing fields
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nhsNumber: string;
  phoneNumber?: string;
  email?: string;
  
  // New fields for NHS prescription handling
  exemptionStatus: string;
  exemptionCertificateNumber?: string;
  exemptionEndDate?: Date;
  lastExemptionCheck?: Date;
  eligibilityStatus?: string;
  lastEligibilityCheck?: Date;
  communicationPreferences: {
    prescriptionReadyNotification: boolean;
    collectionReminder: boolean;
    expiryReminder: boolean;
    preferredChannel: 'SMS' | 'EMAIL' | 'BOTH';
  };
}
```

### Prescription Model Extensions
```typescript
interface Prescription {
  // Existing fields
  id: string;
  prescriptionType: PrescriptionType;
  prescriptionNumber?: string;
  issuedDate: Date;
  expiryDate?: Date;
  status: PrescriptionStatus;
  
  // New fields for NHS prescription handling
  nhsPrescriptionId?: string;
  epsMessageId?: string;
  exemptionApplied?: string;
  exemptionVerified: boolean;
  eligibilityVerified: boolean;
  prescribingOrganization?: {
    name: string;
    odsCode: string;
  };
  prescriber?: {
    name: string;
    professionalCode: string;
  };
  dispensingEvents: {
    status: PrescriptionStatus;
    timestamp: Date;
    userId: string;
    notes?: string;
  }[];
  remindersSent: {
    type: ReminderType;
    timestamp: Date;
    successful: boolean;
    messageId?: string;
  }[];
}
```

## Authentication & Security

### NHS API Authentication
```typescript
/**
 * NHS API authentication configuration
 */
interface NHSAuthConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope: string[];
  tokenRefreshThreshold: number; // in seconds
}

/**
 * Get and manage OAuth tokens for NHS API access
 */
class NHSAuthManager {
  private config: NHSAuthConfig;
  private currentToken: string;
  private tokenExpiry: Date;
  
  constructor(config: NHSAuthConfig) {
    this.config = config;
  }
  
  /**
   * Get a valid access token, refreshing if necessary
   */
  async getToken(): Promise<string>;
  
  /**
   * Force refresh the token regardless of expiry
   */
  async refreshToken(): Promise<string>;
  
  /**
   * Check if token is valid and not near expiry
   */
  isTokenValid(): boolean;
}
```

### Data Encryption
```typescript
/**
 * Encrypt sensitive patient data for storage
 * @param data - Data to encrypt
 * @param context - Encryption context for access control
 * @returns Encrypted data
 */
function encryptPatientData(data: any, context: EncryptionContext): EncryptedData;

/**
 * Decrypt patient data for authorized access
 * @param encryptedData - Data to decrypt
 * @param context - Encryption context for access control
 * @returns Decrypted data
 */
function decryptPatientData(encryptedData: EncryptedData, context: EncryptionContext): any;
```

## Error Handling

### NHS API Error Handling
```typescript
/**
 * Handle NHS API errors with appropriate responses
 * @param error - The error from NHS API
 * @param context - Context of the operation
 * @returns Standardized error response
 */
function handleNHSApiError(error: any, context: OperationContext): ErrorResponse {
  // Error types:
  // - Authentication errors (401, 403)
  // - Rate limiting (429)
  // - Service unavailable (503)
  // - Validation errors (400)
  // - Not found errors (404)
  // - Internal server errors (500)
  
  // Log error with context
  logger.error(`NHS API Error: ${error.message}`, {
    context,
    statusCode: error.response?.status,
    errorCode: error.response?.data?.errorCode,
  });
  
  // Return standardized error
  return {
    code: mapErrorCode(error),
    message: getUserFriendlyMessage(error),
    retryable: isRetryableError(error),
    details: sanitizeErrorDetails(error),
  };
}
```

## Audit & Logging

### Prescription Audit Trail
```typescript
/**
 * Log prescription activity for audit purposes
 * @param prescriptionId - The prescription ID
 * @param action - The action performed
 * @param userId - The user who performed the action
 * @param details - Additional details about the action
 */
async function logPrescriptionActivity(
  prescriptionId: string,
  action: PrescriptionAction,
  userId: string,
  details?: any
): Promise<void> {
  await prisma.prescriptionAuditLog.create({
    data: {
      prescriptionId,
      action,
      userId,
      details: details ? JSON.stringify(details) : null,
      timestamp: new Date(),
      ipAddress: getCurrentIpAddress(),
      userAgent: getCurrentUserAgent(),
    },
  });
}
```

## Performance Considerations

### Caching Strategy
```typescript
/**
 * Cache configuration for NHS data
 */
const NHS_CACHE_CONFIG = {
  patientDetails: {
    ttl: 24 * 60 * 60, // 24 hours in seconds
    maxSize: 10000,
  },
  exemptionStatus: {
    ttl: 12 * 60 * 60, // 12 hours in seconds
    maxSize: 10000,
  },
  eligibilityStatus: {
    ttl: 24 * 60 * 60, // 24 hours in seconds
    maxSize: 10000,
  },
};

/**
 * Cache NHS API responses
 * @param key - Cache key
 * @param data - Data to cache
 * @param type - Type of data for TTL configuration
 */
function cacheNHSData(key: string, data: any, type: NHSDataType): void;

/**
 * Get cached NHS data if available
 * @param key - Cache key
 * @param type - Type of data
 * @returns Cached data or null if not found/expired
 */
function getCachedNHSData(key: string, type: NHSDataType): any | null;
```

## Testing Endpoints

### NHS Test Environment
```
Base URL: https://sandbox.api.service.nhs.uk/
Authentication: OAuth 2.0 with test credentials
Rate Limits: 100 requests per minute
Test Patient IDs: Available in NHS Digital test data set
```

### EPS Test Environment
```
Base URL: https://sandbox.api.service.nhs.uk/electronic-prescriptions/FHIR/R4/
Test Pharmacy ODS Codes: FQ123, FQ456, FQ789
Test Prescriber Codes: G1234567, G7654321
```

## Implementation Timeline

| Phase | Component | Estimated Duration | Dependencies |
|-------|-----------|-------------------|--------------|
| 1 | NHS Spine Service Setup | 2 weeks | NHS API credentials |
| 1 | Database Schema Updates | 1 week | None |
| 2 | Exemption Status API | 2 weeks | NHS Spine Service |
| 2 | Eligibility Verification | 2 weeks | NHS Spine Service |
| 3 | EPS Integration | 3 weeks | NHS API credentials |
| 3 | Prescription Processing UI | 2 weeks | EPS Integration |
| 4 | SMS Notification System | 2 weeks | SMS Gateway account |
| 4 | Patient Communication Preferences | 1 week | None |

## Deployment Checklist

- [ ] NHS API credentials secured in environment variables
- [ ] Database migrations for new schema elements
- [ ] Rate limiting configured for NHS APIs
- [ ] Error handling and fallback mechanisms tested
- [ ] Audit logging enabled and verified
- [ ] Performance testing completed
- [ ] Security review conducted
- [ ] GDPR compliance verified
- [ ] Staff training materials prepared
- [ ] Rollback plan documented
