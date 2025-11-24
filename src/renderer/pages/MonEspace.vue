<template>
  <div class="workspace-page">
    <header class="workspace-header">
      <button class="back-btn" @click="goBack">Retour</button>
      <div class="header-text">
        <p class="eyebrow">Session</p>
        <h1>Mon espace</h1>
        <div v-if="currentUser" class="header-profile">
          <span class="chip">{{ currentUser.username }}</span>
          <span class="muted">{{ currentUser.role === 'admin' ? 'Administrateur' : 'Agent IT' }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="logout-btn" @click="onLogout">Déconnexion</button>
      </div>
    </header>

    <div v-if="!currentUser" class="card error-card">Aucun utilisateur connecté.</div>

    <template v-else>
      <section class="overview-grid">
        <article class="card overview-card">
          <h3>Charge actuelle</h3>
          <ul class="stat-list">
            <li>Total tickets : <strong>{{ personalStats.total }}</strong></li>
            <li>Priorité Alerte Rouge : <strong>{{ personalStats.alerteRouge }}</strong></li>
            <li>Priorité Urgent : <strong>{{ personalStats.urgent }}</strong></li>
            <li>Dernière attribution : <strong>{{ personalStats.lastAssigned ?? '-' }}</strong></li>
          </ul>
        </article>
        <article class="card overview-card">
          <h3>Par statut</h3>
          <ul class="status-summary">
            <li>
              <span>En attente</span>
              <strong>{{ statusCounts['Nouveau'] || 0 }}</strong>
              <small>{{ lastByStatus['Nouveau'] ?? '-' }}</small>
            </li>
            <li>
              <span>En cours</span>
              <strong>{{ statusCounts['Assigne'] || 0 }}</strong>
              <small>{{ lastByStatus['Assigne'] ?? '-' }}</small>
            </li>
            <li>
              <span>Traité</span>
              <strong>{{ statusCounts['Resolu'] || 0 }}</strong>
              <small>{{ lastByStatus['Resolu'] ?? '-' }}</small>
            </li>
          </ul>
        </article>
      </section>

      

      <section class="card task-controls">
        <div class="controls-left">
          <h3>Tickets assignés</h3>
          <span class="chip">{{ totalTachesLabel }}</span>
        </div>
        <div class="filters">
          <button
            v-for="option in statusFilters"
            :key="option.value"
            class="filter-chip"
            :class="{ active: option.value === statusFilter }"
            @click="setStatusFilter(option.value)"
          >
            {{ option.label }}
            <span>{{ option.count }}</span>
          </button>
        </div>
      </section>

      <section class="card task-board">
        <div v-if="loading" class="loading">Chargement…</div>
        <div v-else>
          <div v-if="error" class="error">{{ error }}</div>
          <div v-if="sortedTaches.length === 0 && !error" class="empty-state">
            Aucun ticket à afficher pour ce filtre.
          </div>
          <div v-else class="task-card-list">
            <article v-for="t in sortedTaches" :key="'card-' + t.id" class="task-card">
              <header>
                <div>
                  <p class="task-title">{{ mailSubject(t) }}</p>
                  
                </div>
                <span class="chip">{{ normalizePriority(t.priorite_calculee) }}</span>
              </header>
              <p class="task-preview">{{ mailSnippet(t) }}</p>
              <dl class="task-info">
                <div>
                  <dt>Expéditeur</dt>
                  <dd>{{ senderName(t) }}</dd>
                </div>
                <div>
                  <dt>Réception</dt>
                  <dd>{{ formatDate(t.mail?.date_reception ?? t.date_attribution) }}</dd>
                </div>
              </dl>
              <div class="task-actions">
                <button class="detail-link" @click="openMailDetail(t.mail_id)">Voir le mail</button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Tableau des tickets supprimé selon demande -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTache } from '../composables/useTache';
import { getCurrentUser, logout, restoreSession } from '../utils/auth';
import type { MailStatut, Tache } from '../../shared/interfaces/DatabaseModels';

type StatusFilter = 'all' | MailStatut;

const router = useRouter();
const { taches, loading, error, loadTaches } = useTache();
const currentUser = ref(getCurrentUser());
const isAdmin = computed(() => currentUser.value?.role === 'admin');

const statutLabels: Record<MailStatut, string> = {
  Nouveau: 'Non traité',
  Assigne: 'En cours',
  Resolu: 'Traité',
};

const statusFilter = ref<StatusFilter>('all');
const refreshing = ref(false);

const priorityOrder: Record<string, number> = {
  'Alerte Rouge': 3,
  Urgent: 2,
  Normale: 1,
};

