<template>
  <div>
    <div class="page-header">
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
              <th>Tipo</th>
              <th>Número</th><th>Cliente</th>
              <th>Fecha</th><th>Subtotal</th><th>IVA</th><th>Total</th>
              <th>F. Pago</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="10" style="padding: 0; border: none;">
                <TableSkeleton :rows="6" :has-avatar="false" :has-badge="true" :has-actions="true" />
              </td>
            </tr>
            <template v-else>
              <tr v-for="f in invoices" :key="f.id">
              <td style="text-align: center;">
                <input v-if="f.status === 'draft' || f.status === 'not_authorized'" 
                       type="checkbox" :value="f.id" v-model="seleccionadas" />
              </td>
              <td>
                <span :class="['badge', f.document_type === '02' ? 'badge-info' : 'badge-primary']">
                  {{ f.document_type === '02' ? 'Nota Venta' : 'Factura' }}
                </span>
              </td>
              <td style="font-family:monospace; font-weight:600; color:var(--color-primario)">{{ f.numero }}</td>
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
                  <button v-if="f.status === 'draft' || f.status === 'not_authorized'" class="btn btn-primary"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem" @click="emitir(f)" :disabled="procesando">
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
                  <button v-if="f.status === 'authorized' || f.status === 'autorizada'" class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#d97706; color:white"
                    @click="abrirTicket(f)"
                    title="Imprimir Tirilla Térmica (58mm / 80mm)">
                    <i class="fa-solid fa-receipt"></i> Ticket
                  </button>
                  <button v-if="f.status === 'authorized' || f.status === 'autorizada'" class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#0284c7; color:white"
                    :disabled="enviandoCorreoId === f.id"
                    @click="abrirModalCorreo(f)"
                    title="Enviar RIDE PDF y XML por correo electrónico">
                    {{ enviandoCorreoId === f.id ? 'Enviando...' : '📧 Correo' }}
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
              <td colspan="10" style="padding: 0; border: none;">
                <EmptyState 
                  icon="fa-solid fa-file-invoice-dollar"
                  icon-color="text-brand-500"
                  icon-bg="bg-brand-50"
                  title="Aún no has emitido facturas electrónicas"
                  description="Comienza emitiendo tu primera factura electrónica o realiza ventas desde el punto de venta (POS) para autorizarlas ante el SRI."
                  action-text="+ Emitir Primera Factura"
                  action-icon="fa-solid fa-plus"
                  @action="mostrarForm = true"
                />
              </td>
            </tr>
            </template>
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
          <div><strong>Tipo:</strong> {{ facturaSeleccionada.document_type === '02' ? 'Nota de Venta' : 'Factura' }}</div>
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
        <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
          <button v-if="facturaSeleccionada.status === 'authorized' || facturaSeleccionada.status === 'autorizada'"
            class="btn" style="background:#d97706; color:white;"
            @click="abrirTicket(facturaSeleccionada)">
            <i class="fa-solid fa-receipt" style="margin-right:0.25rem;"></i>
            Ticket Térmico
          </button>
          <button v-if="facturaSeleccionada.status === 'authorized' || facturaSeleccionada.status === 'autorizada'"
            class="btn" style="background:#0284c7; color:white;"
            :disabled="enviandoCorreoId === facturaSeleccionada.id"
            @click="abrirModalCorreo(facturaSeleccionada)">
            <i class="fa-solid fa-paper-plane" style="margin-right:0.25rem;"></i>
            {{ enviandoCorreoId === facturaSeleccionada.id ? 'Enviando...' : 'Reenviar Correo' }}
          </button>
          <button class="btn btn-outline" @click="facturaSeleccionada = null">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal Reenviar Correo -->
    <div v-if="facturaParaCorreo" class="modal-overlay" @mousedown.self="facturaParaCorreo = null">
      <div class="modal" style="position:relative; max-width:440px;">
        <button class="btn" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;" @click="facturaParaCorreo = null" title="Cerrar">✕</button>
        <h3 style="margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">
          <span>📧</span> Enviar Factura por Correo
        </h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          Se enviará el <strong>RIDE en PDF</strong> y el <strong>XML autorizado</strong> de la factura <strong>{{ facturaParaCorreo.numero }}</strong> al cliente.
        </p>

        <div class="form-group" style="margin-bottom:1rem;">
          <label style="font-weight:600; display:block; margin-bottom:0.35rem; font-size:0.85rem;">Correo Electrónico Destinatario *</label>
          <input
            v-model="correoDestinatario"
            type="email"
            class="input"
            placeholder="cliente@ejemplo.com"
            required
          />
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
          <button class="btn btn-outline" @click="facturaParaCorreo = null">Cancelar</button>
          <button
            class="btn btn-primary"
            :disabled="enviandoCorreo || !correoDestinatario"
            @click="enviarCorreoConfirmado"
          >
            {{ enviandoCorreo ? 'Enviando...' : 'Enviar Correo' }}
          </button>
        </div>
      </div>
    </div>

    <ReceiptModal 
      :show="mostrarTicketModal" 
      :lastSaleData="ticketData"
      @close="mostrarTicketModal = false"
    />

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
import ReceiptModal from '@/modules/pos/ui/components/ReceiptModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

const cargando = ref(true)
const parametrosStore = useParametrosStore()
const simbolo = computed(() => parametrosStore.company?.simbolo || '$')
const invoices = ref([])
const mostrarForm = ref(false)
const guardando = ref(false)
const procesando = ref(false)
const errorForm = ref('')
const facturaSeleccionada = ref(null)
const certConfigurado = ref(true)
const mostrarTicketModal = ref(false)
const ticketData = ref(null)

