// src/main/repositories/tacheRepository.ts
import { prisma } from '../prisma/client';
import type { Prisma } from '../prisma/generated/client';
import { logger } from '../utils/logger';
import type { Tache, Staff } from '../../shared/interfaces/DatabaseModels';

const agentSelect = {
  select: { id: true, username: true },
};

const mailInclude = {
  include: {
    expediteur: {
      select: {
        id: true,
        nom_complet: true,
        adresse_mail: true,
        statut_hierarchique: true,
      },
    },
  },
};

/**
 * Repository responsible for Tache (Task/Ticket) data access operations.
 * Encapsulates all Prisma interactions for the Taches table.
 */
export class TacheRepository {
  /**
   * Retrieves all taches/tickets.
   */
  async findAll(): Promise<Tache[]> {
    logger.info('TacheRepository.findAll: executing prisma.taches.findMany with agent include');
    // Order by date desc at the DB level to ensure recent tasks appear first
    // Include the related agent user (id and username) so service can enrich the result
    const tasks = await prisma.taches.findMany({
      orderBy: {
        date_attribution: 'desc',
      },
      include: {
        agent: agentSelect,
        mail: mailInclude,
      },
    });
    logger.info(`TacheRepository.findAll: returned ${tasks.length} rows`);
    return tasks as unknown as Tache[];
  }

  /**
   * Retrieves tasks filtered by agent.
   */
  async findByAgent(params: { agentUserId?: number | null; agentUsername?: string | null }): Promise<Tache[]> {
    const { agentUserId, agentUsername } = params;
    logger.info(
      `TacheRepository.findByAgent: loading tasks for agent filters -> id=${agentUserId} username=${agentUsername}`,
    );

    const whereClause: Prisma.tachesWhereInput = {};
    if (typeof agentUserId === 'number' && !Number.isNaN(agentUserId)) {
      whereClause.agent_user_id = agentUserId;
    } else if (agentUsername) {
      whereClause.agent = {
        username: agentUsername,
      };
    } else {
      throw new Error('findByAgent requires agentUserId or agentUsername');
    }

    const tasks = await prisma.taches.findMany({
      where: whereClause,
      orderBy: {
        date_attribution: 'desc',
      },
      include: {
        agent: agentSelect,
        mail: mailInclude,
      },
    });
    logger.info(`TacheRepository.findByAgent: returned ${tasks.length} rows`);
    return tasks as unknown as Tache[];
  }

  /**
   * Retrieves tasks linked to a specific mail.
   */
  async findByMailId(mailId: number): Promise<Tache[]> {
    const tasks = await prisma.taches.findMany({
      where: { mail_id: mailId },
      orderBy: { date_attribution: 'desc' },
      include: {
        agent: agentSelect,
        mail: mailInclude,
      },
    });
    return tasks as unknown as Tache[];
  }

  /**
   * Creates a new tache/ticket in the database.
   */
  async create(data: {
    mail_id: number;
    agent_user_id: number;
    statut_tache: string;
    priorite_calculee: string;
    date_attribution: string;
  }): Promise<{ id: number }> {
    const created = await prisma.taches.create({
      data,
    });
    return { id: created.id };
  }

  /**
   * Updates existing tickets linked to a mail to point to a new agent.
   */
  async reassignAgentForMail(mailId: number, agentUserId: number): Promise<number> {
    const result = await prisma.taches.updateMany({
      where: { mail_id: mailId },
      data: { agent_user_id: agentUserId },
    });
    logger.info(
      `TacheRepository.reassignAgentForMail: updated ${result.count} tasks for mail ${mailId} to agent ${agentUserId}`,
    );
    return result.count;
  }

  /**
   * Met à jour la priorité (`priorite_calculee`) de toutes les taches liées à un mail.
   */
  async updatePriorityForMail(mailId: number, priority: string): Promise<number> {
    const result = await prisma.taches.updateMany({
      where: { mail_id: mailId },
      data: { priorite_calculee: priority },
    });
    logger.info(
      `TacheRepository.updatePriorityForMail: updated ${result.count} tasks for mail ${mailId} to priority ${priority}`,
    );
    return result.count;
  }

  /**
   * Finds a staff member by ID.
   */
  async findStaffById(staffId: number): Promise<Staff | null> {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    return staff as unknown as Staff | null;
  }

  /**
   * Retrieves a single task by its ID.
   */
  async findById(tacheId: number): Promise<Tache | null> {
    const task = await prisma.taches.findUnique({
      where: { id: tacheId },
      include: {
        agent: agentSelect,
        mail: mailInclude,
      },
    });
    return task as unknown as Tache | null;
  }

  /**
   * Updates the status of a task.
   */
  async updateStatut(tacheId: number, statut: string): Promise<void> {
    await prisma.taches.update({
      where: { id: tacheId },
      data: { statut_tache: statut },
    });
  }
}
