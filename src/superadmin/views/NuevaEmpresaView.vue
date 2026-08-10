<template>
  <div>
    <h1 class="page-title">Crear Nueva Empresa y Alta SaaS</h1>
    <p style="color:var(--text-muted); font-size:0.875rem; margin-top:-0.5rem; margin-bottom:1.5rem;">
      Registra la company customer, su suscripción de tiempo, credenciales del administrador y módulos habilitados.
    </p>

    <div class="card" style="max-width:720px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        
        <!-- SECCIÓN 1: DATOS DE LA EMPRESA -->
        <div style="grid-column:1/-1; border-bottom:1px solid var(--border); padding-bottom:0.5rem; margin-top:0.5rem;">
          <h3 style="font-size:1rem; margin:0; color:var(--color-primario)">🏢 Datos de la Empresa Cliente</h3>
        </div>

        <div class="form-group" style="grid-column:1/-1">
          <label>Razón Social / Nombre Comercial *</label>
          <input v-model="form.name" class="input" placeholder="Comercial El Sol S.A." />
        </div>

        <div class="form-group">
          <label>RUC / Cédula Fiscal</label>
          <input v-model="form.ruc" class="input" placeholder="1792345678001" />
        </div>

        <div class="form-group">
          <label>Subdominio de la Empresa *</label>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <input v-model="form.subdomain" class="input" placeholder="elsol" />
            <span style="color:var(--text-muted); font-size:0.8rem; white-space:nowrap">.tuerp.com</span>
          </div>
        </div>

        <div class="form-group">
          <label>Email de Contacto Comercial</label>
          <input v-model="form.email_contacto" type="email" class="input" placeholder="contacto@elsol.com" />
        </div>

        <div class="form-group">
          <label>Teléfono de Contacto</label>
          <input v-model="form.telefono_contacto" class="input" placeholder="0991234567" />
        </div>

        <!-- SECCIÓN 2: PLAN Y SUSCRIPCIÓN TIEMPO -->
        <div style="grid-column:1/-1; border-bottom:1px solid var(--border); padding-bottom:0.5rem; margin-top:0.75rem;">
          <h3 style="font-size:1rem; margin:0; color:var(--color-primario)">💳 Plan y Tiempo de Suscripción</h3>
        </div>

        <div class="form-group" style="grid-column:1/-1">
          <label>Plan Base (Carga módulos por defecto)</label>
          <select v-model="form.plan" @change="onPlanChange" class="input">
            <option value="">-- Selecciona un plan --</option>
            <option v-for="p in planesDisponibles" :key="p.key" :value="p.key">
              {{ p.name }} - ${{ p.price }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Estado de Suscripción *</label>
          <select v-model="form.subscription_state" class="input">
            <option value="activa">Activa (PAGADA)</option>
            <option value="demo">Modo Prueba (DEMO)</option>
            <option value="suspendida">Suspendida (BLOQUEADA)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Fecha Vencimiento de Contrato *</label>
          <input v-model="form.expiration_date" type="date" class="input" />
        </div>

        <div class="form-group">
          <label>Fecha Inicio Contrato</label>
          <input v-model="form.fecha_inicio_contrato" type="date" class="input" />
        </div>

        <div class="form-group">
          <label>Máximo de Dispositivos (Cajas)</label>
          <input v-model="form.max_devices" type="number" min="1" class="input" required />
        </div>

        <!-- SECCIÓN 3: USUARIO ADMINISTRADOR INICIAL -->
        <div style="grid-column:1/-1; border-bottom:1px solid var(--border); padding-bottom:0.5rem; margin-top:0.75rem;">
          <h3 style="font-size:1rem; margin:0; color:var(--color-primario)">👤 Usuario Administrador Inicial</h3>
        </div>

        <div class="form-group">
          <label>Nombre del Administrador</label>
          <input v-model="form.admin_nombre" class="input" placeholder="Juan Pérez" />
        </div>

        <div class="form-group">
          <label>Email para Iniciar Sesión *</label>
          <input v-model="form.admin_email" type="email" class="input" placeholder="admin@elsol.com" />
        </div>

        <div class="form-group" style="grid-column:1/-1">
          <label>Contraseña del Administrador *</label>
          <input v-model="form.admin_password" type="password" class="input" placeholder="Contraseña segura" />
        </div>

        <!-- SECCIÓN 4: MÓDULOS CONTRATADOS -->
        <div style="grid-column:1/-1; border-bottom:1px solid var(--border); padding-bottom:0.5rem; margin-top:0.75rem;">
          <h3 style="font-size:1rem; margin:0; color:var(--color-primario)">⚙️ Módulos Habilitados en el Plan</h3>
        </div>

        <div style="grid-column:1/-1; display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:0.75rem;">
          <label v-for="mod in todosModulos" :key="mod.id" style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-weight:600;">
            <input type="checkbox" :value="mod.id" v-model="form.modules" style="width:18px; height:18px;" />
            <span>{{ mod.name }}</span>
          </label>
        </div>

      </div>

      <p v-if="error" style="color:#e74c3c; font-size:0.875rem; margin-top:1rem; font-weight:600;">{{ error }}</p>

      <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.5rem;">
        <router-link to="/superadmin/empresas" class="btn btn-outline">Cancelar</router-link>
        <button class="btn btn-primary" @click="crear" :disabled="creando">
          {{ creando ? 'Creando Empresa...' : '✨ Crear Cuenta y Alta Empresa' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

// Calcular date vencimiento por defecto (30 días)
const hoy = new Date()
const hoyStr = hoy.toISOString().slice(0, 10)
const enUnMes = new Date(hoy.setDate(hoy.getDate() + 30)).toISOString().slice(0, 10)

const form = ref({
  name: '',
  subdomain: '',
  ruc: '',
  email_contacto: '',
  telefono_contacto: '',
  fecha_inicio_contrato: hoyStr,
  expiration_date: enUnMes,
  subscription_state: 'activa',
  plan: '',
  max_devices: 1,
  admin_nombre: 'Administrador General',
  admin_email: '',
  admin_password: '',
  modules: ['pos', 'inventario', 'facturacion', 'ventas', 'rrhh', 'contabilidad', 'clinica'],
  primary_color: '#1976D2',
  secondary_color: '#424242',
  logo_url: '',
})

async function crear() {
  error.value = ''
  if (!form.value.name || !form.value.subdomain) {
    error.value = 'El name de la company y subdomain son requeridos'
    return
  }
  if (!form.value.admin_email || !form.value.admin_password) {
    error.value = 'El email y contraseña del administrador inicial son requeridos'
    return
  }
  creando.value = true
  try {
    await api.post('/superadmin/tenants/', form.value)
    router.push('/superadmin/empresas')
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al crear company'
  } finally {
    creando.value = false
  }
}

const planesDisponibles = ref([])

async function cargarPlanes() {
  try {
    const { data } = await api.get('/superadmin/plans/')
    planesDisponibles.value = data
  } catch (e) {
    console.error('Error cargando planes', e)
  }
}

function onPlanChange() {
  const p = planesDisponibles.value.find(x => x.key === form.value.plan)
  if (p) {
    form.value.modules = [...p.modules]
    form.value.max_devices = p.max_devices
  }
}

onMounted(() => {
  cargarPlanes()
})
</script>
