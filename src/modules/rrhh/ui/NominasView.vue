<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; gap: 0.5rem; flex-wrap: wrap;">
      <div class="page-header">
        <div>
        <h1 class="page-title" style="margin:0">Nóminas</h1>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-outline" @click="abrirGeneradorMasivo">⚡ Generación Masiva</button>
        <button class="btn btn-primary" @click="abrirGenerador">+ Generar Individual</button>
      </div>
    </div>

    <div class="card table-card">
      <div class="table-responsive">
        <table class="table modern-table">
          <thead>
          <tr>
            <th>Empleado</th>
            <th>Período</th>
            <th>Salario Base</th>
            <th>Bonos</th>
            <th>Deducciones</th>
            <th>IESS Pers. (9.45%)</th>
            <th>Décimo 3ro</th>
            <th>Décimo 4to</th>
            <th>Fondos Reserva</th>
            <th>Neto a Recibir</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in nominas" :key="n.id">
            <td>{{ n.employee_name }}</td>
            <td>{{ n.period_start }} a {{ n.period_end }}</td>
            <td>{{ parametrosStore.company.simbolo }}{{ parseFloat(n.base_salary).toFixed(2) }}</td>
            <td>{{ parametrosStore.company.simbolo }}{{ parseFloat(n.bonuses).toFixed(2) }}</td>
            <td>{{ parametrosStore.company.simbolo }}{{ parseFloat(n.deductions).toFixed(2) }}</td>
            <td style="color:#e74c3c;">{{ parametrosStore.company.simbolo }}{{ parseFloat(n.iess_personal).toFixed(2) }}</td>
            <td style="color:#27ae60;">
              {{ parseFloat(n.thirteenth_salary) > 0 ? (parametrosStore.company.simbolo + parseFloat(n.thirteenth_salary).toFixed(2)) : 'Acumula' }}
            </td>
            <td style="color:#27ae60;">
              {{ parseFloat(n.fourteenth_salary) > 0 ? (parametrosStore.company.simbolo + parseFloat(n.fourteenth_salary).toFixed(2)) : 'Acumula' }}
            </td>
            <td style="color:#27ae60;">
              {{ parseFloat(n.reserve_funds) > 0 ? (parametrosStore.company.simbolo + parseFloat(n.reserve_funds).toFixed(2)) : 'Acumula' }}
            </td>
            <td><strong>{{ parametrosStore.company.simbolo }}{{ parseFloat(n.net_salary).toFixed(2) }}</strong></td>
            <td><span :class="badgeEstado(n.status)">{{ n.status }}</span></td>
            <td>
              <button v-if="n.status === 'draft' || n.status === 'borrador'" class="btn btn-success" style="padding:0.25rem 0.75rem; font-size:0.8rem" @click="aprobar(n.id)">Aprobar</button>
            </td>
          </tr>
          <tr v-if="!nominas.length">
            <td colspan="12" style="text-align:center; color:var(--text-muted)">Sin nóminas</td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para generar nómina individual -->
    <div v-if="mostrarForm" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1rem">Generar Nómina Individual</h3>
        <div style="display:grid; grid-template-columns:1fr; gap:0.75rem;">
          <div class="form-group">
            <label>Empleado *</label>
            <select v-model="form.empleado_id" class="input">
              <option value="" disabled>Seleccione un employee...</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                {{ emp.name }} ({{ emp.position }} - {{ parametrosStore.company.simbolo }}{{ emp.salary }})
              </option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label>Período Inicio *</label>
              <input v-model="form.period_start" type="date" class="input" />
            </div>
            <div class="form-group">
              <label>Período Fin *</label>
              <input v-model="form.period_end" type="date" class="input" />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label>Bonos / Horas Extras</label>
              <input v-model="form.bonuses" type="number" step="0.01" class="input" />
            </div>
            <div class="form-group">
              <label>Préstamos / Deducciones</label>
              <input v-model="form.deductions" type="number" step="0.01" class="input" />
            </div>
          </div>
        </div>
        <p v-if="error" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem;">{{ error }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardar">Generar</button>
        </div>
      </div>
    </div>

    <!-- Modal para generar nómina masiva -->
    <div v-if="mostrarFormMasivo" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1rem">Generación Masiva de Nóminas</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          Genera automáticamente las pre-nóminas para todos los employees activos o filtra por puesto/departamento. No se duplicarán si ya existen para el mismo período.
        </p>
        <div style="display:grid; grid-template-columns:1fr; gap:0.75rem;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label>Período Inicio *</label>
              <input v-model="formMasivo.period_start" type="date" class="input" />
            </div>
            <div class="form-group">
              <label>Período Fin *</label>
              <input v-model="formMasivo.period_end" type="date" class="input" />
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label>Filtrar por Puesto (ej: Cajero)</label>
              <input v-model="formMasivo.position" type="text" placeholder="Todos los puestos si queda vacío" class="input" />
            </div>
            <div class="form-group">
              <label>Filtrar por Departamento</label>
              <input v-model="formMasivo.department" type="text" placeholder="Todos los departamentos si vacío" class="input" />
            </div>
          </div>
        </div>
        <p v-if="errorMasivo" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem;">{{ errorMasivo }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarFormMasivo = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarMasivo" :disabled="guardandoMasivo">
            {{ guardandoMasivo ? 'Generando...' : '⚡ Generar Roles' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../../shared/api'
import { useParametrosStore } from '../../../stores/parametros'

const parametrosStore = useParametrosStore()

const nominas = ref([])
const employees = ref([])
const mostrarForm = ref(false)
const mostrarFormMasivo = ref(false)
const error = ref('')
const errorMasivo = ref('')
const guardandoMasivo = ref(false)

const form = ref({
  empleado_id: '',
  period_start: '',
  period_end: '',
  bonuses: 0,
  deductions: 0
})

const formMasivo = ref({
  period_start: '',
  period_end: '',
  position: '',
  department: ''
})

const badgeEstado = (e) => ({
  draft: 'badge badge-secondary', 
  aprobada: 'badge badge-info', 
  pagada: 'badge badge-success'
}[e] || 'badge badge-secondary')

onMounted(async () => {
  await cargarNominas()
})

async function cargarNominas() {
  const { data } = await api.get('/rrhh/payrolls/')
  nominas.value = data
}

async function abrirGenerador() {
  error.value = ''
  form.value = {
    empleado_id: '',
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    bonuses: 0,
    deductions: 0
  }
  
  try {
    const { data } = await api.get('/rrhh/employees/')
    employees.value = data
    if (employees.value.length === 0) {
      error.value = 'Primero registre employees en la pestaña Empleados'
    }
  } catch (e) {
    error.value = 'Error al cargar lista de employees'
  }
  
  mostrarForm.value = true
}

async function abrirGeneradorMasivo() {
  errorMasivo.value = ''
  formMasivo.value = {
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    position: '',
    department: ''
  }
  mostrarFormMasivo.value = true
}

async function guardar() {
  error.value = ''
  if (!form.value.empleado_id || !form.value.period_start || !form.value.period_end) {
    error.value = 'Empleado y períodos son obligatorios'
    return
  }
  try {
    await api.post('/rrhh/payrolls/', form.value)
    await cargarNominas()
    mostrarForm.value = false
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al generar nómina'
  }
}

async function guardarMasivo() {
  errorMasivo.value = ''
  if (!formMasivo.value.period_start || !formMasivo.value.period_end) {
    errorMasivo.value = 'Los períodos de inicio y fin son obligatorios'
    return
  }
  guardandoMasivo.value = true
  try {
    const { data } = await api.post('/rrhh/payrolls/generate-mass/', formMasivo.value)
    alert(`Proceso completado. Se generaron ${data.generados} roles de pago con éxito.`)
    await cargarNominas()
    mostrarFormMasivo.value = false
  } catch (e) {
    errorMasivo.value = e.response?.data?.error || 'Error al ejecutar generación masiva'
  } finally {
    guardandoMasivo.value = false
  }
}

async function aprobar(id) {
  try {
    await api.post(`/rrhh/payrolls/${id}/approve/`)
    await cargarNominas()
  } catch (e) {
    alert(e.response?.data?.error || 'Error al aprobar nómina')
  }
}
</script>

<style scoped>
.page-title {
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.table-card {
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 900px;
}
.modern-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 1rem 1.25rem;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}
.modern-table td {
  padding: 1rem 1.25rem;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}
.modern-table tbody tr:hover td {
  background: #f8fafc;
}
.modern-table tbody tr:last-child td {
  border-bottom: none;
}
</style>
