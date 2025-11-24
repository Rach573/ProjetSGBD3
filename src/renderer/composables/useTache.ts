import { onMounted, onUnmounted, ref } from 'vue';
import { ensureSessionReady } from '../utils/auth';
import type { Tache, MailStatut } from '../../shared/interfaces/DatabaseModels';
import type { AssignmentEventPayload } from '../../shared/interfaces/Events';

type LoadTachesOptions = {
  agentUserId?: number | null;
  agentUsername?: string | null;
};

/**
 * Composable responsible for managing tasks/tickets in the UI.
 * Uses the tache API exposed by the preload.
 */
export function useTache() {
  const taches = ref<Tache[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastOptions = ref<LoadTachesOptions | undefined>(undefined);
  let unsubscribe: (() => void) | null = null;

  async function loadTaches(options?: LoadTachesOptions) {
    loading.value = true;
    error.value = null;
    lastOptions.value = options ? { ...options } : undefined;
    try {
      await ensureSessionReady();
      if (options?.agentUserId != null || options?.agentUsername) {
        taches.value = await window.electronService.tache.invokeGetTachesForAgent({
          agentUserId: options?.agentUserId ?? null,
          agentUsername: options?.agentUsername ?? null,
        });
      } else {
        taches.value = await window.electronService.tache.invokeGetAllTaches();
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      error.value = `Error loading tasks: ${errMsg}`;
      taches.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function createTache(mailId: number, agentUserId: number) {
    loading.value = true;
    error.value = null;
    try {
      await ensureSessionReady();
      const result = await window.electronService.tache.invokeCreateTache(mailId, agentUserId);
      // Reload list after creation
      await loadTaches();
      return result;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      error.value = `Error creating task: ${errMsg}`;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateStatut(tacheId: number, statut: MailStatut) {
    error.value = null;
    try {
      await ensureSessionReady();
      await window.electronService.tache.invokeUpdateTacheStatus(tacheId, statut);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      error.value = `Error updating status: ${errMsg}`;
      throw e;
    }
  }

  const handleAssignment = (payload: AssignmentEventPayload) => {
    const assignments = Array.isArray(payload?.assignments) ? payload.assignments : [];
    if (assignments.length === 0) return;

    const filters = lastOptions.value;
    const shouldReload = !filters
      ? true
      : assignments.some((assignment) => {
          if (filters.agentUserId != null && assignment.agentUserId !== filters.agentUserId) {
            return false;
          }
          if (filters.agentUsername && assignment.agentUsername !== filters.agentUsername) {
            return false;
          }
          return true;
        });

    if (shouldReload) {
      void loadTaches(filters ? { ...filters } : undefined);
    }
  };

  onMounted(() => {
    try {
      if (window.electronService.tache.onTacheAssigned) {
        unsubscribe = window.electronService.tache.onTacheAssigned(handleAssignment);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('useTache: failed to subscribe to assignment events', err);
    }
  });

  onUnmounted(() => {
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('useTache: failed to unsubscribe from assignment events', err);
      }
    }
  });

  return { taches, loading, error, loadTaches, createTache, updateStatut };
}
