import { ipcMain } from 'electron';
import type { StatsService } from '../services/statsService';
import { ensureAdmin } from '../utils/session';

let registered = false;

type StatsDependencies = {
  statsService: StatsService;
};

export function registerStatsRepository({ statsService }: StatsDependencies): void {
  if (registered) {
    return;
  }

  ipcMain.handle('stats:getAdminSnapshot', async (event, limitDays = 7) => {
    ensureAdmin(event.sender);
    return await statsService.getAdminSnapshot(limitDays);
  });

  registered = true;
}
