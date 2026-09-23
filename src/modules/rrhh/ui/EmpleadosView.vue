<template>
  <div>
    <div class="page-header">
      <h1 class="page-title" style="margin:0">Empleados</h1>
      <div style="display:flex; gap:0.5rem">
        <button class="btn btn-outline" @click="mostrarFormPuestos = true">⚙️ Gestionar Puestos</button>
        <button class="btn btn-primary" @click="abrirCrear">+ Nuevo Empleado</button>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Puesto</th>
            <th>Departamento</th>
            <th>PIN Caja</th>
            <th>Salario</th>
            <th>Contrato</th>
            <th>Antigüedad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in employees" :key="e.id">
            <td>{{ e.name }}</td>
            <td>{{ e.position }}</td>
            <td>{{ e.department }}</td>
            <td><strong style="font-family:monospace; color:var(--color-primario)">{{ e.pin_caja ? '••••' : 'Sin PIN' }}</strong></td>
            <td>{{ parametrosStore.company.simbolo }}{{ e.salary }}</td>
            <td>{{ e.contract_type }}</td>
            <td>{{ e.tenure_years }} años</td>
            <td>
              <div style="display:flex; gap:0.25rem; align-items:center">
                <button class="btn btn-sm btn-outline" @click="abrirEditar(e)" title="Editar Empleado">⚙️ Editar</button>
                <button class="btn btn-sm btn-outline" @click="form = {...e}; abrirDependientes()" title="Cargas Familiares">👨‍👩‍👧 Cargas</button>
                <button class="btn btn-sm btn-outline" @click="form = {...e}; abrirPrestamos()" title="Préstamos y Anticipos">💰 Préstamos</button>
                <button class="btn btn-sm btn-outline" @click="form = {...e}; abrirHistorialSalarial()" title="Historial de Sueldos">📈 Sueldos</button>
                <button class="btn btn-sm btn-outline" style="color:#e74c3c; border-color:#e74c3c;" @click="eliminar(e)" title="Eliminar Empleado">🗑️</button>
              </div>
            </td>
          </tr>
          <tr v-if="!employees.length">
            <td colspan="8" style="text-align:center; color:var(--text-muted)">Sin employees</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarForm" class="modal-overlay">
      <div class="modal">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border)">
          <h2 class="modal-title" style="margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.4rem">
            <span style="font-size:1.8rem">🧑‍💼</span> {{ modoEditar ? 'Editar Empleado' : 'Nuevo Empleado' }}
          </h2>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
          <div class="form-group"><label>Nombre *</label><input v-model="form.name" class="input" /></div>
          <div class="form-group"><label>Email</label><input v-model="form.email" type="email" class="input" /></div>
          <div class="form-group">
            <label>Puesto *</label>
            <select v-model="form.position" class="input">
              <option value="" disabled>Seleccione un puesto...</option>
              <option v-for="p in puestos" :key="p.id" :value="p.name">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group"><label>Departamento</label><input v-model="form.department" class="input" /></div>
          <div class="form-group"><label>Salario *</label><input v-model="form.salary" type="number" class="input" /></div>
          <div class="form-group"><label>Fecha Ingreso</label><input v-model="form.hire_date" type="date" class="input" /></div>
          <div class="form-group"><label>Tipo Contrato</label>
            <select v-model="form.contract_type" class="input">
              <option value="tiempo_completo">Tiempo Completo</option>
              <option value="medio_tiempo">Medio Tiempo</option>
              <option value="honorarios">Honorarios</option>
            </select>
          </div>
          <div class="form-group"><label>🔑 PIN / Clave de Caja (ej: 1234)</label><input v-model="form.pin_caja" type="password" class="input" placeholder="Clave personal POS" /></div>
          
          <div style="grid-column:1/-1; margin-top:0.5rem; border-top:1px solid var(--border); padding-top:1rem;">
            <label class="checkbox-container" style="font-weight:600; color:var(--color-primario);">
              <input type="checkbox" v-model="form.has_iess"> Posee Seguro (IESS)
            </label>
          </div>
          
          <div v-if="form.has_iess" style="grid-column:1/-1; display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; background:var(--bg-secundario); padding:1rem; border-radius:8px;">
            <label class="checkbox-container">
              <input type="checkbox" v-model="form.accumulates_13th"> Acumula Décimo Tercero
            </label>
            <label class="checkbox-container">
              <input type="checkbox" v-model="form.accumulates_14th"> Acumula Décimo Cuarto
            </label>
            <div class="form-group" style="grid-column:1/-1; margin-bottom:0; display:flex; gap: 0.5rem; justify-content:space-between; align-items:center;">
              <div>
                <label style="margin-bottom:0">Cargas Familiares</label>
                <div style="font-size:0.85rem; color:var(--text-muted)">Cargas válidas: <strong>{{ form.active_dependents_count || 0 }}</strong></div>
              </div>
              <div>
                <button type="button" class="btn btn-sm btn-outline" @click="abrirDependientes" :disabled="!form.id">Gestionar Familiares</button>
              </div>
            </div>
            
            <div class="form-group" style="grid-column:1/-1; margin-bottom:0; display:flex; gap: 0.5rem; justify-content:flex-end; align-items:center; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
               <button type="button" class="btn btn-sm btn-outline" @click="abrirHistorialSalarial" :disabled="!form.id">Historial de Sueldos</button>
               <button type="button" class="btn btn-sm btn-outline" @click="abrirPrestamos" :disabled="!form.id">Préstamos / Anticipos</button>
            </div>
          </div>
        </div>
        <p v-if="error" style="color:#e74c3c; font-size:0.85rem">{{ error }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardar">Guardar</button>
        </div>
      </div>
    </div>
    <div v-if="mostrarFormPuestos" class="modal-overlay">
      <div class="modal">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
          <h3 style="margin:0">Puestos de Trabajo</h3>
          <button class="btn btn-outline" @click="mostrarFormPuestos = false; cargarPuestos()">Cerrar</button>
        </div>
        
        <div style="display:flex; gap:0.5rem; margin-bottom:1rem; align-items:center">
          <input v-model="formPuesto.name" class="input" placeholder="Nuevo puesto..." @keyup.enter="guardarPuesto" />
          <button class="btn btn-primary" @click="guardarPuesto" :disabled="!formPuesto.name.trim()">{{ formPuesto.id ? 'Actualizar' : 'Agregar' }}</button>
          <button v-if="formPuesto.id" class="btn btn-outline" @click="formPuesto={id:null, name:'', active:true}">X</button>
        </div>

        <table class="table" style="font-size:0.9rem">
          <thead>
            <tr>
              <th>Puesto</th>
              <th style="width:100px; text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in puestos" :key="p.id">
              <td>{{ p.name }}</td>
              <td style="text-align:right">
                <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.4rem; font-size:0.75rem; margin-right:0.25rem" @click="formPuesto = {...p}">✏️</button>
                <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.4rem; font-size:0.75rem; color:#e74c3c; border-color:#e74c3c" @click="eliminarPuesto(p.id)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!puestos.length">
              <td colspan="2" style="text-align:center; color:var(--text-muted)">No hay puestos configurados</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="mostrarDependientes" class="modal-overlay">
      <div class="modal" style="max-width:800px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border)">
          <h2 class="modal-title" style="margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.4rem">
            <span style="font-size:1.8rem">👨‍👩‍👧</span> Cargas Familiares: <span style="color:var(--color-primario)">{{ form.name }}</span>
          </h2>
          <button class="btn btn-outline" style="border-radius:50px; padding:0.4rem 1rem" @click="cerrarDependientes">Cerrar</button>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; margin-bottom:1rem; align-items:end">
          <div class="form-group" style="margin:0"><label>Nombres Completos</label><input v-model="formDep.full_name" class="input" /></div>
          <div class="form-group" style="margin:0"><label>Cédula</label><input v-model="formDep.identification" class="input" /></div>
          <div class="form-group" style="margin:0"><label>Parentesco</label>
            <select v-model="formDep.relationship" class="input">
              <option value="hijo">Hijo/a</option>
              <option value="conyuge">Cónyuge</option>
              <option value="padre">Padre/Madre</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group" style="margin:0"><label>Fecha Nacimiento</label><input v-model="formDep.birth_date" type="date" class="input" /></div>
          <label class="checkbox-container" style="margin-bottom:0.5rem"><input type="checkbox" v-model="formDep.has_disability"> Tiene Discapacidad</label>
          <div style="text-align:right">
            <button class="btn btn-outline" style="margin-right:0.25rem" v-if="formDep.id" @click="resetFormDep">X</button>
            <button class="btn btn-primary" @click="guardarDependiente" :disabled="!formDep.full_name || !formDep.birth_date">
              {{ formDep.id ? 'Actualizar' : 'Agregar Familiar' }}
            </button>
          </div>
        </div>

        <table class="table" style="font-size:0.85rem">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Parentesco</th>
              <th>Edad</th>
              <th>Carga Válida</th>
              <th style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in dependientes" :key="d.id" :style="{ opacity: d.active ? 1 : 0.5 }">
              <td>
                {{ d.full_name }}
                <span v-if="d.has_disability" title="Discapacidad" style="cursor:help">♿</span>
              </td>
              <td>{{ d.identification }}</td>
              <td style="text-transform:capitalize">{{ d.relationship }}</td>
              <td>{{ d.age }} años</td>
              <td>
                <span v-if="d.is_valid_carga" style="color:#2ecc71; font-weight:bold">✓ Sí</span>
                <span v-else style="color:#e74c3c">✗ No</span>
              </td>
              <td style="text-align:right">
                <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.4rem; margin-right:0.25rem" @click="formDep = {...d}">✏️</button>
                <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.4rem; color:#e74c3c; border-color:#e74c3c" @click="eliminarDependiente(d.id)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!dependientes.length">
              <td colspan="6" style="text-align:center; color:var(--text-muted)">Sin familiares registrados</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Historial Salarial Modal -->
    <div v-if="mostrarHistorial" class="modal-overlay">
      <div class="modal">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border)">
          <h2 class="modal-title" style="margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.4rem">
            <span style="font-size:1.8rem">📈</span> Historial de Sueldos: <span style="color:var(--color-primario)">{{ form.name }}</span>
          </h2>
          <button class="btn btn-outline" style="border-radius:50px; padding:0.4rem 1rem" @click="mostrarHistorial = false">Cerrar</button>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          Este historial se genera automáticamente cuando se edita el sueldo base del empleado en su perfil.
        </p>
        <table class="table" style="font-size:0.85rem">
          <thead>
            <tr>
              <th>Fecha Cambio</th>
              <th>Sueldo Anterior</th>
              <th>Nuevo Sueldo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in historialSalarial" :key="h.id">
              <td>{{ h.change_date }}</td>
              <td style="color:#e74c3c">${{ h.old_salary }}</td>
              <td style="color:#2ecc71; font-weight:bold">${{ h.new_salary }}</td>
            </tr>
            <tr v-if="!historialSalarial.length">
              <td colspan="3" style="text-align:center; color:var(--text-muted)">No hay historial de cambios</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Préstamos Modal -->
    <div v-if="mostrarPrestamos" class="modal-overlay">
      <div class="modal" style="max-width:800px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border)">
          <h2 class="modal-title" style="margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.4rem">
            <span style="font-size:1.8rem">💰</span> Préstamos y Anticipos: <span style="color:var(--color-primario)">{{ form.name }}</span>
          </h2>
          <button class="btn btn-outline" style="border-radius:50px; padding:0.4rem 1rem" @click="mostrarPrestamos = false">Cerrar</button>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; margin-bottom:1rem; align-items:end">
          <div class="form-group" style="margin:0"><label>Tipo de Préstamo</label>
            <select v-model="formPrestamo.type" class="input">
              <option value="biess">Préstamo BIESS</option>
              <option value="interno">Préstamo Interno (Anticipo)</option>
            </select>
          </div>
          <div class="form-group" style="margin:0"><label>Monto Total ($)</label><input v-model="formPrestamo.total_amount" type="number" step="0.01" class="input" /></div>
          <div class="form-group" style="margin:0"><label>Cuota Mensual ($)</label><input v-model="formPrestamo.monthly_installment" type="number" step="0.01" class="input" /></div>
          <div class="form-group" style="margin:0"><label>Fecha Inicio (Descuento)</label><input v-model="formPrestamo.start_date" type="date" class="input" /></div>
          <label class="checkbox-container" style="margin-bottom:0.5rem"><input type="checkbox" v-model="formPrestamo.active"> Está Activo</label>
          <div style="text-align:right">
            <button class="btn btn-outline" style="margin-right:0.25rem" v-if="formPrestamo.id" @click="resetFormPrestamo">X</button>
            <button class="btn btn-primary" @click="guardarPrestamo" :disabled="!formPrestamo.total_amount || !formPrestamo.start_date">
              {{ formPrestamo.id ? 'Actualizar' : 'Agregar Préstamo' }}
            </button>
          </div>
        </div>

        <table class="table" style="font-size:0.85rem">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Inicio</th>
              <th>Total</th>
              <th>Cuota Mensual</th>
              <th>Estado</th>
              <th style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in prestamos" :key="p.id" :style="{ opacity: p.active ? 1 : 0.5 }">
              <td style="text-transform:capitalize">{{ p.type }}</td>
              <td>{{ p.start_date }}</td>
              <td>${{ p.total_amount }}</td>
              <td style="color:#e74c3c">-${{ p.monthly_installment }}</td>
              <td>
                <span v-if="p.active" style="color:#2ecc71; font-weight:bold">Activo</span>
                <span v-else style="color:var(--text-muted)">Pagado / Inactivo</span>
              </td>
              <td style="text-align:right">
                <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.4rem; margin-right:0.25rem" @click="formPrestamo = {...p}">✏️</button>
                <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.4rem; color:#e74c3c; border-color:#e74c3c" @click="eliminarPrestamo(p.id)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!prestamos.length">
              <td colspan="6" style="text-align:center; color:var(--text-muted)">No hay préstamos activos</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../../shared/api'
