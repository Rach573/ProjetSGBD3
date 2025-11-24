/* Simple test script to verify Prisma can connect to the database.
 * Usage (PowerShell):
 *   node .\scripts\test-prisma-connection.js
 * Ensure you have a `.env` at project root with DATABASE_URL set, and MariaDB is running.
 */

const path = require('path');
const fs = require('fs');

// Load .env if present
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

async function resolvePrismaClient() {
  const candidate = path.resolve(__dirname, '..', 'src', 'main', 'repositories', 'prisma', 'generated', 'index.js');
  if (fs.existsSync(candidate)) {
    return require(candidate).PrismaClient;
  }
  // fallback to @prisma/client
  try {
    return require('@prisma/client').PrismaClient;
  } catch (err) {
    throw new Error('Prisma client not found. Run `npm run prisma:generate` first.');
  }
}

(async () => {
  console.log('DATABASE_URL (from env):', process.env.DATABASE_URL ? 'present' : 'MISSING');
  try {
    const PrismaClient = await resolvePrismaClient();
    const prisma = new PrismaClient();
    console.log('Attempting to connect to the database...');
    // simple raw query to verify connection
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Query result:', res);
    await prisma.$disconnect();
    console.log('✅ Connection OK');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(2);
  }
})();
