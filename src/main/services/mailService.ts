// src/main/services/mailService.ts
import type { Mail, StaffHierarchie, MailPriorite } from '../../shared/interfaces/DatabaseModels';
import type { AuthUser } from '../../shared/interfaces/Auth';
import { MailRepository } from '../repositories/mailRepository';
import { TacheRepository } from '../repositories/tacheRepository';

/**
 * Service responsible for business logic related to mails.
 * Dependencies are injected so that a single repository instance can be shared across handlers.
 */
export class MailService {
  constructor(
    private readonly mailRepository: MailRepository,
    private readonly tacheRepository: TacheRepository,
  ) {}

  /**
   * Retrieves the list of mails not yet assigned to a handler.
   */
  async listUnassignedMails(): Promise<Mail[]> {
    return await this.mailRepository.getUnassignedMails();
  }

  /**
   * Retrieves the full list of mails for administrators.
   */
  async listAdminMails(): Promise<Mail[]> {
    return await this.mailRepository.getAdminMailList();
  }

  private computePriorite(statut: StaffHierarchie | null): MailPriorite {
    switch (statut) {
      case 'Leader':
        return 'Alerte Rouge';
      case 'N':
      case 'N+1':
        return 'Urgent';
      case 'Employe Lambda':
      case 'Employe_Lambda':
      default:
        return 'Normale';
    }
  }

  /**
   * Deletes a mail (and cascaded tickets if any).
   */
  async deleteMail(mailId: number): Promise<void> {
    await this.mailRepository.deleteMailFromDB(mailId);
  }

  /**
   * Changes the handler for an existing mail and its linked tickets.
   */
  async reassignMail(mailId: number, agentUserId: number): Promise<void> {
    const mail = await this.mailRepository.findById(mailId);
    if (!mail) {
      throw new Error('Mail introuvable.');
    }

    await this.mailRepository.assignToHandler(mailId, agentUserId);

    const existingTasks = await this.tacheRepository.findByMailId(mailId);
    if (existingTasks.length > 0) {
      await this.tacheRepository.reassignAgentForMail(mailId, agentUserId);
      return;
    }

    // No task existed yet: create one so the agent sees it in son espace.
    const staff =
      mail.expediteur_staff_id != null
        ? await this.tacheRepository.findStaffById(mail.expediteur_staff_id)
        : null;
    const priorite = this.computePriorite(staff?.statut_hierarchique ?? null);
    const prioritePrisma = priorite === 'Alerte Rouge' ? 'Alerte_Rouge' : priorite;

    await this.tacheRepository.create({
      mail_id: mailId,
      agent_user_id: agentUserId,
      statut_tache: 'Assigne',
      priorite_calculee: prioritePrisma,
      date_attribution: new Date().toISOString(),
    });
  }

  /**
   * Met à jour la priorité des tickets associés à un mail.
   * priority doit correspondre à l'enum `MailPriorite` attendu par la table `taches`.
   */
  async updatePriorityForMail(mailId: number, priority: string): Promise<void> {
    await this.tacheRepository.updatePriorityForMail(mailId, priority);
  }

  /**
   * Retrieves a single mail with its relations for detail view.
   * Only admins or the assigned agent can view the content.
   */
  async getMailDetail(mailId: number, actor: AuthUser): Promise<Mail> {
    const mail = await this.mailRepository.findById(mailId);
    if (!mail) {
      throw new Error('Mail introuvable.');
    }

    if (!mail.expediteur) {
      throw new Error('Accès refusé: expéditeur inconnu.');
    }

    if (actor.role !== 'admin' && mail.handler_user_id !== actor.id) {
      throw new Error("Vous n'avez pas accès à ce mail.");
    }

    return mail;
  }
}
