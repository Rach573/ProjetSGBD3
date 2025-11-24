import { ipcMain } from 'electron';
import type { UserRepository} from './userRepository';
import { AuthService } from '../services/authService';
import type { UserRole } from '../../shared/interfaces/DatabaseModels';
import { ensureAdmin } from '../utils/session';

let registered = false;

export function registerUserRepository(
  repositories: { userRepository: UserRepository },

): void {
  if (registered) {
    return;
  }

  const authService = new AuthService(repositories.userRepository);

  ipcMain.handle('user:list', async (event) => {
    ensureAdmin(event.sender);
    return await authService.listUsers();
  });

  ipcMain.handle('user:get', async (event, userId: number) => {
    ensureAdmin(event.sender);
    return await authService.getUserById(userId);
  });

  ipcMain.handle('user:create', async (event, username: string, password: string, role: UserRole) => {
    ensureAdmin(event.sender);
    return await authService.createUser(username, password, role);
  });

  ipcMain.handle(
    'user:update',
    async (
      event,
      username: string,
      payload: { role?: UserRole; newPassword?: string | null },
    ) => {
      ensureAdmin(event.sender);
      return await authService.updateUser(username, payload);
    },
  );

  ipcMain.handle('user:delete', async (event, username: string) => {
    ensureAdmin(event.sender);
    await authService.deleteUser(username);
  });

  ipcMain.handle('user:resetPassword', async (event, username: string, newPassword: string) => {
    ensureAdmin(event.sender);
    await authService.resetPassword(username, newPassword);
  });

  ipcMain.handle('user:getAgentWorkload', async (event) => {
    ensureAdmin(event.sender);
    return await repositories.userRepository.findAgentsWithOpenTaskCount();
  });

  registered = true;
}
