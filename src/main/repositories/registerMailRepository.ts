import { ipcMain } from 'electron';
import type { MailRepository } from './mailRepository';
import type { TacheRepository } from './tacheRepository';
import { MailService } from '../services/mailService';
import { ensureAdmin, ensureAuthenticated } from '../utils/session';

let registered = false;

export function registerMailRepository(
  repositories: { mailRepository: MailRepository; tacheRepository: TacheRepository },
): void {
  if (registered) {
    return;
  }

  const mailService = new MailService(repositories.mailRepository, repositories.tacheRepository);

  ipcMain.handle('mail:getAll', async (event) => {
    ensureAdmin(event.sender);
    return await mailService.listUnassignedMails();
  });

  ipcMain.handle('mail:getAdmin', async (event) => {
    ensureAdmin(event.sender);
    return await mailService.listAdminMails();
  });

  ipcMain.handle('mail:reassign', async (event, mailId: number, agentUserId: number) => {
    ensureAdmin(event.sender);
    await mailService.reassignMail(mailId, agentUserId);
  });

  ipcMain.handle('mail:delete', async (event, mailId: number) => {
    ensureAdmin(event.sender);
    await mailService.deleteMail(mailId);
  });

  ipcMain.handle('mail:updatePriority', async (event, mailId: number, priority: string) => {
    ensureAdmin(event.sender);
    await mailService.updatePriorityForMail(mailId, priority);
  });

  ipcMain.handle('mail:getOne', async (event, mailId: number) => {
    const actor = ensureAuthenticated(event.sender);
    return await mailService.getMailDetail(mailId, actor);
  });

  registered = true;
}
