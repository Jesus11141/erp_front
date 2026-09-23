<template>
  <div>
    <div class="page-header">
      <h1 class="page-title" style="margin:0">Notas de Crédito</h1>
      <div>
        <button class="btn btn-primary" @click="abrirNuevaNota">+ Nueva Nota</button>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="overflow-x: auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Número NC</th>
              <th>Factura Orig.</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Subtotal</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nc in notas" :key="nc.id">
              <td style="font-family:monospace; font-size:0.8rem; white-space:nowrap;">{{ nc.number || 'Borrador' }}</td>
              <td style="font-family:monospace; font-size:0.8rem; white-space:nowrap;">{{ nc.origin_invoice_number }}</td>
              <td>
                <div style="font-weight: 500; font-size:0.9rem;">{{ nc.client }}</div>
                <div style="font-size: 0.75rem; color: #888;">{{ nc.client_identification }}</div>
              </td>
              <td style="font-size:0.8rem; white-space:nowrap;">{{ nc.date }}</td>
              <td>{{ simbolo }}{{ formatDecimal(nc.subtotal) }}</td>
              <td><strong>{{ simbolo }}{{ formatDecimal(nc.total) }}</strong></td>
              <td><span :class="badgeEstado(nc.status)">{{ labelEstado(nc.status) }}</span></td>
              <td>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center; min-width:140px;">
                  <button v-if="(nc.status === 'draft' || nc.status === 'not_authorized')" class="btn btn-primary"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem" @click="emitir(nc)">
                    Emitir
                  </button>
                  <button v-if="nc.status === 'sent_to_sri' || (nc.status === 'not_authorized' && nc.access_key)" class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem" @click="autorizar(nc)">
                    Consultar
                  </button>
                  <button v-if="nc.status === 'authorized' || nc.status === 'autorizada'" class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem" @click="verAutorizacion(nc)">
                    Detalle
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!notas.length">
              <td colspan="8" style="text-align:center; color:var(--text-muted)">Sin notas de crédito registradas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CreditNoteFormModal 
      :show="mostrarForm" 
      :procesando="guardando"
      @close="mostrarForm = false"
      @submit="guardarNota"
    />

    <!-- Modal detalle autorización -->
    <div v-if="notaSeleccionada" class="modal-overlay" @mousedown.self="notaSeleccionada = null">
      <div class="modal" style="position:relative;">
        <button class="btn" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;" @click="notaSeleccionada = null" title="Cerrar (Esc)">✕</button>
        <h3 style="margin-bottom:1rem">Detalle de Autorización SRI</h3>
        <div style="font-size:0.875rem; display:flex; flex-direction:column; gap:0.5rem;">
          <div><strong>Número:</strong> {{ notaSeleccionada.number }}</div>
          <div><strong>Factura Original:</strong> {{ notaSeleccionada.origin_invoice_number }}</div>
          <div><strong>Cliente:</strong> {{ notaSeleccionada.client }}</div>
          <div><strong>Total:</strong> {{ simbolo }}{{ notaSeleccionada.total }}</div>
          <div><strong>Clave de acceso:</strong>
            <span style="font-family:monospace; font-size:0.72rem; word-break:break-all; display:block; background:var(--bg); padding:0.25rem; border-radius:4px; margin-top:0.25rem;">
              {{ notaSeleccionada.access_key }}
            </span>
          </div>
          <div><strong>Estado SRI:</strong>
            <span :class="badgeEstado(notaSeleccionada.status)">{{ notaSeleccionada.sri_status || notaSeleccionada.status }}</span>
          </div>
          <div v-if="notaSeleccionada.authorization_number">
            <strong>Nro. Autorización:</strong> {{ notaSeleccionada.authorization_number }}
          </div>
          <div v-if="notaSeleccionada.authorization_date">
            <strong>Fecha Autorización:</strong> {{ notaSeleccionada.authorization_date }}
          </div>
          <div v-if="notaSeleccionada.sri_message" style="color:#e74c3c;">
            <strong>Mensaje SRI:</strong> {{ notaSeleccionada.sri_message }}
          </div>
        </div>
        <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
          <button class="btn btn-outline" @click="notaSeleccionada = null">Cerrar</button>
        </div>
      </div>
    </div>

    <p v-if="procesando" style="text-align:center; color:var(--text-muted); margin-top:1rem;">
      ⏳ Comunicando con SRI...
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../../shared/api'
import { useParametrosStore } from '../../../stores/parametros'
import CreditNoteFormModal from './CreditNoteFormModal.vue'
import { useAlert } from '../../../composables/useAlert'

