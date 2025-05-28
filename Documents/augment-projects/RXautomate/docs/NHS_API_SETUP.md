# NHS API Integration Setup Guide

This guide provides detailed instructions for setting up and configuring the NHS API integrations for RXautomate.

## Prerequisites

Before you begin, ensure you have the following:

1. **NHS Digital Account**
   - Register at [NHS Digital Developer Portal](https://digital.nhs.uk/developer)
   - Complete the onboarding process for API access

2. **Network Requirements**
   - HSCN/N3 Connection or alternative access method
   - NHS Digital approved network configuration

3. **Security Requirements**
   - NHS Digital Certificate (TLS/SSL)
   - Data Security and Protection Toolkit compliance
   - Information Governance requirements

## Environment Variables

Configure the following environment variables in your `.env.local` file:

```
# NHS API Credentials
NHS_CLIENT_ID="your-nhs-client-id"
NHS_CLIENT_SECRET="your-nhs-client-secret"
NHS_API_KEY="your-nhs-api-key"

# NHS Notify API
SMS_API_KEY="your-nhs-notify-api-key"

# NHS Notify Templates
TEMPLATE_PRESCRIPTION_READY="template-id-for-prescription-ready"
TEMPLATE_PRESCRIPTION_REMINDER="template-id-for-prescription-reminder"
TEMPLATE_PRESCRIPTION_EXPIRING="template-id-for-prescription-expiring"
TEMPLATE_APPOINTMENT_REMINDER="template-id-for-appointment-reminder"
TEMPLATE_APPOINTMENT_CONFIRMATION="template-id-for-appointment-confirmation"
TEMPLATE_EXEMPTION_EXPIRING="template-id-for-exemption-expiring"

# NHS API Base URLs (defaults to sandbox, change for production)
NHS_API_BASE_URL="https://sandbox.api.service.nhs.uk"
NHS_AUTH_URL="https://api.service.nhs.uk/oauth2/token"
```

## API Registration Process

### 1. Register for NHS API Access

1. Log in to the [NHS Digital API Management Portal](https://digital.nhs.uk/developer)
2. Navigate to "Applications" and click "Register a new application"
3. Complete the application form with the following details:
   - Application name: "RXautomate"
   - Application description: "Multi-tenant pharmacy automation system"
   - Environment: "Sandbox" (for initial development)
   - Callback URL: Your application's OAuth callback URL
4. Select the required APIs:
   - Personal Demographics Service (PDS)
   - Electronic Prescription Service (EPS)
   - Summary Care Record (SCR)
   - Prescription Exemption Checking Service (PECS)
   - NHS Notify

### 2. Generate API Keys

1. After application approval, navigate to your application details
2. Generate API keys for each required service
3. Store these securely in your environment variables

### 3. Configure OAuth Settings

1. Set up OAuth 2.0 client credentials
2. Configure scopes based on required API access
3. Set appropriate token lifetimes and refresh policies

## Testing Your Integration

### 1. Sandbox Environment

Start by testing your integration with the NHS Sandbox environment:

```bash
# Test PDS API
curl -X GET "https://sandbox.api.service.nhs.uk/personal-demographics/FHIR/R4/Patient/9000000009" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Request-ID: $(uuidgen)" \
  -H "Accept: application/fhir+json"
```

### 2. Integration Testing

Use the provided test scripts to verify your integration:

```bash
# Run NHS API integration tests
npm run test:nhs
```

### 3. OpenTest Environment

Once sandbox testing is successful, request access to the OpenTest environment for more realistic testing.

## Production Deployment

### 1. Complete NHS Digital Onboarding

1. Submit the Digital Service Onboarding Form
2. Provide evidence of Data Security and Protection Toolkit compliance
3. Complete the Clinical Safety Case (if applicable)
4. Arrange for penetration testing and security review

### 2. Switch to Production Endpoints

Update your environment variables to use production endpoints:

```
NHS_API_BASE_URL="https://api.service.nhs.uk"
```

### 3. Implement Production Monitoring

Set up monitoring for:
- API rate limits
- Token expiration
- Error rates
- Response times

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check that your OAuth credentials are correct
   - Verify token expiration and refresh mechanism
   - Ensure proper scopes are configured

2. **Rate Limiting**
   - Implement exponential backoff for retries
   - Monitor API usage to stay within limits
   - Cache responses where appropriate

3. **Network Connectivity**
   - Verify HSCN/N3 connection status
   - Check firewall and proxy configurations
   - Validate TLS/SSL certificate setup

### Support Resources

- NHS Digital API Support: https://digital.nhs.uk/developer/help-and-support
- API Documentation: https://digital.nhs.uk/developer/api-catalogue
- Developer Community: https://nhs-digital-api.slack.com
- Service Desk: https://digital.nhs.uk/services/service-desk

## Compliance Requirements

Ensure ongoing compliance with:

1. **Data Protection**
   - GDPR requirements for patient data
   - Data minimization principles
   - Appropriate consent mechanisms

2. **Security Standards**
   - Regular security assessments
   - Vulnerability management
   - Access control and audit logging

3. **Clinical Safety**
   - DCB0129 compliance (if applicable)
   - Clinical risk management
   - Incident reporting procedures

## Appendix: API Reference

### Personal Demographics Service (PDS)

```typescript
// Example: Get patient details
const patientDetails = await nhsSpineService.getPatientByNhsNumber('9000000009');
```

### Electronic Prescription Service (EPS)

```typescript
// Example: Get prescription details
const prescription = await epsService.getPrescription('prescriptionId');
```

### Summary Care Record (SCR)

```typescript
// Example: Get patient SCR
const scrRecord = await scrService.getPatientSCR('9000000009', {
  permissionType: 'explicit',
  reason: 'Medication review'
});
```

### Prescription Exemption Checking Service (PECS)

```typescript
// Example: Check exemption status
const exemptionStatus = await bsaService.checkExemptionStatus('9000000009');
```

### NHS Notify

```typescript
// Example: Send prescription reminder
const notificationResult = await notifyService.sendPrescriptionReminder(patient, prescription);
```

### Additional Example: Fetching Patient Details

```typescript
import nhsSpineService from '@/services/NHSSpineService';

async function fetchPatientDetails(nhsNumber: string) {
  try {
    const patientDetails = await nhsSpineService.getPatientByNhsNumber(nhsNumber);
    console.log('Patient Details:', patientDetails);
  } catch (error) {
    console.error('Error fetching patient details:', error);
  }
}

fetchPatientDetails('9000000009');
```

This example demonstrates how to use the `NHSSpineService` to fetch patient details by NHS number. Ensure the NHS number is valid and the service is properly configured.
