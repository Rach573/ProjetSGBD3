<template>
  <button class="add-mail" @click="handleClick">
    Attribuer un mail
  </button>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const handleClick = () => {
  router.push('/add-task');
};
</script>

<style scoped>
.add-mail {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #389c2b;
  border: none;
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  z-index: 100;
}

.add-task-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(37, 168, 107, 0.4);
  background: #2563eb;
}

.add-task-btn:active {
  transform: translateY(-1px);
}
</style>