import { useParametrosStore } from '../../../stores/parametros'

const parametrosStore = useParametrosStore()

const employees = ref([])
const puestos = ref([])
const mostrarForm = ref(false)
const mostrarFormPuestos = ref(false)
const mostrarDependientes = ref(false)
const mostrarHistorial = ref(false)
const mostrarPrestamos = ref(false)
const modoEditar = ref(false)
const error = ref('')
const dependientes = ref([])
const historialSalarial = ref([])
const prestamos = ref([])
const form = ref({ id: null, name: '', email: '', position: '', department: 'General', salary: 0, hire_date: '', contract_type: 'tiempo_completo', pin_caja: '', has_iess: false, accumulates_13th: true, accumulates_14th: true, active_dependents_count: 0 })
const formPuesto = ref({ id: null, name: '', active: true })
const formDep = ref({ id: null, full_name: '', identification: '', relationship: 'hijo', birth_date: '', has_disability: false, active: true })
const formPrestamo = ref({ id: null, type: 'interno', total_amount: 0, monthly_installment: 0, start_date: '', active: true })

async function cargarEmpleados() {
  const { data } = await api.get('/rrhh/employees/')
  employees.value = data
}

async function cargarPuestos() {
  const { data } = await api.get('/rrhh/positions/')
  puestos.value = data
}

