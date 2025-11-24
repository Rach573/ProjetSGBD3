import type { AuthUser } from './Auth';
import type { UserRole } from './DatabaseModels';

export interface IAuthService {
  invokeLogin(username: string, password: string): Promise<AuthUser>;
  invokeLogout(): Promise<void>;
  invokeRestoreSession(user: AuthUser | null): Promise<void>;
  onSessionUpdated(cb: (user: AuthUser | null) => void): () => void;
  invokeListUsers(): Promise<AuthUser[]>;
  invokeCreateUser(username: string, password: string, role: UserRole): Promise<AuthUser>;
  invokeUpdateUser(username: string, payload: { role?: UserRole; newPassword?: string | null }): Promise<AuthUser>;
  invokeDeleteUser(username: string): Promise<void>;
  invokeResetPassword(username: string, newPassword: string): Promise<void>;
  invokeGetAgentWorkload(): Promise<Array<{ id: number; username: string; openTasks: number }>>;
}
