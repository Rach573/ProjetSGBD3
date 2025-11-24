// scripts/seed-prisma-mail.js
// Seed sample mail using Prisma Client so renderer shows "Mails à traiter"
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('[seed-prisma-mail] Vérification de l\'existence d\'un mail non assigné...');
  const existing = await prisma.mail.findFirst({ where: { handler_user_id: null } });
  if (existing) {
    console.log('[seed-prisma-mail] Un mail non assigné existe déjà (id=' + existing.id + '), rien à faire.');
    await prisma.$disconnect();
    return;
  }

  console.log('[seed-prisma-mail] Création d\'un mail de test (handler_user_id = NULL)');
  const created = await prisma.mail.create({
    data: {
      objet: 'Mail de test - à traiter',
      contenu: 'Ce mail a été inséré par le seed pour peupler la section "Mails à traiter".',
      // Leave handler_user_id null so it appears in unassigned list
      handler_user_id: null,
      // other optional relations left null
      expediteur_staff_id: null,
      categorie_id: null,
      privacy_id: null,
    },
  });

  console.log('[seed-prisma-mail] Mail créé, id=' + created.id);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[seed-prisma-mail] Erreur :', e && e.stack ? e.stack : e);
  process.exitCode = 2;
});
