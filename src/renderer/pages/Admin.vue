<template>
  <div class="admin-page">
    <div class="admin-header">
      <button class="back-btn" @click="goBack">Retour</button>
      <div class="header-copy">
        
        <h2>Espace administrateur</h2>
      </div>
    </div>

    <div class="admin-grid">
      <section class="card account-card">
        <header class="section-header">
          <div>
            <h3>Comptes applicatifs</h3>
            <p class="muted">Création, suppression et réinitialisation · {{ users.length }}/{{ maxSlots }} comptes utilisés</p>
          </div>
          
        </header>

        <div class="form-row">
          <input v-model="newUsername" placeholder="Nom d'utilisateur" />
          <input v-model="newPassword" placeholder="Mot de passe" type="password" />
          <button class="primary-btn" @click="handleCreate" :disabled="creating">
            {{ creating ? 'Création…' : 'Créer' }}
          </button>
        </div>
        <p class="hint">Les mots de passe sont immédiatement chiffrés côté serveur.</p>
        <div v-if="createError" class="error">{{ createError }}</div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Rôle</th>
                    <th>Charge</th>
                    <th>Actions</th>
              </tr>
            </thead>
            <tbody>
                  <tr v-for="u in users" :key="u.username">
                    <td>{{ u.id }}</td>
                    <td>{{ u.username }}</td>
                    <td class="role-cell">
                      <span class="role-chip" :class="u.role">{{ u.role }}</span>
                    </td>
                    <td>
                      <div class="charge-cell">{{ agentStats[u.id]?.openTasks ?? 0 }} ouvert(s)</div>
                    </td>
                    <td class="actions-cell">
                      <button class="link-btn" @click="promptReset(u.username)">Réinitialiser</button>
                      <button class="link-btn danger-text" @click="handleDelete(u.username)" :disabled="u.username === currentUser?.username">
                        Supprimer
                      </button>
                    </td>
                  </tr>
              <tr v-if="users.length === 0">
                <td colspan="5" class="no-data">Aucun compte enregistré.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card stats-card">
        <header class="section-header">
          <div>
            <h3>Statistiques de traitement</h3>
            <p class="muted">Tables utilisées :
              <code>stats_gender_mail_count</code>,
              <code>stat_mail_by_gender</code>,
              <code>stat_mail_by_priority</code>
            </p>
          </div>
         
        </header>

        <div v-if="statsLoading" class="loading">Chargement des statistiques…</div>
        <template v-else>
          <div v-if="genderCards.length" class="stat-cards">
            <div class="summary-card" v-for="card in genderCards" :key="card.key">
              <p class="summary-label">{{ card.label }}</p>
              <p class="summary-value">{{ card.value }}</p>
              <div class="summary-bar">
                <span :style="{ width: card.percent + '%' }"></span>
              </div>
              <small>{{ card.percent }}% des mails connus</small>
            </div>
          </div>
          <p v-else class="no-data">Aucune donnée agrégée disponible.</p>

          <div class="trend-panels">
            <div class="trend-panel">
              <div class="panel-header">
                <h4>Volume quotidien par genre</h4>
                <span class="muted">7 derniers jours</span>
              </div>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th v-for="col in genderColumns" :key="col">{{ genderColumnLabel(col) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in genderTrendRows" :key="'gender-' + row.date">
                      <td>{{ formatDisplayDate(row.date) }}</td>
                      <td v-for="col in genderColumns" :key="row.date + col">{{ row.values[col] ?? 0 }}</td>
                    </tr>
                    <tr v-if="genderTrendRows.length === 0">
                      <td :colspan="genderColumns.length + 1" class="no-data">Pas de données journalières.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="trend-panel">
              <div class="panel-header">
                <h4>Volume quotidien par priorité</h4>
                <span class="muted">7 derniers jours</span>
              </div>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th v-for="col in priorityColumns" :key="'header-' + col">{{ priorityLabel(col) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in priorityTrendRows" :key="'priority-' + row.date">
                      <td>{{ formatDisplayDate(row.date) }}</td>
                      <td v-for="col in priorityColumns" :key="row.date + '-' + col">{{ row.values[col] ?? 0 }}</td>
                    </tr>
                    <tr v-if="priorityTrendRows.length === 0">
                      <td :colspan="priorityColumns.length + 1" class="no-data">Pas de données journalières.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
        <div v-if="statsError" class="error">{{ statsError }}</div>
      </section>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUsers, fetchAgentWorkload, createUserWithCredentials, deleteUser, resetPassword, getCurrentUser } from '../utils/auth';
import { useAdminStats } from '../composables/useAdminStats';
import type { AuthUser } from '../../shared/interfaces/Auth';
import type { GenderStat, Genre } from '../../shared/interfaces/DatabaseModels';

const router = useRouter();
const users = ref<AuthUser[]>([]);
const newUsername = ref('');
const newPassword = ref('');
const createError = ref('');
const creating = ref(false);
const maxSlots = 4;
const currentUser = ref(getCurrentUser());
const agentStats = ref<Record<number, { openTasks: number }>>({});

const { stats, loading: statsLoading, error: statsError, loadStats } = useAdminStats();

const genderColumns: GenderStat[] = ['F', 'M', 'X', 'U'];
const genderColumnLabels: Record<GenderStat, string> = {
  F: 'Femmes',
  M: 'Hommes',
  X: 'X / Divers',
  U: 'Inconnu',
};

const genreCountLabels: Record<Genre, string> = {
  F: 'Contacts féminins',
  M: 'Contacts masculins',
  Autre: 'Autres genres',
};

const priorityLabelMap: Record<number, string> = {
  1: 'Alerte Rouge',
  2: 'Urgent',
  3: 'Normale',
};

const genderCards = computed(() => {
  const totals = stats.value?.genderTotals ?? [];
  const grandTotal = totals.reduce((acc, entry) => acc + entry.mail_count, 0);
  return totals.map((entry) => ({
    key: entry.genre,
    label: genreCountLabels[entry.genre] ?? entry.genre,
    value: entry.mail_count,
    percent: grandTotal > 0 ? Math.round((entry.mail_count / grandTotal) * 100) : 0,
  }));
});

const genderTrendRows = computed(() => {
  if (!stats.value) return [];
  const grouped = new Map<string, Record<GenderStat, number>>();
  for (const entry of stats.value.mailByGender) {
    const dateKey = entry.stat_date.slice(0, 10);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        F: 0,
        M: 0,
        X: 0,
        U: 0,
      });
    }
    grouped.get(dateKey)![entry.gender] = entry.mail_count;
  }
  return Array.from(grouped.entries())
    .map(([date, values]) => ({ date, values }))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
});

