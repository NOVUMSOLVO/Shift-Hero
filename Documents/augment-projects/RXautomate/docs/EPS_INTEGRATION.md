# Electronic Prescription Service (EPS) Integration

This document provides an overview of the Electronic Prescription Service (EPS) integration in RXautomate.

## Overview

The Electronic Prescription Service (EPS) allows prescribers to send prescriptions electronically to a dispenser (pharmacy) of the patient's choice. RXautomate integrates with the NHS EPS API to:

1. Download electronic prescriptions assigned to the pharmacy
2. Process and dispense prescriptions
3. Update prescription status in the NHS Spine
4. Track prescription status throughout the workflow

## Implementation Details

### Core Components

- **EPSService**: Core service for interacting with EPS APIs
- **API Routes**: RESTful endpoints for frontend integration
- **UI Components**: User interface for managing EPS prescriptions

### Authentication

EPS integration uses OAuth 2.0 client credentials flow for authentication with NHS Digital:

```typescript
// Example: System-level authentication
const params = new URLSearchParams();
params.append('grant_type', 'client_credentials');
params.append('client_id', process.env.NHS_CLIENT_ID);
params.append('client_secret', process.env.NHS_CLIENT_SECRET);
params.append('scope', 'urn:nhsd:fhir:rest:read:medication urn:nhsd:fhir:rest:write:medication');
```

### Key Features

1. **Prescription Download**
   - Fetch prescriptions for a specific pharmacy by ODS code
   - Fetch prescriptions for a specific patient by NHS number
   - Filter prescriptions by status, date, etc.

2. **Prescription Management**
   - View prescription details
   - Update prescription status
   - Complete (dispense) prescriptions
   - Cancel prescriptions with reason

3. **Error Handling & Resilience**
   - Automatic retry for transient errors
   - Exponential backoff strategy
   - Comprehensive error logging

4. **Performance Optimization**
   - Caching of prescription data
   - Efficient API request batching
   - Pagination support for large result sets

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/prescriptions/pharmacy/:odsCode` | GET | Get prescriptions for a pharmacy |
| `/api/prescriptions/patient/:nhsNumber` | GET | Get prescriptions for a patient |
| `/api/prescriptions/:id` | GET | Get a specific prescription |
| `/api/prescriptions/:id` | PUT | Update prescription status |
| `/api/prescriptions/:id/complete` | POST | Mark prescription as completed |
| `/api/prescriptions/:id/cancel` | POST | Cancel a prescription |
| `/api/prescriptions/search` | POST | Advanced search for prescriptions |
| `/api/prescriptions/batch` | POST | Process multiple prescriptions in batch |
| `/api/prescriptions/:id/history` | GET | Get prescription status history |
| `/api/prescriptions/:id/stock` | GET | Check inventory stock for a prescription |
| `/api/prescriptions/pharmacy/:odsCode/check-new` | GET | Check for new prescriptions |
| `/api/analytics/prescriptions` | GET | Get prescription analytics data |

## Environment Variables

The following environment variables must be configured:

```
# NHS API Credentials
NHS_CLIENT_ID="your-nhs-client-id"
NHS_CLIENT_SECRET="your-nhs-client-secret"
NHS_API_KEY="your-nhs-api-key"

# NHS API Base URLs (defaults to sandbox, change for production)
NHS_API_BASE_URL="https://sandbox.api.service.nhs.uk"
NHS_AUTH_URL="https://api.service.nhs.uk/oauth2/token"
```

## Testing

The EPS integration includes comprehensive unit tests:

```bash
# Run EPS service tests
npm test -- src/tests/services/EPSService.test.ts
```

## User Interface

The EPS integration includes a user interface for managing electronic prescriptions:

1. **Prescription List**: View all electronic prescriptions for the pharmacy
2. **Prescription Details**: View detailed information about a prescription
3. **Prescription Actions**: Dispense or cancel prescriptions

## Advanced Features

### 1. Advanced Search and Filtering

The EPS integration includes a sophisticated search interface that allows users to:

- Search by patient name, NHS number, or medication name
- Filter by prescription status
- Filter by date range
- Sort results by various criteria
- Limit the number of results

### 2. Batch Processing

The batch processing feature allows pharmacists to:

- Select multiple prescriptions for processing
- Dispense or cancel multiple prescriptions in a single operation
- Provide a single reason for batch cancellations
- View batch operation results
- Automatic inventory checking before dispensing

### 3. Detailed Prescription View

The detailed prescription view provides:

- Comprehensive prescription information
- Medication details and dosage instructions
- Prescription timeline showing status changes
- Inventory status for prescribed medications
- Actions for dispensing or cancelling prescriptions
- Print functionality for prescription details

### 4. Prescription Timeline

The prescription timeline feature:

- Displays a chronological history of prescription status changes
- Shows who made each change and when
- Includes reasons for status changes when available
- Provides a visual representation of the prescription lifecycle

### 5. Real-time Notifications

The notification system provides:

- Real-time alerts for new prescriptions
- Notifications for expiring prescriptions
- Status update notifications
- Error notifications
- Browser notifications support
- Unread count indicator

### 6. Prescription Analytics

The analytics dashboard provides:

- Key metrics (total prescriptions, dispensing rate, processing time)
- Trend indicators comparing to previous periods
- Daily prescription activity charts
- Status distribution visualization
- Prescription type breakdown
- Customizable time range selection

### 7. Inventory Integration

The inventory integration feature:

- Automatically checks stock levels before dispensing
- Prevents dispensing when items are out of stock
- Warns about low stock levels
- Updates inventory automatically after dispensing
- Links prescriptions to inventory items

## Future Enhancements

1. **Smartcard Integration**: Support for NHS smartcard authentication
2. **Barcode Scanning**: Scan prescription barcodes for quick access
3. **Advanced Reporting**: Generate detailed reports on prescription processing metrics
4. **Mobile App Integration**: Access prescriptions and notifications on mobile devices
5. **AI-Powered Recommendations**: Suggest actions based on prescription patterns
6. **Integration with Patient Records**: Link prescriptions to comprehensive patient records

## References

- [NHS Digital EPS API Documentation](https://digital.nhs.uk/developer/api-catalogue/electronic-prescription-service-fhir)
- [FHIR MedicationRequest Resource](https://www.hl7.org/fhir/medicationrequest.html)
- [NHS Digital OAuth 2.0 Documentation](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/user-restricted-restful-apis-nhs-cis2-authentication)
