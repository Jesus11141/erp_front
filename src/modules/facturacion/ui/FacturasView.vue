<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 class="page-title" style="margin:0">Facturación Electrónica</h1>
      <div>
        <button v-if="seleccionadas.length > 0" class="btn" style="background:#8e44ad; color:white; margin-right: 0.5rem;" @click="emitirMasivo" :disabled="procesando">Emitir Masivas ({{ seleccionadas.length }})</button>
        <button class="btn btn-primary" @click="abrirNuevaFactura">+ Nueva Factura</button>
      </div>
    </div>

    <!-- Alerta certificado -->
    <div v-if="!certConfigurado" class="card" style="border-left:4px solid #e67e22; margin-bottom:1rem;">
      <p style="color:#e67e22; font-size:0.875rem;">
        ⚠️ No tienes certificado P12 configurado. Sin él no puedes emitir invoices electrónicas.
        <router-link to="/parametros">Configurar en Parametrización → Facturación</router-link>
      </p>
    </div>

    <!-- Tabla invoices -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="overflow-x: auto;">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;"><input type="checkbox" :checked="todasSeleccionadas" @change="toggleTodas" :disabled="emitibles.length === 0" title="Seleccionar todas las emitibles" /></th>
              <th>Número</th><th>Cliente</th>
              <th>Fecha</th><th>Subtotal</th><th>IVA</th><th>Total</th>
              <th>F. Pago</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in invoices" :key="f.id">
              <td style="text-align: center;">
                <input v-if="(f.status === 'draft' || f.status === 'not_authorized') && f.cliente_identificacion !== '9999999999999'" 
                       type="checkbox" :value="f.id" v-model="seleccionadas" />
              </td>
              <td style="font-family:monospace; font-size:0.8rem; white-space:nowrap;">{{ f.numero }}</td>
              <td>
                <div style="font-weight: 500; font-size:0.9rem;">{{ f.customer }}</div>
                <div style="font-size: 0.75rem; color: #888;">{{ f.cliente_identificacion }}</div>
              </td>
              <td style="font-size:0.8rem; white-space:nowrap;">{{ f.created_at.split(' ')[0] }}</td>
              <td>{{ simbolo }}{{ formatDecimal(f.subtotal) }}</td>
              <td>{{ simbolo }}{{ formatDecimal(f.vat) }}</td>
              <td><strong>{{ simbolo }}{{ formatDecimal(f.total) }}</strong></td>
              <td style="font-size:0.8rem;">{{ labelFormaPago(f.forma_pago) }}</td>
              <td><span :class="badgeEstado(f.status)">{{ labelEstado(f.status) }}</span></td>
              <td>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center; min-width:140px;">
                  <button v-if="(f.status === 'draft' || f.status === 'not_authorized') && f.cliente_identificacion !== '9999999999999'" class="btn btn-primary"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem" @click="emitir(f)">
                    Emitir
                  </button>
                  <button v-if="f.status === 'sent_to_sri' || (f.status === 'not_authorized' && f.access_key)" class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem" @click="autorizar(f)">
                    Consultar
                  </button>
                  <button v-if="f.status === 'authorized' || f.status === 'autorizada'" class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#27ae60; color:white"
                    @click="descargarXML(f)">
                    XML
                  </button>
                  <button v-if="f.status === 'authorized' || f.status === 'autorizada'" class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#8e44ad; color:white"
                    @click="verPDF(f)">
                    PDF
                  </button>
                  <button v-if="f.status === 'authorized' || f.status === 'autorizada'" class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem" @click="verAutorizacion(f)">
                    Detalle
                  </button>
                  <button v-if="f.status !== 'canceled'" class="btn btn-danger"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem" @click="cancelar(f.id, f.status)">
                    Anular
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!invoices.length">
              <td colspan="10" style="text-align:center; color:var(--text-muted)">Sin facturas registradas</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Controles de paginación -->
      <div v-if="totalPages > 1" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-top: 1px solid var(--border-color); background: var(--bg-card);">
        <button class="btn btn-outline" :disabled="currentPage === 1" @click="cargar(currentPage - 1)">
          Anterior
        </button>
        <span style="font-size: 0.85rem; color: var(--text-muted);">
          Página {{ currentPage }} de {{ totalPages }} ({{ totalRecords }} facturas)
        </span>
        <button class="btn btn-outline" :disabled="currentPage === totalPages" @click="cargar(currentPage + 1)">
          Siguiente
        </button>
      </div>
    </div>

    <InvoiceFormModal 
      :show="mostrarForm" 
      :procesando="guardando"
      @close="mostrarForm = false"
      @submit="guardarFactura"
    />

    <!-- Modal detalle autorización -->
    <div v-if="facturaSeleccionada" class="modal-overlay" @mousedown.self="facturaSeleccionada = null">
      <div class="modal" style="position:relative;">
        <button class="btn" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;" @click="facturaSeleccionada = null" title="Cerrar (Esc)">✕</button>
        <h3 style="margin-bottom:1rem">Detalle de Autorización SRI</h3>
        <div style="font-size:0.875rem; display:flex; flex-direction:column; gap:0.5rem;">
          <div><strong>Número:</strong> {{ facturaSeleccionada.numero }}</div>
          <div><strong>Cliente:</strong> {{ facturaSeleccionada.customer }}</div>
          <div><strong>Identificación:</strong> {{ facturaSeleccionada.cliente_identificacion }}</div>
          <div><strong>Total:</strong> {{ simbolo }}{{ facturaSeleccionada.total }}</div>
          <div><strong>Clave de acceso:</strong>
            <span style="font-family:monospace; font-size:0.72rem; word-break:break-all; display:block; background:var(--bg); padding:0.25rem; border-radius:4px; margin-top:0.25rem;">
              {{ facturaSeleccionada.clave_acceso }}
            </span>
          </div>
          <div><strong>Estado SRI:</strong>
            <span :class="badgeEstado(facturaSeleccionada.status)">{{ facturaSeleccionada.sri_estado || facturaSeleccionada.status }}</span>
          </div>
          <div v-if="facturaSeleccionada.numero_autorizacion">
            <strong>Nro. Autorización:</strong> {{ facturaSeleccionada.numero_autorizacion }}
          </div>
          <div v-if="facturaSeleccionada.fecha_autorizacion">
            <strong>Fecha Autorización:</strong> {{ facturaSeleccionada.fecha_autorizacion }}
          </div>
          <div v-if="facturaSeleccionada.sri_mensaje" style="color:#e74c3c;">
            <strong>Mensaje SRI:</strong> {{ facturaSeleccionada.sri_mensaje }}
          </div>
        </div>
        <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
          <button class="btn btn-outline" @click="facturaSeleccionada = null">Cerrar</button>
        </div>
      </div>
    </div>

    <p v-if="procesando" style="text-align:center; color:var(--text-muted); margin-top:1rem;">
      ⏳ Comunicando con SRI...
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../../shared/api'
import { descargar, abrirPDF } from '@/shared/descargas'
import { useParametrosStore } from '../../../stores/parametros'
import InvoiceFormModal from './components/InvoiceFormModal.vue'

