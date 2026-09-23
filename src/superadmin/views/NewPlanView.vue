<template>
  <div>
    <div class="page-header">
      <div>
      <h1 class="page-title">Crear Nuevo Plan</h1>
      <p style="color:var(--text-muted); font-size:0.875rem; margin-top:-0.5rem; margin-bottom:1.5rem;">
        Define los límites y módulos de un nuevo plan de suscripción SaaS.
      </p>
      </div>
    </div>

    <div class="card" style="max-width:1200px; margin: 0 auto;">
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

        <div style="grid-column:1/-1;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; padding: 0 1.5rem 1.5rem 1.5rem; align-items: start;">
            <div v-for="cat in categoriasModulos" :key="cat.nombre" style="margin-bottom:0;">
              <h4 
                @click="categoriasColapsadas[cat.nombre] = !categoriasColapsadas[cat.nombre]"
                style="margin:0 0 0.5rem 0; font-size:0.9rem; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e2e8f0; padding-bottom:0.25rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"
              >
                {{ cat.nombre }}
                <i class="fa-solid fa-chevron-down" style="transition: transform 0.2s" :style="{ transform: categoriasColapsadas[cat.nombre] ? 'rotate(180deg)' : 'rotate(0deg)' }"></i>
              </h4>
              <div class="modules-grid" v-show="!categoriasColapsadas[cat.nombre]">
                <label 
                  v-for="m in cat.modulos" :key="m.id"
                  class="modulo-check"
                  :class="{ is_active: form.modules.includes(m.id) }"
                >
                  <input 
                    type="checkbox" 
                    :value="m.id" 
                    v-model="form.modules"
                  />
                  {{ m.name }}
                </label>
              </div>
            </div>
          </div>
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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../shared/api'

const router = useRouter()
const creando = ref(false)
const error = ref('')

const categoriasColapsadas = ref(JSON.parse(localStorage.getItem('saCategoriasColapsadas')) || {
  'Gestión Empresarial': false,
  'Administración': false,
  'Especializados': false,
  'Sistema & Seguridad': false
})

watch(categoriasColapsadas, (newVal) => {
  localStorage.setItem('saCategoriasColapsadas', JSON.stringify(newVal))
}, { deep: true })

const categoriasModulos = [
  {
    nombre: 'Gestión Empresarial',
    modulos: [
      { id: 'pos', name: '🛒 Punto de Venta (POS)' },
      { id: 'inventario', name: '📦 Inventario Avanzado' },
      { id: 'facturacion', name: '🧾 Facturación SRI' },
      { id: 'ventas', name: '📊 Gestión de Ventas' },
      { id: 'compras', name: '🛍️ Gestión de Compras' },
    ]
  },
  {
    nombre: 'Administración',
    modulos: [
      { id: 'rrhh', name: '👥 Recursos Humanos' },
      { id: 'contabilidad', name: '📒 Contabilidad' },
      { id: 'centros_costos', name: '🏢 Centros de Costos' },
    ]
  },
  {
    nombre: 'Gastronomía y Operaciones',
    modulos: [
      { id: 'restaurantes', name: '🍔 Restaurantes (Mesas y Comandas)' },
    ]
  },
  {
    nombre: 'Especializados',
    modulos: [
      { id: 'clinica', name: '🏥 Gestión Clínica' },
      { id: 'technical_service', name: '🔧 Servicio Técnico' },
    ]
  },
  {
    nombre: 'Sistema & Seguridad',
    modulos: [
      { id: 'auditoria', name: '🛡️ Auditoría Inmutable' },
      { id: 'usuarios', name: '👥 Gestión Usuarios' },
      { id: 'roles', name: '🔑 Roles Dinámicos' },
    ]
  },
  {
    nombre: 'Integraciones SRI',
    modulos: [
      { id: 'sri_perfil', name: '🔍 Consulta RUC Automática' },
      { id: 'sri_facturas', name: '📥 Extracción de Facturas (Robot)' }
    ]
  }
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

<style scoped>
.modules-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem;
}
.modulo-check {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem; border: 2px solid var(--border);
  border-radius: 8px; cursor: pointer; font-size: 0.875rem;
  transition: all 0.15s;
}
.modulo-check.is_active { border-color: var(--color-primario); background: #e3f2fd; }
.modulo-check input { cursor: pointer; }
</style>
