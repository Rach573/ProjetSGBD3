<template>
  <div class="home-container">
    <div class="home-header">
      <h1 class="main-title">SnowDispatcher</h1>
      <div class="user-actions">
        <span class="username">{{ currentUsername }}</span>
        <button class="logout-btn" @click="onLogout">Déconnexion</button>
        <button class="goto-me" @click="goToMonEspace">Mon espace</button>
        <button v-if="isAdmin" class="goto-admin" @click="goToAdmin">Admin</button>
      </div>
    </div>
    
    <!-- Tâches Section -->
    <section class="section">
      <h2 class="section-title">Tickets en cours</h2>
      <div v-if="loadingTasks" class="loading">Chargement des tickets…</div>
      <div v-if="taskError" class="error">{{ taskError }}</div>
      <div class="list-container">
        <TaskCard v-for="tache in taches" :key="tache.id" :task="tache" />
      </div>
      <p v-if="!loadingTasks && taches.length === 0" class="no-data">Aucun ticket.</p>
    </section>

    <!-- Mails Section -->
    <section class="section">
      <h2 class="section-title">Mails à traiter</h2>
      <div v-if="loadingMails" class="loading">Chargement des mails…</div>
      <div v-if="mailError" class="error">{{ mailError }}</div>
      <div class="list-container">
        <MailCard v-for="mail in mails" :key="mail.id" :mail="mail" />
      </div>
      <p v-if="!loadingMails && mails.length === 0" class="no-data">Aucun mail à traiter.</p>
    </section>

    <AddTaskButton />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, logout } from '../utils/auth';
import { useMail } from '../composables/useMail';
import { useTache } from '../composables/useTache';
import TaskCard from '../components/TaskCard.vue';
import MailCard from '../components/MailCard.vue';
import AddTaskButton from '../components/AddTaskButton.vue';

const {
  mails,
  loading: loadingMails,
  error: mailError,
  loadMails,
} = useMail();

const {
  taches,
  loading: loadingTasks,
  error: taskError,
  loadTaches,
} = useTache();

const router = useRouter();
const currentUserObj = ref(getCurrentUser());
const currentUsername = ref<string>(currentUserObj.value?.username ?? '');
const isAdmin = ref<boolean>(currentUserObj.value?.role === 'admin');

function onLogout() {
  logout();
  router.push('/login');
}

function goToMonEspace() {
  router.push('/mon-espace');
}

function goToAdmin() {
  router.push('/admin');
}

onMounted(async () => {
  const user = currentUserObj.value;
  if (!user) {
    router.replace('/login');
    return;
  }
  if (user.role !== 'admin') {
    router.replace('/mon-espace');
    return;
  }
  await loadMails();
  await loadTaches();
});
</script>

<style scoped>
.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.user-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.username {
  color: #334155;
  font-weight: 600;
}
.logout-btn {
  background: transparent;
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
}
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.main-title {
  color: #1e293b;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
}

.section {
  margin-bottom: 3rem;
}

.section-title {
  color: #334155;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.loading {
  color: #3b82f6;
  font-weight: 600;
  text-align: center;
  padding: 2rem;
}

.error {
  color: #ef4444;
  background: #fee2e2;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid #ef4444;
}

.no-data {
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}
</style>
