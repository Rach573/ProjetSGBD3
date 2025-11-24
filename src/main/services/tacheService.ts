// src/main/services/tacheService.ts
import { TacheRepository } from '../repositories/tacheRepository';
import { MailRepository } from '../repositories/mailRepository';
import type {
  Tache,
  Mail,
  MailPriorite,
  StaffHierarchie,
  MailStatut,
} from '../../shared/interfaces/DatabaseModels';
import type { AuthUser } from '../../shared/interfaces/Auth';

/**
 * Service responsible for business logic related to tasks/tickets.
 * Uses TacheRepository and MailRepository for data access.
 */
export class TacheService {
  constructor(
    private readonly tacheRepository: TacheRepository,
    private readonly mailRepository: MailRepository,
  ) {}

  /**
   * Normalizes DB tasks and sorts them by priority (desc) then date.
   */
  private normalizeAndSort(tasksFromDb: Tache[]): Tache[] {
    type MailWithPrismaDate = Omit<Mail, 'date_reception'> & {
      date_reception: string | Date | null;
    };

    type TacheWithRelations = Tache & {
      agent?: { username?: string | null } | null;
      mail?: MailWithPrismaDate | null;
    };

    const records = tasksFromDb as TacheWithRelations[];

    const isDate = (value: unknown): value is Date => value instanceof Date;

    const priorityRank: Record<MailPriorite, number> = {
      'Alerte Rouge': 3,
      Urgent: 2,
      Normale: 1,
    };

    const toMailPriorite = (value: unknown): MailPriorite => {
      if (value === 'Alerte Rouge' || value === 'Alerte_Rouge') return 'Alerte Rouge';
      if (value === 'Urgent') return 'Urgent';
      return 'Normale';
    };

    const rank = (value: unknown): number => priorityRank[toMailPriorite(value)];

    const arrivalTime = (task: TacheWithRelations): number => {
      const mailDate = task.mail?.date_reception;
      if (isDate(mailDate)) {
        return mailDate.getTime();
      }
      if (typeof mailDate === 'string') {
        const parsed = Date.parse(mailDate);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
      if (task.date_attribution) {
        const parsed = Date.parse(task.date_attribution);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
      return 0;
    };

    const sorted = records.slice().sort((a, b) => {
      const priorityDiff = rank(b.priorite_calculee) - rank(a.priorite_calculee);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return arrivalTime(b) - arrivalTime(a);
    });

    return sorted.map((task) => {
      const agentUsername = task.agent?.username ?? null;
      const priority = toMailPriorite(task.priorite_calculee);
      const mailSource = task.mail;

      let normalizedMail: Mail | null = null;
      if (mailSource) {
        const rawDate = mailSource.date_reception;
        const dateValue = isDate(rawDate) ? rawDate.toISOString() : rawDate ?? '';
        normalizedMail = {
          ...mailSource,
          date_reception: dateValue,
          expediteur: mailSource.expediteur ?? null,
        } as Mail;
      }

      return {
        ...task,
        agent_username: agentUsername,
        priorite_calculee: priority,
        mail: normalizedMail,
      };
    });
  }

  /**
   * Computes the priority of a mail based on the sender's hierarchical status.
   */
  computePriorite(statut: StaffHierarchie | null): MailPriorite {
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
   * Returns all existing tasks.
   */
  async getAll(): Promise<Tache[]> {
    const tasksFromDb = await this.tacheRepository.findAll();
    return this.normalizeAndSort(tasksFromDb);
  }

  /**
   * Returns tickets assigned to a specific agent.
   */
  async getByAgent(filters: { agentUserId?: number | null; agentUsername?: string | null }): Promise<Tache[]> {
    const tasksFromDb = await this.tacheRepository.findByAgent(filters);
    return this.normalizeAndSort(tasksFromDb);
  }

  /**
   * Creates a new task based on an existing mail and an IT agent.
   */
  async createTache(mailId: number, agentUserId: number): Promise<{ id: number; priorite: MailPriorite }> {
    // Retrieve the mail
    const mail = await this.mailRepository.findById(mailId);
    if (!mail) {
      throw new Error(`Mail ${mailId} not found`);
    }

    // Calculate priority
    const expediteurStaffId = mail.expediteur_staff_id;
    const staff = expediteurStaffId
      ? await this.tacheRepository.findStaffById(expediteurStaffId)
      : null;
    const priorite = this.computePriorite(staff?.statut_hierarchique ?? null);

    // Update the mail
    await this.mailRepository.assignToHandler(mailId, agentUserId);

    // Adjust priority value to match Prisma enum values (e.g., "Alerte_Rouge")
    const prioritePrisma = (() => {
      switch (priorite) {
        case 'Alerte Rouge':
          return 'Alerte_Rouge';
        case 'Urgent':
          return 'Urgent';
        default:
          return 'Normale';
      }
    })();

    // Create the task
    const created = await this.tacheRepository.create({
      mail_id: mailId,
      agent_user_id: agentUserId,
      statut_tache: 'Assigne',
      priorite_calculee: prioritePrisma,
      date_attribution: new Date().toISOString(),
    });

    return { id: created.id, priorite };
  }

  /**
   * Updates the status of an existing ticket. Agents can only update their own tasks.
   */
  async updateStatut(tacheId: number, statut: MailStatut, actor: AuthUser): Promise<void> {
    const allowed: MailStatut[] = ['Nouveau', 'Assigne', 'Resolu'];
    if (!allowed.includes(statut)) {
      throw new Error('Statut invalide.');
    }

    const task = await this.tacheRepository.findById(tacheId);
    if (!task) {
      throw new Error('Tache introuvable.');
    }

    if (actor.role !== 'admin' && task.agent_user_id !== actor.id) {
      throw new Error('Vous ne pouvez modifier que vos propres tickets.');
    }

    await this.tacheRepository.updateStatut(tacheId, statut);
  }
}
