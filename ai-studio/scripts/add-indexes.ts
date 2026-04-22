const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS idx_gen_user_status_created ON Generation(userId, status, createdAt)'
    );
    console.log('✅ Created index: idx_gen_user_status_created');

    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS idx_gen_user_created ON Generation(userId, createdAt)'
    );
    console.log('✅ Created index: idx_gen_user_created');

    console.log('✅ All indexes created successfully. No data was lost.');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
