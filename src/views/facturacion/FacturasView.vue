<template>
  <div>
    <h2>Facturas</h2>
    <table>
      <thead>
        <tr>
          <th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in invoices" :key="f.id">
          <td>{{ f.numero }}</td>
          <td>{{ f.customer }}</td>
          <td>{{ f.date }}</td>
          <td>{{ f.total }}</td>
          <td>{{ f.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'

const invoices = ref([])
onMounted(async () => {
  const { data } = await api.get('/facturacion/invoices/')
  invoices.value = data
})
</script>
