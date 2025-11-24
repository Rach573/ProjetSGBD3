import type { Tache, MailStatut } from './DatabaseModels';
import type { AssignmentEventPayload } from './Events';

export interface ITacheService {
  invokeGetAllTaches(): Promise<Tache[]>;
  invokeGetTachesForAgent(filters: { agentUserId?: number | null; agentUsername?: string | null }): Promise<Tache[]>;
  invokeCreateTache(mailId: number, agentUserId: number): Promise<{ id: number }>;
  invokeUpdateTacheStatus(tacheId: number, statut: MailStatut): Promise<void>;
  onTacheAssigned(cb: (payload: AssignmentEventPayload) => void): () => void;
}
