import { ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type { Mail } from '../../shared/interfaces/DatabaseModels';
import type { IMailService, MailUpdatedPayload, MailIncomingPayload } from '../../shared/interfaces/IMailService';

export const mailService: IMailService = {
  invokeGetAllMails: async (): Promise<Mail[]> => {
    return await ipcRenderer.invoke('mail:getAll');
  },
  invokeGetAdminMails: async (): Promise<Mail[]> => {
    return await ipcRenderer.invoke('mail:getAdmin');
  },
  invokeDeleteMail: async (mailId: number): Promise<void> => {
    await ipcRenderer.invoke('mail:delete', mailId);
  },
  invokeReassignMail: async (mailId: number, agentUserId: number): Promise<void> => {
    await ipcRenderer.invoke('mail:reassign', mailId, agentUserId);
  },
  invokeUpdateMailPriority: async (mailId: number, priority: string): Promise<void> => {
    await ipcRenderer.invoke('mail:updatePriority', mailId, priority);
  },
  invokeGetMailDetail: async (mailId: number): Promise<Mail> => {
    return await ipcRenderer.invoke('mail:getOne', mailId);
  },
  onMailUpdated: (cb: (payload: MailUpdatedPayload) => void) => {
    const listener = (_ev: IpcRendererEvent, payload: MailUpdatedPayload) => cb(payload);
    ipcRenderer.on('mail:updated', listener);
    return () => ipcRenderer.removeListener('mail:updated', listener);
  },
  onMailIncoming: (cb: (payload: MailIncomingPayload) => void) => {
    const listener = (_ev: IpcRendererEvent, payload: MailIncomingPayload) => cb(payload);
    ipcRenderer.on('mail:incoming', listener);
    return () => ipcRenderer.removeListener('mail:incoming', listener);
  },
};

export type MailService = typeof mailService;
