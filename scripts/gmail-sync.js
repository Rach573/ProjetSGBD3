#!/usr/bin/env node
/*
  Script de synchronisation Gmail -> base (Prisma)
  - Lit les variables GMAIL_* depuis .env
  - Récupère les messages non lus selon la query
  - Evite doublons en vérifiant objet + date_reception
  - Insère les mails dans la table `mail` via Prisma
  - Marque les messages comme lus (retire le label UNREAD)

  Usage: node scripts/gmail-sync.js
*/

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { google } = require('googleapis');
// Require the generated Prisma client from the project (avoid relying on node_modules/.prisma)
const generatedClientPath = path.resolve(__dirname, '..', 'src', 'main', 'repositories', 'prisma', 'generated');
const { PrismaClient } = require(generatedClientPath);
const prisma = new PrismaClient();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const USER_EMAIL = process.env.GMAIL_USER_EMAIL || 'me';
const QUERY = process.env.GMAIL_QUERY || 'in:inbox is:unread';
const MAX_RESULTS = process.env.GMAIL_MAX_RESULTS ? Number(process.env.GMAIL_MAX_RESULTS) : 10;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('Gmail credentials missing in .env (client id/secret/refresh token)');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

function headerValue(headers, name) {
  if (!headers) return null;
  const h = headers.find((hh) => hh.name && hh.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : null;
}

function parseAddress(raw) {
  if (!raw) return { name: null, address: null };
  const m = raw.match(/<([^>]+)>/);
  if (m) {
    const address = m[1].trim().toLowerCase();
    const name = raw.replace(m[0], '').trim().replace(/^"|"$/g, '');
    return { name: name || null, address };
  }
  const normalized = raw.trim().toLowerCase();
  return { name: null, address: normalized || null };
}

async function extractBody(part) {
  if (!part) return null;
  if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
    const data = part.body && part.body.data;
    if (data) {
      const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(normalized, 'base64').toString('utf8');
    }
  }
  if (part.parts) {
    for (const p of part.parts) {
      const found = await extractBody(p);
      if (found) return found;
    }
  }
  return null;
}

async function markAsRead(id) {
  try {
    await gmail.users.messages.modify({ userId: 'me', id, requestBody: { removeLabelIds: ['UNREAD'] } });
  } catch (e) {
    console.warn('Failed to mark message as read', id, e.message || e);
  }
}

async function main() {
  try {
    const listRes = await gmail.users.messages.list({ userId: USER_EMAIL === 'me' ? 'me' : USER_EMAIL, q: QUERY, maxResults: MAX_RESULTS });
    const msgs = listRes.data.messages || [];
    console.log(`Found ${msgs.length} messages`);
    let inserted = 0;
    for (const entry of msgs) {
      if (!entry.id) continue;
      const full = await gmail.users.messages.get({ userId: USER_EMAIL === 'me' ? 'me' : USER_EMAIL, id: entry.id, format: 'full' });
      const headers = full.data.payload && full.data.payload.headers ? full.data.payload.headers : [];
      const subject = headerValue(headers, 'Subject') || '(no subject)';
      const dateHeader = headerValue(headers, 'Date');
      const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : (full.data.internalDate ? new Date(Number(full.data.internalDate)).toISOString() : new Date().toISOString());
      const body = (await extractBody(full.data.payload)) || full.data.snippet || null;
      const fromRaw = headerValue(headers, 'From');
      const { name: fromName, address: fromAddress } = parseAddress(fromRaw);

      // Check duplicates by objet + date_reception
      const exists = await prisma.mail.findFirst({ where: { objet: subject, date_reception: receivedAt } });
      if (exists) {
        await markAsRead(entry.id);
        continue;
      }

      // Attempt to find staff by email
      let staff = null;
      if (fromAddress) {
        staff = await prisma.staff.findFirst({ where: { adresse_mail: fromAddress } });
      }

      const created = await prisma.mail.create({ data: {
        objet: subject,
        contenu: body,
        date_reception: receivedAt,
        expediteur_staff_id: staff ? staff.id : null,
        categorie_id: null,
        privacy_id: null,
        handler_user_id: null,
      }});

      inserted++;
      console.log(`Inserted mail id=${created.id} subject="${subject}" from=${fromAddress}`);
      await markAsRead(entry.id);
    }
    console.log(`Synchronization finished. Inserted: ${inserted}`);
  } catch (err) {
    console.error('Error during sync:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
