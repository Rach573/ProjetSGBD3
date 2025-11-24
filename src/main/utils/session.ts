import type { WebContents } from 'electron';
import type { AuthUser } from '../../shared/interfaces/Auth';

const sessionUsers = new Map<number, AuthUser>();

export function setSessionUser(contents: WebContents, user: AuthUser | null): void {
  if (!contents) return;
  if (user) {
    sessionUsers.set(contents.id, user);
    contents.once('destroyed', () => {
      sessionUsers.delete(contents.id);
    });
  } else {
    sessionUsers.delete(contents.id);
  }
  try {
    // Notify the renderer associated with these contents that the session changed.
    // This helps the renderer keep its local state in sync when role or user changes.
    contents.send('session:updated', user);
  } catch (e) {
    // ignore send errors (contents may be destroyed)
  }
}

export function getSessionUser(contents: WebContents): AuthUser | null {
  if (!contents) return null;
  return sessionUsers.get(contents.id) ?? null;
}

export function ensureAuthenticated(contents: WebContents): AuthUser {
  const user = getSessionUser(contents);
  if (!user) {
    throw new Error('Utilisateur non authentifie.');
  }
  return user;
}

export function ensureAdmin(contents: WebContents): AuthUser {
  const user = ensureAuthenticated(contents);
  if (user.role !== 'admin') {
    throw new Error('Action reservee aux administrateurs.');
  }
  return user;
}
