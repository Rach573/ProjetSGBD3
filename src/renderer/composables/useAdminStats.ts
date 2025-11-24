import { ref } from 'vue';
import type { AdminStatsSnapshot } from '../../shared/interfaces/Stats';

/**
 * Charge les statistiques de traitement pour l'espace admin.
 */
export function useAdminStats() {
  const stats = ref<AdminStatsSnapshot | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadStats = async () => {
    loading.value = true;
    error.value = null;
    try {
      stats.value = await window.electronService.stats.invokeGetAdminSnapshot();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Impossible de charger les statistiques.';
      stats.value = null;
    } finally {
      loading.value = false;
    }
  };

  return {
    stats,
    loading,
    error,
    loadStats,
  };
}
