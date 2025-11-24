<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <nav class="side-nav">
        <ul>
          <li>
            <RouterLink to="/mon-espace">Mon Espace</RouterLink>
          </li>

         
          <li v-if="isAdmin">
            <RouterLink to="/admin">Gestion Des Utilisateurs</RouterLink>
          </li>
          <li v-if="isAdmin">
            <RouterLink to="/admin-mails">Gestion Des Mails</RouterLink>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
// ... imports et handleUnload

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getCurrentUser, logout } from './utils/auth';
import type { AuthUser } from '../shared/interfaces/Auth';
// ... autres imports ...

// --- LOGIQUE DE SESSION ET NAVIGATION ---

// Derivation du role Admin (basee sur l'original)
const currentUser = ref<AuthUser | null>(getCurrentUser());
const isAdmin = computed(() => currentUser.value?.role === 'admin');

function syncSession(user: AuthUser | null) {
  currentUser.value = user ?? null;
}

function refreshCurrentUser() {
  syncSession(getCurrentUser());
}

let unsubscribeSession: (() => void) | null = null;

onMounted(() => {
  refreshCurrentUser();
  window.addEventListener('storage', refreshCurrentUser);
  if (window.electronService?.auth?.onSessionUpdated) {
    try {
      unsubscribeSession = window.electronService.auth.onSessionUpdated((user) => {
        syncSession(user);
      });
    } catch {
      unsubscribeSession = null;
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', refreshCurrentUser);
  if (unsubscribeSession) {
    unsubscribeSession();
    unsubscribeSession = null;
  }
});

// ... (le reste de votre logique de notifications, onMounted, etc.) ...
</script>

<style>
/* Ajoutez un style pour separer les sections du menu */
.menu-separator {
    font-size: 0.8rem;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    margin-top: 12px;
    margin-bottom: 6px;
    padding-left: 6px;
}
</style>
