<template>
  <div class="admin-mail-page">
    <div class="header">
      <button class="ghost-btn" @click="goBack">Retour</button>
      <div>
        <p class="eyebrow">Administration</p>
        <h2>Gestion des mails</h2>
        <p class="muted">Affectation, statut et suppression des mails</p>
      </div>
    </div>

    <div v-if="mailError" class="error">{{ mailError }}</div>

    <section class="card">
      <h3>Mails non assignés</h3>
      <p class="muted">Attribuez un agent pour que le ticket soit créé dans son espace.</p>
      <div v-if="mailLoading" class="loading">Chargement...</div>
      <div v-else-if="unassignedMails.length === 0" class="no-data">Aucun mail en attente.</div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Objet</th>
              <th>Date</th>
              <th>Priorité</th>
              <th>Agent</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mail in unassignedMails" :key="mail.id">
              <td>{{ mail.id }}</td>
              <td>{{ mail.objet }}</td>
              <td>{{ formatDate(mail.date_reception) }}</td>
              <td>{{ mailPriority(mail) }}</td>
              <td>
                <select v-model.number="reassignTargets[mail.id]">
                  <option :value="null" disabled>Selectionnez</option>
                  <option v-for="agent in agentOptions" :key="agent.id" :value="agent.id">{{ agent.label }}</option>
                </select>
              </td>
              <td><button class="primary-btn" @click="assignMail(mail.id)">Assigner</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <div class="section-header">
        <h3>Tous les mails</h3>
        <span class="muted">{{ adminMails.length }} entrées</span>
      </div>
      <div v-if="mailLoading" class="loading">Chargement...</div>
      <div v-else-if="adminMails.length === 0" class="no-data">Aucun mail.</div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Objet</th>
              <th>Agent</th>
              <th>Priorité</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mail in adminMails" :key="mail.id">
              <td>{{ mail.id }}</td>
              <td>{{ mail.objet }}</td>
              <td>{{ mail.handler_username ?? (mail.handler_user_id ? ('#' + mail.handler_user_id) : 'Non assigne') }}</td>
              <td>{{ mailPriority(mail) }}</td>
              <td>{{ formatDate(mail.date_reception) }}</td>
              <td class="row-actions">
                <button class="link-btn" @click="openMailDetail(mail.id)">Voir</button>
                <button class="link-btn danger-text" @click="confirmDelete(mail.id)">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="mail-modal" role="dialog" aria-modal="true">
      <div class="mail-modal-content card">
        <header class="modal-header">
          <h3>Détail du mail</h3>
          <button class="link-btn" @click="closeModal">Fermer</button>
        </header>
        <div v-if="modalLoading" class="loading">Chargement...</div>
        <div v-else-if="modalError" class="error">{{ modalError }}</div>
        <div v-else-if="selectedMail">
          <p><strong>Objet :</strong> {{ selectedMail.objet }}</p>
          <p><strong>Expéditeur :</strong> {{ selectedMail.expediteur?.nom_complet }} &lt;{{ selectedMail.expediteur?.adresse_mail }}&gt;</p>
          <p><strong>Date réception :</strong> {{ formatDate(selectedMail.date_reception) }}</p>

          <div class="status-row" v-if="selectedTacheId">
            <label><strong>Statut :</strong></label>
            <div class="status-inline">
              <select v-model="selectedTacheStatut">
                <option v-for="opt in statutOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <button class="primary-btn" @click="submitStatus" :disabled="updatingStatus">
                {{ updatingStatus ? 'Mise à jour...' : 'Mettre à jour' }}
              </button>
            </div>
            <p v-if="statusError" class="error">{{ statusError }}</p>
          </div>

          <div class="reassign-row">
            <label><strong>Réassigner :</strong></label>
            <select v-model.number="reassignTargets[selectedMail.id]">
              <option :value="null" disabled>Choisir un agent</option>
              <option v-for="agent in agentOptions" :key="agent.id" :value="agent.id">{{ agent.label }}</option>
            </select>
            <button class="primary-btn" @click="submitModalReassign">Réassigner</button>
          </div>

          <div style="margin-top:0.6rem">
            <label><strong>Changer priorité :</strong></label>
            <div class="status-inline">
              <button class="ghost-btn" @click="submitPriority('Alerte Rouge')">Alerte Rouge</button>
              <button class="ghost-btn" @click="submitPriority('Urgent')">Urgent</button>
              <button class="ghost-btn" @click="submitPriority('Normale')">Normale</button>
            </div>
          </div>

          <hr />
          <h4>Contenu</h4>
          <div class="mail-content">{{ selectedMail.contenu ?? '-' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUsers, getCurrentUser } from '../utils/auth';
import { useAdminMail } from '../composables/useAdminMail';
import type { AuthUser } from '../../shared/interfaces/Auth';
import type { Mail, MailPriorite, StaffHierarchie } from '../../shared/interfaces/DatabaseModels';

const router = useRouter();
const currentUser = ref(getCurrentUser());
const users = ref<AuthUser[]>([]);

const {
  mails: adminMails,
  loading: mailLoading,
  error: mailError,
  loadAllMails,
  deleteMail,
  reassignMail,
} = useAdminMail();

const reassignTargets = ref<Record<number, number | null>>({});
const agentOptions = computed(() =>
  users.value.filter((u) => u.role === 'agent').map((u) => ({ id: u.id, label: u.username })),
);
const unassignedMails = computed(() =>
  adminMails.value.filter((mail) => !mail.handler_user_id && !mail.handler_username),
);

const statutOptions = [
  { label: 'Non traité', value: 'Nouveau' },
  { label: 'En cours', value: 'Assigne' },
  { label: 'Traité', value: 'Resolu' },
];
const selectedMail = ref<Mail | null>(null);
const selectedTacheStatut = ref<string | null>(null);
const updatingStatus = ref(false);
const statusError = ref<string | null>(null);
const showModal = ref(false);
const modalLoading = ref(false);
const modalError = ref<string | null>(null);
const selectedTacheId = computed(() => {
  const t = selectedMail.value?.taches;
  return Array.isArray(t) && t.length > 0 ? t[0].id ?? null : null;
});

const hierarchyPriorityMap: Partial<Record<StaffHierarchie, MailPriorite>> = {
  Leader: 'Alerte Rouge',
  'N+1': 'Urgent',
  N: 'Urgent',
  'Employe Lambda': 'Normale',
  Employe_Lambda: 'Normale',
};

const prismaPriorityMap: Record<MailPriorite, string> = {
  'Alerte Rouge': 'Alerte_Rouge',
  Urgent: 'Urgent',
  Normale: 'Normale',
};

function normalizePriority(value: string | null | undefined): MailPriorite | null {
  if (!value) return null;
  if (value === 'Alerte_Rouge') return 'Alerte Rouge';
  return value as MailPriorite;
}

function mailPriority(mail: Mail): MailPriorite {
  const taskPriority = normalizePriority(mail.taches?.[0]?.priorite_calculee);
  if (taskPriority) {
    return taskPriority;
  }
  const hierarchy = mail.expediteur?.statut_hierarchique ?? null;
  return hierarchy ? hierarchyPriorityMap[hierarchy as StaffHierarchie] ?? 'Normale' : 'Normale';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

async function loadUsers() {
  try {
    users.value = await fetchUsers();
  } catch {
    users.value = [];
  }
}

async function loadAdminMails() {
  await loadAllMails();
}

async function assignMail(mailId: number) {
  const target = reassignTargets.value[mailId];
  if (typeof target !== 'number' || Number.isNaN(target) || target <= 0) {
    alert('Choisissez un agent.');
    return;
  }
  await reassignMail(mailId, target);
  reassignTargets.value[mailId] = null;
}

async function confirmDelete(mailId: number) {
  if (!confirm('Supprimer le mail ?')) return;
  await deleteMail(mailId);
}

async function openMailDetail(mailId: number) {
  modalError.value = null;
  modalLoading.value = true;
  try {
    const mail = await window.electronService.mail.invokeGetMailDetail(mailId);
    selectedMail.value = mail;
    selectedTacheStatut.value = mail.taches?.[0]?.statut_tache ?? null;
    showModal.value = true;
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Impossible de charger le mail';
  } finally {
    modalLoading.value = false;
  }
}

function closeModal() {
  showModal.value = false;
  selectedMail.value = null;
}

async function submitModalReassign() {
  if (!selectedMail.value) return;
  const target = reassignTargets.value[selectedMail.value.id];
  if (typeof target !== 'number' || Number.isNaN(target) || target <= 0) {
    alert('Choisissez un agent.');
    return;
  }
  await reassignMail(selectedMail.value.id, target);
  await loadAdminMails();
  await openMailDetail(selectedMail.value.id);
}

async function submitPriority(priority: MailPriorite) {
  if (!selectedMail.value) return;
  const prismaValue = prismaPriorityMap[priority] ?? priority;
  await window.electronService.mail.invokeUpdateMailPriority(selectedMail.value.id, prismaValue);
  await loadAdminMails();
  await openMailDetail(selectedMail.value.id);
}

async function submitStatus() {
  const tacheId = selectedTacheId.value;
  if (!tacheId || !selectedTacheStatut.value) {
    statusError.value = 'Aucun ticket lié.';
    return;
  }
  statusError.value = null;
  updatingStatus.value = true;
  try {
    await window.electronService.tache.invokeUpdateTacheStatus(tacheId, selectedTacheStatut.value as any);
    await loadAdminMails();
    await openMailDetail(selectedMail.value.id);
  } catch (e) {
    statusError.value = e instanceof Error ? e.message : 'Impossible de mettre a jour le statut.';
  } finally {
    updatingStatus.value = false;
  }
}

function goBack() {
  router.back();
}

onMounted(async () => {
  if (!currentUser.value || currentUser.value.role !== 'admin') {
    router.push('/mon-espace');
    return;
  }
  await Promise.all([loadUsers(), loadAdminMails()]);
});
</script>

<style scoped>
.admin-mail-page {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.header-actions {
  display: flex;
  gap: 0.5rem;
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
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.6rem;
  text-align: left;
}
.row-actions {
  display: flex;
  gap: 0.4rem;
}
.mail-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15,23,42,0.4);
  z-index: 1100;
}
.mail-modal-content {
  width: 90%;
  max-width: 800px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-inline {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.reassign-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.mail-content {
  white-space: pre-wrap;
  border: 1px solid #e2e8f0;
  padding: 0.8rem;
  border-radius: 6px;
  background: #f8fafc;
}
.error {
  color: #b91c1c;
}
.loading {
  color: #2563eb;
}
.no-data {
  color: #64748b;
  font-style: italic;
}
</style>