onMounted(async () => {
  await cargarPuestos()
  await cargarEmpleados()
})

function abrirCrear() {
  modoEditar.value = false
  error.value = ''
  form.value = {
    id: null,
    name: '',
    email: '',
    position: '',
    department: 'General',
    salary: 0,
    hire_date: '',
    contract_type: 'tiempo_completo',
    pin_caja: '',
    has_iess: false,
    accumulates_13th: true,
    accumulates_14th: true,
    active_dependents_count: 0
  }
  mostrarForm.value = true
}

function abrirEditar(e) {
  modoEditar.value = true
  error.value = ''
  form.value = {
    id: e.id,
    name: e.name,
    email: e.email || '',
    position: e.position,
    department: e.department || 'General',
    salary: parseFloat(e.salary),
    hire_date: e.hire_date ? e.hire_date.substring(0, 10) : '',
    contract_type: e.contract_type || 'tiempo_completo',
    pin_caja: e.pin_caja || '',
    has_iess: e.has_iess || false,
    accumulates_13th: e.accumulates_13th !== undefined ? e.accumulates_13th : true,
    accumulates_14th: e.accumulates_14th !== undefined ? e.accumulates_14th : true,
    active_dependents_count: e.active_dependents_count || 0
  }
  mostrarForm.value = true
}