const priorityColumns = computed(() => {
  if (!stats.value) return [] as number[];
  const ids = Array.from(
    new Set(stats.value.mailByPriority.map((entry) => entry.priority_id)),
  );
  ids.sort((a, b) => a - b);
  return ids;
});

const priorityTrendRows = computed(() => {
  if (!stats.value) return [];
  const grouped = new Map<string, Record<number, number>>();
  for (const entry of stats.value.mailByPriority) {
    const dateKey = entry.stat_date.slice(0, 10);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {});
    }
    grouped.get(dateKey)![entry.priority_id] = entry.mail_count;
  }
  return Array.from(grouped.entries())
    .map(([date, values]) => ({ date, values }))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
});

async function refreshAccounts() {
  try {
    users.value = await fetchUsers();
    // fetch workload per agent
    try {
      const workloads = await fetchAgentWorkload();
      const map: Record<number, { openTasks: number }> = {};
      for (const w of workloads) map[w.id] = { openTasks: w.openTasks };
      agentStats.value = map;
    } catch (e) {
      // ignore workload errors, keep agentStats empty
      agentStats.value = {};
    }
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Erreur de chargement des comptes.';
  }
}

onMounted(async () => {
  if (!currentUser.value || currentUser.value.role !== 'admin') {
    router.push('/');
    return;
  }
  // Restore server-side session from localStorage-stored user if needed,
  // then load admin-only resources.
  try {
    if (currentUser.value) {
      await import('../utils/auth').then((m) => m.restoreSession(currentUser.value));
    }
  } catch (e) {
    // ignore restore errors here; subsequent IPC calls will fail with a proper message
  }
  await Promise.all([refreshAccounts(), loadStats()]);
});

