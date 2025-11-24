<template>
  <div class="card">
    <div class="card-header">
      <span class="card-id">{{ mail.id }}</span>
    </div>
    <div class="card-body">
      <div class="card-info">
        <span class="subject">{{ mail.objet }}</span>
        <span class="date">{{ formatDate(mail.date_reception) }}</span>
      </div>
      <div v-if="mail.contenu" class="content">{{ mail.contenu }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Mail } from '../../shared/interfaces/DatabaseModels';

interface Props {
  mail: Mail;
}

const props = defineProps<Props>();

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border: 1px solid #fde047;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-id {
  font-size: 1.1rem;
  font-weight: 700;
  color: #78350f;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.subject {
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
}

.date {
  font-size: 0.875rem;
  color: #a16207;
}

.content {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #ffffff;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #334155;
  max-height: 100px;
  overflow-y: auto;
}
</style>
