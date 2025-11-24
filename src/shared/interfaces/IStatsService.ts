import type { AdminStatsSnapshot } from './Stats';

export interface IStatsService {
  invokeGetAdminSnapshot(): Promise<AdminStatsSnapshot>;
}
