import { ref } from 'vue';
import type { Mail } from '../../shared/interfaces/DatabaseModels';

export function useMailDetail() {
  const mail = ref<Mail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadMail(mailId: number) {
    if (!Number.isFinite(mailId)) {
      error.value = 'Identifiant de mail invalide.';
      mail.value = null;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      mail.value = await window.electronService.mail.invokeGetMailDetail(mailId);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Erreur inconnue';
      error.value = `Impossible de charger le mail: ${errMsg}`;
      mail.value = null;
    } finally {
      loading.value = false;
    }
  }

  return { mail, loading, error, loadMail };
}
