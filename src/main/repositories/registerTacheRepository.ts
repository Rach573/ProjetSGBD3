import { ipcMain } from 'electron';
import type { TacheRepository } from './tacheRepository';
import type { MailStatut } from '../../shared/interfaces/DatabaseModels';
import { ensureAdmin, ensureAuthenticated } from '../utils/session';
import type { TacheService } from '../services/tacheService';

let registered = false;

export function registerTacheRepository(
  _repositories: TacheRepository,
  services: { tacheService: TacheService },
): void {
  if (registered) {
    return;
  }

  const { tacheService } = services;

  ipcMain.handle('tache:getAll', async (event) => {
    ensureAdmin(event.sender);
    return await tacheService.getAll();
  });

  ipcMain.handle(
    'tache:getByAgent',
    async (event, filters: { agentUserId?: number | null; agentUsername?: string | null }) => {
      const actor = ensureAuthenticated(event.sender);
      if (actor.role === 'admin') {
        return await tacheService.getByAgent(filters);
      }
      return await tacheService.getByAgent({
        agentUserId: actor.id,
        agentUsername: actor.username,
      });
    },
  );

  ipcMain.handle('tache:create', async (event, mailId: number, agentUserId: number) => {
    ensureAdmin(event.sender);
    return await tacheService.createTache(mailId, agentUserId);
  });

  ipcMain.handle('tache:updateStatut', async (event, tacheId: number, statut: MailStatut) => {
    const actor = ensureAuthenticated(event.sender);
    await tacheService.updateStatut(tacheId, statut, actor);
  });

  registered = true;
}
