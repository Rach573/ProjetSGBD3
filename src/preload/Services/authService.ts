import { ipcRenderer } from 'electron';
import type { AuthUser } from '../../shared/interfaces/Auth';
import type { UserRole } from '../../shared/interfaces/DatabaseModels';
import type { IAuthService } from '../../shared/interfaces/IAuthService';

export const authService: IAuthService = {
  invokeLogin: async (username: string, password: string): Promise<AuthUser> => {
    return await ipcRenderer.invoke('auth:login', username, password);
  },
  invokeLogout: async (): Promise<void> => {
    await ipcRenderer.invoke('auth:logout');
  },
  invokeRestoreSession: async (user: AuthUser | null): Promise<void> => {
    await ipcRenderer.invoke('auth:restoreSession', user);
  },
  onSessionUpdated: (cb: (user: AuthUser | null) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, user: AuthUser | null) => cb(user);
    ipcRenderer.on('auth:session-updated', listener);
    return () => ipcRenderer.removeListener('auth:session-updated', listener);
  },
  invokeListUsers: async (): Promise<AuthUser[]> => {
    return await ipcRenderer.invoke('user:list');
  },
  invokeCreateUser: async (username: string, password: string, role: UserRole): Promise<AuthUser> => {
    return await ipcRenderer.invoke('user:create', username, password, role);
  },
  invokeUpdateUser: async (username: string, payload: { role?: UserRole; newPassword?: string | null }): Promise<AuthUser> => {
    return await ipcRenderer.invoke('user:update', username, payload);
  },
  invokeDeleteUser: async (username: string): Promise<void> => {
    await ipcRenderer.invoke('user:delete', username);
  },
  invokeResetPassword: async (username: string, newPassword: string): Promise<void> => {
    await ipcRenderer.invoke('user:resetPassword', username, newPassword);
  },
  invokeGetAgentWorkload: async (): Promise<Array<{ id: number; username: string; openTasks: number }>> => {
    return await ipcRenderer.invoke('user:getAgentWorkload');
  },
};

export type AuthService = typeof authService;
