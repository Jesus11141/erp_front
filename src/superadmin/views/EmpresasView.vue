<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h1 class="page-title" style="margin:0">Empresas Clientes (Tenants SaaS)</h1>
        <p style="color:var(--text-muted); font-size:0.875rem; margin-top:0.25rem;">
          Control centralizado de suscripciones, fechas de vencimiento, suspensión por pago y módulos contratados.
        </p>
      </div>
      <router-link to="/superadmin/nueva-company" class="btn btn-primary">+ Nueva Empresa</router-link>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <input v-model="busqueda" class="input" placeholder="Buscar por Razón Social, RUC o Subdominio..." style="max-width:380px" />
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Empresa / RUC</th>
            <th>Subdominio</th>
            <th>Módulos Activos</th>
            <th>Vencimiento Contrato</th>
            <th>Estado Suscripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in empresasFiltradas" :key="t.id">
            <td>
              <div style="font-weight:700; color:var(--color-primario)">{{ t.name }}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">
                RUC: {{ t.ruc || 'Sin RUC' }} | Contacto: {{ t.email_contacto || '-' }}
              </div>
            </td>
            <td>
              <code style="background:#f0f0f0; padding:0.2rem 0.4rem; border-radius:4px; font-size:0.8rem; font-family:monospace;">{{ t.subdomain }}.tuerp.com</code>
            </td>
            <td>
              <div class="modules-wrap">
                <span v-for="m in t.modules" :key="m" class="modulo-tag">{{ m }}</span>
              </div>
            </td>
            <td>
              <div style="font-weight:600; font-size:0.85rem;">
                {{ t.expiration_date || 'Sin date' }}
              </div>
              <span v-if="t.remaining_days !== null" :class="t.is_expired ? 'badge badge-danger' : 'badge badge-info'" style="font-size:0.7rem;">
                {{ t.is_expired ? '⚠️ VENCIDA' : `${t.remaining_days} días restantes` }}
              </span>
            </td>
            <td>
              <span :class="badgeSuscripcion(t)">
                {{ labelSuscripcion(t) }}
              </span>
            </td>
            <td>
              <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button class="btn btn-outline btn-sm" style="padding:0.25rem 0.5rem; font-size:0.8rem;" @click="verDetalle(t)">
                  ⚙️ Gestionar
                </button>
                <button
                  :class="['btn', 'btn-sm', t.active && !t.is_expired ? 'btn-danger' : 'btn-primary']"
                  style="padding:0.25rem 0.5rem; font-size:0.8rem;"
                  @click="toggleEmpresa(t)"
                >
                  {{ t.active && !t.is_expired ? '🔴 Suspender' : '🟢 Activar' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!empresasFiltradas.length">
            <td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">
              No hay empresas registradas o no coinciden con la búsqueda.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL EDITAR EMPRESA Y SUSCRIPCIÓN -->
    <div v-if="empresaSeleccionada" class="modal-overlay" @click.self="empresaSeleccionada = null">
      <div class="modal" style="max-width:640px">
        <h3 style="margin-bottom:1.25rem">Gestionar Suscripción: {{ empresaSeleccionada.name }}</h3>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1.5rem;">
          <div class="form-group">
            <label>Razón Social *</label>
            <input v-model="formEditar.name" class="input" />
          </div>
          <div class="form-group">
            <label>RUC / Cédula</label>
            <input v-model="formEditar.ruc" class="input" />
          </div>
          <div class="form-group">
            <label>Email Contacto</label>
            <input v-model="formEditar.email_contacto" type="email" class="input" />
          </div>
          <div class="form-group">
            <label>Teléfono Contacto</label>
            <input v-model="formEditar.telefono_contacto" class="input" />
          </div>
          <div class="form-group">
            <label>Estado de Suscripción</label>
            <select v-model="formEditar.subscription_status" class="input">
              <option value="activa">Activa (PAGADA)</option>
              <option value="demo">Modo Prueba (DEMO)</option>
              <option value="suspendida">Suspendida (BLOQUEADA)</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha Vencimiento Contrato</label>
            <input v-model="formEditar.expiration_date" type="date" class="input" />
          </div>
          <div class="form-group">
            <label>Dispositivos Permitidos</label>
            <input v-model.number="formEditar.max_devices" type="number" min="1" class="input" />
          </div>

          <!-- Restablecer Clave del Administrador -->
          <div class="form-group" style="grid-column:1/-1; background:#f8fafc; padding:0.75rem; border-radius:8px; border:1px solid #e2e8f0; margin-top:0.25rem;">
            <div style="font-weight:700; color:var(--color-primario); font-size:0.85rem; margin-bottom:0.5rem;">
              🔑 Credenciales del Administrador de esta Empresa
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <label style="font-size:0.78rem;">Email del Admin (Login)</label>
                <input v-model="formEditar.admin_email" type="email" class="input" placeholder="admin@company.com" />
              </div>
              <div>
                <label style="font-size:0.78rem;">Restablecer Contraseña</label>
                <input v-model="formEditar.admin_password" type="password" class="input" placeholder="Escribe nueva clave si la olvidó" autocomplete="new-password" />
              </div>
            </div>
          </div>
        </div>

        <!-- Módulos -->
        <div style="margin-bottom:1.5rem;">
          <label style="font-weight:600; display:block; margin-bottom:0.75rem;">Módulos Contratados</label>
          <div class="modules-grid">
            <label
              v-for="m in todosModulos" :key="m.clave"
              class="modulo-check"
              :class="{ is_active: empresaSeleccionada.modules.includes(m.clave) }"
            >
              <input
                type="checkbox"
                :checked="empresaSeleccionada.modules.includes(m.clave)"
                @change="toggleModulo(empresaSeleccionada.id, m.clave, $event.target.checked)"
              />
              {{ m.icono }} {{ m.label }}
            </label>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
          <button class="btn btn-outline" @click="empresaSeleccionada = null">Cancelar</button>
          <button class="btn btn-primary" @click="guardarEdicion">Guardar Cambios Suscripción</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../shared/api'

const empresas = ref([])
const busqueda = ref('')
const empresaSeleccionada = ref(null)
const formEditar = ref({})

const todosModulos = [
  { clave: 'pos',          label: 'POS',           icono: '🛒' },
  { clave: 'inventario',   label: 'Inventario',    icono: '📦' },
  { clave: 'facturacion',  label: 'Facturación',  icono: '🧾' },
  { clave: 'ventas',       label: 'Ventas',        icono: '📊' },
  { clave: 'compras',      label: 'Compras',       icono: '🛍️' },
  { clave: 'rrhh',         label: 'RRHH',          icono: '👥' },
  { clave: 'contabilidad', label: 'Contabilidad',  icono: '📒' },
  { clave: 'clinica',      label: 'Clínica',       icono: '🏥' },
]

const empresasFiltradas = computed(() =>
  empresas.value.filter(e =>
    e.name.toLowerCase().includes(busqueda.value.toLowerCase()) ||
    (e.ruc && e.ruc.includes(busqueda.value)) ||
    e.subdomain.toLowerCase().includes(busqueda.value.toLowerCase())
  )
)

function badgeSuscripcion(t) {
  if (t.is_expired) return 'badge badge-danger'
  if (t.subscription_status === 'suspendida' || !t.active) return 'badge badge-danger'
  if (t.subscription_status === 'demo') return 'badge badge-warning'
  return 'badge badge-success'
}

function labelSuscripcion(t) {
  if (t.is_expired) return '⚠️ VENCIDA'
  if (t.subscription_status === 'suspendida' || !t.active) return '🔴 SUSPENDIDA'
  if (t.subscription_status === 'demo') return '🟡 DEMO'
  return '🟢 ACTIVA'
}

async function cargar() {
  const { data } = await api.get('/superadmin/tenants/')
  empresas.value = data
}

function verDetalle(tenant) {
  empresaSeleccionada.value = { ...tenant }
  formEditar.value = {
    name: tenant.name,
    ruc: tenant.ruc || '',
    email_contacto: tenant.email_contacto || '',
    telefono_contacto: tenant.telefono_contacto || '',
    subscription_status: tenant.subscription_status || 'activa',
    expiration_date: tenant.expiration_date || '',
    admin_email: tenant.admin_email || tenant.email_contacto || '',
    admin_password: '',
    max_devices: tenant.max_devices || 1,
  }
}

async function toggleEmpresa(tenant) {
  const estaSuspendida = tenant.subscription_status === 'suspendida' || !tenant.active
  const nuevoEstado = estaSuspendida ? 'activa' : 'suspendida'
  const { data } = await api.put(`/superadmin/tenants/${tenant.id}/`, {
    subscription_status: nuevoEstado
  })
  const idx = empresas.value.findIndex(e => e.id === tenant.id)
  if (idx !== -1) empresas.value[idx] = data
}

async function toggleModulo(tenantId, modulo, activar) {
  const { data } = await api.post(`/superadmin/tenants/${tenantId}/modules/${modulo}/`, { activar })
  empresaSeleccionada.value = data
  const idx = empresas.value.findIndex(e => e.id === tenantId)
  if (idx !== -1) empresas.value[idx] = data
}

async function guardarEdicion() {
  const { data } = await api.put(`/superadmin/tenants/${empresaSeleccionada.value.id}/`, formEditar.value)
  const idx = empresas.value.findIndex(e => e.id === data.id)
  if (idx !== -1) empresas.value[idx] = data
  empresaSeleccionada.value = null
}

onMounted(cargar)
</script>

<style scoped>
.modules-wrap { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.modulo-tag {
  font-size: 0.7rem; padding: 0.15rem 0.5rem;
  background: #e3f2fd; color: #1976D2;
  border-radius: 20px; font-weight: 600;
}
.modules-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem;
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