const parametros = useParametrosStore()
const { showAlert } = useAlert()

const notas = ref([])
const procesando = ref(false)
const guardando = ref(false)
const mostrarForm = ref(false)
const notaSeleccionada = ref(null)

const simbolo = ref('$')

const cargar = async () => {
  procesando.value = true
  try {
    const res = await api.get('/facturacion/notas-credito/')
    // La respuesta en views.py devuelve un array directo
    notas.value = res.data || []
  } catch (error) {
    showAlert({ type: 'error', title: 'Error', message: 'No se pudieron cargar las notas de crédito' })
  } finally {
    procesando.value = false
  }
}

const abrirNuevaNota = () => {
  mostrarForm.value = true
}

const formatDecimal = (val) => {
  if (!val) return '0.00'
  return parseFloat(val).toFixed(2)
}

const labelEstado = (st) => {
  const m = {
    draft: 'Borrador',
    sent_to_sri: 'Enviada SRI',
    authorized: 'Autorizada',
    autorizada: 'Autorizada',
    not_authorized: 'No Autorizada',
    canceled: 'Anulada'
  }
  return m[st] || st
}

const badgeEstado = (st) => {
  if (st === 'draft') return 'badge badge-draft'
  if (st === 'sent_to_sri') return 'badge badge-sri'
  if (st === 'authorized' || st === 'autorizada') return 'badge badge-success'
  if (st === 'not_authorized') return 'badge badge-error'
  if (st === 'canceled') return 'badge badge-error'
  return 'badge badge-draft'
}

const guardarNota = async (payload) => {
  guardando.value = true
  try {
    await api.post('/facturacion/notas-credito/', payload)
    showAlert({ type: 'success', title: 'Éxito', message: 'Nota de Crédito creada como borrador' })
    mostrarForm.value = false
    cargar()
  } catch (error) {
    showAlert({ type: 'error', title: 'Error', message: error.response?.data?.error || 'No se pudo crear la nota de crédito' })
  } finally {
    guardando.value = false
  }
}

const emitir = async (nc) => {
  procesando.value = true
  try {
    await api.post(`/facturacion/notas-credito/${nc.id}/emitir/`)
    showAlert({ type: 'success', title: 'Enviando', message: 'Nota de Crédito enviada al SRI. Autorizando...' })
    cargar()
  } catch (error) {
    showAlert({ type: 'error', title: 'Error al emitir', message: error.response?.data?.error || 'Ocurrió un error' })
    cargar()
  } finally {
    procesando.value = false
  }
}

const autorizar = async (nc) => {
  procesando.value = true
  try {
    await api.post(`/facturacion/notas-credito/${nc.id}/autorizar/`)
    showAlert({ type: 'success', title: 'Consulta finalizada', message: 'Se consultó el estado con el SRI' })
    cargar()
  } catch (error) {
    showAlert({ type: 'warning', title: 'Aviso', message: error.response?.data?.error || 'El comprobante aún no se autoriza o fue devuelto' })
    cargar()
  } finally {
    procesando.value = false
  }
}

const verAutorizacion = (nc) => {
  notaSeleccionada.value = nc
}

onMounted(() => {
  simbolo.value = parametros.obtener('general', 'currency_symbol', '$')
  cargar()
})
</script>

<style scoped>
.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}
.badge-draft { background: #f1c40f; color: #000; }
.badge-sri { background: #3498db; color: #fff; }
.badge-success { background: #2ecc71; color: #fff; }
.badge-error { background: #e74c3c; color: #fff; }
</style>
