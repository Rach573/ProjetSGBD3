import type { Mail } from './DatabaseModels';

export type MailUpdatedPayload = {
  inserted: number;
};

export type MailIncomingPayload = {
  mail: Mail;
};

export interface IMailService {
  invokeGetAllMails(): Promise<Mail[]>;
  invokeGetAdminMails(): Promise<Mail[]>;
  invokeDeleteMail(mailId: number): Promise<void>;
  invokeReassignMail(mailId: number, agentUserId: number): Promise<void>;
  invokeUpdateMailPriority(mailId: number, priority: string): Promise<void>;
  invokeGetMailDetail(mailId: number): Promise<Mail>;
  onMailUpdated(cb: (payload: MailUpdatedPayload) => void): () => void;
  onMailIncoming(cb: (payload: MailIncomingPayload) => void): () => void;
}
