#!/usr/bin/env node
/*
  Script d'aide pour tester l'API Gmail:
  - Si aucun refresh token valide n'est présent, génère une URL d'autorisation,
    échange le code pour obtenir tokens et affiche le refresh token à sauvegarder.
  - Si un refresh token est présent, liste quelques e-mails (par défaut: inbox non lus).

  Usage: node scripts/gmail-test.js

  Assurez-vous d'avoir installé les dépendances: `npm install googleapis dotenv`
*/

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const http = require('http');
const { URL } = require('url');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';
let REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const USER_EMAIL = process.env.GMAIL_USER_EMAIL || 'me';
const QUERY = process.env.GMAIL_QUERY || 'in:inbox is:unread';
const MAX_RESULTS = parseInt(process.env.GMAIL_MAX_RESULTS || '5', 10);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERREUR: `GMAIL_CLIENT_ID` et `GMAIL_CLIENT_SECRET` doivent être définis dans .env');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function startLocalServerForCode(redirectUri) {
  const parsed = new URL(redirectUri);
  const port = parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80);
  const pathname = parsed.pathname || '/';
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const fullUrl = new URL(req.url, `http://${req.headers.host}`);
        if (fullUrl.pathname === pathname) {
          const code = fullUrl.searchParams.get('code');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<html><body><h2>Autorisation reçue</h2><p>Vous pouvez fermer cette fenêtre et revenir au terminal.</p></body></html>');
          server.close();
          resolve(code);
        } else {
          res.writeHead(404);
          res.end();
        }
      } catch (e) {
        reject(e);
      }
    });
    server.on('error', (err) => reject(err));
    server.listen(port, () => {
      console.log(`Listening on http://localhost:${port}${pathname} to capture OAuth code...`);
    });
  });
}

async function getNewRefreshToken() {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'];
  const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent' });
  console.log('\n1) Ouvrez cette URL dans votre navigateur et autorisez l\'application:');
  console.log(authUrl);

  // Si le redirect URI est un localhost avec port/path, on démarre un serveur qui capture automatiquement le code
  try {
    const redirectIsLocal = REDIRECT_URI && (REDIRECT_URI.startsWith('http://localhost') || REDIRECT_URI.startsWith('http://127.0.0.1'));
    if (redirectIsLocal) {
      console.log('\nAttente de la redirection sur', REDIRECT_URI, '... (ouvrez l\'URL ci-dessus)');
      const code = await startLocalServerForCode(REDIRECT_URI);
      if (!code) {
        console.error('Aucun code reçu via la redirection.');
        process.exit(1);
      }
      try {
        const { tokens } = await oAuth2Client.getToken(code.trim());
        console.log('\nRéponse tokens:');
        console.log(tokens);
        if (tokens.refresh_token) {
          console.log('\nCopiez ce `refresh_token` dans votre fichier .env comme GMAIL_REFRESH_TOKEN=...');
        } else {
          console.log('\nAucun refresh_token retourné — assurez-vous d\'avoir demandé `access_type=offline` et `prompt=consent`.');
        }
        return tokens.refresh_token;
      } catch (err) {
        console.error('Erreur lors de l\'échange du code:', err.message || err);
        process.exit(1);
      }
    }
  } catch (e) {
    console.warn('Impossible de démarrer le serveur local pour capturer le code, fallback sur saisie manuelle.');
  }

  console.log('\n2) Après autorisation, copiez le paramètre `code` de l\'URL de redirection (ou collez le code)');
  const code = await prompt('Entrez ici le code d\'autorisation: ');
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('\nRéponse tokens:');
    console.log(tokens);
    if (tokens.refresh_token) {
      console.log('\nCopiez ce `refresh_token` dans votre fichier .env comme GMAIL_REFRESH_TOKEN=...');
    } else {
      console.log('\nAucun refresh_token retourné — assurez-vous d\'avoir demandé `access_type=offline` et `prompt=consent`.');
    }
    return tokens.refresh_token;
  } catch (err) {
    console.error('Erreur lors de l\'échange du code:', err.message || err);
    process.exit(1);
  }
}

function prettyHeader(headers, name) {
  const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : '';
}

async function listMessages() {
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  try {
    const res = await gmail.users.messages.list({ userId: 'me', q: QUERY, maxResults: MAX_RESULTS });
    const messages = res.data.messages || [];
    console.log(`\nFound ${messages.length} message(s)`);
    for (const m of messages) {
      const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const headers = msg.data.payload.headers || [];
      const from = prettyHeader(headers, 'From');
      const subject = prettyHeader(headers, 'Subject');
      const snippet = msg.data.snippet || '';
      console.log('---');
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`Snippet: ${snippet}`);
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des e-mails:', (err && err.message) || err);
    process.exit(1);
  }
}

(async function main(){
  // Simple heuristic: if REFRESH_TOKEN looks like a URL or is empty, treat as invalid
  if (!REFRESH_TOKEN || REFRESH_TOKEN.startsWith('http') || REFRESH_TOKEN.length < 20) {
    console.log('Aucun refresh token valide trouvé dans .env. Nous allons en générer un via OAuth2.');
    const newToken = await getNewRefreshToken();
    if (newToken) {
      console.log('\n---');
      console.log('Refresh token obtenu:\n' + newToken);
      const save = (await prompt('Souhaitez-vous que je l\'ajoute automatiquement au fichier `.env` ? (y/N): ')).trim().toLowerCase();
      if (save === 'y' || save === 'yes') {
        const envPath = path.resolve(process.cwd(), '.env');
        let env = '';
        try { env = fs.readFileSync(envPath, 'utf8'); } catch (e) { env = ''; }
        const line = `GMAIL_REFRESH_TOKEN="${newToken.replace(/"/g,'') }"`;
        if (/^GMAIL_REFRESH_TOKEN=/m.test(env)) {
          env = env.replace(/^GMAIL_REFRESH_TOKEN=.*$/m, line);
        } else {
          env += '\n' + line + '\n';
        }
        fs.writeFileSync(envPath, env, 'utf8');
        console.log('Mis à jour de `.env` avec le nouveau GMAIL_REFRESH_TOKEN. Relancez le script.');
        process.exit(0);
      } else {
        console.log('Le script va continuer sans sauvegarder; vous pouvez relancer après mise à jour de `.env`.');
        REFRESH_TOKEN = newToken; // continue in-memory
      }
    }
  }

  if (!REFRESH_TOKEN || REFRESH_TOKEN.startsWith('http')) {
    console.error('Aucun refresh token utilisable trouvé. Arrêt.');
    process.exit(1);
  }

  await listMessages();
})();
