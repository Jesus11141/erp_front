<template>
  <div>
    <div class="page-header">
      <div>
      <h1 class="page-title">Dashboard Global</h1>
      </div>
    </div>

    <div v-if="cargando" class="spinner" style="margin:2rem auto;"></div>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_tenants }}</div>
          <div class="stat-label">Total Empresas</div>
        </div>
        <div class="stat-card" style="border-color:#27ae60">
          <div class="stat-value" style="color:#27ae60">{{ stats.active_tenants }}</div>
          <div class="stat-label">Empresas Activas</div>
        </div>
        <div class="stat-card" style="border-color:#e74c3c">
          <div class="stat-value" style="color:#e74c3c">{{ stats.expired_tenants }}</div>
          <div class="stat-label">Vencidas</div>
        </div>
        <div class="stat-card" style="border-color:#f39c12">
          <div class="stat-value" style="color:#f39c12">{{ stats.new_this_month }}</div>
          <div class="stat-label">Nuevas este mes</div>
        </div>
        <div class="stat-card" style="border-color:#9b59b6">
          <div class="stat-value" style="color:#9b59b6">${{ stats.monthly_revenue }}</div>
          <div class="stat-label">Ingresos mensuales</div>
        </div>
        <div class="stat-card" style="border-color:#16a085">
          <div class="stat-value" style="color:#16a085; font-size:1.1rem">{{ stats.most_used_module }}</div>
          <div class="stat-label">Módulo más usado</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../shared/api'

const stats = ref({})
const cargando = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/superadmin/statistics/')
    stats.value = data
  } finally {
    cargando.value = false
  }
})
</script>
