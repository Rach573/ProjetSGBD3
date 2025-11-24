<template>
  <div class="mail-detail">
    <header class="detail-header">
      <button class="back-btn" @click="goBack">← Retour</button>
      <div class="header-text">
        <h2>{{ mail?.objet ?? 'Mail' }}</h2>
        <p v-if="mail">{{ formatDate(mail.date_reception) }}</p>
      </div>
    </header>

    <div v-if="loading" class="state">Chargement du mail…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else-if="mail" class="mail-card">
      <section class="meta">
        <div>
          <span class="meta-label">Expéditeur</span>
          <p class="meta-value">
            {{ mail.expediteur?.nom_complet ?? 'Inconnu' }}
            <span v-if="mail.expediteur?.adresse_mail" class="mail-address">({{ mail.expediteur?.adresse_mail }})</span>
          </p>
        </div>
        <div>
          <span class="meta-label">Date de réception</span>
          <p class="meta-value">{{ formatDate(mail.date_reception) }}</p>
        </div>
      </section>

  

      <section v-if="relatedTacheId" class="status-block">
        <h3>Statut du ticket</h3>
        <div class="status-inline">
          <select v-model="selectedStatut">
            <option v-for="opt in statutOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <button class="btn primary" @click="submitStatus" :disabled="updatingStatus">
            {{ updatingStatus ? 'Mise à jour...' : 'Mettre à jour' }}
          </button>
        </div>
        <p v-if="statusError" class="state error">{{ statusError }}</p>
      </section>

      <section class="content">
        <h3>Contenu</h3>
        <pre>{{ mail.contenu ?? '-' }}</pre>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMailDetail } from '../composables/useMailDetail';
import { getCurrentUser, restoreSession } from '../utils/auth';
import type { MailStatut } from '../../shared/interfaces/DatabaseModels';

const route = useRoute();
const router = useRouter();
const { mail, loading, error, loadMail } = useMailDetail();

const mailId = Number(route.params.id);

onMounted(async () => {
  const user = getCurrentUser();
  if (user) {
    try {
      await restoreSession(user);
    } catch (err) {
      // session restore is best-effort; ignore errors
    }
  }

  await loadMail(mailId);
  await findRelatedTache();
});

const goBack = () => {
  if (router.options.history.state.back) {
    router.back();
  } else {
    router.push('/mon-espace');
  }
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

const relatedTacheId = ref<number | null>(null);

const selectedStatut = ref<MailStatut | null>(null);
const statusError = ref<string | null>(null);
const updatingStatus = ref(false);
const statutOptions: Array<{ label: string; value: MailStatut }> = [
  { label: 'Non traité', value: 'Nouveau' },
  { label: 'En cours', value: 'Assigne' },
  { label: 'Traité', value: 'Resolu' },
];

async function findRelatedTache() {
  try {
    if (!mail.value) return;
    const current = getCurrentUser();
    let taches: any[] = [];
    if (current?.role === 'admin') {
      taches = await window.electronService.tache.invokeGetAllTaches();
    } else {
      const agentUserId = current?.id != null ? Number(current.id) : null;
      const normalizedId = agentUserId != null && !Number.isNaN(agentUserId) ? agentUserId : null;
      taches = await window.electronService.tache.invokeGetTachesForAgent({
        agentUserId: normalizedId,
        agentUsername: current?.username ?? null,
      });
    }

    const found = taches.find((t: any) => Number(t.mail_id) === Number(mail.value?.id));
    if (found) {
      relatedTacheId.value = found.id;
      selectedStatut.value = found.statut_tache as MailStatut;
    } else {
      relatedTacheId.value = null;
      selectedStatut.value = null;
    }
  } catch (e) {
    relatedTacheId.value = null;
    selectedStatut.value = null;
  }
}

async function submitStatus() {
  if (!relatedTacheId.value || !selectedStatut.value) {
    statusError.value = 'Aucun ticket lié à ce mail.';
    return;
  }
  statusError.value = null;
  updatingStatus.value = true;
  try {
    await window.electronService.tache.invokeUpdateTacheStatus(relatedTacheId.value, selectedStatut.value);
    await loadMail(mailId);
    await findRelatedTache();
  } catch (e) {
    statusError.value = e instanceof Error ? e.message : 'Impossible de mettre à jour le statut.';
  } finally {
    updatingStatus.value = false;
  }
}
</script>

<style scoped>
.mail-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.back-btn {
  border: 1px solid #cbd5f5;
  background: transparent;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
}

.header-text h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #0f172a;
}

.header-text p {
  margin: 0.2rem 0 0;
  color: #475569;
}

.mail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.meta-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.meta-value {
  margin: 0.2rem 0 0;
  font-size: 1rem;
  color: #0f172a;
}

.mail-address {
  color: #64748b;
  font-size: 0.9rem;
}

.content h3 {
  margin-bottom: 0.5rem;
  color: #0f172a;
}

.content pre {
  white-space: pre-wrap;
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  max-height: 60vh;
  overflow: auto;
}

.state {
  padding: 1rem;
  text-align: center;
  color: #475569;
}

.state.error {
  color: #b91c1c;
}

.status-block {
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.status-inline {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.status-inline select {
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5f5;
  border-radius: 6px;
}
</style>
