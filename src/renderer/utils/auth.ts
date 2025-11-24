import type { AuthUser } from '../../shared/interfaces/Auth';
import type { UserRole } from '../../shared/interfaces/DatabaseModels';

const CURRENT_KEY = 'sd_currentUser';

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null): void {
  if (user) localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
  else localStorage.removeItem(CURRENT_KEY);
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const user = await window.electronService.auth.invokeLogin(username, password);
  setCurrentUser(user);
  // ensure main process session is restored for this renderer
  try {
    await restoreSession(user);
  } catch (e) {
    // ignore restore errors
  }
  return user;
}

export function logout(): void {
  try {
    if (window.electronService.auth.invokeLogout) {
      void window.electronService.auth.invokeLogout();
    }
  } catch (e) {
    // ignore logout propagation errors
  }
  setCurrentUser(null);
}

export async function fetchUsers(): Promise<AuthUser[]> {
  return await window.electronService.auth.invokeListUsers();
}

export async function fetchAgentWorkload(): Promise<Array<{ id: number; username: string; openTasks: number }>> {
  return await window.electronService.auth.invokeGetAgentWorkload();
}

/**
 * Restore main-side session from a locally stored user object (if any).
 */
export async function restoreSession(user: AuthUser | null): Promise<void> {
  if (!user) return;
  if (window.electronService.auth.invokeRestoreSession) {
    try {
      await window.electronService.auth.invokeRestoreSession(user);
    } catch (e) {
      // ignore restore errors
    }
  }
}

let sessionReadyPromise: Promise<void> | null = null;

export function ensureSessionReady(): Promise<void> {
  if (sessionReadyPromise) {
    return sessionReadyPromise;
  }

  const user = getCurrentUser();
  if (!user) {
    sessionReadyPromise = Promise.resolve();
    return sessionReadyPromise;
  }

  sessionReadyPromise = (async () => {
    try {
      await restoreSession(user);
    } catch (error) {
      // ignore restore errors; the session remains best-effort
    }
  })();

  return sessionReadyPromise;
}

// Subscribe to session updates from main and keep localStorage in sync.
if (typeof window !== 'undefined' && window.electronService.auth.onSessionUpdated) {
  try {
    window.electronService.auth.onSessionUpdated((user: AuthUser | null) => {
      try {
        setCurrentUser(user ?? null);
      } catch (err) {
        // ignore
      }
    });
  } catch (e) {
    // ignore registration errors
  }
}

export async function createUserWithCredentials(username: string, password: string, role: UserRole = 'agent'): Promise<AuthUser> {
  return await window.electronService.auth.invokeCreateUser(username, password, role);
}

export async function deleteUser(username: string): Promise<void> {
  await window.electronService.auth.invokeDeleteUser(username);
}

export async function resetPassword(username: string, newPassword: string): Promise<void> {
  await window.electronService.auth.invokeResetPassword(username, newPassword);
}

export async function updateUser(username: string, payload: { role?: UserRole; newPassword?: string | null }): Promise<AuthUser> {
  return await window.electronService.auth.invokeUpdateUser(username, payload);
}

// Clear any stored session when the window is about to close/refresh so no user
// remains logged in after an app restart.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      logout();
    } catch {
      // ignore best-effort cleanup errors
    }
  });
}
