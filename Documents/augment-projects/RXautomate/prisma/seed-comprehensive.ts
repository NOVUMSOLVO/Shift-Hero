import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus, PharmacyRole, PrescriptionType, PrescriptionStatus, AppointmentType, AppointmentStatus, ConsentType, TransactionType, TransactionStatus, IntegrationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, addMonths, format } from 'date-fns';

const prisma = new PrismaClient();

// Configuration for seed data volume
const CONFIG = {
  organizations: 2,
  pharmaciesPerOrg: 3,
  patientsPerPharmacy: 50,
  prescriptionsPerPatient: 3,
  inventoryItemsPerPharmacy: 100,
  appointmentsPerPharmacy: 30,
  transactionsPerPharmacy: 50,
  usersPerOrg: 5,
  auditLogsPerPharmacy: 100,
};

// Common password for all test users
const TEST_PASSWORD = 'Password123!';

// Helper function to generate random date within a range
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random number within range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random decimal within range
function randomDecimal(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Helper function to generate random boolean with probability
function randomBoolean(trueProbability = 0.5): boolean {
  return Math.random() < trueProbability;
}

// Helper function to generate random NHS number
function generateNhsNumber(): string {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

// Helper function to generate random UK postcode
function generatePostcode(): string {
  const areas = ['SW', 'NW', 'SE', 'NE', 'E', 'W', 'N', 'S', 'EC', 'WC'];
  const area = getRandomItem(areas);
  const district = randomInt(1, 20);
  const sector = randomInt(1, 9);
  const unit = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
               String.fromCharCode(65 + Math.floor(Math.random() * 26));

  return `${area}${district} ${sector}${unit}`;
}

// Helper function to generate random UK phone number
function generatePhoneNumber(): string {
  const prefixes = ['07700', '07800', '07900', '07500', '07600'];
  const prefix = getRandomItem(prefixes);
  const suffix = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

  return `${prefix} ${suffix}`;
}

// Helper function to generate random email
function generateEmail(firstName: string, lastName: string, domain = 'example.com'): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Helper function to generate random prescription number
function generatePrescriptionNumber(): string {
  return `RX-${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
}

// Helper function to generate random product code
function generateProductCode(): string {
  return `P${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
}

// Lists for generating realistic data
const MEDICATION_NAMES = [
  'Amoxicillin 500mg capsules', 'Paracetamol 500mg tablets', 'Ibuprofen 400mg tablets',
  'Simvastatin 20mg tablets', 'Omeprazole 20mg capsules', 'Ramipril 5mg capsules',
  'Amlodipine 5mg tablets', 'Salbutamol 100mcg inhaler', 'Metformin 500mg tablets',
  'Levothyroxine 50mcg tablets', 'Atorvastatin 10mg tablets', 'Aspirin 75mg tablets',
  'Bisoprolol 2.5mg tablets', 'Bendroflumethiazide 2.5mg tablets', 'Codeine 30mg tablets',
  'Fluoxetine 20mg capsules', 'Lansoprazole 15mg capsules', 'Lisinopril 10mg tablets',
  'Naproxen 250mg tablets', 'Sertraline 50mg tablets', 'Tramadol 50mg capsules',
  'Warfarin 3mg tablets', 'Citalopram 20mg tablets', 'Diazepam 5mg tablets',
  'Furosemide 40mg tablets', 'Gabapentin 300mg capsules', 'Methotrexate 2.5mg tablets',
  'Propranolol 40mg tablets', 'Ramipril 10mg tablets', 'Venlafaxine 75mg tablets'
];

const DOSAGE_INSTRUCTIONS = [
  'Take one tablet daily', 'Take one capsule twice daily', 'Take two tablets three times a day',
  'Take one tablet at night', 'Take one tablet in the morning', 'Take as needed for pain',
  'Take with food', 'Take on an empty stomach', 'Take one tablet every 4-6 hours',
  'Use one puff twice daily', 'Take one tablet before meals', 'Take one tablet after meals',
  'Take one tablet every other day', 'Take two tablets at bedtime', 'Take as directed'
];

const MEDICATION_CATEGORIES = [
  'Antibiotics', 'Analgesics', 'Antidepressants', 'Antihypertensives', 'Statins',
  'Anticoagulants', 'Antidiabetics', 'Antihistamines', 'Bronchodilators', 'Corticosteroids',
  'Proton Pump Inhibitors', 'NSAIDs', 'Opioids', 'Thyroid Medications', 'Vaccines'
];

const SUPPLIERS = [
  'AAH Pharmaceuticals', 'Alliance Healthcare', 'Phoenix Medical', 'Sigma Pharmaceuticals',
  'Mawdsleys', 'DE Pharmaceuticals', 'Lexon UK', 'Trident Pharmaceuticals', 'Teva UK',
  'Accord Healthcare', 'Actavis UK', 'Mylan', 'Sandoz', 'Zentiva', 'Wockhardt UK'
];

const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Mohammed', 'Ahmed', 'Ali', 'Omar', 'Fatima', 'Aisha', 'Zainab', 'Maryam', 'Yusuf', 'Ibrahim',
  'Olivia', 'Emma', 'Ava', 'Charlotte', 'Sophia', 'Amelia', 'Isabella', 'Mia', 'Evelyn', 'Harper',
  'Liam', 'Noah', 'Oliver', 'Elijah', 'William', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
  'Patel', 'Singh', 'Kaur', 'Shah', 'Khan', 'Begum', 'Sharma', 'Chowdhury', 'Hussain', 'Rahman'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White',
  'Patel', 'Khan', 'Ali', 'Singh', 'Shah', 'Ahmed', 'Begum', 'Sharma', 'Hussain', 'Rahman',
  'Murphy', 'O\'Connor', 'Ryan', 'O\'Neill', 'Walsh', 'Sullivan', 'O\'Brien', 'Kelly', 'McCarthy', 'Byrne',
  'Lee', 'Wong', 'Chen', 'Yang', 'Kim', 'Li', 'Zhang', 'Liu', 'Wang', 'Nguyen',
  'Kowalski', 'Nowak', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski'
];

const TITLES = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof'];

const APPOINTMENT_NOTES = [
  'Patient requested this appointment for regular check-up',
  'Follow-up appointment after previous consultation',
  'First-time vaccination for this patient',
  'Patient has history of adverse reactions, proceed with caution',
  'Patient requested specific pharmacist for this appointment',
  'Appointment rescheduled from previous week',
  'Patient may require translator assistance',
  'Patient has mobility issues, please accommodate',
  'Urgent appointment requested by GP',
  'Annual review appointment'
];

async function main() {
  console.log('Starting comprehensive seed...');

  // Hash the test password once
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  // Create a super admin user for system access
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@rxautomate.co.uk' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@rxautomate.co.uk',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      lastLogin: new Date(),
    },
  });

  console.log(`Created super admin: ${superAdmin.email} (password: ${TEST_PASSWORD})`);

  // Create a demo user for easy access
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@rxautomate.co.uk' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@rxautomate.co.uk',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      lastLogin: new Date(),
    },
  });

  console.log(`Created demo user: ${demoUser.email} (password: ${TEST_PASSWORD})`);

  // Create organizations
  const organizations = [];

  for (let i = 0; i < CONFIG.organizations; i++) {
    const orgName = i === 0 ? 'London Pharmacy Group' : `Pharmacy Chain ${i + 1}`;
    const orgSlug = i === 0 ? 'london-pharmacy-group' : `pharmacy-chain-${i + 1}`;

    const organization = await prisma.organization.upsert({
      where: { slug: orgSlug },
      update: {},
      create: {
        name: orgName,
        slug: orgSlug,
        contactEmail: `admin@${orgSlug.replace(/-/g, '')}.co.uk`,
        contactPhone: generatePhoneNumber(),
        address: `${randomInt(1, 100)} High Street`,
        postcode: generatePostcode(),
        subscriptionTier: getRandomItem([
          SubscriptionTier.BASIC,
          SubscriptionTier.STANDARD,
          SubscriptionTier.PREMIUM,
          SubscriptionTier.ENTERPRISE
        ]),
        subscriptionStatus: getRandomItem([
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIAL
        ]),
        subscriptionExpiry: addMonths(new Date(), randomInt(1, 12)),
      },
    });

    organizations.push(organization);
    console.log(`Created organization: ${organization.name}`);

    // Create users for this organization
    for (let j = 0; j < CONFIG.usersPerOrg; j++) {
      const firstName = getRandomItem(FIRST_NAMES);
      const lastName = getRandomItem(LAST_NAMES);
      const email = generateEmail(firstName, lastName, `${orgSlug.replace(/-/g, '')}.co.uk`);
      const role = j === 0
        ? UserRole.ORG_ADMIN
        : getRandomItem([UserRole.PHARMACY_ADMIN, UserRole.PHARMACY_STAFF]);

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          role,
          isActive: true,
          lastLogin: randomBoolean(0.7) ? randomDate(subDays(new Date(), 30), new Date()) : null,
          organizationId: organization.id,
        },
      });

      console.log(`Created user: ${user.email} (${user.role})`);
    }

    // Create pharmacies for this organization
    for (let j = 0; j < CONFIG.pharmaciesPerOrg; j++) {
      const pharmacyName = j === 0
        ? `${orgName} - Main Branch`
        : `${orgName} - ${['North', 'South', 'East', 'West', 'Central'][j % 5]} Branch`;

      const pharmacySlug = j === 0
        ? `${orgSlug}-main`
        : `${orgSlug}-${['north', 'south', 'east', 'west', 'central'][j % 5]}`;

      const pharmacy = await prisma.pharmacy.upsert({
        where: {
          organizationId_slug: {
            organizationId: organization.id,
            slug: pharmacySlug,
          },
        },
        update: {},
        create: {
          name: pharmacyName,
          slug: pharmacySlug,
          address: `${randomInt(1, 100)} ${['High Street', 'Main Road', 'Broadway', 'Market Street', 'Station Road'][j % 5]}`,
          postcode: generatePostcode(),
          phoneNumber: generatePhoneNumber(),
          email: `pharmacy@${pharmacySlug.replace(/-/g, '')}.co.uk`,
          nhsContractNumber: `FW${randomInt(10000, 99999)}`,
          organizationId: organization.id,
        },
      });

      console.log(`Created pharmacy: ${pharmacy.name}`);

      // Link users to this pharmacy
      const orgUsers = await prisma.user.findMany({
        where: { organizationId: organization.id },
      });

      for (const user of orgUsers) {
        // Assign all users to the main branch, but only some to other branches
        if (j === 0 || randomBoolean(0.5)) {
          const pharmacyRole = user.role === UserRole.ORG_ADMIN
            ? PharmacyRole.ADMIN
            : user.role === UserRole.PHARMACY_ADMIN
              ? PharmacyRole.ADMIN
              : getRandomItem([PharmacyRole.PHARMACIST, PharmacyRole.TECHNICIAN, PharmacyRole.STAFF]);

          await prisma.userPharmacy.upsert({
            where: {
              userId_pharmacyId: {
                userId: user.id,
                pharmacyId: pharmacy.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              pharmacyId: pharmacy.id,
              role: pharmacyRole,
              assignedBy: superAdmin.id,
            },
          });

          console.log(`Linked user ${user.email} to pharmacy ${pharmacy.name} as ${pharmacyRole}`);
        }
      }

      // Create pharmacy integrations
      const integrationTypes = [
        IntegrationType.PHARMACY_SYSTEM,
        IntegrationType.WHOLESALER,
        IntegrationType.PAYMENT_PROVIDER,
        IntegrationType.SMS_PROVIDER
      ];

      for (const integrationType of integrationTypes) {
        if (randomBoolean(0.7)) {
          await prisma.pharmacyIntegration.create({
            data: {
              integrationType,
              apiKey: `api_key_${uuidv4().substring(0, 8)}`,
              apiSecret: `api_secret_${uuidv4().substring(0, 8)}`,
              accessToken: randomBoolean(0.5) ? `access_token_${uuidv4().substring(0, 8)}` : null,
              refreshToken: randomBoolean(0.5) ? `refresh_token_${uuidv4().substring(0, 8)}` : null,
              tokenExpiry: randomBoolean(0.5) ? addDays(new Date(), randomInt(1, 30)) : null,
              isActive: randomBoolean(0.8),
              pharmacyId: pharmacy.id,
            },
          });

          console.log(`Created ${integrationType} integration for ${pharmacy.name}`);
        }
      }

      // Create inventory items for this pharmacy
      for (let k = 0; k < CONFIG.inventoryItemsPerPharmacy; k++) {
        const medicationName = getRandomItem(MEDICATION_NAMES);
        const category = getRandomItem(MEDICATION_CATEGORIES);
        const supplier = getRandomItem(SUPPLIERS);

        await prisma.inventoryItem.create({
          data: {
            productCode: generateProductCode(),
            name: medicationName,
            description: `${medicationName} - ${getRandomItem(DOSAGE_INSTRUCTIONS)}`,
            category,
            supplier,
            currentStock: randomInt(0, 200),
            reorderLevel: randomInt(10, 50),
            reorderQuantity: randomInt(50, 100),
            unitPrice: randomDecimal(1, 50),
            pharmacyId: pharmacy.id,
          },
        });
      }

      console.log(`Created ${CONFIG.inventoryItemsPerPharmacy} inventory items for ${pharmacy.name}`);

      // Create patients for this pharmacy
      const patients = [];

      for (let k = 0; k < CONFIG.patientsPerPharmacy; k++) {
        const firstName = getRandomItem(FIRST_NAMES);
        const lastName = getRandomItem(LAST_NAMES);
        const title = getRandomItem(TITLES);
        const dateOfBirth = randomDate(new Date(1940, 0, 1), new Date(2010, 0, 1));
        const nhsNumber = generateNhsNumber();

        const patient = await prisma.patient.create({
          data: {
            nhsNumber,
            title,
            firstName,
            lastName,
            dateOfBirth,
            address: `${randomInt(1, 100)} ${['High Street', 'Main Road', 'Park Avenue', 'Church Lane', 'Station Road'][k % 5]}`,
            postcode: generatePostcode(),
            phoneNumber: generatePhoneNumber(),
            email: randomBoolean(0.8) ? generateEmail(firstName, lastName) : null,
            exemptionStatus: randomBoolean(0.3) ? getRandomItem(['A', 'B', 'D', 'E', 'F', 'G', 'L', 'M', 'S', 'U']) : null,
            exemptionEndDate: randomBoolean(0.2) ? addMonths(new Date(), randomInt(1, 12)) : null,
            isActive: randomBoolean(0.9),
            pharmacyId: pharmacy.id,
          },
        });

        patients.push(patient);

        // Create consents for this patient
        for (const consentType of Object.values(ConsentType)) {
          if (randomBoolean(0.7)) {
            await prisma.consent.create({
              data: {
                consentType,
                consentGiven: randomBoolean(0.8),
                consentDate: randomDate(subDays(new Date(), 365), new Date()),
                expiryDate: randomBoolean(0.5) ? addMonths(new Date(), randomInt(12, 36)) : null,
                patientId: patient.id,
                pharmacyId: pharmacy.id,
              },
            });
          }
        }
      }

      console.log(`Created ${patients.length} patients for ${pharmacy.name}`);

      // Create prescriptions for patients
      for (const patient of patients) {
        for (let l = 0; l < CONFIG.prescriptionsPerPatient; l++) {
          const issuedDate = randomDate(subDays(new Date(), 90), new Date());
          const expiryDate = addDays(issuedDate, 28);
          const prescriptionType = getRandomItem(Object.values(PrescriptionType));

          // Determine status based on dates and randomness
          let status;
          const now = new Date();

          if (expiryDate < now && randomBoolean(0.7)) {
            status = randomBoolean(0.8) ? PrescriptionStatus.COLLECTED : PrescriptionStatus.EXPIRED;
          } else if (issuedDate > subDays(now, 7)) {
            status = getRandomItem([PrescriptionStatus.PENDING, PrescriptionStatus.PROCESSING]);
          } else {
            status = getRandomItem([
              PrescriptionStatus.PROCESSING,
              PrescriptionStatus.DISPENSED,
              PrescriptionStatus.COLLECTED
            ]);
          }

          const prescription = await prisma.prescription.create({
            data: {
              prescriptionType,
              prescriptionNumber: generatePrescriptionNumber(),
              issuedDate,
              expiryDate,
              status,
              patientId: patient.id,
              pharmacyId: pharmacy.id,
            },
          });

          // Create prescription items
          const itemCount = randomInt(1, 5);
          for (let m = 0; m < itemCount; m++) {
            const medicationName = getRandomItem(MEDICATION_NAMES);
            const dosage = getRandomItem(DOSAGE_INSTRUCTIONS);

            await prisma.prescriptionItem.create({
              data: {
                medicationName,
                dosage,
                quantity: randomInt(14, 84),
                instructions: `${dosage}. ${randomBoolean(0.3) ? 'Take with food.' : ''}`,
                prescriptionId: prescription.id,
              },
            });
          }

          // Create transaction for completed prescriptions
          if (status === PrescriptionStatus.COLLECTED || status === PrescriptionStatus.DISPENSED) {
            await prisma.transaction.create({
              data: {
                transactionType: TransactionType.PRESCRIPTION_FEE,
                amount: prescriptionType === PrescriptionType.PRIVATE ? randomDecimal(10, 50) : 9.35,
                status: TransactionStatus.COMPLETED,
                reference: `TRX-${uuidv4().substring(0, 8)}`,
                prescriptionId: prescription.id,
                pharmacyId: pharmacy.id,
              },
            });
          }
        }
      }

      console.log(`Created prescriptions for patients at ${pharmacy.name}`);

      // Create appointments
      for (let k = 0; k < CONFIG.appointmentsPerPharmacy; k++) {
        const appointmentType = getRandomItem(Object.values(AppointmentType));
        const date = randomDate(subDays(new Date(), 30), addDays(new Date(), 60));
        const isPast = date < new Date();

        // Determine status based on date
        let status;
        if (isPast) {
          status = getRandomItem([
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW
          ], [0.7, 0.2, 0.1]);
        } else {
          status = AppointmentStatus.SCHEDULED;
        }

        // Select a random patient
        const patient = getRandomItem(patients);

        await prisma.appointment.create({
          data: {
            appointmentType,
            date,
            status,
            notes: randomBoolean(0.7) ? getRandomItem(APPOINTMENT_NOTES) : null,
            patientId: patient.id,
            pharmacyId: pharmacy.id,
          },
        });
      }

      console.log(`Created ${CONFIG.appointmentsPerPharmacy} appointments for ${pharmacy.name}`);

      // Create additional transactions (not linked to prescriptions)
      for (let k = 0; k < CONFIG.transactionsPerPharmacy; k++) {
        const transactionType = getRandomItem([
          TransactionType.PRIVATE_SERVICE,
          TransactionType.VACCINATION,
          TransactionType.OTHER
        ]);

        const date = randomDate(subDays(new Date(), 90), new Date());

        await prisma.transaction.create({
          data: {
            transactionType,
            amount: randomDecimal(5, 100),
            status: getRandomItem(Object.values(TransactionStatus)),
            reference: `TRX-${uuidv4().substring(0, 8)}`,
            pharmacyId: pharmacy.id,
            createdAt: date,
            updatedAt: date,
          },
        });
      }

      console.log(`Created additional transactions for ${pharmacy.name}`);

      // Create audit logs
      const auditActions = [
        'GET_PATIENT', 'CHECK_EXEMPTION', 'VERIFY_ELIGIBILITY', 'GET_PRESCRIPTION',
        'UPDATE_PRESCRIPTION', 'SEARCH_PRESCRIPTIONS', 'SEND_NOTIFICATION', 'API_ERROR',
        'AUTHENTICATION', 'CACHE_OPERATION', 'SYSTEM_EVENT'
      ];

      const auditCategories = [
        'NHS_API', 'PRESCRIPTION', 'PATIENT', 'AUTHENTICATION', 'SYSTEM'
      ];

      for (let k = 0; k < CONFIG.auditLogsPerPharmacy; k++) {
        const action = getRandomItem(auditActions);
        const category = getRandomItem(auditCategories);
        const date = randomDate(subDays(new Date(), 30), new Date());

        // Randomly select a user and patient
        const user = getRandomItem(orgUsers);
        const patient = randomBoolean(0.7) ? getRandomItem(patients) : null;

        await prisma.auditLog.create({
          data: {
            action,
            category,
            userId: randomBoolean(0.8) ? user.id : null,
            patientId: patient?.id,
            nhsNumber: patient?.nhsNumber,
            details: JSON.stringify({
              status: randomBoolean(0.8) ? 'success' : 'error',
              message: randomBoolean(0.8) ? 'Operation completed successfully' : 'Error processing request',
              timestamp: date.toISOString(),
            }),
            ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            timestamp: date,
          },
        });
      }

      console.log(`Created audit logs for ${pharmacy.name}`);
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('\nYou can now log in with the following credentials:');
  console.log(`- Super Admin: ${superAdmin.email} / ${TEST_PASSWORD}`);
  console.log(`- Demo User: ${demoUser.email} / ${TEST_PASSWORD}`);
  console.log('\nEnjoy exploring RXautomate!');
}

// Helper function to get random item with weighted probabilities
function getRandomItem<T>(array: T[], weights?: number[]): T {
  if (!weights) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Normalize weights if they don't sum to 1
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum !== 1) {
    weights = weights.map(w => w / sum);
  }

  // Create cumulative weights
  const cumulativeWeights = [];
  let cumulative = 0;

  for (const weight of weights) {
    cumulative += weight;
    cumulativeWeights.push(cumulative);
  }

  // Get a random number between 0 and 1
  const random = Math.random();

  // Find the index where the random number falls
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (random < cumulativeWeights[i]) {
      return array[i];
    }
  }

  return array[array.length - 1];
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
