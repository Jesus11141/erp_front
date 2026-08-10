<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 class="page-title" style="margin:0">Médicos</h1>
      <button class="btn btn-primary" @click="mostrarForm = true">+ Nuevo Médico</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr><th>Nombre</th><th>Especialidad</th><th>SENESCYT</th><th>Teléfono</th><th>% Consulta</th></tr>
        </thead>
        <tbody>
          <tr v-for="m in doctors" :key="m.id">
            <td><strong>Dr. {{ m.name }}</strong></td>
            <td>{{ m.especialidad }}</td>
            <td style="font-family:monospace; font-size:0.8rem">{{ m.registro_senescyt || 'N/A' }}</td>
            <td>{{ m.phone }}</td>
            <td><span class="badge badge-info">{{ m.porcentaje_consulta }}%</span></td>
          </tr>
          <tr v-if="!doctors.length">
            <td colspan="5" style="text-align:center; color:var(--text-muted)">Sin médicos registrados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarForm" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1.25rem">Nuevo Médico</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
          <div class="form-group"><label>Nombre completo *</label><input v-model="form.name" class="input" /></div>
          <div class="form-group"><label>Cédula</label><input v-model="form.identification" class="input" /></div>
          <div class="form-group"><label>Especialidad</label><input v-model="form.especialidad" class="input" placeholder="Ej: Medicina General" /></div>
          <div class="form-group"><label>Registro SENESCYT</label><input v-model="form.registro_senescyt" class="input" /></div>
          <div class="form-group"><label>Teléfono</label><input v-model="form.phone" class="input" /></div>
          <div class="form-group"><label>Email</label><input v-model="form.email" type="email" class="input" /></div>
          <div class="form-group"><label>% de consulta</label><input v-model.number="form.porcentaje_consulta" type="number" class="input" min="0" max="100" /></div>
        </div>
        <p v-if="errorForm" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem">{{ errorForm }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardar" :disabled="guardando">{{ guardando ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../../shared/api'

const doctors = ref([])
const mostrarForm = ref(false)
const guardando = ref(false)
const errorForm = ref('')
const form = ref({ name: '', identification: '', especialidad: '', registro_senescyt: '', phone: '', email: '', porcentaje_consulta: 70 })

onMounted(async () => {
  const { data } = await api.get('/clinica/doctors/')
  doctors.value = data
})

async function guardar() {
  errorForm.value = ''
  if (!form.value.name) { errorForm.value = 'El name es requerido'; return }
  guardando.value = true
  try {
    const { data } = await api.post('/clinica/doctors/', form.value)
    doctors.value.push(data)
    mostrarForm.value = false
  } catch (e) {
    errorForm.value = e.response?.data?.error || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}
</script>
