# Multi-Tenant Architecture Guide for RXautomate

This document outlines the multi-tenant architecture of RXautomate, designed to support multiple pharmacy organizations with secure data isolation.

## Architecture Overview

RXautomate implements a multi-tenant architecture with the following key components:

1. **Tenant Isolation**: Each pharmacy organization (tenant) has its data securely isolated
2. **Shared Infrastructure**: Common infrastructure and code base shared across tenants
3. **Role-Based Access Control**: Granular permissions based on user roles
4. **Tenant-Aware Services**: All services maintain tenant context

## Data Model

The multi-tenant data model is structured as follows:

```
Organization (Tenant)
├── Pharmacies
│   ├── Users
│   ├── Patients
│   ├── Prescriptions
│   ├── Inventory
│   └── Appointments
└── Organization Settings
```

### Key Entities

1. **Organization**: The top-level tenant entity representing a pharmacy group or independent pharmacy
2. **Pharmacy**: Individual pharmacy locations within an organization
3. **User**: Staff members with specific roles and pharmacy assignments
4. **Patient**: Patients associated with specific pharmacies

## Tenant Isolation Strategy

RXautomate implements tenant isolation through:

1. **Database-Level Isolation**: 
   - Foreign key relationships enforce tenant boundaries
   - All queries include tenant context filters

2. **Application-Level Isolation**:
   - Middleware enforces tenant context on all requests
   - Services validate tenant access before operations

3. **API-Level Isolation**:
   - Authentication includes tenant context
   - Authorization checks tenant permissions

## User Roles and Permissions

The system implements a hierarchical role-based access control model:

1. **Super Admin**: System-wide access across all organizations
2. **Organization Admin**: Access to all pharmacies within their organization
3. **Pharmacy Manager**: Full access to a specific pharmacy
4. **Pharmacist**: Clinical access to a specific pharmacy
5. **Pharmacy Staff**: Limited operational access to a specific pharmacy

## Implementation Details

### Tenant Context Middleware

```typescript
// Middleware that enforces tenant context on all requests
export async function tenantMiddleware(req, res, next) {
  // Extract user and tenant information from session
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Set tenant context
  req.tenantId = session.user.organizationId;
  req.pharmacyId = session.user.selectedPharmacyId;
  
  // Validate tenant access
  if (req.params.organizationId && req.params.organizationId !== req.tenantId) {
    // Only super admins can access other organizations
    if (session.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  
  next();
}
```

### Tenant-Aware Database Queries

```typescript
// Example of tenant-aware database query
async function getPatients(pharmacyId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pharmacies: true },
  });
  
  // Check if user has access to this pharmacy
  const hasAccess = user.pharmacies.some(p => p.pharmacyId === pharmacyId);
  
  if (!hasAccess && user.role !== 'SUPER_ADMIN' && user.role !== 'ORG_ADMIN') {
    throw new Error('Access denied');
  }
  
  // Query with tenant context
  return prisma.patient.findMany({
    where: {
      pharmacyId: pharmacyId,
    },
  });
}
```

## Tenant Provisioning and Management

### Tenant Onboarding Process

1. **Registration**:
   - Organization signs up with basic information
   - System creates organization record with default settings

2. **Pharmacy Setup**:
   - Add pharmacy locations with details
   - Configure NHS contract information
   - Set up pharmacy-specific settings

3. **User Provisioning**:
   - Create admin users for the organization
   - Assign users to specific pharmacies
   - Configure role-based permissions

### Tenant Configuration

Each tenant can configure:

1. **Organization Settings**:
   - Branding (logo, colors)
   - Contact information
   - Billing details
   - Default policies

2. **Pharmacy Settings**:
   - Operating hours
   - Service offerings
   - Integration settings
   - Notification preferences

## Subscription and Billing Model

RXautomate implements a tiered subscription model:

1. **Basic Tier**:
   - Essential prescription processing
   - Basic inventory management
   - Limited NHS API integrations

2. **Standard Tier**:
   - Full prescription automation
   - Complete inventory management
   - Standard NHS API integrations
   - Basic reporting

3. **Premium Tier**:
   - Advanced automation features
   - Comprehensive analytics
   - Full NHS API integrations
   - Priority support

### Billing Implementation

- Usage-based billing for certain API transactions
- Monthly subscription fees based on tier
- Per-pharmacy pricing model for multi-location organizations

## Security Considerations

### Data Isolation

- Strict validation of tenant context on all operations
- Regular security audits of tenant boundaries
- Monitoring for potential cross-tenant access attempts

### Tenant-Specific Encryption

- Encryption keys managed per tenant
- Sensitive data encrypted at rest
- Tenant-specific backup and recovery processes

### Access Controls

- Regular permission reviews
- Audit logging of all cross-tenant operations
- Time-limited elevated access for support purposes

## Performance Considerations

### Tenant-Aware Caching

- Cache keys include tenant identifiers
- Separate cache spaces for different tenants
- Cache invalidation respects tenant boundaries

### Database Optimization

- Indexes on tenant identifier columns
- Partitioning strategies for large multi-tenant deployments
- Query optimization for tenant-filtered queries

## Scaling the Multi-Tenant Architecture

### Horizontal Scaling

- Stateless application servers for easy scaling
- Database read replicas for high-traffic tenants
- Tenant-aware load balancing

### Vertical Partitioning

For very large tenants:
- Consider dedicated database instances
- Implement tenant-specific optimizations
- Custom scaling policies

## Monitoring and Observability

- Tenant-tagged metrics and logs
- Per-tenant usage analytics
- Tenant-specific performance monitoring
- Anomaly detection for tenant behavior

## Disaster Recovery

- Regular tenant-aware backups
- Point-in-time recovery capabilities
- Tenant-specific recovery procedures
- Data sovereignty considerations

## Conclusion

The multi-tenant architecture of RXautomate provides a secure, scalable foundation for serving multiple pharmacy organizations while maintaining strict data isolation and efficient resource utilization. This architecture enables the system to scale from small independent pharmacies to large pharmacy chains while maintaining performance and security.
