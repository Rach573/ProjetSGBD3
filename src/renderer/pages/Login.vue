<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2>Connexion</h2>

      <form @submit.prevent="onSubmit">
        <label>
          Nom d'utilisateur
          <input v-model="username" autocomplete="username" />
        </label>

        <label>
          Mot de passe
          <input type="password" v-model="password" autocomplete="current-password" />
        </label>

        <div class="actions">
          <button type="submit" :disabled="loading">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </div>
      </form>

      <div class="info">
        <p v-if="error" class="error">{{ error }}</p>
        <p class="hint">Compte non reference ? Contactez l'administrateur pour creer un compte (maximum 4 comptes).</p>
        <p class="hint">Mot de passe perdu ? Contactez l'administrateur pour reinitialisation.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../utils/auth';

const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function onSubmit() {
  error.value = '';
  if (!username.value.trim() || !password.value) {
    error.value = 'Veuillez renseigner le nom d\'utilisateur et le mot de passe.';
    return;
  }

  loading.value = true;
  try {
    const user = await login(username.value.trim(), password.value);
    // Tous les utilisateurs arrivent sur Mon Espace après connexion.
    // Les admins y verront un bouton pour accéder à l'espace admin.
    router.push('/mon-espace');
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Erreur de connexion.';
    error.value = errMsg;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}
.login-card {
  width: 360px;
  background: white;
  padding: 1.6rem;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(2,6,23,0.08);
}
.login-card h2 { margin-bottom: 1rem; }
.login-card label { display: block; margin-bottom: 0.75rem; font-size: 0.95rem; }
.login-card input { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; }
.actions { margin-top: 1rem; text-align: right; }
.actions button { background: #2563eb; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; }
.actions button[disabled] { opacity: 0.6; cursor: not-allowed; }
.hint { color: #64748b; font-size: 0.85rem; margin-top: 0.6rem; }
.error { color: #b91c1c; background: #fee2e2; padding: 0.5rem; border-radius: 6px; margin-top: 0.6rem; }
</style>
