<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-header">
          <div>
          <h1 class="page-title">Planes SaaS</h1>
          <p style="color:var(--text-muted); font-size:0.875rem;">Administra los planes de suscripción disponibles para tus clientes.</p>
          </div>
        </div>
      </div>
      <router-link to="/superadmin/nuevo-plan" class="btn btn-primary">
        ✨ Nuevo Plan
      </router-link>
    </div>

    <div class="card">
      <div v-if="cargando" style="padding: 2rem; text-align: center;">Cargando planes...</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Nombre del Plan</th>
            <th>Precio</th>
            <th>Max. Usuarios</th>
            <th>Max. Dispositivos</th>
            <th>Módulos Incluidos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in planes" :key="plan.id">
            <td style="font-weight: 600;">{{ plan.name }}</td>
            <td>${{ plan.price }}</td>
            <td>{{ plan.max_users }}</td>
            <td>{{ plan.max_devices }}</td>
            <td>
              <div style="display:flex; flex-wrap:wrap; gap:0.25rem;">
                <span v-for="mod in plan.modules" :key="mod" class="badge" style="background:var(--brand-100); color:var(--brand-700); font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:4px;">
                  {{ mod }}
                </span>
              </div>
            </td>
            <td>
              <button class="btn btn-outline" style="padding:0.25rem 0.5rem; font-size:0.8rem; color:#e74c3c; border-color:#e74c3c;" @click="eliminar(plan)">
                Eliminar
              </button>
            </td>
          </tr>
          <tr v-if="planes.length === 0">
            <td colspan="6" style="text-align: center; padding: 2rem;">No hay planes registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../shared/api'

const planes = ref([])
const cargando = ref(true)

async function cargar() {
  try {
    const { data } = await api.get('/superadmin/plans/')
    planes.value = data
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

async function eliminar(plan) {
  if (!confirm(`¿Estás seguro de eliminar el plan "${plan.name}"?`)) return
  try {
    await api.delete(`/superadmin/plans/${plan.id}/`)
    cargar()
  } catch (e) {
    alert('Error al eliminar el plan')
  }
}

onMounted(cargar)
</script>
