const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    
    // Test connection by getting all users
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    // Test finding a specific user
    const admin = await prisma.user.findUnique({
      where: {
        email: 'admin@rxautomate.co.uk',
      },
    });
    
    if (admin) {
      console.log('\nFound admin user:');
      console.log(`- ID: ${admin.id}`);
      console.log(`- Name: ${admin.name}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Role: ${admin.role}`);
      console.log(`- Password hash: ${admin.password ? admin.password.substring(0, 20) + '...' : 'null'}`);
    } else {
      console.log('\nAdmin user not found!');
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