const personalStats = computed(() => {
  const total = taches.value.length;
  const alerteRouge = taches.value.filter((t) => normalizePriority(t.priorite_calculee) === 'Alerte Rouge').length;
  const urgent = taches.value.filter((t) => normalizePriority(t.priorite_calculee) === 'Urgent').length;
  const lastTask = taches.value
    .slice()
    .sort((a, b) => getMailTimestamp(b) - getMailTimestamp(a))[0];
  return {
    total,
    alerteRouge,
    urgent,
    lastAssigned: lastTask ? formatDate(getMailDate(lastTask)) : null,
  };
});

const statusCounts = computed(() => {
  const map: Record<string, number> = { Nouveau: 0, Assigne: 0, Resolu: 0 };
  for (const t of taches.value) {
    const s = t.statut_tache || 'Nouveau';
    map[s] = (map[s] || 0) + 1;
  }
  return map;
});

const statusFilters = computed(() => {
  const counts = statusCounts.value;
  return [
    { label: 'Tous', value: 'all' as StatusFilter, count: taches.value.length },
    { label: 'En attente', value: 'Nouveau' as StatusFilter, count: counts.Nouveau || 0 },
    { label: 'En cours', value: 'Assigne' as StatusFilter, count: counts.Assigne || 0 },
    { label: 'Traité', value: 'Resolu' as StatusFilter, count: counts.Resolu || 0 },
  ];
});

const lastByStatus = computed(() => {
  const map: Record<string, string | null> = { Nouveau: null, Assigne: null, Resolu: null };
  for (const s of Object.keys(map)) {
    const list = taches.value
      .filter((t) => (t.statut_tache || 'Nouveau') === s)
      .sort((a, b) => getMailTimestamp(b) - getMailTimestamp(a));
    map[s] = list.length ? formatDate(getMailDate(list[0])) : null;
  }
  return map;
});

const filteredTaches = computed(() => {
  if (statusFilter.value === 'all') {
    return taches.value;
  }
  return taches.value.filter((t) => (t.statut_tache || 'Nouveau') === statusFilter.value);
});

const sortedTaches = computed(() => {
  return filteredTaches.value.slice().sort((a, b) => {
    const pb = priorityOrder[normalizePriority(b.priorite_calculee)] ?? 0;
    const pa = priorityOrder[normalizePriority(a.priorite_calculee)] ?? 0;
    if (pb !== pa) return pb - pa;
    return getMailTimestamp(b) - getMailTimestamp(a);
  });
});

const totalTachesLabel = computed(() => {
  const count = filteredTaches.value.length;
  if (statusFilter.value === 'all') {
    return `${count} ticket${count !== 1 ? 's' : ''}`;
  }
  const label = statutLabel(statusFilter.value as MailStatut);
  return `${count} ${label.toLowerCase()}${count !== 1 ? 's' : ''}`;
});

const highPriorityTaches = computed(() => {
  return taches.value
    .filter((t) => {
      const p = normalizePriority(t.priorite_calculee);
      return p === 'Alerte Rouge' || p === 'Urgent';
    })
    .sort((a, b) => {
      const pb = priorityOrder[normalizePriority(b.priorite_calculee)] ?? 0;
      const pa = priorityOrder[normalizePriority(a.priorite_calculee)] ?? 0;
      if (pb !== pa) return pb - pa;
      return getMailTimestamp(b) - getMailTimestamp(a);
    });
});

async function loadMyTaches() {
  const user = currentUser.value;
  if (!user) return;
  const id = Number(user.id);
  await loadTaches({
    agentUserId: Number.isNaN(id) ? null : id,
    agentUsername: user.username,
  });
}

async function refreshTaches() {
  refreshing.value = true;
  try {
    await loadMyTaches();
  } finally {
    refreshing.value = false;
  }
}

onMounted(async () => {
  if (!currentUser.value) {
    router.push('/login');
    return;
  }
  try {
    await restoreSession(currentUser.value);
  } catch (err) {
    // best-effort: proceed even if session restore fails
  }
  await refreshTaches();
});

function setStatusFilter(value: StatusFilter) {
  statusFilter.value = value;
}

function normalizePriority(p: string | null | undefined) {
  if (!p) return 'Normale';
  if (p === 'Alerte_Rouge') return 'Alerte Rouge';
  return p;
}

