# RXautomate - Multi-Tenant UK Pharmacy Automation System

RXautomate is a comprehensive multi-tenant system designed to automate UK pharmacy processes including NHS prescription handling, inventory management, private prescriptions, vaccination campaigns, and GDPR-compliant patient engagement.

## Features

### 1. Multi-Tenant Architecture

- Support for multiple pharmacy organizations
- Secure data isolation between tenants
- Role-based access control
- Organization and pharmacy management

### 2. NHS Prescription Handling & EPS Integration

- Automated patient eligibility and exemption status checking
- NHS Spine integration for patient verification and exemption checking
- Real-time eligibility verification against NHS BSA database
- SMS reminders for repeat prescriptions via NHS Notify API
- Flagging of mismatches (e.g., expired exemptions) before dispensing
- Comprehensive audit trail for all NHS prescription activities
- Secure OAuth 2.0 authentication with NHS Digital APIs

### 3. Inventory Management

- Automated stock tracking and alerts
- Integration with UK wholesalers (AAH, Alliance, Phoenix)
- Smart reordering based on usage patterns

### 4. Private Prescription & Travel Clinic Workflows

- Automated private invoicing with payment links
- Integration with Travel Health Pro API for vaccine requirements
- Streamlined private service management

### 5. NHS Vaccination Campaign Management

- Appointment scheduling for NHS-funded jabs
- Automated SMS invites for eligible patients
- Integration with PharmOutcomes for claim submissions

### 6. GDPR-Compliant Patient Engagement

- Explicit consent management for patient communications
- Automated consent logging and expiry tracking
- Compliant with UK data protection regulations

### 7. Admin Dashboard

- Organization management
- Pharmacy management
- User management
- Subscription and billing management

## Technology Stack

- **Frontend**: React with Next.js
- **Backend**: Node.js with Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multi-tenant support
- **Styling**: Tailwind CSS with NHS color palette
- **APIs**: Integration with NHS Spine, EPS, NHS Notify, and more

## UK-Specific Integrations

- **NHS APIs**: NHS Login, NHS Notify, EPS, NHS Spine, NHS BSA
- **Pharmacy Software**: PharmOutcomes, RxWeb, ProScript Connect
- **Wholesalers**: AAH, Alliance, Phoenix

## NHS API Integration

RXautomate integrates with several NHS Digital APIs to provide comprehensive prescription handling:

### NHS Spine Service
- Patient demographic verification via Personal Demographics Service (PDS)
- Exemption status checking via Prescription Exemption Checking Service (PECS)
- Eligibility verification against NHS BSA database
- GP details retrieval for comprehensive patient records

### Electronic Prescription Service (EPS)
- Prescription download and processing
- Prescription status updates
- Pharmacy and patient prescription listings

### NHS Notify
- SMS notifications for prescription readiness
- Collection reminders with configurable timing
- Automated communication based on prescription status changes

All NHS API integrations use OAuth 2.0 authentication and include comprehensive error handling, caching for performance optimization, and full audit logging for compliance.

## System Architecture

### Multi-Tenant Data Model

The system uses a multi-tenant architecture with the following key models:

- **Organization**: Represents a pharmacy chain or group
- **Pharmacy**: Individual pharmacy locations within an organization
- **User**: Staff members with role-based permissions
- **Patient**: Patient records associated with specific pharmacies
- **Prescription**: Prescription records with pharmacy context
- **Inventory**: Stock management with pharmacy context
- **Appointment**: Vaccination and service appointments
- **Consent**: GDPR consent records

### Authentication & Authorization

- JWT-based authentication with NextAuth.js
- Role-based access control (RBAC)
- Tenant isolation middleware
- Pharmacy context selection

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- NHS API credentials (for production use)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/rxautomate.git
   cd rxautomate
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Update the variables with your database and API credentials

4. Set up the database:
   ```
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## User Roles

- **Super Admin**: Can manage all organizations and system settings
- **Organization Admin**: Can manage their organization and all its pharmacies
- **Pharmacy Admin**: Can manage a specific pharmacy
- **Pharmacy Staff**: Regular staff with limited permissions

## Subscription Tiers

- **Basic**: Limited features
- **Standard**: Standard features
- **Premium**: All features
- **Enterprise**: Custom features and support

## Deployment

For production deployment, we recommend using Vercel or a similar platform that supports Next.js applications.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- NHS Digital for their API documentation and services
- UK pharmacy software providers for integration capabilities
- UK wholesalers for their ordering APIs