const parametrosStore = useParametrosStore()
const simbolo = computed(() => parametrosStore.company?.simbolo || '$')
const invoices = ref([])
const mostrarForm = ref(false)
const guardando = ref(false)
const procesando = ref(false)
const errorForm = ref('')
const facturaSeleccionada = ref(null)
const certConfigurado = ref(true)

const seleccionadas = ref([])
const emitibles = computed(() => invoices.value.filter(f => (f.status === 'draft' || f.status === 'not_authorized') && f.cliente_identificacion !== '9999999999999'))
const todasSeleccionadas = computed(() => emitibles.value.length > 0 && emitibles.value.every(f => seleccionadas.value.includes(f.id)))

async function toggleTodas() {
  if (todasSeleccionadas.value) {
    seleccionadas.value = []
  } else {
    try {
      procesando.value = true
      const { data } = await api.get('/facturacion/?pending_ids=true')
      seleccionadas.value = data.ids
    } catch (e) {
      console.error(e)
      alert('Error al seleccionar todas las facturas pendientes')
    } finally {
      procesando.value = false
    }
  }
}

async function emitirMasivo() {
  if (!seleccionadas.value.length) return
  if (!confirm(`¿Estás seguro de emitir ${seleccionadas.value.length} facturas al SRI?`)) return
  
  procesando.value = true
  let exitosas = 0
  let fallidas = 0
  
  for (const id of seleccionadas.value) {
    try {
      const { data } = await api.post(`/facturacion/${id}/emitir/`)
      const mapped = mapFactura(data)
      const idx = invoices.value.findIndex(f => f.id === id)
      if (idx >= 0) invoices.value[idx] = mapped
      exitosas++
    } catch (e) {
      console.error(e)
      fallidas++
    }
  }
  
  procesando.value = false
  seleccionadas.value = []
  alert(`Emisión Masiva Completada.\nExitosas: ${exitosas}\nFallidas: ${fallidas}`)
}

function abrirNuevaFactura() {
  mostrarForm.value = true
}

const badgeEstado = (e) => ({
  draft:      'badge badge-secondary',
  sent_to_sri:   'badge badge-info',
  authorized:    'badge badge-success',
  not_authorized: 'badge badge-danger',
  canceled:     'badge badge-secondary',
}[e] || 'badge badge-secondary')

const labelEstado = (e) => ({
  draft:      'Borrador',
  sent_to_sri:   'Enviada SRI',
  authorized:    'Autorizada',
  not_authorized: 'No Autorizada',
  canceled:     'Cancelada',
}[e] || e)

