import { StatsRepository } from '../repositories/statsRepository';
import type { AdminStatsSnapshot } from '../../shared/interfaces/Stats';

/**
 * Service exposant un instantané des statistiques utiles à l'admin.
 */
export class StatsService {
  constructor(private readonly repository: StatsRepository) {}

  async getAdminSnapshot(limitDays = 7): Promise<AdminStatsSnapshot> {
    const [genderTotals, mailByGender, mailByPriority] = await Promise.all([
      this.repository.getGenderCounters(),
      this.repository.getDailyMailByGender(limitDays),
      this.repository.getDailyMailByPriority(limitDays),
    ]);

    return {
      genderTotals,
      mailByGender,
      mailByPriority,
    };
  }
}