function getMailTimestamp(t: Tache): number {
  const raw = getMailDate(t);
  if (!raw) return 0;
  const timestamp = new Date(raw).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getMailDate(t: Tache): string | null {
  return t.mail?.date_reception ?? t.date_attribution ?? null;
}

function senderName(t: Tache): string {
  return t.mail?.expediteur?.nom_complet ?? 'Expéditeur inconnu';
}

function mailSubject(t: Tache): string {
  return t.mail?.objet ?? 'Mail';
}

function mailSnippet(t: Tache): string {
  const content = t.mail?.contenu ?? '';
  if (!content) return 'Pas de contenu.';
  return content.length > 240 ? `${content.slice(0, 237)}...` : content;
}

function statutLabel(statut: MailStatut): string {
  return statutLabels[statut] ?? statut;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

function goBack() {
  router.push('/');
}

function openMailDetail(mailId: number) {
  if (!mailId) return;
  router.push(`/mails/${mailId}`);
}

function goToAdmin() {
  router.push('/admin');
}

function onLogout() {
  logout();
  currentUser.value = null;
  router.push('/login');
}
</script>

<style scoped>
.workspace-page {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}


.workspace-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.header-text h1 {
  margin: 0;
  font-size: 1.8rem;
}

.header-text .muted {
  margin-top: 0.2rem;
  color: #64748b;
}

.header-profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.1rem;
  background: #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.error-card {
  border-color: #fecaca;
  color: #b91c1c;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.overview-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.profile-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem;
}

.profile-summary dt {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #64748b;
}

.profile-summary dd {
  margin: 0;
  font-weight: 600;
}

.stat-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.status-summary {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.6rem;
}

.status-summary li {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.status-summary span {
  color: #475569;
  font-size: 0.9rem;
}

.status-summary strong {
  font-size: 1.3rem;
}

.status-summary small {
  color: #94a3b8;
  font-size: 0.75rem;
}

.priority-section header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.priority-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.9rem;
  margin-top: 1rem;
}

.priority-card {
  border: 1px solid #cbd5f5;
  border-radius: 10px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.priority-card.open {
  border-color: #1d4ed8;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.15);
}

.priority-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.ticket-id {
  font-size: 0.85rem;
  color: #475569;
}

.priority-title {
  margin: 0;
  font-weight: 600;
}

.priority-meta {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.priority-actions {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}

.task-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.filters {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #cbd5f5;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
  font-size: 0.85rem;
}

.filter-chip span {
  background: #e2e8f0;
  border-radius: 999px;
  padding: 0.05rem 0.45rem;
  font-size: 0.75rem;
}

.filter-chip.active {
  background: #2563eb;
  border-color: #1d4ed8;
  color: #fff;
}

.filter-chip.active span {
  background: rgba(255, 255, 255, 0.2);
}

.task-board .task-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.task-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.task-card.open {
  border-color: #1d4ed8;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.15);
}

.task-card header {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}

.task-title {
  margin: 0;
  font-weight: 600;
}

.task-meta {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.task-preview {
  margin: 0;
  color: #1f2937;
}

.task-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem;
}

.task-info dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
}

.task-info dd {
  margin: 0;
  font-weight: 500;
}

.task-actions {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-editor {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.6rem;
}

.status-editor label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  color: #475569;
  gap: 0.3rem;
}

.status-editor select {
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  background: #fff;
  font-size: 0.9rem;
}

.card-error {
  color: #b91c1c;
  margin-top: 0.4rem;
  font-size: 0.85rem;
}

.chip {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 600;
}

.detail-link,
.admin-btn,
.logout-btn,
.back-btn {
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  padding: 0.45rem 0.9rem;
  background: #fff;
  cursor: pointer;
  font-weight: 600;
}

.detail-link {
  background: #2563eb;
  color: #fff;
  border-color: #1d4ed8;
}

.admin-btn {
  background: #2563eb;
  color: #fff;
  border-color: #1d4ed8;
}

.ghost-btn {
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  background: #f8fafc;
  color: #1f2937;
  cursor: pointer;
  font-weight: 600;
}

.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-btn {
  background: #fff;
}

.table-card .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.table-card .tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th,
.tasks-table td {
  border: 1px solid #e2e8f0;
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-size: 0.9rem;
}

.tasks-table th {
  background: #f1f5f9;
}

.loading {
  color: #2563eb;
}

.error {
  color: #b91c1c;
  margin-bottom: 0.6rem;
}

.empty-state {
  color: #64748b;
  font-style: italic;
}

.muted {
  color: #64748b;
}

@media (max-width: 900px) {
  .workspace-header {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }
}

@media (max-width: 600px) {
  .workspace-page {
    padding: 1.2rem;
  }

  .priority-list,
  .task-board .task-card-list {
    grid-template-columns: 1fr;
  }
}
</style>
