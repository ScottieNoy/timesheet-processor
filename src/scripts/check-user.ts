import { prisma } from '../lib/prisma';
import { hash } from 'bcrypt';

async function main() {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!adminUser) {
      // Create admin user if it doesn't exist
      const hashedPassword = await hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          isAdmin: true,
        },
      });
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
