import { prisma } from '../prisma/client';
import type {
  StatMailByGender,
  StatMailByPriority,
  StatsGenderMailCount,
} from '../../shared/interfaces/DatabaseModels';
import { stat_mail_by_gender, stat_mail_by_priority, stats_gender_mail_count } from '../prisma/generated';

/**
 * Centralise l'accès aux tables statistiques utilisées par la page admin.
 */
export class StatsRepository {
  /**
   * Retourne les compteurs globaux par genre (table stats_gender_mail_count).
   */
  async getGenderCounters(): Promise<StatsGenderMailCount[]> {
    const rows = await prisma.stats_gender_mail_count.findMany({
      orderBy: {
        mail_count: 'desc',
      },
    });
    return rows.map((row: stats_gender_mail_count) => ({
      id: row.id,
      genre: row.genre,
      mail_count: row.mail_count,
    }));
  }

  /**
   * Retourne l'historique journalier par genre pour les N derniers jours.
   */
  async getDailyMailByGender(limitDays: number): Promise<StatMailByGender[]> {
    const where =
      limitDays > 0
        ? {
            stat_date: {
              gte: this.computeSinceDate(limitDays),
            },
          }
        : undefined;

    const rows = await prisma.stat_mail_by_gender.findMany({
      where,
      orderBy: [
        {
          stat_date: 'desc',
        },
        {
          gender: 'asc',
        },
      ],
    });

    return rows.map((row: stat_mail_by_gender) => ({
      stat_date: this.formatDate(row.stat_date),
      gender: row.gender,
      mail_count: row.mail_count,
    }));
  }

  /**
   * Retourne l'historique journalier par priorité pour les N derniers jours.
   */
  async getDailyMailByPriority(limitDays: number): Promise<StatMailByPriority[]> {
    const where =
      limitDays > 0
        ? {
            stat_date: {
              gte: this.computeSinceDate(limitDays),
            },
          }
        : undefined;

    const rows = await prisma.stat_mail_by_priority.findMany({
      where,
      orderBy: [
        { stat_date: 'desc' },
        { priority_id: 'asc' },
      ],
    });

    return rows.map((row: stat_mail_by_priority) => ({
      stat_date: this.formatDate(row.stat_date),
      priority_id: row.priority_id,
      mail_count: row.mail_count,
    }));
  }

  private formatDate(date: Date): string {
    if (!(date instanceof Date)) {
      return String(date);
    }
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private computeSinceDate(limitDays: number): Date {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - Math.max(0, limitDays - 1));
    return since;
  }
}

