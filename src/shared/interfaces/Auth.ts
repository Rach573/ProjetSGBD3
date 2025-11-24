import type { UserRole } from './DatabaseModels';

/**
 * User shape exposed to the renderer after authentication.
 * Password hashes are never sent outside the main process.
 */
export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}
