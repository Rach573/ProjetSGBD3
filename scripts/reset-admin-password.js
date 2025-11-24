/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');
const path = require('path');
const fs = require('fs');

// Load dotenv manually to ensure DATABASE_URL is available
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const prisma = new PrismaClient();

function hashPassword(plain) {
  const salt = randomBytes(16);
  const derived = scryptSync(plain, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function main() {
  const newPassword = process.argv[2] || 'admin';
  const passwordHash = hashPassword(newPassword);

  await prisma.users.upsert({
    where: { username: 'admin' },
    update: { password_hash: passwordHash, role: 'admin' },
    create: { username: 'admin', password_hash: passwordHash, role: 'admin' },
  });

  console.log(`✅ Mot de passe admin mis à jour. Nouveau mot de passe: "${newPassword}".`);
}

main()
  .catch((err) => {
    console.error('Erreur lors de la réinitialisation du mot de passe admin:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
