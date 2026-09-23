<template>
  <div class="modulo-container">
    <div class="header-actions">
      <h2>Registro de Auditoría <span class="badge">Inmutable</span></h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">
        Este módulo rastrea automáticamente las modificaciones realizadas por los usuarios en las tablas críticas del sistema.
      </p>
    </div>

    <div class="card" style="padding: 1.5rem;">
      <div v-if="loading" style="text-align:center;">
        Cargando registros de auditoría...
      </div>
      <div v-else-if="logs.length === 0" style="text-align:center; color: var(--text-muted);">
        No hay actividad registrada recientemente.
      </div>
      <div v-else class="table-container">
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border);">Fecha y Hora</th>
              <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border);">Usuario ID</th>
              <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border);">Acción</th>
              <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border);">Módulo / Registro</th>
              <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border);">Detalles del Cambio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" style="border-bottom: 1px solid var(--border);">
              <td style="padding: 0.75rem; color: var(--text-muted); white-space: nowrap;">
                {{ formatDateTime(log.created_at) }}
              </td>
              <td style="padding: 0.75rem;">
                <span class="user-badge">{{ log.user_id ? 'User ' + log.user_id : 'Sistema' }}</span>
              </td>
              <td style="padding: 0.75rem;">
                <span :class="'action-badge ' + log.action.toLowerCase()">{{ log.action }}</span>
              </td>
              <td style="padding: 0.75rem;">
                <strong>{{ log.table_name }}</strong> <br>
                <span style="font-size: 0.8rem; color: var(--text-muted);">ID: {{ log.record_id }}</span>
              </td>
              <td style="padding: 0.75rem; font-family: monospace; font-size: 0.85rem;">
                <div v-if="log.action === 'UPDATE'" class="diff-view">
                  <div v-for="(val, key) in log.changes" :key="key">
                    <strong style="color: var(--text-main);">{{ key }}:</strong> <br>
                    <span style="color: #e74c3c; text-decoration: line-through;">{{ val.old }}</span> 
                    <span style="color: var(--text-muted);"> → </span> 
                    <span style="color: #2ecc71; font-weight: bold;">{{ val.new }}</span>
                  </div>
                </div>
                <div v-else-if="log.action === 'CREATE'" style="color: #2ecc71;">
                  Creado exitosamente.
                </div>
                <div v-else-if="log.action === 'DELETE'" style="color: #e74c3c;">
                  Registro eliminado por completo.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/shared/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const logs = ref([])
const loading = ref(true)

const formatDateTime = (isoString) => {
  const d = new Date(isoString)
  return d.toLocaleString('es-ES', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  })
}

const fetchLogs = async () => {
  try {
    const { data } = await api.get('/auditoria/logs/')
    logs.value = data
  } catch (error) {
    console.error('Error fetching audit logs', error)
    toast.error('Error cargando el registro de auditoría. Permisos insuficientes.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.badge {
  background: #e74c3c;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  vertical-align: middle;
  margin-left: 0.5rem;
}

.user-badge {
  background: var(--bg-secundario);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid var(--border);
}

.action-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.action-badge.create {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.action-badge.update {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.action-badge.delete {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.diff-view {
  background: var(--bg-secundario);
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
}
</style>
