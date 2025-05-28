import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus, PharmacyRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a test organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'test-pharmacy-group' },
    update: {},
    create: {
      name: 'Test Pharmacy Group',
      slug: 'test-pharmacy-group',
      contactEmail: 'admin@testpharmacy.co.uk',
      contactPhone: '020 1234 5678',
      address: '123 High Street',
      postcode: 'SW1A 1AA',
      subscriptionTier: SubscriptionTier.STANDARD,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  });

  console.log('Created organization:', organization.name);

  // Create a test pharmacy
  const pharmacy = await prisma.pharmacy.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: 'main-pharmacy',
      },
    },
    update: {},
    create: {
      name: 'Main Pharmacy',
      slug: 'main-pharmacy',
      address: '123 High Street',
      postcode: 'SW1A 1AA',
      phoneNumber: '020 1234 5678',
      email: 'pharmacy@testpharmacy.co.uk',
      nhsContractNumber: 'NHS123456',
      organizationId: organization.id,
    },
  });

  console.log('Created pharmacy:', pharmacy.name);

  // Create a super admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@rxautomate.co.uk' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@rxautomate.co.uk',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('Created super admin user:', superAdmin.email);

  // Create an organization admin
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'manager@testpharmacy.co.uk' },
    update: {},
    create: {
      name: 'Pharmacy Manager',
      email: 'manager@testpharmacy.co.uk',
      password: hashedPassword,
      role: UserRole.ORG_ADMIN,
      isActive: true,
      organizationId: organization.id,
    },
  });

  console.log('Created organization admin:', orgAdmin.email);

  // Create a pharmacy staff user
  const pharmacist = await prisma.user.upsert({
    where: { email: 'pharmacist@testpharmacy.co.uk' },
    update: {},
    create: {
      name: 'Test Pharmacist',
      email: 'pharmacist@testpharmacy.co.uk',
      password: hashedPassword,
      role: UserRole.PHARMACY_STAFF,
      isActive: true,
      organizationId: organization.id,
    },
  });

  console.log('Created pharmacist user:', pharmacist.email);

  // Link the pharmacist to the pharmacy
  await prisma.userPharmacy.upsert({
    where: {
      userId_pharmacyId: {
        userId: pharmacist.id,
        pharmacyId: pharmacy.id,
      },
    },
    update: {},
    create: {
      userId: pharmacist.id,
      pharmacyId: pharmacy.id,
      role: PharmacyRole.PHARMACIST,
      assignedBy: orgAdmin.id,
    },
  });

  // Link the org admin to the pharmacy
  await prisma.userPharmacy.upsert({
    where: {
      userId_pharmacyId: {
        userId: orgAdmin.id,
        pharmacyId: pharmacy.id,
      },
    },
    update: {},
    create: {
      userId: orgAdmin.id,
      pharmacyId: pharmacy.id,
      role: PharmacyRole.ADMIN,
      assignedBy: superAdmin.id,
    },
  });

  console.log('Linked users to pharmacy');

  // Create some test patients
  const patient1 = await prisma.patient.upsert({
    where: {
      pharmacyId_nhsNumber: {
        pharmacyId: pharmacy.id,
        nhsNumber: '1234567890',
      },
    },
    update: {},
    create: {
      nhsNumber: '1234567890',
      title: 'Mr',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1980-01-01'),
      address: '456 High Street',
      postcode: 'SW1A 2BB',
      phoneNumber: '07700 900123',
      email: 'john.smith@example.com',
      pharmacyId: pharmacy.id,
    },
  });

  console.log('Created test patient:', patient1.firstName, patient1.lastName);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
