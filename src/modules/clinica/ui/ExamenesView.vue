<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Resultados de Laboratorio</h1>
        <p class="page-subtitle">El sistema interpreta automáticamente cada valor ingresado</p>
      </div>
      <button class="btn btn-primary" @click="mostrarForm = true">+ Nuevo Examen</button>
    </div>

    <!-- Lista de exámenes -->
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Paciente</th><th>Tipo</th><th>Médico</th>
            <th>Fecha</th><th>Resultado</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ex in examenes" :key="ex.id">
            <td><strong>{{ ex.paciente_nombre }}</strong></td>
            <td>{{ ex.tipo_examen }}</td>
            <td>{{ ex.medico_nombre }}</td>
            <td>{{ ex.result_date?.slice(0,10) }}</td>
            <td>
              <span v-if="ex.tiene_criticos" class="badge badge-danger">⬇⬆ Valores críticos</span>
              <span v-else-if="ex.tiene_alterados" class="badge badge-warning">⚠ Valores alterados</span>
              <span v-else class="badge badge-success">✓ Todo normal</span>
            </td>
            <td>
              <button class="btn btn-outline btn-sm" @click="verExamen(ex)">Ver detalle</button>
            </td>
          </tr>
          <tr v-if="!examenes.length">
            <td colspan="6" class="empty-state">Sin exámenes registrados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: nuevo examen -->
    <div v-if="mostrarForm" class="modal-overlay">
      <div class="modal" style="max-width:720px">
        <h3 class="modal-title">Ingresar Resultados de Examen</h3>

        <!-- Paso 1: datos generales -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
          <div class="form-group">
            <label>Paciente *</label>
            <select v-model="form.patient_id" class="input" @change="cargarPaciente">
              <option value="">Seleccionar...</option>
              <option v-for="p in patients" :key="p.id" :value="p.id">
                {{ p.name }} — {{ p.identification }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Médico *</label>
            <select v-model="form.doctor_id" class="input">
              <option value="">Seleccionar...</option>
              <option v-for="m in doctors" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Tipo de examen *</label>
            <select v-model="form.tipo_examen" class="input" @change="cargarPlantilla">
              <option value="">Seleccionar...</option>
              <option v-for="t in tiposExamen" :key="t.clave" :value="t.clave">
                {{ t.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Paso 2: ingreso de valores con interpretación en tiempo real -->
        <div v-if="form.tipo_examen && form.patient_id && analitos.length">
          <div class="analitos-header">
            <span>Analito</span>
            <span>Valor medido</span>
            <span>Unidad</span>
            <span>Rango normal</span>
            <span>Resultado</span>
          </div>

          <div
            v-for="analito in analitos"
            :key="analito.clave"
            class="analito-row"
            :class="'analito-' + (interpretaciones[analito.clave]?.color || 'gris')"
          >
            <span class="analito-name">{{ analito.label }}</span>

            <input
              v-model="analito.valor"
              type="number"
              step="0.01"
              class="input analito-input"
              :placeholder="analito.clave"
              @input="interpretarEnTiempoReal(analito)"
            />

            <span class="analito-unidad">
              {{ interpretaciones[analito.clave]?.unidad || '—' }}
            </span>

            <span class="analito-rango">
              <template v-if="interpretaciones[analito.clave]?.rango_min">
                {{ interpretaciones[analito.clave].rango_min }}
                – {{ interpretaciones[analito.clave].rango_max }}
              </template>
              <span v-else style="color:var(--text-muted)">—</span>
            </span>

            <span class="analito-status">
              <template v-if="analito.valor !== '' && interpretaciones[analito.clave]">
                <span
                  class="badge"
                  :class="badgeColor(interpretaciones[analito.clave]?.color)"
                >
                  {{ interpretaciones[analito.clave].icono }}
                  {{ labelEstado(interpretaciones[analito.clave].status) }}
                </span>
              </template>
              <span v-else style="color:var(--text-muted); font-size:0.8rem;">Ingresa valor</span>
            </span>
          </div>
        </div>

        <div v-else-if="form.tipo_examen && !form.patient_id" class="alert alert-warning" style="margin-top:1rem">
          <span>⚠️</span> Selecciona primero el patient para calcular rangos por edad y sexo.
        </div>

        <div class="form-group" style="margin-top:1rem">
          <label>Observaciones</label>
          <input v-model="form.notes" class="input" placeholder="Observaciones del laboratorista..." />
        </div>

        <p v-if="errorForm" class="form-error">{{ errorForm }}</p>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="cerrarForm">Cancelar</button>
          <button class="btn btn-primary" @click="guardar" :disabled="guardando">
            {{ guardando ? 'Procesando...' : 'Guardar e Interpretar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: detalle de examen -->
    <div v-if="examenDetalle" class="modal-overlay">
      <div class="modal" style="max-width:680px">
        <h3 class="modal-title">
          {{ examenDetalle.tipo_examen }} — {{ examenDetalle.paciente_nombre }}
        </h3>

        <div style="display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap;">
          <span class="badge badge-info">{{ examenDetalle.medico_nombre }}</span>
          <span class="badge badge-secondary">{{ examenDetalle.result_date?.slice(0,10) }}</span>
          <span v-if="examenDetalle.tiene_criticos" class="badge badge-danger">⚠ Valores críticos</span>
          <span v-else-if="examenDetalle.tiene_alterados" class="badge badge-warning">Valores alterados</span>
          <span v-else class="badge badge-success">✓ Todo normal</span>
        </div>

        <!-- Resumen visual -->
        <div class="resumen-examen">
          <div
            v-for="r in examenDetalle.results"
            :key="r.analito"
            class="result-card"
            :class="'result-' + r.color"
          >
            <div class="result-icono">{{ r.icono }}</div>
            <div class="result-analito">{{ formatAnalito(r.analito) }}</div>
            <div class="result-valor">
              <strong>{{ r.valor }}</strong>
              <span class="result-unidad">{{ r.unidad }}</span>
            </div>
            <div class="result-rango">
              Ref: {{ r.rango_min }} – {{ r.rango_max }}
            </div>
            <div class="result-status">
              <span class="badge" :class="badgeColor(r.color)">
                {{ labelEstado(r.status) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="examenDetalle.notes" style="margin-top:1rem; font-size:0.875rem; color:var(--text-muted)">
          <strong>Observaciones:</strong> {{ examenDetalle.notes }}
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="examenDetalle = null">Cerrar</button>
          <button class="btn btn-primary" @click="imprimirExamen">🖨 Imprimir</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../../shared/api'

const examenes     = ref([])
const patients    = ref([])
const doctors      = ref([])
const tiposExamen  = ref([])
const analitos     = ref([])
const interpretaciones = ref({})
const mostrarForm  = ref(false)
const guardando    = ref(false)
const errorForm    = ref('')
const examenDetalle = ref(null)

const form = ref({
  patient_id: '', doctor_id: '',
  tipo_examen: '', notes: '',
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function badgeColor(color) {
  return { verde: 'badge-success', naranja: 'badge-warning', rojo: 'badge-danger', gris: 'badge-secondary' }[color] || 'badge-secondary'
}

function labelEstado(status) {
  return { NORMAL: 'Normal', BAJO: 'Bajo', ALTO: 'Alto', CRITICO_BAJO: 'Crítico ↓', CRITICO_ALTO: 'Crítico ↑', SIN_RANGO: 'Sin rango' }[status] || status
}

function formatAnalito(clave) {
  return clave.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// ── Carga inicial ─────────────────────────────────────────────────────────────

onMounted(async () => {
  const [ep, em, et, ee] = await Promise.all([
    api.get('/clinica/patients/'),
    api.get('/clinica/doctors/'),
    api.get('/clinica/examenes/tipos/'),
    api.get('/clinica/examenes/'),
  ])
  patients.value   = ep.data
  doctors.value     = em.data
  tiposExamen.value = et.data
  examenes.value    = ee.data
})

// ── Plantilla de analitos ─────────────────────────────────────────────────────

async function cargarPlantilla() {
  if (!form.value.tipo_examen) return
  const { data } = await api.get(`/clinica/examenes/plantilla/${form.value.tipo_examen}/`)
  analitos.value = data.analitos.map(clave => ({
    clave,
    label: formatAnalito(clave),
    valor: '',
  }))
  interpretaciones.value = {}
}

function cargarPaciente() {
  // Limpiar interpretaciones al cambiar patient (los rangos cambian por edad/sexo)
  interpretaciones.value = {}
  analitos.value.forEach(a => { a.valor = '' })
}

// ── Interpretación en tiempo real ─────────────────────────────────────────────

async function interpretarEnTiempoReal(analito) {
  if (!analito.valor || !form.value.patient_id) return
  try {
    const { data } = await api.post('/clinica/examenes/interpretar/', {
      patient_id: form.value.patient_id,
      analito: analito.clave,
      valor: analito.valor,
    })
    interpretaciones.value[analito.clave] = data
  } catch {}
}

// ── Guardar examen ────────────────────────────────────────────────────────────

async function guardar() {
  errorForm.value = ''
  if (!form.value.patient_id || !form.value.doctor_id || !form.value.tipo_examen) {
    errorForm.value = 'Paciente, médico y type de examen son requeridos'
    return
  }
  const valores = analitos.value
    .filter(a => a.valor !== '')
    .map(a => ({ analito: a.clave, valor: parseFloat(a.valor) }))

  if (!valores.length) {
    errorForm.value = 'Ingresa al menos un valor'
    return
  }

  guardando.value = true
  try {
    const { data } = await api.post('/clinica/examenes/', {
      ...form.value,
      valores,
    })
    examenes.value.unshift(data)
    examenDetalle.value = data
    cerrarForm()
  } catch (e) {
    errorForm.value = e.response?.data?.error || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

function verExamen(ex) { examenDetalle.value = ex }

function cerrarForm() {
  mostrarForm.value = false
  form.value = { patient_id: '', doctor_id: '', tipo_examen: '', notes: '' }
  analitos.value = []
  interpretaciones.value = {}
  errorForm.value = ''
}

function imprimirExamen() { window.print() }
</script>

<style scoped>
/* Cabecera de la tabla de analitos */
.analitos-header {
  display: grid;
  grid-template-columns: 2fr 1.2fr 0.8fr 1.5fr 1.5fr;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg);
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

/* Fila de analito */
.analito-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 0.8fr 1.5fr 1.5fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
  margin-bottom: 0.2rem;
  transition: var(--transition);
}
.analito-verde  { border-left-color: var(--color-exito);  background: #F0FDF4; }
.analito-naranja{ border-left-color: var(--color-alerta); background: #FFFBEB; }
.analito-rojo   { border-left-color: var(--color-peligro);background: #FEF2F2; }
.analito-gris   { border-left-color: var(--border); }

.analito-name { font-size: 0.85rem; font-weight: 600; }
.analito-input  { padding: 0.35rem 0.6rem; font-size: 0.875rem; }
.analito-unidad { font-size: 0.78rem; color: var(--text-muted); }
.analito-rango  { font-size: 0.78rem; color: var(--text-muted); }

/* Resumen de results en detalle */
.resumen-examen {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.result-card {
  border-radius: var(--radius-sm);
  padding: 0.875rem;
  border: 1.5px solid var(--border);
  text-align: center;
  transition: var(--transition);
}
.result-verde  { border-color: #A7F3D0; background: #F0FDF4; }
.result-naranja{ border-color: #FDE68A; background: #FFFBEB; }
.result-rojo   { border-color: #FECACA; background: #FEF2F2; }

.result-icono   { font-size: 1.25rem; margin-bottom: 0.25rem; }
.result-analito { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem; }
.result-valor   { font-size: 1.3rem; font-weight: 800; color: var(--text); }
.result-unidad  { font-size: 0.72rem; color: var(--text-muted); margin-left: 0.2rem; }
.result-rango   { font-size: 0.72rem; color: var(--text-muted); margin: 0.25rem 0; }
.result-status  { margin-top: 0.35rem; }
</style>
