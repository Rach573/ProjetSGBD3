// src/main/repositories/mailRepository.ts
import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import type { Mail, MailPriorite } from '../../shared/interfaces/DatabaseModels';

export interface CreateMailInput {
  objet: string;
  contenu: string | null;
  date_reception: string;
  expediteur_staff_id: number | null;
  categorie_id: number | null;
  privacy_id: number | null;
  handler_user_id: number | null;
}

/**
 * Repository responsible for Mail data access operations.
 * Encapsulates all Prisma interactions for the Mail table.
 */
export class MailRepository {
  /**
   * Retrieves all mails that have not been assigned to a handler yet.
   */
  async getUnassignedMails(): Promise<Mail[]> {
    logger.info('MailRepository.getUnassignedMails: executing prisma.mail.findMany for unassigned mails with known sender');
    // Only return mails that are unassigned and whose sender exists in the staff table
    // (expediteur_staff_id not null). This restores the previous filter that limited
    // admin/mail lists to addresses that are already recognised in the DB.
    const mails = await prisma.mail.findMany({
      where: {
        handler_user_id: null,
        expediteur_staff_id: { not: null },
      },
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
    });
    logger.info(`MailRepository.getUnassignedMails: returned ${mails.length} rows`);
    return mails as unknown as Mail[];
  }

  /**
   * Retrieves every mail (assigned or not) and enriches each entry
   * with the handler username when possible.
   */
  async getAdminMailList(): Promise<Mail[]> {
    logger.info('MailRepository.getAdminMailList: retrieving mail list (only known senders) ordered by date_reception desc');
    // Only return mails whose sender (expediteur) is known/linked in the staff table.
    const mails = await prisma.mail.findMany({
      where: {
        expediteur_staff_id: { not: null },
      },
      orderBy: {
        date_reception: 'desc',
      },
      include: {
        expediteur: {
          select: {
            id: true,
            nom_complet: true,
            adresse_mail: true,
            statut_hierarchique: true,
          },
        },
        taches: {
          select: {
            id: true,
            agent_user_id: true,
            statut_tache: true,
            priorite_calculee: true,
          },
          orderBy: {
            date_attribution: 'desc',
          },
        },
      },
    });

    const handlerIds = Array.from(
      new Set(
        mails
          .map((m: Mail) => m.handler_user_id)
          .filter((id: unknown): id is number => typeof id === 'number' && !Number.isNaN(id)),
      ),
    );

    let handlerMap = new Map<number, string>();
    if (handlerIds.length > 0) {
      const handlers = await prisma.users.findMany({
        where: {
          id: {
            in: handlerIds,
          },
        },
        select: {
          id: true,
          username: true,
        },
      });
      handlerMap = new Map(handlers.map((h: { id: number; username: string }) => [h.id, h.username]));
    }

    const normalizePriority = (value: string | null | undefined): MailPriorite | null => {
      if (!value) return null;
      if (value === 'Alerte_Rouge') return 'Alerte Rouge';
      return value as MailPriorite;
    };

    const enriched = mails.map((mail: Mail) => ({
      ...mail,
      handler_username:
        typeof mail.handler_user_id === 'number' ? handlerMap.get(mail.handler_user_id) ?? null : null,
      taches: Array.isArray((mail as any).taches)
        ? (mail as any).taches.map((task: any) => ({
            ...task,
            priorite_calculee: normalizePriority(task.priorite_calculee) ?? undefined,
          }))
        : [],
    }));

    logger.info(`MailRepository.getAdminMailList: returned ${enriched.length} rows`);
    return enriched as unknown as Mail[];
  }

  /**
   * Create a new mail record.
   */
  async createMail(data: CreateMailInput): Promise<{ id: number }> {
    const created = await prisma.mail.create({
      data,
    });
    return { id: created.id };
  }

  /**
   * Try to find a mail by a uniqueness heuristic (subject + reception date).
   */
  async findByUnique(objet: string, dateReception: string): Promise<Mail | null> {
    const mail = await prisma.mail.findFirst({
      where: {
        objet,
        date_reception: new Date(dateReception),
      },
    });
    return mail as unknown as Mail | null;
  }

  /**
   * Updates a mail to assign it to a specific handler (agent IT).
   */
  async assignToHandler(mailId: number, handlerUserId: number): Promise<void> {
    await prisma.mail.update({
      where: { id: mailId },
      data: { handler_user_id: handlerUserId },
    });
  }

  /**
   * Deletes a mail entry by ID.
   */
  async deleteMailFromDB(mailId: number): Promise<void> {
    await prisma.mail.delete({
      where: { id: mailId },
    });
  }

  /**
   * Finds a mail by its ID.
   */
  async findById(mailId: number): Promise<Mail | null> {
    const mail = await prisma.mail.findUnique({
      where: { id: mailId },
      include: {
        expediteur: {
          select: {
            id: true,
            nom_complet: true,
            adresse_mail: true,
            statut_hierarchique: true,
          },
        },
        taches: {
          select: {
            id: true,
            agent_user_id: true,
            statut_tache: true,
            priorite_calculee: true,
          },
        },
      },
    });
    if (!mail) return null;

    const normalizePriority = (value: string | null | undefined): MailPriorite | null => {
      if (!value) return null;
      if (value === 'Alerte_Rouge') return 'Alerte Rouge';
      return value as MailPriorite;
    };

    const normalized = {
      ...mail,
      taches: Array.isArray((mail as any).taches)
        ? (mail as any).taches.map((task: any) => ({
            ...task,
            priorite_calculee: normalizePriority(task.priorite_calculee) ?? undefined,
          }))
        : [],
    };

    return normalized as unknown as Mail;
  }
}