const seleccionadas = ref([])
const emitibles = computed(() => invoices.value.filter(f => (f.status === 'draft' || f.status === 'not_authorized')))
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
  '01': 'Efectivo', '16': 'Tarjeta Débito', '19': 'Tarjeta Crédito',
  '17': 'Dinero elect.', '18': 'Prepago', '20': 'Transferencia / Bancos',
  '15': 'Compensación', '21': 'Endoso'
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
  cargando.value = true
  try {
    const { data } = await api.get(`/facturacion/?page=${page}&limit=10`)
    invoices.value = data.data.map(mapFactura)
    currentPage.value = data.page
    totalPages.value = Math.ceil(data.total / data.limit)
    totalRecords.value = data.total
  } catch {
    invoices.value = []
  } finally {
    cargando.value = false
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
          address: form.cliente_direccion || 'S/D',
        })
      } catch { /* si falla no bloqueamos la invoice */ }
    }
    const res = await api.post('/facturacion/', {
      client: form.customer,
      client_identification: form.cliente_identificacion,
      client_id_type: form.cliente_tipo_id,
      client_address: form.cliente_direccion || 'S/D',
      client_email: form.cliente_email || '',
      payment_method: form.forma_pago,
      notes: form.notes,
      items: itemsValidos,
    })

    const facturaCreada = (res.data?.data && res.data.data[0]) ? res.data.data[0] : (res.data?.data || res.data)
    
    // Emitir inmediatamente al SRI tras guardar
    if (facturaCreada && facturaCreada.id) {
      try {
        const emitRes = await api.post(`/facturacion/${facturaCreada.id}/emitir/`)
        const sriMsg = emitRes.data?.sri_mensaje || ''
        if (sriMsg) {
          alert(`Factura ${facturaCreada.number || ''} emitida al SRI:\n${sriMsg}`)
        } else {
          alert(`Factura ${facturaCreada.number || ''} creada y enviada al SRI con éxito.`)
        }
      } catch (errEmit) {
        console.warn('Error al emitir al SRI inmediatamente:', errEmit)
        const errData = errEmit.response?.data
        let errDetail = 'Error al enviar al SRI'
        if (errData?.error) errDetail = errData.error
        else if (errData?.data && Array.isArray(errData.data) && errData.data[0]?.message) errDetail = errData.data[0].message
        else if (errData?.message) errDetail = errData.message
        alert(`Factura guardada como borrador, pero el SRI retornó:\n${errDetail}`)
      }
    }

    await cargar()
    mostrarForm.value = false
  } catch (e) {
    console.error('Error al guardar factura:', e)
    const errData = e.response?.data
    let msg = 'Error al crear la factura.'
    if (errData?.error) msg = errData.error
    else if (errData?.data && Array.isArray(errData.data) && errData.data[0]?.message) msg = errData.data[0].message
    else if (errData?.message) msg = errData.message
    alert(msg)
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
    else alert(`Factura enviada al SRI con éxito. Estado: ${data.sri_estado || data.status}`)
    await cargar()
  } catch (e) {
    console.error('Error al emitir factura:', e)
    const errData = e.response?.data
    let msg = 'Error al emitir factura.'
    if (errData?.error) msg = errData.error
    else if (errData?.data && Array.isArray(errData.data) && errData.data[0]?.message) msg = errData.data[0].message
    else if (errData?.message) msg = errData.message
    alert(msg)
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

function abrirTicket(invoice) {
  ticketData.value = {
    id: invoice.id,
    invoice_number: invoice.numero || invoice.number,
    numero: invoice.numero || invoice.number,
    access_key: invoice.clave_acceso || invoice.access_key,
    clave_acceso: invoice.clave_acceso || invoice.access_key,
    authorization_number: invoice.numero_autorizacion || invoice.authorization_number,
    document_type: invoice.document_type || '01',
    created_at: invoice.created_at || invoice.date,
    payment_method: invoice.forma_pago || invoice.payment_method,
    client: {
      name: invoice.customer || invoice.client,
      identification: invoice.cliente_identificacion || invoice.client_identification,
      address: invoice.client_address || ''
    },
    subtotal: invoice.subtotal,
    tax: invoice.vat,
    total: invoice.total,
    items: (invoice.items || []).map(i => ({
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: i.total || i.subtotal || (parseFloat(i.quantity) * parseFloat(i.unit_price || 0)).toFixed(2)
    }))
  }
  mostrarTicketModal.value = true
}

function verAutorizacion(invoice) {
  facturaSeleccionada.value = invoice
}

const enviandoCorreoId = ref(null)
const enviandoCorreo = ref(false)
const facturaParaCorreo = ref(null)
const correoDestinatario = ref('')

function abrirModalCorreo(invoice) {
  facturaParaCorreo.value = invoice
  correoDestinatario.value = invoice.client_email || invoice.cliente_email || ''
}

async function enviarCorreoConfirmado() {
  if (!correoDestinatario.value || !facturaParaCorreo.value) return
  enviandoCorreo.value = true
  enviandoCorreoId.value = facturaParaCorreo.value.id
  try {
    const { data } = await api.post(`/facturacion/${facturaParaCorreo.value.id}/enviar-correo/`, {
      email: correoDestinatario.value
    })
    alert(data.mensaje || 'Comprobante enviado exitosamente por correo electrónico')
    facturaParaCorreo.value = null
  } catch (e) {
    alert(e.response?.data?.error || 'Error al enviar comprobante por correo')
  } finally {
    enviandoCorreo.value = false
    enviandoCorreoId.value = null
  }
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

