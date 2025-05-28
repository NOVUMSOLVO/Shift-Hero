# Electronic Prescription Service (EPS) Integration Guide

This guide provides detailed information on integrating with the NHS Electronic Prescription Service (EPS) in the RXautomate system.

## Overview

The Electronic Prescription Service (EPS) allows prescribers to send prescriptions electronically to a dispenser (pharmacy) of the patient's choice. This integration enables RXautomate to:

1. Download electronic prescriptions assigned to the pharmacy
2. Process and dispense prescriptions
3. Update prescription status in the NHS Spine
4. Track prescription status throughout the workflow

## Prerequisites

Before implementing EPS integration, ensure you have:

1. **NHS Digital Approval**
   - Completed the NHS Digital onboarding process
   - Received approval for EPS integration

2. **Technical Requirements**
   - N3/HSCN network connection
   - NHS Digital Certificate
   - Smartcard integration capability
   - FHIR API support

3. **Regulatory Compliance**
   - Data Security and Protection Toolkit compliance
   - Clinical safety assessment (DCB0129/DCB0160)
   - Information governance policies

## EPS Integration Architecture

RXautomate implements EPS integration through the following components:

1. **EPSService**: Core service for interacting with EPS APIs
2. **PrescriptionProcessor**: Processes downloaded prescriptions
3. **DispensaryWorkflow**: Manages the dispensing workflow
4. **SmartcardManager**: Handles smartcard authentication
5. **AuditLogger**: Maintains comprehensive audit trail

### Integration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  NHS Spine  │◄────┤ EPSService  │◄────┤Prescription │◄────┤  Pharmacy   │
│    (EPS)    │────►│             │────►│ Processor   │────►│   Staff     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Audit Logger│     │ Dispensary  │
                    │             │     │  Workflow   │
                    └─────────────┘     └─────────────┘
```

## Implementation Guide

### 1. Authentication

EPS requires two levels of authentication:

#### 1.1 System Authentication

```typescript
// Example: System-level authentication
async function getEPSSystemToken() {
  const tokenUrl = 'https://api.service.nhs.uk/oauth2/token';
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.NHS_CLIENT_ID);
  params.append('client_secret', process.env.NHS_CLIENT_SECRET);
  params.append('scope', 'urn:nhsd:fhir:rest:read:medication urn:nhsd:fhir:rest:write:medication');
  
  const response = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  return response.data.access_token;
}
```

#### 1.2 User Authentication (Smartcard)

```typescript
// Example: User-level authentication with smartcard
async function authenticateWithSmartcard(pin: string) {
  // Initialize smartcard reader
  const reader = await SmartcardManager.getReader();
  
  // Authenticate with smartcard
  const session = await reader.authenticate(pin);
  
  // Extract role profiles
  const roleProfiles = session.getRoleProfiles();
  
  // Validate EPS access rights
  if (!roleProfiles.some(role => role.hasRight('B0572'))) {
    throw new Error('User does not have EPS access rights');
  }
  
  return session;
}
```

### 2. Downloading Prescriptions

```typescript
// Example: Download prescriptions for a pharmacy
async function downloadPrescriptions(pharmacyOdsCode: string) {
  // Get system token
  const token = await getEPSSystemToken();
  
  // Set up request headers
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/fhir+json',
    'X-Request-ID': uuidv4(),
  };
  
  // Query EPS for prescriptions
  const response = await axios.get(
    `${EPS_API_BASE_URL}/MedicationRequest?performer=${pharmacyOdsCode}&status=active`,
    { headers }
  );
  
  // Process and store prescriptions
  const prescriptions = response.data.entry.map(entry => {
    return {
      id: entry.resource.id,
      prescriptionNumber: entry.resource.identifier[0].value,
      patientNhsNumber: entry.resource.subject.identifier.value,
      issuedDate: entry.resource.authoredOn,
      items: entry.resource.medicationCodeableConcept.map(med => ({
        medicationName: med.coding[0].display,
        dosage: entry.resource.dosageInstruction[0].text,
        quantity: entry.resource.dispenseRequest.quantity.value,
      })),
    };
  });
  
  // Save prescriptions to database
  await savePrescriptionsToDatabase(prescriptions);
  
  return prescriptions;
}
```

### 3. Processing Prescriptions

```typescript
// Example: Process a prescription
async function processPrescription(prescriptionId: string, userId: string) {
  // Get prescription from database
  const prescription = await getPrescriptionById(prescriptionId);
  
  // Update status to 'DOWNLOADED'
  await updatePrescriptionStatus(prescriptionId, 'DOWNLOADED', userId);
  
  // Validate prescription
  const validationResult = await validatePrescription(prescription);
  if (!validationResult.isValid) {
    await updatePrescriptionStatus(prescriptionId, 'VALIDATION_ERROR', userId);
    throw new Error(`Prescription validation failed: ${validationResult.error}`);
  }
  
  // Check for interactions
  const interactionResult = await checkInteractions(prescription);
  if (interactionResult.hasInteractions) {
    await createInteractionAlert(prescriptionId, interactionResult.interactions);
  }
  
  // Create dispensary tasks
  await createDispensaryTasks(prescription);
  
  // Log activity
  await logPrescriptionActivity(prescriptionId, 'PROCESSED', userId);
  
  return prescription;
}
```

### 4. Dispensing Prescriptions

```typescript
// Example: Dispense a prescription
async function dispensePrescription(prescriptionId: string, userId: string) {
  // Get prescription from database
  const prescription = await getPrescriptionById(prescriptionId);
  
  // Verify all items are ready
  const allItemsReady = prescription.items.every(item => item.status === 'READY');
  if (!allItemsReady) {
    throw new Error('Not all items are ready for dispensing');
  }
  
  // Get smartcard session
  const smartcardSession = await SmartcardManager.getCurrentSession();
  if (!smartcardSession) {
    throw new Error('No active smartcard session');
  }
  
  // Update status in EPS
  const token = await getEPSSystemToken();
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json',
    'X-Request-ID': uuidv4(),
    'X-User-ID': smartcardSession.userId,
    'X-Role-ID': smartcardSession.roleId,
  };
  
  // Create dispensing claim
  const claim = {
    resourceType: 'MedicationDispense',
    status: 'completed',
    medicationRequest: {
      reference: `MedicationRequest/${prescriptionId}`,
    },
    performer: [{
      actor: {
        identifier: {
          system: 'https://fhir.nhs.uk/Id/ods-organization-code',
          value: prescription.pharmacy.odsCode,
        },
      },
    }],
    whenHandedOver: new Date().toISOString(),
  };
  
  // Submit claim to EPS
  await axios.post(
    `${EPS_API_BASE_URL}/MedicationDispense`,
    claim,
    { headers }
  );
  
  // Update local status
  await updatePrescriptionStatus(prescriptionId, 'DISPENSED', userId);
  
  // Update inventory
  await updateInventory(prescription.items);
  
  // Log activity
  await logPrescriptionActivity(prescriptionId, 'DISPENSED', userId);
  
  return prescription;
}
```

### Additional Example: Dispensing a Prescription

```typescript
import epsService from '@/services/EPSService';

