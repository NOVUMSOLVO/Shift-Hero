const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing password verification...');
    
    // Get the admin user
    const admin = await prisma.user.findUnique({
      where: {
        email: 'admin@rxautomate.co.uk',
      },
    });
    
    if (!admin) {
      console.log('Admin user not found!');
      return;
    }
    
    // Test password verification
    const password = 'Admin123!';
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    console.log(`Password verification result: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Input password: ${password}`);
    console.log(`Stored hash: ${admin.password}`);
    
  } catch (error) {
    console.error('Error testing password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
