# NHS API Integration Guide

## Overview

This guide provides detailed information on integrating with NHS Digital APIs for prescription handling in the RXautomate system. It covers the necessary steps for connecting to NHS Spine, Electronic Prescription Service (EPS), and other NHS digital services.

## NHS Digital API Access Requirements

### Network Requirements

1. **N3/HSCN Network Access**
   - Health and Social Care Network (HSCN) connection is required for production access
   - Options:
     - Direct HSCN connection (requires formal application)
     - Connection via an existing N3/HSCN connected partner
     - HSCN Connection Agreement with NHS Digital

2. **Alternative Access Methods**
   - NHS Digital API Gateway for selected APIs
   - OpenTest environment for development and testing
   - NHS Sandbox environments for initial integration

### Registration and Onboarding

1. **NHS Digital Onboarding Process**
   - Register on the NHS Digital API Management Portal
   - Complete the Digital Service Onboarding Form
   - Provide organization ODS code and details
   - Nominate a technical contact and senior responsible officer

2. **Required Documentation**
   - Data Security and Protection Toolkit (DSPT) compliance evidence
   - Data Protection Impact Assessment (DPIA)
   - System Level Security Policy (SLSP)
   - Penetration testing results

3. **Approval Process**
   - Technical review by NHS Digital
   - Information governance assessment
   - Clinical safety review (where applicable)
   - Connection testing and verification

## Key NHS APIs for Prescription Handling

### Personal Demographics Service (PDS) API

**Purpose**: Retrieve patient demographic information

**Base URL**: `https://api.service.nhs.uk/personal-demographics/FHIR/R4/`

**Key Endpoints**:
- `GET /Patient/{nhsNumber}` - Retrieve patient details by NHS number
- `GET /Patient?family={surname}&given={firstname}&birthdate={yyyy-mm-dd}` - Search for patients

**Authentication**: NHS OAuth 2.0

**Headers**:
```
Authorization: Bearer {access_token}
Accept: application/fhir+json
X-Request-ID: {uuid}
```

**Example Response**:
```json
{
  "resourceType": "Patient",
  "id": "9000000009",
  "identifier": [
    {
      "system": "https://fhir.nhs.uk/Id/nhs-number",
      "value": "9000000009"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "SMITH",
      "given": ["John"]
    }
  ],
  "gender": "male",
  "birthDate": "1970-01-01",
  "address": [
    {
      "use": "home",
      "line": ["1 High Street", "Townville"],
      "postalCode": "LS1 1AA"
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "01234567890",
      "use": "home"
    }
  ]
}
```

### Electronic Prescription Service (EPS) API

**Purpose**: Manage electronic prescriptions

**Base URL**: `https://api.service.nhs.uk/electronic-prescriptions/FHIR/R4/`

**Key Endpoints**:
- `GET /MedicationRequest?subject={nhsNumber}` - Get patient's prescriptions
- `GET /MedicationRequest?performer={odsCode}` - Get pharmacy's prescriptions
- `GET /MedicationRequest/{id}` - Get specific prescription
- `PUT /MedicationRequest/{id}` - Update prescription status

**Authentication**: NHS OAuth 2.0

**Headers**:
```
Authorization: Bearer {access_token}
Accept: application/fhir+json
Content-Type: application/fhir+json
X-Request-ID: {uuid}
```

**Example Response**:
```json
{
  "resourceType": "MedicationRequest",
  "id": "e8f70b0a-6bdb-4c0f-9d5a-b5c3d122d9a5",
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "323509005",
        "display": "Amoxicillin 500mg capsules"
      }
    ]
  },
  "subject": {
    "reference": "Patient/9000000009",
    "display": "SMITH, John (Mr)"
  },
  "authoredOn": "2023-04-15T14:30:00+00:00",
  "requester": {
    "reference": "Practitioner/G8133333",
    "display": "DR JONES"
  },
  "dosageInstruction": [
    {
      "text": "1 capsule three times a day",
      "timing": {
        "repeat": {
          "frequency": 3,
          "period": 1,
          "periodUnit": "d"
        }
      }
    }
  ],
  "dispenseRequest": {
    "validityPeriod": {
      "start": "2023-04-15T00:00:00+00:00",
      "end": "2023-07-15T23:59:59+00:00"
    },
    "quantity": {
      "value": 21,
      "unit": "capsule",
      "system": "http://snomed.info/sct",
      "code": "3316911000001105"
    }
  }
}
```

### Prescription Exemption Checking Service (PECS)

**Purpose**: Verify patient exemption status

**Base URL**: `https://api.service.nhs.uk/prescription-exemption/1.0.0/`

**Key Endpoints**:
- `GET /exemptions/{nhsNumber}` - Check exemption status

**Authentication**: NHS OAuth 2.0

**Headers**:
```
Authorization: Bearer {access_token}
Accept: application/json
X-Request-ID: {uuid}
```

**Example Response**:
```json
{
  "exemptionStatus": true,
  "exemptionType": "MATERNITY",
  "expiryDate": "2023-12-31",
  "certificateNumber": "M12345678"
}
```

### NHS Business Services Authority (BSA) API

**Purpose**: Check eligibility for NHS services

**Base URL**: `https://api.service.nhs.uk/bsa-eligibility/`

**Key Endpoints**:
- `POST /check-eligibility` - Verify eligibility for services

