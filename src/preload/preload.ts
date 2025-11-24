import { contextBridge } from 'electron';
import { mailService } from './Services/mailService';
import { tacheService } from './Services/tacheService';
import { authService } from './Services/authService';
import { statsService } from './Services/statsService';
import type { IElectronService } from '../shared/ElectronServices/IElectronService';




contextBridge.exposeInMainWorld('electronService',{
  
  mail: mailService,
  tache: tacheService,
  auth: authService,
  stats: statsService,

} as IElectronService); 