async function guardar() {
  error.value = ''
  if (!form.value.name || !form.value.position || form.value.salary === undefined) {
    error.value = 'Nombre, puesto y salario son requeridos'
    return
  }
  try {
    if (modoEditar.value) {
      await api.put(`/rrhh/employees/${form.value.id}/`, form.value)
    } else {
      await api.post('/rrhh/employees/', form.value)
    }
    await cargarEmpleados()
    mostrarForm.value = false
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al guardar'
  }
}

async function eliminar(e) {
  if (confirm(`¿Estás seguro de que deseas eliminar al employee ${e.name}?`)) {
    try {
      await api.delete(`/rrhh/employees/${e.id}/`)
      await cargarEmpleados()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar')
    }
  }
}

async function guardarPuesto() {
  if (!formPuesto.value.name.trim()) return
  try {
    if (formPuesto.value.id) {
      await api.put(`/rrhh/positions/${formPuesto.value.id}/`, formPuesto.value)
    } else {
      await api.post('/rrhh/positions/', formPuesto.value)
    }
    formPuesto.value = { id: null, name: '', active: true }
    await cargarPuestos()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al guardar puesto')
  }
}

async function eliminarPuesto(id) {
  if (confirm('¿Eliminar este puesto permanentemente?')) {
    try {
      await api.delete(`/rrhh/positions/${id}/`)
      await cargarPuestos()
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar el puesto')
    }
  }
}