async function dispensePrescription(prescriptionId: string, userId: string) {
  try {
    const result = await epsService.completePrescription(prescriptionId, userId);
    console.log('Prescription Dispensed:', result);
  } catch (error) {
    console.error('Error dispensing prescription:', error);
  }
}

dispensePrescription('prescription-12345', 'user-67890');
```

This example demonstrates how to use the `EPSService` to mark a prescription as dispensed. Ensure the prescription ID and user ID are valid and the service is properly authenticated.

### 5. Handling Prescription Collection

```typescript
// Example: Mark prescription as collected
async function markPrescriptionCollected(prescriptionId: string, userId: string) {
  // Get prescription from database
  const prescription = await getPrescriptionById(prescriptionId);
  
  // Verify prescription is dispensed
  if (prescription.status !== 'DISPENSED') {
    throw new Error('Prescription must be dispensed before collection');
  }
  
  // Update status in EPS
  const token = await getEPSSystemToken();
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json',
    'X-Request-ID': uuidv4(),
  };
  
  // Update prescription status
  await axios.put(
    `${EPS_API_BASE_URL}/MedicationRequest/${prescriptionId}`,
    {
      resourceType: 'MedicationRequest',
      id: prescriptionId,
      status: 'completed',
    },
    { headers }
  );
  
  // Update local status
  await updatePrescriptionStatus(prescriptionId, 'COLLECTED', userId);
  
  // Send notification to patient if configured
  const patient = await getPatientById(prescription.patientId);
  if (patient.notificationsEnabled) {
    await sendCollectionConfirmation(patient, prescription);
  }
  
  // Log activity
  await logPrescriptionActivity(prescriptionId, 'COLLECTED', userId);
  
  return prescription;
}
```

## Error Handling

### Common EPS Errors

| Error Code | Description | Handling Strategy |
|------------|-------------|-------------------|
| 401 | Unauthorized | Refresh authentication token and retry |
| 403 | Forbidden | Verify user has appropriate smartcard rights |
| 404 | Prescription not found | Check prescription ID and pharmacy ODS code |
| 409 | Conflict (already claimed) | Update local status to match EPS |
| 422 | Validation error | Log detailed error and notify user |

### Error Recovery Process

```typescript
// Example: Error handling and recovery
async function handleEPSError(error: any, operation: string, retryCount = 0) {
  // Log error
  console.error(`EPS Error (${operation}):`, error);
  
  // Determine if error is retryable
  const isRetryable = [401, 429, 500, 502, 503, 504].includes(error.response?.status);
  
  // Implement retry logic for retryable errors
  if (isRetryable && retryCount < 3) {
    // Calculate exponential backoff delay
    const backoffDelay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
    
    console.log(`Retrying ${operation} in ${Math.round(backoffDelay)}ms (attempt ${retryCount + 1}/3)`);
    
    // Wait for backoff period
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    
    // Retry the operation
    try {
      return await operation();
    } catch (retryError) {
      return handleEPSError(retryError, operation, retryCount + 1);
    }
  }
  
  // Handle specific error types
  switch (error.response?.status) {
    case 401:
      // Token expired, force refresh
      await refreshEPSToken(true);
      throw new Error('Authentication failed. Please try again.');
    
    case 403:
      throw new Error('You do not have permission to perform this action. Please check your smartcard rights.');
    
    case 404:
      throw new Error('Prescription not found in EPS. It may have been claimed by another pharmacy.');
    
    case 409:
      // Conflict - prescription already claimed or status changed
      await syncPrescriptionWithEPS(error.config.url.split('/').pop());
      throw new Error('Prescription status has changed. Please refresh and try again.');
    
    default:
      throw new Error(`EPS operation failed: ${error.message}`);
  }
}
```

## Testing EPS Integration

### 1. Sandbox Testing

Use the NHS Digital Sandbox environment for initial testing:

```
NHS_API_BASE_URL="https://sandbox.api.service.nhs.uk"
```

The sandbox provides test patient data and prescriptions for development.

### 2. Integration Testing

```typescript
// Example: Integration test for downloading prescriptions
describe('EPS Integration', () => {
  test('should download prescriptions for pharmacy', async () => {
    // Mock smartcard authentication
    mockSmartcardSession({
      userId: 'test-user',
      roleId: 'test-role',
      hasRight: (right) => right === 'B0572',
    });
    
    // Call the service
    const result = await epsService.downloadPrescriptions('FW123');
    
    // Verify results
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('prescriptionNumber');
    expect(result[0]).toHaveProperty('items');
  });
});
```

### 3. End-to-End Testing

Use the NHS Digital OpenTest environment for end-to-end testing with realistic data flows.

## Compliance Requirements

### 1. Audit Logging

All EPS operations must be logged for compliance:

```typescript
// Example: Audit logging for EPS operations
async function logEPSActivity(action: string, details: any) {
  await prisma.auditLog.create({
    data: {
      action,
      category: 'EPS',
      details: JSON.stringify(details),
      timestamp: new Date(),
      userId: details.userId,
      prescriptionId: details.prescriptionId,
    },
  });
}
```

### 2. Data Retention

EPS prescription data must be retained according to NHS guidelines:

- Active prescriptions: Until dispensed or expired
- Dispensed prescriptions: Minimum 2 years
- Audit logs: Minimum 7 years

## Deployment Checklist

Before deploying EPS integration to production:

1. **Complete NHS Digital Assurance**
   - Technical conformance testing
   - Clinical safety assessment
   - Information governance review

2. **Prepare Production Environment**
   - Configure production API endpoints
   - Set up smartcard infrastructure
   - Implement monitoring and alerting

3. **Staff Training**
   - Train pharmacy staff on EPS workflow
   - Document error handling procedures
   - Establish support processes

## Troubleshooting

### Common Issues

1. **Smartcard Authentication Failures**
   - Verify smartcard reader is properly connected
   - Check user has appropriate role profiles
   - Ensure smartcard certificates are valid

2. **Prescription Download Issues**
   - Verify network connectivity to N3/HSCN
   - Check pharmacy ODS code is correctly configured
   - Validate system authentication tokens

3. **Dispensing Failures**
   - Verify prescription hasn't been claimed elsewhere
   - Check smartcard has appropriate rights
   - Validate all required fields are present

## Support Resources

- NHS Digital EPS Support: https://digital.nhs.uk/services/electronic-prescription-service/eps-support
- EPS Implementation Guide: https://digital.nhs.uk/services/electronic-prescription-service/eps-implementation-guidance
- FHIR API Documentation: https://digital.nhs.uk/developer/api-catalogue/electronic-prescription-service-fhir

## Appendix: EPS FHIR Resources

### MedicationRequest

```json
{
  "resourceType": "MedicationRequest",
  "id": "prescription-id",
  "identifier": [
    {
      "system": "https://fhir.nhs.uk/Id/prescription-order-number",
      "value": "prescription-number"
    }
  ],
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "medication-code",
        "display": "Medication Name"
      }
    ]
  },
  "subject": {
    "identifier": {
      "system": "https://fhir.nhs.uk/Id/nhs-number",
      "value": "nhs-number"
    }
  },
  "authoredOn": "2023-05-01T12:00:00+00:00",
  "requester": {
    "identifier": {
      "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
      "value": "prescriber-id"
    }
  },
  "dosageInstruction": [
    {
      "text": "One tablet three times a day"
    }
  ],
  "dispenseRequest": {
    "performer": {
      "identifier": {
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": "pharmacy-ods-code"
      }
    },
    "quantity": {
      "value": 21,
      "unit": "tablet",
      "system": "http://snomed.info/sct",
      "code": "unit-code"
    }
  }
}
```

### MedicationDispense

```json
{
  "resourceType": "MedicationDispense",
  "status": "completed",
  "medicationRequest": {
    "reference": "MedicationRequest/prescription-id"
  },
  "performer": [
    {
      "actor": {
        "identifier": {
          "system": "https://fhir.nhs.uk/Id/ods-organization-code",
          "value": "pharmacy-ods-code"
        }
      }
    }
  ],
  "whenHandedOver": "2023-05-02T14:30:00+00:00"
}
```
