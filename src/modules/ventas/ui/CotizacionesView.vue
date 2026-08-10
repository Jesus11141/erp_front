<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 class="page-title" style="margin:0">Cotizaciones</h1>
    </div>
    <div class="card">
      <table class="table">
        <thead>
          <tr><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in quotations" :key="c.id">
            <td>{{ c.customer }}</td><td>{{ c.date }}</td>
            <td>{{ parametrosStore.company.simbolo }}{{ c.total }}</td>
            <td><span :class="badgeEstado(c.status)">{{ c.status }}</span></td>
            <td style="display:flex; gap:0.5rem;">
              <button v-if="c.status === 'draft'" class="btn btn-primary" style="padding:0.25rem 0.75rem; font-size:0.8rem" @click="enviar(c.id)">Enviar</button>
              <button v-if="c.status === 'enviada'" class="btn btn-success" style="padding:0.25rem 0.75rem; font-size:0.8rem" @click="convertir(c.id)">→ Pedido</button>
            </td>
          </tr>
          <tr v-if="!quotations.length">
            <td colspan="5" style="text-align:center; color:var(--text-muted)">Sin quotations</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../../shared/api'
import { useParametrosStore } from '../../../stores/parametros'

const parametrosStore = useParametrosStore()

const quotations = ref([])

const badgeEstado = (e) => ({
  draft: 'badge badge-secondary', enviada: 'badge badge-info',
  aceptada: 'badge badge-success', rechazada: 'badge badge-danger',
}[e] || 'badge badge-secondary')

onMounted(async () => {
  const { data } = await api.get('/ventas/quotations/')
  quotations.value = data
})

async function enviar(id) {
  await api.post(`/sales/quotations/${id}/enviar/`)
  const { data } = await api.get('/ventas/quotations/')
  quotations.value = data
}

async function convertir(id) {
  await api.post(`/sales/quotations/${id}/convertir/`)
  const { data } = await api.get('/ventas/quotations/')
  quotations.value = data
}
</script>

