import { ipcRenderer } from 'electron';
import type { IStatsService } from '../../shared/interfaces/IStatsService';

export const statsService: IStatsService = {
  invokeGetAdminSnapshot: async () => {
    return await ipcRenderer.invoke('stats:getAdminSnapshot');
  },
};

export type StatsService = typeof statsService;
