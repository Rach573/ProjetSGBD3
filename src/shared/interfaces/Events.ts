import type { MailPriorite } from './DatabaseModels';

export interface AssignmentNotification {
  tacheId: number;
  mailId: number;
  agentUserId: number;
  agentUsername: string | null;
  priority: MailPriorite;
  mailObjet: string;
  expediteurNom: string | null;
  expediteurMail: string | null;
}

export interface AssignmentEventPayload {
  assignments: AssignmentNotification[];
}