const labelFormaPago = (c) => ({
  '01': 'Efectivo', '16': 'Débito', '19': 'Crédito',
  '17': 'Dinero elect.', '18': 'Prepago', '20': 'Otros',
}[c] || c || '-')

const mapFactura = (f) => ({
  ...f,
  numero: f.number,
  customer: f.client,
  cliente_identificacion: f.client_identification,
  date: f.date,
  created_at: f.created_at,
  vat: f.vat,
  forma_pago: f.payment_method,
  status: f.status,
  clave_acceso: f.access_key,
  sri_estado: f.sri_status,
  sri_mensaje: f.sri_message,
  numero_autorizacion: f.authorization_number,
  fecha_autorizacion: f.authorization_date
})

const currentPage = ref(1)
const totalPages = ref(1)
const totalRecords = ref(0)

async function cargar(page = 1) {
  try {
    const { data } = await api.get(`/facturacion/?page=${page}&limit=10`)
    invoices.value = data.data.map(mapFactura)
    currentPage.value = data.page
    totalPages.value = Math.ceil(data.total / data.limit)
    totalRecords.value = data.total
  } catch {
    invoices.value = []
  }
}

async function guardarFactura(payload) {
  const { form, itemsValidos } = payload
  guardando.value = true
  try {
    if (form._guardar_cliente && form.cliente_tipo_id !== '07') {
      try {
        await api.post('/ventas/customers/', {
          name: form.customer,
          rfc: form.cliente_identificacion,
          email: form.cliente_email,
          phone: form.cliente_telefono || '',
          address: form.cliente_direccion,
        })
      } catch { /* si falla no bloqueamos la invoice */ }
    }
    await api.post('/facturacion/', {
      client: form.customer,
      client_identification: form.cliente_identificacion,
      client_id_type: form.cliente_tipo_id,
      client_address: form.cliente_direccion,
      client_email: form.cliente_email,
      payment_method: form.forma_pago,
      notes: form.notes,
      items: itemsValidos,
    })
    await cargar()
    mostrarForm.value = false
  } catch (e) {
    errorForm.value = e.response?.data?.error || 'Error al crear la invoice. Revisa los datos.'
  } finally {
    guardando.value = false
  }
}

async function emitir(invoice) {
  procesando.value = true
  try {
    const { data } = await api.post(`/facturacion/${invoice.id}/emitir/`)
    const mapped = mapFactura(data)
    const idx = invoices.value.findIndex(f => f.id === invoice.id)
    if (idx >= 0) invoices.value[idx] = mapped
    if (data.sri_mensaje) alert(`SRI: ${data.sri_mensaje}`)
  } catch (e) {
    alert(e.response?.data?.error || 'Error al emitir')
  } finally {
    procesando.value = false
  }
}

async function autorizar(invoice) {
  procesando.value = true
  try {
    const { data } = await api.post(`/facturacion/${invoice.id}/autorizar/`)
    const mapped = mapFactura(data)
    const idx = invoices.value.findIndex(f => f.id === invoice.id)
    if (idx >= 0) invoices.value[idx] = mapped
    facturaSeleccionada.value = mapped
  } catch (e) {
    alert(e.response?.data?.error || 'Error al consultar autorización')
  } finally {
    procesando.value = false
  }
}

async function cancelar(id, status) {
  const msg = status === 'autorizada'
    ? '¿Anular esta invoice autorizada? Los products volverán al inventory.'
    : '¿Anular esta invoice?'
  if (!confirm(msg)) return
  try {
    await api.post(`/facturacion/${id}/cancelar/`)
    await cargar()
  } catch (e) {
    alert(e.response?.data?.error || 'Error al anular')
  }
}

async function descargarXML(invoice) {
  try {
    await descargar(`/facturacion/${invoice.id}/xml/`, `factura-${invoice.number}.xml`)
  } catch (e) {
    alert('Error al descargar el XML')
  }
}

async function verPDF(invoice) {
  try {
    await abrirPDF(`/reportes/pdf/invoice/${invoice.id}/`)
  } catch (e) {
    alert('Error al abrir el PDF')
  }
}

function verAutorizacion(invoice) {
  facturaSeleccionada.value = invoice
}

const formatDecimal = (value) => {
  const val = parseFloat(value)
  return isNaN(val) ? '0.00' : val.toFixed(2)
}

onMounted(async () => {
  await parametrosStore.cargar()
  await cargar()
  const cert = parametrosStore.obtener('facturacion', 'signature_file', '')
  certConfigurado.value = !!cert
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  if (e.key === 'Escape') {
    if (mostrarForm.value) cerrarModal()
    else if (facturaSeleccionada.value) facturaSeleccionada.value = null
  }
}
</script>

