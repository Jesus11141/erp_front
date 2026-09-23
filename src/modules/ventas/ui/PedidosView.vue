<template>
  <div>
    <div class="page-header">
      <div>
      <h1 class="page-title">Pedidos</h1>
      </div>
    </div>
    <div class="card">
      <table class="table">
        <thead>
          <tr><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in orders" :key="p.id">
            <td>{{ p.customer }}</td><td>{{ p.date }}</td>
            <td>{{ parametrosStore.company.simbolo }}{{ p.total }}</td>
            <td><span :class="badgeEstado(p.status)">{{ p.status }}</span></td>
          </tr>
          <tr v-if="!orders.length">
            <td colspan="4" style="text-align:center; color:var(--text-muted)">Sin orders</td>
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

const orders = ref([])

const badgeEstado = (e) => ({
  pendiente: 'badge badge-warning', en_proceso: 'badge badge-info',
  entregado: 'badge badge-success', cancelado: 'badge badge-danger',
}[e] || 'badge badge-secondary')

onMounted(async () => {
  const { data } = await api.get('/ventas/orders/')
  orders.value = data
})
</script>

