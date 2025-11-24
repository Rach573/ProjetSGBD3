import type { StatMailByGender, StatMailByPriority, StatsGenderMailCount } from './DatabaseModels';

/**
 * Jeu de données envoyé au renderer pour la page admin.
 */
export interface AdminStatsSnapshot {
  genderTotals: StatsGenderMailCount[];
  mailByGender: StatMailByGender[];
  mailByPriority: StatMailByPriority[];
}