**Authentication**: NHS OAuth 2.0

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
X-Request-ID: {uuid}
```

**Request Body**:
```json
{
  "nhsNumber": "9000000009",
  "serviceType": "prescription",
  "checkDate": "2023-05-01"
}
```

**Example Response**:
```json
{
  "eligibilityStatus": true,
  "eligibilityReason": "AGE_EXEMPT",
  "validFrom": "2020-01-01",
  "validTo": null
}
```

## NHS OAuth 2.0 Authentication

### Registration

1. Register application on NHS API Management Portal
2. Receive client ID and client secret
3. Configure allowed redirect URIs
4. Select required API scopes

### Authentication Flow

1. **Client Credentials Flow** (server-to-server)

```typescript
async function getNHSToken() {
  const tokenUrl = 'https://api.service.nhs.uk/oauth2/token';
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.NHS_CLIENT_ID);
  params.append('client_secret', process.env.NHS_CLIENT_SECRET);
  params.append('scope', 'urn:nhsd:fhir:rest:read:patient urn:nhsd:fhir:rest:read:medication');
  
  const response = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  return response.data.access_token;
}
```

2. **Token Management**

```typescript
class NHSTokenManager {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  
  async getToken() {
    if (!this.token || !this.tokenExpiry || new Date() > this.tokenExpiry) {
      await this.refreshToken();
    }
    return this.token;
  }
  
  private async refreshToken() {
    const tokenResponse = await getNHSToken();
    this.token = tokenResponse.access_token;
    
    // Set expiry time (usually 1 hour)
    const expiresIn = tokenResponse.expires_in || 3600;
    this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  }
}
```

## Error Handling and Rate Limiting

### Common Error Codes

| HTTP Status | Description | Handling Strategy |
|-------------|-------------|-------------------|
| 400 | Bad Request | Check request parameters and format |
| 401 | Unauthorized | Refresh authentication token |
| 403 | Forbidden | Check API permissions and scopes |
| 404 | Not Found | Verify resource identifiers |
| 429 | Too Many Requests | Implement exponential backoff |
| 500 | Server Error | Retry with backoff strategy |
| 503 | Service Unavailable | Retry after delay |

### Rate Limiting

NHS Digital APIs typically enforce the following rate limits:

- **Default**: 300 requests per minute
- **PDS API**: 600 requests per minute
- **EPS API**: 300 requests per minute
- **PECS API**: 300 requests per minute

Implementation strategy:

```typescript
class NHSApiRateLimiter {
  private requestCounts: Map<string, number[]> = new Map();
  private limits: Map<string, number> = new Map([
    ['pds', 600],
    ['eps', 300],
    ['pecs', 300],
    ['default', 300]
  ]);
  
  canMakeRequest(apiName: string): boolean {
    const now = Date.now();
    const limit = this.limits.get(apiName) || this.limits.get('default');
    
    // Get or initialize request timestamps
    let timestamps = this.requestCounts.get(apiName) || [];
    
    // Remove timestamps older than 1 minute
    timestamps = timestamps.filter(time => now - time < 60000);
    
    // Check if under limit
    if (timestamps.length < limit) {
      timestamps.push(now);
      this.requestCounts.set(apiName, timestamps);
      return true;
    }
    
    return false;
  }
  
  getBackoffTime(apiName: string): number {
    const timestamps = this.requestCounts.get(apiName) || [];
    if (timestamps.length === 0) return 0;
    
    // Calculate time until oldest timestamp is 1 minute old
    const oldestTimestamp = timestamps[0];
    const timeToWait = Math.max(0, 60000 - (Date.now() - oldestTimestamp));
    
    return timeToWait;
  }
}
```

## Testing and Sandbox Environments

### NHS Sandbox

1. **Registration**:
   - Register at https://digital.nhs.uk/developer
   - Request sandbox access credentials
   - No HSCN connection required for sandbox

2. **Test Data**:
   - Test patient NHS numbers: 9000000009, 9000000017, 9000000025
   - Test ODS codes: FQ123, FQ456, FQ789
   - Test prescriber codes: G8133333, G8644474, G8644475

3. **Sandbox Limitations**:
   - Limited dataset
   - Simulated responses
   - No real-time processing
   - May not reflect all production behaviors

### OpenTest Environment

1. **Purpose**: More realistic testing environment with synthetic data
2. **Access Requirements**:
   - Complete OpenTest application form
   - Configure VPN connection to OpenTest
   - Receive test certificates
3. **Benefits**:
   - Larger test dataset
   - More realistic system behavior
   - Integration with other test systems

## Implementation Checklist

- [ ] Register for NHS Digital API access
- [ ] Obtain necessary network connectivity (HSCN/N3)
- [ ] Complete information governance requirements
- [ ] Implement OAuth 2.0 authentication
- [ ] Set up rate limiting and error handling
- [ ] Develop against sandbox environment
- [ ] Test with OpenTest environment
- [ ] Complete clinical safety assessment
- [ ] Conduct security review
- [ ] Prepare for production deployment

## Support Resources

- NHS Digital API Support: https://digital.nhs.uk/developer/help-and-support
- API Documentation: https://digital.nhs.uk/developer/api-catalogue
- Developer Community: https://nhs-digital-api.slack.com
- Service Desk: https://digital.nhs.uk/services/service-desk

## Glossary of NHS Terms

| Term | Description |
|------|-------------|
| HSCN | Health and Social Care Network |
| ODS | Organisation Data Service (provides unique identifiers) |
| PDS | Personal Demographics Service |
| EPS | Electronic Prescription Service |
| PECS | Prescription Exemption Checking Service |
| BSA | Business Services Authority |
| FHIR | Fast Healthcare Interoperability Resources (standard) |
| DSPT | Data Security and Protection Toolkit |
| IG | Information Governance |
| SDS | Spine Directory Service |
