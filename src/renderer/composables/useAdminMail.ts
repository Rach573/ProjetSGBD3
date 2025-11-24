import { ref } from 'vue';
import type { Mail } from '../../shared/interfaces/DatabaseModels';

/**
 * Composable pour la gestion administrative des mails.
 */
export function useAdminMail() {
  const mails = ref<Mail[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadAllMails() {
    loading.value = true;
    error.value = null;
    try {
      mails.value = await window.electronService.mail.invokeGetAdminMails();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      error.value = `Impossible de charger les mails: ${errMsg}`;
      mails.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function deleteMail(mailId: number) {
    try {
      await window.electronService.mail.invokeDeleteMail(mailId);
      await loadAllMails();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      error.value = `Suppression impossible: ${errMsg}`;
    }
  }

  async function reassignMail(mailId: number, agentUserId: number) {
    try {
      await window.electronService.mail.invokeReassignMail(mailId, agentUserId);
      await loadAllMails();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      error.value = `Réaffectation impossible: ${errMsg}`;
    }
  }

  return {
    mails,
    loading,
    error,
    loadAllMails,
    deleteMail,
    reassignMail,
  };
}
