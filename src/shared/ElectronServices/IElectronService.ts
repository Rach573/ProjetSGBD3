import type { IMailService } from '../interfaces/IMailService';
import type { ITacheService } from '../interfaces/ITacheService';
import type { IAuthService } from '../interfaces/IAuthService';
import type { IStatsService } from '../interfaces/IStatsService';

export interface IElectronService {
  mail: IMailService;
  tache: ITacheService;
  auth: IAuthService;
  stats: IStatsService;
}

declare global {
  interface Window {
    electronService: IElectronService;
  }
}