import { ipcMain } from 'electron';
import type { WebContents } from 'electron';
import type { AuthService } from '../services/authService';
import type { AuthUser } from '../../shared/interfaces/Auth';
import { setSessionUser } from '../utils/session';
import { logger } from '../utils/logger';

let registered = false;

export function registerAuthRepository(authService: AuthService): void {
  if (registered) {
    return;
  }

  // use the provided authService parameter directly
  authService.ensureSeedUsers().catch((error) => {
    logger.error('registerAuthRepository: failed to seed default users', error as Error);
  });

  ipcMain.handle('auth:login', async (event, username: string, password: string) => {
    const user = await authService.login(username, password);
    setSessionUser(event.sender, user);
    emitSessionUpdate(event.sender, user);
    return user;
  });

  ipcMain.handle('auth:logout', async (event) => {
    setSessionUser(event.sender, null);
    emitSessionUpdate(event.sender, null);
  });

  ipcMain.handle('auth:restoreSession', async (event, payload: unknown) => {
    if (isAuthUser(payload)) {
      setSessionUser(event.sender, payload);
      emitSessionUpdate(event.sender, payload);
    }
  });

  registered = true;
}

function emitSessionUpdate(target: WebContents, user: AuthUser | null): void {
  try {
    target.send('auth:session-updated', user);
  } catch (error) {
    logger.warn('registerAuthRepository: failed to notify renderer about session change', error as Error);
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.username === 'string' &&
    candidate.username.length > 0 &&
    (candidate.role === 'admin' || candidate.role === 'agent')
  );
}
