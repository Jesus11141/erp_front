<template>
  <div>
    <h1 class="page-title">Crear Nuevo Plan</h1>
    <p style="color:var(--text-muted); font-size:0.875rem; margin-top:-0.5rem; margin-bottom:1.5rem;">
      Define los límites y módulos de un nuevo plan de suscripción SaaS.
    </p>

    <div class="card" style="max-width:720px;">
      <form @submit.prevent="crear" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        
        <div class="form-group" style="grid-column:1/-1">
          <label>Nombre del Plan *</label>
          <input v-model="form.name" class="input" placeholder="Ej: Básico, Profesional, Enterprise" required />
        </div>

        <div class="form-group">
          <label>Precio Mensual ($) *</label>
          <input v-model="form.price" type="number" step="0.01" min="0" class="input" placeholder="29.99" required />
        </div>

        <div class="form-group">
          <label>Clave Única (Opcional)</label>
          <input v-model="form.key" class="input" placeholder="basic, pro, enterprise" />
        </div>

        <div class="form-group">
          <label>Máximo de Usuarios *</label>
          <input v-model="form.max_users" type="number" min="1" class="input" required />
        </div>

        <div class="form-group">
          <label>Máximo de Dispositivos Permitidos *</label>
          <input v-model="form.max_devices" type="number" min="1" class="input" required />
        </div>

        <div style="grid-column:1/-1; border-bottom:1px solid var(--border); padding-bottom:0.5rem; margin-top:0.75rem;">
          <h3 style="font-size:1rem; margin:0; color:var(--color-primario)">⚙️ Módulos Incluidos</h3>
        </div>

        <div style="grid-column:1/-1; display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:0.75rem;">
          <label v-for="mod in todosModulos" :key="mod.id" style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-weight:600;">
            <input type="checkbox" :value="mod.id" v-model="form.modules" style="width:18px; height:18px;" />
            <span>{{ mod.name }}</span>
          </label>
        </div>

        <div v-if="error" style="grid-column:1/-1; color:#e74c3c; font-size:0.875rem; font-weight:600;">
          {{ error }}
        </div>

        <div style="grid-column:1/-1; display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
          <router-link to="/superadmin/planes" class="btn btn-outline">Cancelar</router-link>
          <button type="submit" class="btn btn-primary" :disabled="creando">
            {{ creando ? 'Guardando...' : 'Guardar Plan' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../shared/api'

const router = useRouter()
const creando = ref(false)
const error = ref('')

const todosModulos = [
  { id: 'pos', name: '🛒 Punto de Venta (POS)' },
  { id: 'inventario', name: '📦 Inventario y Kardex' },
  { id: 'facturacion', name: '🧾 Facturación SRI' },
  { id: 'ventas', name: '📊 Ventas y Cotizaciones' },
  { id: 'compras', name: '🛍️ Compras y Proveedores' },
  { id: 'rrhh', name: '👥 Recursos Humanos y Nómina' },
  { id: 'contabilidad', name: '📒 Contabilidad Centralizada' },
  { id: 'clinica', name: '🏥 Clínica y Laboratorio' },
]

const form = ref({
  name: '',
  key: '',
  price: 0,
  max_users: 1,
  max_devices: 1,
  modules: ['pos', 'facturacion', 'ventas'],
})

async function crear() {
  error.value = ''
  creando.value = true
  try {
    await api.post('/superadmin/plans/', form.value)
    router.push('/superadmin/planes')
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al guardar el plan'
  } finally {
    creando.value = false
  }
}
</script>
