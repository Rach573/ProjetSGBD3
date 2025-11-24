<template>
  <div class="card">
    <div class="card-header">
      <span class="card-id">Ticket #{{ task.id }}</span>
      <span class="priority-badge" :class="priorityClass">{{ task.priorite_calculee }}</span>
    </div>
    <div class="card-body">
      <div class="card-info">
        <span class="status">Statut: {{ task.statut_tache }}</span>
        <span class="agent" v-if="task.agent_user_id">Agent: {{ agentName }}</span>
        <span class="date" v-if="task.date_attribution">
          {{ formatDate(task.date_attribution) }}
        </span>
      </div>
      <div v-if="task.commentaire" class="comment">{{ task.commentaire }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { Tache } from '../../shared/interfaces/DatabaseModels';

interface Props {
  task: Tache;
}

const props = defineProps<Props>();

const priorityClass = computed(() => {
  const priority = props.task.priorite_calculee;
  if (priority === 'Alerte Rouge') return 'priority-critical';
  if (priority === 'Urgent') return 'priority-urgent';
  return 'priority-normal';
});

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const agentName = computed(() => {
  const usernameFromService = (props.task as any).agent_username as string | undefined | null;
  if (usernameFromService) return usernameFromService;
  const uid = props.task.agent_user_id as unknown as number | null;
  if (!uid) return '';
  return `#${uid}`;
});
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
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
  color: #1e293b;
}

.priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
}

.priority-critical {
  background: #fee2e2;
  color: #991b1b;
}

.priority-urgent {
  background: #fed7aa;
  color: #9a3412;
}

.priority-normal {
  background: #dbeafe;
  color: #1e40af;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-info {
  display: flex;
  justify-content: space-between;
  color: #475569;
}

.status {
  font-weight: 500;
}

.date {
  font-size: 0.875rem;
  color: #64748b;
}

.agent {
  font-size: 0.9rem;
  color: #0f172a;
  margin-left: 0.5rem;
  font-weight: 600;
}

.comment {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #ffffff;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #334155;
}
</style>
