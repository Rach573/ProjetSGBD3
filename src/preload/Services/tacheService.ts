import { ipcRenderer } from 'electron';
import type { Tache, MailStatut } from '../../shared/interfaces/DatabaseModels';
import type { AssignmentEventPayload } from '../../shared/interfaces/Events';
import type { ITacheService } from '../../shared/interfaces/ITacheService';

export const tacheService: ITacheService = {
  invokeGetAllTaches: async (): Promise<Tache[]> => {
    return await ipcRenderer.invoke('tache:getAll');
  },
  invokeGetTachesForAgent: async (filters: { agentUserId?: number | null; agentUsername?: string | null }): Promise<Tache[]> => {
    return await ipcRenderer.invoke('tache:getByAgent', filters);
  },
  invokeCreateTache: async (mailId: number, agentUserId: number): Promise<{ id: number }> => {
    return await ipcRenderer.invoke('tache:create', mailId, agentUserId);
  },
  invokeUpdateTacheStatus: async (tacheId: number, statut: MailStatut): Promise<void> => {
    await ipcRenderer.invoke('tache:updateStatut', tacheId, statut);
  },
  onTacheAssigned: (cb: (payload: AssignmentEventPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: AssignmentEventPayload) => cb(payload);
    ipcRenderer.on('tache:assigned', listener);
    return () => ipcRenderer.removeListener('tache:assigned', listener);
  },
};

export type TacheService = typeof tacheService;
