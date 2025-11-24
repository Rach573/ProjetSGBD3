import { ref, onMounted, onUnmounted } from 'vue';
import { ensureSessionReady } from '../utils/auth';
import type { Mail } from '../../shared/interfaces/DatabaseModels';

/**
 * Composable responsible for managing mail state in the UI.
 * Uses the API exposed by the preload to retrieve unassigned mails.
 */
export function useMail() {
  const mails = ref<Mail[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let unsubscribe: (() => void) | null = null;

  async function loadMails() {
    loading.value = true;
    error.value = null;
    try {
      await ensureSessionReady();
      // window.electronService.mail is injected by the preload
      mails.value = await window.electronService.mail.invokeGetAllMails();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      error.value = `Error loading mails: ${errMsg}`;
      mails.value = [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    // initial load
    void loadMails();
    // subscribe to main process mail updates
    try {
      if (window.electronService.mail.onMailUpdated) {
        unsubscribe = window.electronService.mail.onMailUpdated(() => {
          // refresh mails when main notifies of new inserts
          void loadMails();
        });
      }
    } catch (e) {
      // ignore subscription errors in environments where preload isn't present
      // eslint-disable-next-line no-console
      console.warn('useMail: failed to subscribe to mail updates', e);
    }
  });

  onUnmounted(() => {
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('useMail: failed to unsubscribe', e);
      }
    }
  });

  return { mails, loading, error, loadMails };
}
