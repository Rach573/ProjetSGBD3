// src/main/utils/errors.ts

/**
 * Classe d'erreur personnalisée pour les erreurs de base de données
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Classe d'erreur personnalisée pour les erreurs IPC
 */
export class IpcError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'IpcError';
  }
}

/**
 * Gestionnaire d'erreurs global pour le processus main
 */
export function handleError(error: unknown, context?: string): void {
  const contextMsg = context ? ` [${context}]` : '';
  
  if (error instanceof Error) {
    console.error(`${contextMsg} ${error.name}: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(`${contextMsg} Unknown error:`, error);
  }
}
