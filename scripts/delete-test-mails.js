#!/usr/bin/env node
/**
 * Supprime les mails de test en sauvegardant d'abord les lignes candidates.
 * Usage:
 *  node scripts/delete-test-mails.js --since=2025-11-18 [--yes]
 *  node scripts/delete-test-mails.js --subject-contains="Test notification" [--yes]
 *
 * Le script crée `scripts/backups/mail-backup-<timestamp>.json` contenant les lignes
 * candidates avant suppression. Par défaut il cherche les mails dont `date_reception` >= 2025-11-18.
 */

const path = require('path');
const fs = require('fs');
const { PrismaClient } = require(path.resolve(__dirname, '..', 'src', 'main', 'repositories', 'prisma', 'generated'));
const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { since: null, subjectContains: null, yes: false };
  for (const a of args) {
    if (a.startsWith('--since=')) out.since = a.split('=')[1];
    else if (a.startsWith('--subject-contains=')) out.subjectContains = a.split('=')[1];
    else if (a === '--yes' || a === '-y') out.yes = true;
  }
  if (!out.since && !out.subjectContains) out.since = '2025-11-18';
  return out;
}

function confirmSync(promptText) {
  return new Promise((resolve) => {
    process.stdout.write(promptText + ' (y/N): ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (d) => {
      const r = String(d || '').trim().toLowerCase();
      resolve(r === 'y' || r === 'yes');
    });
  });
}

(async function main() {
  const opts = parseArgs();
  try {
    let where = {};
    if (opts.since) {
      const iso = new Date(opts.since).toISOString();
      where.date_reception = { gte: iso };
    }
    if (opts.subjectContains) {
      where.objet = { contains: opts.subjectContains };
    }

    console.log('Recherche des mails candidats avec critères:', where);
    const candidates = await prisma.mail.findMany({ where, orderBy: { date_reception: 'desc' } });

    if (!candidates || candidates.length === 0) {
      console.log('Aucun mail candidat trouvé. Rien à supprimer.');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Prepare backup
    const backupDir = path.resolve(__dirname, 'backups');
    try { fs.mkdirSync(backupDir, { recursive: true }); } catch (e) { /* ignore */ }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `mail-backup-${ts}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(candidates, null, 2), 'utf8');
    console.log(`Backup écrit: ${backupPath} (rows=${candidates.length})`);

    if (!opts.yes) {
      const ok = await confirmSync(`Confirmez-vous la suppression de ces ${candidates.length} mails ?`);
      if (!ok) {
        console.log('Opération annulée par l\'utilisateur. Aucune suppression effectuée.');
        await prisma.$disconnect();
        process.exit(0);
      }
    }

    // Collect ids and delete
    const ids = candidates.map(c => c.id);
    const del = await prisma.mail.deleteMany({ where: { id: { in: ids } } });
    console.log(`Suppression réalisée. Count: ${del.count}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Erreur pendant l\'opération:', e && e.message ? e.message : e);
    try { await prisma.$disconnect(); } catch (err) {}
    process.exit(1);
  }
})();
