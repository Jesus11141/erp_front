<template>
  <div>
    <div class="page-header">
      <h1 class="page-title" style="margin:0">Pacientes</h1>
      <button class="btn btn-primary" @click="abrirForm()">+ Nuevo Paciente</button>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <input v-model="busqueda" class="input" placeholder="Buscar por name o cédula..." style="max-width:320px" />
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr><th>Cédula</th><th>Nombre</th><th>Edad</th><th>Sexo</th><th>Sangre</th><th>Teléfono</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in patients" :key="p.id">
            <td style="font-family:monospace">{{ p.identification }}</td>
            <td><strong>{{ p.name }}</strong></td>
            <td>{{ p.edad }} años</td>
            <td>{{ p.sexo === 'M' ? '♂ Masculino' : '♀ Femenino' }}</td>
            <td><span class="badge badge-info">{{ p.blood_type || 'N/D' }}</span></td>
            <td>{{ p.phone }}</td>
            <td style="display:flex; gap:0.4rem;">
              <button class="btn btn-outline" style="padding:0.2rem 0.6rem; font-size:0.75rem" @click="verHistorial(p)">Historial</button>
              <button class="btn" style="padding:0.2rem 0.6rem; font-size:0.75rem; background:#8e44ad; color:white" @click="abrirForm(p)">Editar</button>
            </td>
          </tr>
          <tr v-if="!patients.length">
            <td colspan="7" style="text-align:center; color:var(--text-muted)">Sin patients registrados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal nuevo/editar patient -->
    <div v-if="mostrarForm" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1.25rem">{{ editando ? 'Editar Paciente' : 'Nuevo Paciente' }}</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
          <div class="form-group">
            <label>Cédula / Pasaporte *</label>
            <input v-model="form.identification" class="input" :disabled="editando" />
          </div>
          <div class="form-group">
            <label>Nombre completo *</label>
            <input v-model="form.name" class="input" />
          </div>
          <div class="form-group">
            <label>Fecha de nacimiento *</label>
            <input v-model="form.birth_date" type="date" class="input" />
          </div>
          <div class="form-group">
            <label>Sexo</label>
            <select v-model="form.sexo" class="input">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tipo de sangre</label>
            <select v-model="form.blood_type" class="input">
              <option value="">No sabe</option>
              <option v-for="s in tiposSangre" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input v-model="form.phone" class="input" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input v-model="form.address" class="input" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Alergias conocidas</label>
            <input v-model="form.alergias" class="input" placeholder="Ej: Penicilina, Aspirina..." />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Antecedentes médicos</label>
            <input v-model="form.antecedentes" class="input" placeholder="Ej: Diabetes, Hipertensión..." />
          </div>
        </div>
        <p v-if="errorForm" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem">{{ errorForm }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardar" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal historial -->
    <div v-if="pacienteHistorial" class="modal-overlay">
      <div class="modal">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem;">
          <div>
            <h3>{{ pacienteHistorial.name }}</h3>
            <p style="font-size:0.85rem; color:var(--text-muted)">
              {{ pacienteHistorial.identification }} · {{ pacienteHistorial.edad }} años ·
              {{ pacienteHistorial.sexo === 'M' ? 'Masculino' : 'Femenino' }} ·
              Sangre: {{ pacienteHistorial.blood_type || 'N/D' }}
            </p>
          </div>
          <button class="btn btn-outline" style="font-size:0.8rem" @click="pacienteHistorial = null">Cerrar</button>
        </div>

        <div v-if="pacienteHistorial.alergias" style="background:#fff3cd; border-radius:var(--radius); padding:0.75rem; margin-bottom:1rem; font-size:0.875rem;">
          ⚠️ <strong>Alergias:</strong> {{ pacienteHistorial.alergias }}
        </div>
        <div v-if="pacienteHistorial.antecedentes" style="background:#d1ecf1; border-radius:var(--radius); padding:0.75rem; margin-bottom:1rem; font-size:0.875rem;">
          📋 <strong>Antecedentes:</strong> {{ pacienteHistorial.antecedentes }}
        </div>

        <!-- Consultas -->
        <div style="font-weight:600; margin-bottom:0.5rem;">Consultas ({{ pacienteHistorial.consultas?.length || 0 }})</div>
        <div v-if="!pacienteHistorial.consultas?.length" style="color:var(--text-muted); font-size:0.875rem; margin-bottom:1rem;">Sin consultas registradas</div>
        <div v-for="c in pacienteHistorial.consultas" :key="c.id" class="card" style="margin-bottom:0.75rem; padding:1rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.875rem;">
            <strong>{{ c.diagnostico_descripcion || c.motivo_consulta }}</strong>
            <span style="color:var(--text-muted)">{{ c.date?.slice(0,10) }}</span>
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
            Dr. {{ c.medico_nombre }} · CIE-10: {{ c.diagnostico_cie || 'N/A' }}
          </div>
        </div>

        <!-- Exámenes -->
        <div style="font-weight:600; margin-bottom:0.5rem; margin-top:0.5rem;">Exámenes de laboratorio ({{ pacienteHistorial.examenes?.length || 0 }})</div>
        <div v-if="!pacienteHistorial.examenes?.length" style="color:var(--text-muted); font-size:0.875rem;">Sin exámenes registrados</div>
        <div v-for="ex in pacienteHistorial.examenes" :key="ex.id" class="card" style="margin-bottom:0.5rem; padding:0.75rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
            <strong>{{ ex.tipo_examen }}</strong>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <span v-if="ex.tiene_criticos" class="badge badge-danger">⚠ Críticos</span>
              <span v-else-if="ex.tiene_alterados" class="badge badge-warning">Alterados</span>
              <span v-else class="badge badge-success">Normal</span>
              <span style="color:var(--text-muted); font-size:0.8rem;">{{ ex.result_date?.slice(0,10) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../../../shared/api'

const patients = ref([])
const busqueda = ref('')
const mostrarForm = ref(false)
const guardando = ref(false)
const errorForm = ref('')
const editando = ref(false)
const pacienteHistorial = ref(null)

const tiposSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const formVacio = () => ({
  identification: '', name: '', birth_date: '', sexo: 'M',
  blood_type: '', phone: '', email: '', address: '',
  alergias: '', antecedentes: '',
})
const form = ref(formVacio())

async function cargar() {
  const { data } = await api.get('/clinica/patients/', { params: busqueda.value ? { q: busqueda.value } : {} })
  patients.value = data
}

watch(busqueda, cargar)
onMounted(cargar)

function abrirForm(patient = null) {
  editando.value = !!patient
  form.value = patient ? { ...patient } : formVacio()
  errorForm.value = ''
  mostrarForm.value = true
}

async function guardar() {
  errorForm.value = ''
  if (!form.value.identification || !form.value.name || !form.value.birth_date) {
    errorForm.value = 'Cédula, name y date de nacimiento son requeridos'
    return
  }
  guardando.value = true
  try {
    await api.post('/clinica/patients/', form.value)
    await cargar()
    mostrarForm.value = false
  } catch (e) {
    errorForm.value = e.response?.data?.error || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function verHistorial(patient) {
  const { data } = await api.get(`/clinica/patients/${patient.id}/`)
  pacienteHistorial.value = data
}
</script>
