<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 class="page-title" style="margin:0">Clientes</h1>
      <button class="btn btn-primary" @click="mostrarForm = true">+ Nuevo Cliente</button>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <input v-model="busqueda" class="input" placeholder="Buscar customer..." style="max-width:300px" />
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>RFC</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in clientesFiltrados" :key="c.id">
            <td>{{ c.name }}</td><td>{{ c.email }}</td>
            <td>{{ c.phone }}</td><td>{{ c.rfc }}</td>
          </tr>
          <tr v-if="!clientesFiltrados.length">
            <td colspan="4" style="text-align:center; color:var(--text-muted)">Sin customers</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal nuevo customer -->
    <div v-if="mostrarForm" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1rem">Nuevo Cliente</h3>
        <div class="form-group"><label>Nombre *</label><input v-model="form.name" class="input" /></div>
        <div class="form-group"><label>Email</label><input v-model="form.email" type="email" class="input" /></div>
        <div class="form-group"><label>Teléfono</label><input v-model="form.phone" class="input" /></div>
        <div class="form-group"><label>RFC</label><input v-model="form.rfc" class="input" /></div>
        <div class="form-group"><label>Dirección</label><input v-model="form.address" class="input" /></div>
        <p v-if="error" style="color:#e74c3c; font-size:0.85rem">{{ error }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardar">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../../shared/api'

const customers = ref([])
const busqueda = ref('')
const mostrarForm = ref(false)
const error = ref('')
const form = ref({ name: '', email: '', phone: '', rfc: '', address: '' })

const clientesFiltrados = computed(() =>
  customers.value.filter(c => (c.name || '').toLowerCase().includes(busqueda.value.toLowerCase()))
)

onMounted(async () => {
  const { data } = await api.get('/ventas/customers/')
  customers.value = data
})

async function guardar() {
  error.value = ''
  if (!form.value.name) { error.value = 'El name es requerido'; return }
  try {
    const { data } = await api.post('/ventas/customers/', form.value)
    customers.value.push({ ...form.value, id: data.id })
    mostrarForm.value = false
    form.value = { name: '', email: '', phone: '', rfc: '', address: '' }
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al guardar'
  }
}
</script>

