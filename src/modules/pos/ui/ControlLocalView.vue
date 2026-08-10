<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h1 class="page-title" style="margin:0">🏢 Control de Local y Cajas</h1>
        <p style="color:var(--text-muted); font-size:0.875rem; margin-top:0.25rem;">
          Estandariza los nombres de registers físicas, sucursales y personal asignado para cierres y reportes impecables.
        </p>
      </div>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="tabs-header" style="display:flex; gap:0.5rem; margin-bottom:1.5rem; border-bottom:2px solid var(--border);">
      <button
        :class="['tab-btn', tabActiva === 'registers' ? 'is_active' : '']"
        @click="tabActiva = 'registers'"
      >
        🖥️ Cajas Físicas Registradas
      </button>
      <button
        :class="['tab-btn', tabActiva === 'locales' ? 'is_active' : '']"
        @click="tabActiva = 'locales'"
      >
        🏢 Locales / Sucursales
      </button>
      <button
        :class="['tab-btn', tabActiva === 'personal' ? 'is_active' : '']"
        @click="tabActiva = 'personal'"
      >
        👥 Personal Registrado
      </button>
    </div>

    <!-- PESTAÑA 1: CAJAS FÍSICAS REGISTRADAS -->
    <div v-if="tabActiva === 'registers'">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2 style="font-size:1.1rem; font-weight:700; margin:0;">Catálogo de Cajas Físicas</h2>
        <button v-if="esAdmin" class="btn btn-primary" @click="abrirNuevaCaja()">+ Registrar Nueva Caja</button>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre de Caja Estandarizado</th>
              <th>Sucursal / Local</th>
              <th>Estado</th>
              <th v-if="esAdmin">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in cajasRegistradas" :key="c.id">
              <td><strong style="font-family:monospace;">{{ c.code }}</strong></td>
              <td><strong style="color:var(--color-primario);">{{ c.name }}</strong></td>
              <td>{{ obtenerNombreSucursal(c.branch_id) }}</td>
              <td>
                <span :class="c.active ? 'badge badge-success' : 'badge badge-secondary'">
                  {{ c.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td v-if="esAdmin">
                <button class="btn btn-outline btn-sm" style="padding:0.15rem 0.4rem; font-size:0.75rem; margin-right: 0.25rem;" @click="editarCaja(c)">
                  ✎ Editar
                </button>
                <button class="btn btn-danger btn-sm" style="padding:0.15rem 0.4rem; font-size:0.75rem;" @click="eliminarCaja(c.id)">
                  ✕ Eliminar
                </button>
              </td>
            </tr>
            <tr v-if="!cajasRegistradas.length">
              <td colspan="5" style="text-align:center; color:var(--text-muted); padding:2rem;">
                No hay registers físicas registradas aún. ¡Crea la primera para estandarizar la opening en el POS!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PESTAÑA 2: LOCALES / SUCURSALES -->
    <div v-if="tabActiva === 'locales'">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2 style="font-size:1.1rem; font-weight:700; margin:0;">Locales y Sucursales</h2>
        <button v-if="esAdmin" class="btn btn-primary" @click="abrirNuevoLocal">+ Nueva Sucursal</button>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Establecimiento</th>
              <th>Nombre del Local</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th v-if="esAdmin">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sucursales" :key="s.id">
              <td><strong style="font-family:monospace;">{{ s.establishment }}</strong></td>
              <td><strong>{{ s.name }}</strong></td>
              <td>{{ s.address || 'Sin dirección registrada' }}</td>
              <td>
                <span :class="s.active ? 'badge badge-success' : 'badge badge-secondary'">
                  {{ s.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td v-if="esAdmin">
                <button class="btn btn-outline btn-sm" style="padding:0.15rem 0.4rem; font-size:0.75rem; margin-right: 0.25rem;" @click="editarLocal(s)">
                  ✎ Editar
                </button>
                <button class="btn btn-danger btn-sm" style="padding:0.15rem 0.4rem; font-size:0.75rem;" @click="eliminarLocal(s.id)">
                  ✕ Eliminar
                </button>
              </td>
            </tr>
            <tr v-if="!sucursales.length">
              <td colspan="4" style="text-align:center; color:var(--text-muted); padding:2rem;">
                Sin sucursales registradas.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PESTAÑA 3: PERSONAL REGISTRADO -->
    <div v-if="tabActiva === 'personal'">
      <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:1rem;">Cajeros y Personal Habilitado</h2>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Puesto / Cargo</th>
              <th>Email</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in employees" :key="e.id">
              <td><strong>{{ e.name }}</strong></td>
              <td><span class="badge badge-info">{{ e.position || 'Cajero' }}</span></td>
              <td>{{ e.email || '-' }}</td>
              <td>
                <span :class="e.active ? 'badge badge-success' : 'badge badge-secondary'">
                  {{ e.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
            </tr>
            <tr v-if="!employees.length">
              <td colspan="4" style="text-align:center; color:var(--text-muted); padding:2rem;">
                Sin employees registrados en RRHH.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL NUEVA CAJA REGISTRADA -->
    <div v-if="mostrarModalCaja" class="modal-overlay">
      <div class="modal" style="max-width:450px;">
        <h3 style="margin-bottom:1rem;">Registrar Nueva Caja Física</h3>

        <div class="form-group">
          <label>Código Auto-generado</label>
          <input :value="formCaja.code" class="input" readonly
            style="background:var(--bg-card); border-color:var(--border-color); font-family:monospace; font-weight:600; color:var(--color-primario);" />
        </div>

        <div class="form-group">
          <label class="label">Nombre de la Caja</label>
          <input v-model="formCaja.name" class="input" placeholder="Ej: Caja Principal Matriz" />
        </div>

        <div class="form-group">
          <label class="label">Sucursal Asignada</label>
          <select v-model="formCaja.branch_id" class="input">
            <option :value="null">Todas las sucursales / Matriz</option>
            <option v-for="s in sucursales" :key="s.id" :value="s.id">
              {{ s.name }} ({{ s.establishment }})
            </option>
          </select>
        </div>

        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.5rem;">
          <button class="btn btn-outline" @click="mostrarModalCaja = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarCaja" :disabled="guardandoCaja || !formCaja.name.trim()">
            {{ guardandoCaja ? 'Guardando...' : 'Guardar Caja' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA SUCURSAL -->
    <div v-if="mostrarModalLocal" class="modal-overlay">
      <div class="modal" style="max-width:450px;">
        <h3 style="margin-bottom:1rem;">Nueva Sucursal / Local</h3>

        <div class="form-group">
          <label>Nombre del Local *</label>
          <input v-model="formLocal.name" class="input" placeholder="Ej: Sucursal Cumbayá" />
        </div>

        <div class="form-group">
          <label>Nº Establecimiento SRI (ej: 001, 002) *</label>
          <input v-model="formLocal.establecimiento" class="input" placeholder="002" />
        </div>

        <div class="form-group">
          <label>Dirección del Local</label>
          <input v-model="formLocal.address" class="input" placeholder="Av. Interoceánica km 12" />
        </div>

        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.5rem;">
          <button class="btn btn-outline" @click="mostrarModalLocal = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarLocal" :disabled="guardandoLocal">
            {{ guardandoLocal ? 'Guardando...' : 'Guardar Local' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../../shared/api'
import { useAlert } from '../../../composables/useAlert'
import { useAuthStore } from '../../../stores/auth'

const { showAlert } = useAlert()
const authStore = useAuthStore()
const esAdmin = computed(() => ['admin', 'superadmin'].includes(authStore.rol))

const tabActiva = ref('registers')

const cajasRegistradas = ref([])
const sucursales = ref([])
const employees = ref([])

const mostrarModalCaja = ref(false)
const guardandoCaja = ref(false)
const formCaja = ref({ code: '', name: '', branch_id: null })

function abrirNuevaCaja() {
  const code = 'CJ-' + String(cajasRegistradas.value.length + 1).padStart(3, '0')
  const name = 'Turno de Caja #' + (cajasRegistradas.value.length + 1)
  formCaja.value = { code, name, branch_id: null, id: null }
  mostrarModalCaja.value = true
}

function editarCaja(register) {
  formCaja.value = { ...register }
  mostrarModalCaja.value = true
}

const mostrarModalLocal = ref(false)
const guardandoLocal = ref(false)
const formLocal = ref({ name: '', establecimiento: '001', address: '', id: null })

function abrirNuevoLocal() {
  formLocal.value = { name: '', establecimiento: '001', address: '', id: null }
  mostrarModalLocal.value = true
}

function editarLocal(local) {
  formLocal.value = { id: local.id, name: local.name, establecimiento: local.establishment, address: local.address, active: local.active }
  mostrarModalLocal.value = true
}

onMounted(async () => {
  await cargarDatos()
})

async function cargarDatos() {
  try {
    const [resCajas, resSuc, resEmp] = await Promise.allSettled([
      api.get('/pos/physical-cash-registers/'),
      api.get('/inventario/branches/'),
      api.get('/rrhh/employees/')
    ])
    if (resCajas.status === 'fulfilled') cajasRegistradas.value = resCajas.value.data
    if (resSuc.status === 'fulfilled') sucursales.value = resSuc.value.data
    if (resEmp.status === 'fulfilled') employees.value = resEmp.value.data
  } catch (e) {
    console.error(e)
  }
}

function obtenerNombreSucursal(sucursalId) {
  if (!sucursalId) return 'Matriz / Todas'
  const suc = sucursales.value.find(s => s.id === sucursalId)
  return suc ? `${suc.name} (${suc.establishment})` : 'Matriz'
}

async function guardarCaja() {
  if (!formCaja.value.name.trim()) {
    await showAlert({ type: 'warning', title: 'Campo requerido', message: 'El name de la register es obligatorio.' })
    return
  }
  guardandoCaja.value = true
  try {
    if (formCaja.value.id) {
      await api.put(`/pos/physical-cash-registers/${formCaja.value.id}/`, formCaja.value)
    } else {
      await api.post('/pos/physical-cash-registers/', formCaja.value)
    }
    await cargarDatos()
    mostrarModalCaja.value = false
    formCaja.value = { code: '', name: '', branch_id: null, id: null }
  } catch (e) {
    await showAlert({ type: 'error', title: 'Error al guardar', message: e.response?.data?.error || 'No se pudo guardar la register registrada.' })
  } finally {
    guardandoCaja.value = false
  }
}

async function eliminarCaja(id) {
  const confirmado = await showAlert({ type: 'confirm', title: '¿Eliminar register?', message: 'Esta acción eliminará la register predefinida permanentemente. ¿Deseas continuar?' })
  if (!confirmado) return
  try {
    await api.delete(`/pos/physical-cash-registers/${id}/`)
    await cargarDatos()
  } catch (e) {
    await showAlert({ type: 'error', title: 'Error al eliminar', message: e.response?.data?.error || 'No se pudo eliminar la register.' })
  }
}

async function guardarLocal() {
  if (!formLocal.value.name || !formLocal.value.establecimiento) {
    await showAlert({ type: 'warning', title: 'Campos requeridos', message: 'El name del local y el número de establecimiento son obligatorios.' })
    return
  }
  guardandoLocal.value = true
  try {
    if (formLocal.value.id) {
      await api.put(`/inventory/branches/${formLocal.value.id}/`, formLocal.value)
    } else {
      await api.post('/inventario/branches/', formLocal.value)
    }
    await cargarDatos()
    mostrarModalLocal.value = false
    formLocal.value = { name: '', establecimiento: '001', address: '', id: null }
  } catch (e) {
    await showAlert({ type: 'error', title: 'Error al guardar', message: e.response?.data?.error || 'No se pudo guardar la branch.' })
  } finally {
    guardandoLocal.value = false
  }
}

async function eliminarLocal(id) {
  const confirmado = await showAlert({ type: 'confirm', title: '¿Eliminar Sucursal?', message: 'Esta acción eliminará la branch permanentemente. ¿Deseas continuar?' })
  if (!confirmado) return
  try {
    await api.delete(`/inventory/branches/${id}/`)
    await cargarDatos()
  } catch (e) {
    await showAlert({ type: 'error', title: 'Error al eliminar', message: e.response?.data?.error || 'No se pudo eliminar la branch.' })
  }
}
</script>

<style scoped>
.tab-btn {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn.is_active {
  border-bottom-color: var(--color-primario);
  color: var(--color-primario);
}
.tab-btn:hover:not(.is_active) {
  color: var(--text);
}
</style>