async function refreshAll() {
  await Promise.all([refreshAccounts(), loadStats()]);
}

async function handleCreate() {
  createError.value = '';
  if (!newUsername.value.trim() || !newPassword.value) {
    createError.value = 'Remplissez nom utilisateur et mot de passe.';
    return;
  }
  creating.value = true;
  try {
    await createUserWithCredentials(newUsername.value.trim(), newPassword.value, 'agent');
    newUsername.value = '';
    newPassword.value = '';
    await refreshAccounts();
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Impossible de créer le compte.';
  } finally {
    creating.value = false;
  }
}

async function handleDelete(username: string) {
  if (username === currentUser.value?.username) return;
  if (!confirm(`Supprimer le compte ${username} ?`)) return;
  try {
    await deleteUser(username);
    await refreshAccounts();
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Erreur lors de la suppression.');
  }
}

async function promptReset(username: string) {
  const np = prompt(`Nouveau mot de passe pour ${username} :`, 'changeme');
  if (!np) return;
  try {
    await resetPassword(username, np);
    alert('Mot de passe réinitialisé.');
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Erreur lors de la réinitialisation.');
  }
}

function genderColumnLabel(col: GenderStat) {
  return genderColumnLabels[col] ?? col;
}

function priorityLabel(id: number) {
  return priorityLabelMap[id] ?? `Priorité ${id}`;
}

function formatDisplayDate(dateStr: string) {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.admin-page {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-copy h2 {
  margin: 0;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-bottom: 0.2rem;
}

.back-btn,
.ghost-btn,
.primary-btn,
.link-btn {
  border-radius: 6px;
  border: 1px solid transparent;
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.back-btn,
.ghost-btn {
  background: transparent;
  border-color: #cbd5f5;
}

.ghost-btn:hover:not(:disabled) {
  background: #eef2ff;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
  border-color: #1d4ed8;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link-btn {
  background: transparent;
  color: #2563eb;
  padding: 0.25rem 0.5rem;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  background: #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr);
  gap: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.muted {
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 0.1rem 0 0;
}

.form-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.form-row input {
  flex: 1;
  min-width: 140px;
  padding: 0.45rem 0.6rem;
  border: 1px solid #cbd5f5;
  border-radius: 6px;
}

.hint {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin-top: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 480px;
}

th,
td {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.6rem;
  text-align: left;
}

.role-chip {
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-size: 0.78rem;
  text-transform: uppercase;
  background: #e2e8f0;
  color: #0f172a;
}

.role-chip.admin {
  background: #fee2e2;
  color: #b91c1c;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.summary-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.summary-label {
  color: #64748b;
  font-size: 0.85rem;
  margin: 0;
}

.summary-value {
  font-size: 1.4rem;
  margin: 0;
  font-weight: 600;
  color: #0f172a;
}

.summary-bar {
  background: #f1f5f9;
  border-radius: 999px;
  height: 6px;
  overflow: hidden;
}

.summary-bar span {
  display: block;
  height: 100%;
  background: #2563eb;
}

.trend-panels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trend-panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  background: #f8fafc;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.6rem;
}

.link-btn.danger-text {
  color: #b91c1c;
}

.error {
  color: #b91c1c;
  margin-top: 0.5rem;
}

.loading {
  color: #2563eb;
  margin: 0.4rem 0;
}

.no-data {
  color: #94a3b8;
  font-style: italic;
  text-align: center;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}
</style>
