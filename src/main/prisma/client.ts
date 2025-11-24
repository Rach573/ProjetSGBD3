// src/main/prisma/client.ts
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

import { logger } from '../utils/logger';
import type { Prisma } from './generated/client';

// Charger les variables d'environnement depuis .env si présentes (utile en dev)
dotenv.config();

// Déterminer de manière robuste le chemin du client généré.
// Après build, __dirname peut pointer vers .vite/build/... ; le client généré se
// trouve soit dans le dossier compilé courant, soit dans les sources TS.
const candidatePaths = [
  path.resolve(__dirname, 'generated/index.js'),
  path.resolve(__dirname, 'generated/default/index.js'),
  // Fallback vers les sources TypeScript (utiles en dev ou tests)
  path.resolve(__dirname, '../../src/main/prisma/generated/index.js'),
  path.resolve(__dirname, '../../src/main/prisma/generated/default/index.js'),
];

let resolvedClientPath: string | null = null;
for (const candidate of candidatePaths) {
  try {
    if (fs.existsSync(candidate)) {
      resolvedClientPath = candidate;
      break;
    }
  } catch {
    // ignore missing path and try next candidate
  }
}

if (!resolvedClientPath) {
  resolvedClientPath = path.resolve(__dirname, '../../src/main/prisma/generated/default/index.js');
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require(resolvedClientPath);

/**
 * Instance unique du client Prisma, configurée avec un logging
 * personnalisé pour s'intégrer avec notre logger.
 */
export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

// ... (le reste du fichier ne change pas) ...

// Écoute des événements de log de Prisma
prisma.$on('query', (e: Prisma.QueryEvent) => {
  logger.debug(`[Prisma Query]: ${e.query}`);
  logger.debug(`[Prisma Params]: ${e.params}`);
  logger.debug(`[Prisma Duration]: ${e.duration}ms`);
});

prisma.$on('info', (e: Prisma.LogEvent) => {
  logger.info(`[Prisma Info]: ${e.message}`);
});

prisma.$on('warn', (e: Prisma.LogEvent) => {
  logger.warn(`[Prisma Warn]: ${e.message}`);
});

prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error(`[Prisma Error]: ${e.message}`);
});

logger.info('Prisma client singleton initialisé.');
// Log the DATABASE_URL and resolved generated client path for debugging
logger.info('Prisma resolved generated client path =', resolvedClientPath);
logger.info('Prisma using DATABASE_URL =', process.env.DATABASE_URL);