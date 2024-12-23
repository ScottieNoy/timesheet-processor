const { hash } = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete existing admin user if exists
    await prisma.user.deleteMany({
      where: {
        username: 'admin'
      }
    });

    // Create new admin user
    const hashedPassword = await hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        isAdmin: true,
      },
    });

    console.log('Admin user recreated:', admin);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