// Dependientes Logic
async function abrirDependientes() {
  if (!form.value.id) return
  await cargarDependientes()
  mostrarDependientes.value = true
}

function cerrarDependientes() {
  mostrarDependientes.value = false
  cargarEmpleados() // update counts in list
  if (form.value.id) {
    const updated = employees.value.find(e => e.id === form.value.id)
    if (updated) form.value.active_dependents_count = updated.active_dependents_count
  }
}

function resetFormDep() {
  formDep.value = { id: null, full_name: '', identification: '', relationship: 'hijo', birth_date: '', has_disability: false, active: true }
}

async function cargarDependientes() {
  const { data } = await api.get(`/rrhh/employees/${form.value.id}/dependents/`)
  dependientes.value = data
}

async function guardarDependiente() {
  try {
    if (formDep.value.id) {
      await api.put(`/rrhh/employees/${form.value.id}/dependents/${formDep.value.id}/`, formDep.value)
    } else {
      await api.post(`/rrhh/employees/${form.value.id}/dependents/`, formDep.value)
    }
    resetFormDep()
    await cargarDependientes()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al guardar familiar')
  }
}

async function eliminarDependiente(id) {
  if (confirm('¿Eliminar carga familiar?')) {
    try {
      await api.delete(`/rrhh/employees/${form.value.id}/dependents/${id}/`)
      await cargarDependientes()
    } catch (err) {
      alert('Error al eliminar familiar')
    }
  }
}

// Historial Salarial Logic
async function abrirHistorialSalarial() {
  if (!form.value.id) return
  const { data } = await api.get(`/rrhh/employees/${form.value.id}/salary-history/`)
  historialSalarial.value = data
  mostrarHistorial.value = true
}

// Préstamos Logic
async function abrirPrestamos() {
  if (!form.value.id) return
  await cargarPrestamos()
  mostrarPrestamos.value = true
}

function resetFormPrestamo() {
  formPrestamo.value = { id: null, type: 'interno', total_amount: 0, monthly_installment: 0, start_date: '', active: true }
}

async function cargarPrestamos() {
  const { data } = await api.get(`/rrhh/employees/${form.value.id}/loans/`)
  prestamos.value = data
}

async function guardarPrestamo() {
  try {
    if (formPrestamo.value.id) {
      await api.put(`/rrhh/employees/${form.value.id}/loans/${formPrestamo.value.id}/`, formPrestamo.value)
    } else {
      await api.post(`/rrhh/employees/${form.value.id}/loans/`, formPrestamo.value)
    }
    resetFormPrestamo()
    await cargarPrestamos()
  } catch (err) {
    alert(err.response?.data?.error || 'Error al guardar préstamo')
  }
}

async function eliminarPrestamo(id) {
  if (confirm('¿Eliminar préstamo permanentemente?')) {
    try {
      await api.delete(`/rrhh/employees/${form.value.id}/loans/${id}/`)
      await cargarPrestamos()
    } catch (err) {
      alert('Error al eliminar préstamo')
    }
  }
}
</script>

<style scoped>
button:disabled, .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
