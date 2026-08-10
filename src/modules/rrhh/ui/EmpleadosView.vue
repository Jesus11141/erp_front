<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
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
              <div style="display:flex; gap:0.25rem;">
                <button class="btn btn-sm btn-outline" @click="abrirEditar(e)">⚙️ Editar</button>
                <button class="btn btn-sm btn-outline" style="color:#e74c3c; border-color:#e74c3c;" @click="eliminar(e)">🗑️ Eliminar</button>
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
        <h3 style="margin-bottom:1rem">{{ modoEditar ? 'Editar Empleado' : 'Nuevo Empleado' }}</h3>
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
        </div>
        <p v-if="error" style="color:#e74c3c; font-size:0.85rem">{{ error }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardar">Guardar</button>
        </div>
      </div>
    </div>
    <div v-if="mostrarFormPuestos" class="modal-overlay">
      <div class="modal" style="max-width:500px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
          <h3 style="margin:0">Puestos de Trabajo</h3>
          <button class="btn btn-outline" @click="mostrarFormPuestos = false; cargarPuestos()">Cerrar</button>
        </div>
        
        <div style="display:flex; gap:0.5rem; margin-bottom:1rem">
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
const modoEditar = ref(false)
const error = ref('')
const form = ref({ id: null, name: '', email: '', position: '', department: 'General', salary: 0, hire_date: '', contract_type: 'tiempo_completo', pin_caja: '' })
const formPuesto = ref({ id: null, name: '', active: true })

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
    pin_caja: ''
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
    pin_caja: e.pin_caja || ''
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
</script>
