<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 class="page-title" style="margin:0">Agenda de Citas</h1>
      <button class="btn btn-primary" @click="abrirForm()">+ Nueva Cita</button>
    </div>

    <!-- Filtros -->
    <div class="card" style="margin-bottom:1rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
      <div class="form-group" style="margin:0">
        <label style="font-size:0.8rem;">Fecha</label>
        <input v-model="filtroFecha" type="date" class="input" style="width:160px" />
      </div>
      <div class="form-group" style="margin:0">
        <label style="font-size:0.8rem;">Médico</label>
        <select v-model="filtroMedico" class="input" style="width:200px">
          <option value="">Todos</option>
          <option v-for="m in doctors" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
      </div>
      <button class="btn btn-outline" style="margin-top:1.1rem" @click="cargar">Filtrar</button>
    </div>

    <!-- Tabla de appointments -->
    <div class="card">
      <table class="table">
        <thead>
          <tr><th>Hora</th><th>Paciente</th><th>Médico</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in appointments" :key="c.id">
            <td style="font-weight:700; color:var(--color-primario)">{{ c.hora?.slice(0,5) }}</td>
            <td><strong>{{ c.paciente_nombre }}</strong></td>
            <td>{{ c.medico_nombre }}</td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ c.motivo }}</td>
            <td><span :class="badgeEstado(c.status)">{{ labelEstado(c.status) }}</span></td>
            <td style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button v-if="c.status === 'scheduled'" class="btn btn-success"
                style="padding:0.2rem 0.6rem; font-size:0.75rem" @click="accion(c.id, 'confirmar')">
                Confirmar
              </button>
              <button v-if="['scheduled','confirmed'].includes(c.status)" class="btn btn-primary"
                style="padding:0.2rem 0.6rem; font-size:0.75rem" @click="atender(c)">
                Atender
              </button>
              <button v-if="!['attended','canceled'].includes(c.status)" class="btn btn-danger"
                style="padding:0.2rem 0.6rem; font-size:0.75rem" @click="accion(c.id, 'cancelar')">
                Cancelar
              </button>
            </td>
          </tr>
          <tr v-if="!appointments.length">
            <td colspan="6" style="text-align:center; color:var(--text-muted)">Sin appointments para esta date</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal nueva appointment -->
    <div v-if="mostrarForm" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1.25rem">Nueva Cita</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
          <div class="form-group" style="grid-column:1/-1">
            <label>Paciente *</label>
            <select v-model="form.patient_id" class="input">
              <option value="">Seleccionar...</option>
              <option v-for="p in patients" :key="p.id" :value="p.id">{{ p.name }} — {{ p.identification }}</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Médico *</label>
            <select v-model="form.doctor_id" class="input">
              <option value="">Seleccionar...</option>
              <option v-for="m in doctors" :key="m.id" :value="m.id">{{ m.name }} — {{ m.especialidad }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha *</label>
            <input v-model="form.date" type="date" class="input" />
          </div>
          <div class="form-group">
            <label>Hora *</label>
            <input v-model="form.hora" type="time" class="input" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Motivo de consulta</label>
            <input v-model="form.motivo" class="input" placeholder="Motivo de la appointment..." />
          </div>
        </div>
        <p v-if="errorForm" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem">{{ errorForm }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardar" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Agendar Cita' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal atender (consulta rápida) -->
    <div v-if="citaAtender" class="modal-overlay">
      <div class="modal" style="max-width:680px">
        <h3 style="margin-bottom:1.25rem">Registrar Consulta — {{ citaAtender.paciente_nombre }}</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
          <div class="form-group" style="grid-column:1/-1">
            <label>Motivo de consulta</label>
            <input v-model="consulta.motivo_consulta" class="input" :placeholder="citaAtender.motivo" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Enfermedad actual / Anamnesis</label>
            <textarea v-model="consulta.enfermedad_actual" class="input" rows="3" style="resize:vertical"></textarea>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Examen físico</label>
            <textarea v-model="consulta.examen_fisico" class="input" rows="2" style="resize:vertical"></textarea>
          </div>
          <div class="form-group">
            <label>Diagnóstico CIE-10</label>
            <input v-model="consulta.diagnostico_cie" class="input" placeholder="Ej: J06.9" />
          </div>
          <div class="form-group">
            <label>Descripción diagnóstico</label>
            <input v-model="consulta.diagnostico_descripcion" class="input" placeholder="Ej: Infección respiratoria aguda" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Tratamiento</label>
            <textarea v-model="consulta.tratamiento" class="input" rows="2" style="resize:vertical"></textarea>
          </div>

          <!-- Receta -->
          <div style="grid-column:1/-1">
            <div style="font-weight:600; font-size:0.9rem; margin-bottom:0.5rem;">Receta médica</div>
            <div v-for="(item, idx) in consulta.receta" :key="idx"
              style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr auto; gap:0.5rem; margin-bottom:0.5rem; align-items:center;">
              <input v-model="item.medicamento" class="input" placeholder="Medicamento" />
              <input v-model="item.dosis" class="input" placeholder="Dosis" />
              <input v-model="item.frecuencia" class="input" placeholder="Frecuencia" />
              <input v-model="item.duracion" class="input" placeholder="Duración" />
              <button @click="consulta.receta.splice(idx,1)" style="color:#e74c3c; background:none; border:none; cursor:pointer; font-size:1rem;">✕</button>
            </div>
            <button class="btn btn-outline" style="font-size:0.8rem"
              @click="consulta.receta.push({medicamento:'',dosis:'',frecuencia:'',duracion:''})">
              + Agregar medicamento
            </button>
          </div>
        </div>
        <p v-if="errorConsulta" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem">{{ errorConsulta }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="citaAtender = null">Cancelar</button>
          <button class="btn btn-primary" @click="guardarConsulta" :disabled="guardandoConsulta">
            {{ guardandoConsulta ? 'Guardando...' : 'Guardar Consulta' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../../shared/api'

const appointments = ref([])
const patients = ref([])
const doctors = ref([])
const mostrarForm = ref(false)
const guardando = ref(false)
const errorForm = ref('')
const citaAtender = ref(null)
const guardandoConsulta = ref(false)
const errorConsulta = ref('')

const hoy = new Date().toISOString().slice(0, 10)
const filtroFecha = ref(hoy)
const filtroMedico = ref('')

const form = ref({ patient_id: '', doctor_id: '', date: hoy, hora: '08:00', motivo: '' })
const consulta = ref({ motivo_consulta: '', enfermedad_actual: '', examen_fisico: '', diagnostico_cie: '', diagnostico_descripcion: '', tratamiento: '', receta: [] })

const badgeEstado = (e) => ({
  scheduled: 'badge badge-info',
  confirmed: 'badge badge-warning',
  attended: 'badge badge-success',
  canceled: 'badge badge-secondary',
  no_show: 'badge badge-danger',
}[e] || 'badge badge-secondary')

const labelEstado = (e) => ({
  scheduled: 'Programada', confirmed: 'Confirmada',
  attended: 'Atendida', canceled: 'Cancelada', no_show: 'No asistió',
}[e] || e)

async function cargar() {
  const params = {}
  if (filtroFecha.value) params.date = filtroFecha.value
  if (filtroMedico.value) params.doctor_id = filtroMedico.value
  const { data } = await api.get('/clinica/appointments/', { params })
  appointments.value = data
}

onMounted(async () => {
  await cargar()
  const [rp, rm] = await Promise.all([api.get('/clinica/patients/'), api.get('/clinica/doctors/')])
  patients.value = rp.data
  doctors.value = rm.data
})

function abrirForm() {
  form.value = { patient_id: '', doctor_id: '', date: hoy, hora: '08:00', motivo: '' }
  errorForm.value = ''
  mostrarForm.value = true
}

async function guardar() {
  errorForm.value = ''
  if (!form.value.patient_id || !form.value.doctor_id || !form.value.date || !form.value.hora) {
    errorForm.value = 'Paciente, médico, date y hora son requeridos'
    return
  }
  guardando.value = true
  try {
    await api.post('/clinica/appointments/', form.value)
    await cargar()
    mostrarForm.value = false
  } catch (e) {
    errorForm.value = e.response?.data?.error || 'Error al agendar'
  } finally {
    guardando.value = false
  }
}

async function accion(citaId, accion) {
  await api.post(`/clinica/appointments/${citaId}/${accion}/`)
  await cargar()
}

function atender(appointment) {
  citaAtender.value = appointment
  consulta.value = { motivo_consulta: appointment.motivo, enfermedad_actual: '', examen_fisico: '', diagnostico_cie: '', diagnostico_descripcion: '', tratamiento: '', receta: [] }
  errorConsulta.value = ''
}

async function guardarConsulta() {
  errorConsulta.value = ''
  if (!consulta.value.diagnostico_descripcion) {
    errorConsulta.value = 'El diagnóstico es requerido'
    return
  }
  guardandoConsulta.value = true
  try {
    await api.post('/clinica/consultas/', {
      ...consulta.value,
      patient_id: citaAtender.value.patient_id,
      doctor_id: citaAtender.value.doctor_id,
      cita_id: citaAtender.value.id,
    })
    await accion(citaAtender.value.id, 'atender')
    citaAtender.value = null
  } catch (e) {
    errorConsulta.value = e.response?.data?.error || 'Error al guardar consulta'
  } finally {
    guardandoConsulta.value = false
  }
}
</script>
