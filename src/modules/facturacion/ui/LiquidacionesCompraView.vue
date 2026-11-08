<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title" style="margin:0;">🧾 Liquidaciones de Compra y Servicios</h1>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0.25rem 0 0 0;">
          Emisión electrónica (Tipo 03 SRI) para compras y contratación de servicios a personas sin RUC (Art. 43 RALRTI)
        </p>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-outline" @click="cargarLiquidaciones" :disabled="cargando">
          <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': cargando }" style="margin-right:0.25rem;"></i>
          Refrescar
        </button>
        <button class="btn btn-primary" @click="mostrarModal = true">
          <i class="fa-solid fa-plus" style="margin-right:0.25rem;"></i>
          + Nueva Liquidación
        </button>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="card" style="padding:0.75rem 1rem; margin-bottom:1rem; display:flex; flex-wrap:wrap; gap:1rem; align-items:center; justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:0.5rem; flex:1; min-width:240px;">
        <i class="fa-solid fa-magnifying-glass" style="color:#94a3b8;"></i>
        <input
          v-model="filtroTexto"
          type="text"
          class="input"
          style="width:100%; border:none; background:transparent; font-size:0.85rem;"
          placeholder="Buscar por proveedor, cédula, número de liquidación..."
        />
      </div>

      <div style="display:flex; gap:0.5rem; align-items:center;">
        <span style="font-size:0.8rem; color:var(--text-muted);">Estado:</span>
        <select v-model="filtroEstado" class="input" style="font-size:0.8rem; padding:0.25rem 0.5rem;">
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent_to_sri">Enviada SRI</option>
          <option value="authorized">Autorizada</option>
          <option value="not_authorized">No Autorizada</option>
        </select>
      </div>
    </div>

    <!-- Tabla Principal -->
    <div class="card" style="padding:0; overflow:hidden;">
      <div style="overflow-x:auto;">
        <table class="table" style="font-size:0.85rem;">
          <thead>
            <tr>
              <th>Número</th>
              <th>Proveedor (Sin RUC)</th>
              <th>Fecha</th>
              <th>Subtotal 0%</th>
              <th>Subtotal IVA</th>
              <th>IVA</th>
              <th>Total</th>
              <th>Estado SRI</th>
              <th style="min-width:180px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="liq in liquidacionesFiltradas" :key="liq.id">
              <td style="font-family:monospace; font-weight:600; white-space:nowrap;">
                {{ liq.number || 'Borrador' }}
              </td>
              <td>
                <div style="font-weight:500; color:#1e293b;">{{ liq.supplier }}</div>
                <div style="font-size:0.75rem; color:#64748b; font-family:monospace;">
                  C.I. {{ liq.supplier_identification }}
                </div>
              </td>
              <td style="white-space:nowrap; color:#64748b;">
                {{ liq.date }}
              </td>
              <td style="font-family:monospace;">${{ formatMoney(liq.subtotal_0) }}</td>
              <td style="font-family:monospace;">${{ formatMoney(liq.subtotal_iva) }}</td>
              <td style="font-family:monospace;">${{ formatMoney(liq.vat) }}</td>
              <td style="font-weight:bold; color:#0f172a; white-space:nowrap; font-family:monospace;">
                ${{ formatMoney(liq.total) }}
              </td>
              <td>
                <span :class="badgeEstado(liq.status)">
                  {{ labelEstado(liq.status) }}
                </span>
              </td>
              <td>
                <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">
                  <!-- Emitir al SRI -->
                  <button
                    v-if="liq.status === 'draft' || liq.status === 'not_authorized'"
                    class="btn btn-primary"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    :disabled="accionEnProceso[liq.id]"
                    @click="emitir(liq)"
                    title="Firmar digitalmente y enviar al SRI"
                  >
                    <i class="fa-solid fa-paper-plane" :class="{ 'fa-spin': accionEnProceso[liq.id] }" style="margin-right:0.25rem;"></i>
                    Emitir
                  </button>

                  <!-- Consultar Autorización -->
                  <button
                    v-if="liq.status === 'sent_to_sri'"
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    :disabled="accionEnProceso[liq.id]"
                    @click="consultarAutorizacion(liq)"
                    title="Consultar estado de autorización en el SRI"
                  >
                    <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': accionEnProceso[liq.id] }" style="margin-right:0.25rem;"></i>
                    Consultar
                  </button>

                  <!-- Descargar XML -->
                  <button
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    @click="descargarXML(liq)"
                    title="Descargar archivo XML"
                  >
                    <i class="fa-solid fa-file-code" style="margin-right:0.25rem; color:#0284c7;"></i>
                    XML
                  </button>

                  <!-- Descargar RIDE PDF -->
                  <button
                    class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#8e44ad; color:white;"
                    @click="verPDF(liq)"
                    title="Ver RIDE en PDF Oficial SRI"
                  >
                    <i class="fa-solid fa-file-pdf" style="margin-right:0.25rem;"></i>
                    PDF
                  </button>

                  <!-- Enviar Correo -->
                  <button
                    v-if="liq.status === 'authorized' || liq.status === 'autorizada'"
                    class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#0284c7; color:white;"
                    :disabled="enviandoCorreoId === liq.id"
                    @click="abrirModalCorreo(liq)"
                    title="Enviar liquidación de compra por correo"
                  >
                    <i class="fa-solid fa-envelope" style="margin-right:0.25rem;"></i>
                    {{ enviandoCorreoId === liq.id ? '...' : 'Correo' }}
                  </button>

                  <!-- Detalle -->
                  <button
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    @click="liquidacionSeleccionada = liq"
                    title="Ver detalle del comprobante y clave de acceso"
                  >
                    <i class="fa-solid fa-eye" style="margin-right:0.25rem;"></i>
                    Detalle
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!cargando && !liquidacionesFiltradas.length">
              <td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">
                <i class="fa-solid fa-receipt" style="font-size:2rem; margin-bottom:0.5rem; display:block; opacity:0.3;"></i>
                No se encontraron liquidaciones de compra registradas
              </td>
            </tr>

            <tr v-if="cargando">
              <td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:0.5rem;"></i>
                Cargando liquidaciones de compra...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Creación de Liquidación -->
    <PurchaseSettlementFormModal
      :show="mostrarModal"
      :procesando="guardando"
      @close="mostrarModal = false"
      @submit="guardarNuevaLiquidacion"
    />

    <!-- Modal de Detalle SRI -->
    <div v-if="liquidacionSeleccionada" class="modal-overlay" @mousedown.self="liquidacionSeleccionada = null">
      <div class="modal" style="position:relative; max-width:720px; width:95%; max-height:90vh; overflow-y:auto;">
        <button
          class="btn"
          style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;"
          @click="liquidacionSeleccionada = null"
        >
          ✕
        </button>

        <h3 style="margin:0 0 1rem 0;">Detalle Liquidación de Compra (Tipo 03 SRI)</h3>
        
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.85rem;">
          <div><strong>Comprobante:</strong> {{ liquidacionSeleccionada.number }}</div>
          <div><strong>Proveedor:</strong> {{ liquidacionSeleccionada.supplier }} (Cédula: {{ liquidacionSeleccionada.supplier_identification }})</div>
          <div v-if="liquidacionSeleccionada.supplier_address"><strong>Dirección:</strong> {{ liquidacionSeleccionada.supplier_address }}</div>
          <div v-if="liquidacionSeleccionada.supplier_email"><strong>Correo:</strong> {{ liquidacionSeleccionada.supplier_email }}</div>
          <div><strong>Fecha de Emisión:</strong> {{ liquidacionSeleccionada.date }}</div>
          <div><strong>Forma de Pago:</strong> Código {{ liquidacionSeleccionada.payment_method }}</div>
          <div v-if="liquidacionSeleccionada.notes"><strong>Notas:</strong> {{ liquidacionSeleccionada.notes }}</div>
          
          <div>
            <strong>Clave de Acceso SRI (49 dígitos):</strong>
            <div style="font-family:monospace; font-size:0.75rem; background:#f1f5f9; padding:0.4rem; border-radius:6px; word-break:break-all; margin-top:0.25rem;">
              {{ liquidacionSeleccionada.access_key || 'No asignada' }}
            </div>
          </div>

          <div>
            <strong>Estado:</strong>
            <span :class="badgeEstado(liquidacionSeleccionada.status)" style="margin-left:0.35rem;">
              {{ labelEstado(liquidacionSeleccionada.status) }}
            </span>
          </div>

          <div v-if="liquidacionSeleccionada.authorization_number">
            <strong>N° Autorización:</strong>
            <span style="font-family:monospace; margin-left:0.35rem;">{{ liquidacionSeleccionada.authorization_number }}</span>
          </div>

          <div v-if="liquidacionSeleccionada.authorization_date">
            <strong>Fecha de Autorización:</strong>
            <span style="margin-left:0.35rem;">{{ liquidacionSeleccionada.authorization_date }}</span>
          </div>

          <div v-if="liquidacionSeleccionada.sri_message" style="background:#fef2f2; color:#b91c1c; padding:0.5rem; border-radius:6px; font-size:0.8rem;">
            <strong>Mensaje SRI:</strong> {{ liquidacionSeleccionada.sri_message }}
          </div>

          <!-- Desglose de Líneas de Compra -->
          <div style="margin-top:0.5rem; border-top:1px solid #e2e8f0; padding-top:0.5rem;">
            <strong>Detalle de Bienes / Servicios:</strong>
            <table class="table" style="font-size:0.8rem; margin-top:0.35rem;">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th style="text-align:right;">Cant.</th>
                  <th style="text-align:right;">P. Unit.</th>
                  <th style="text-align:right;">IVA</th>
                  <th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in liquidacionSeleccionada.items" :key="i">
                  <td style="font-family:monospace;">{{ it.product_code || '-' }}</td>
                  <td>{{ it.description }}</td>
                  <td style="text-align:right;">{{ it.quantity }}</td>
                  <td style="text-align:right; font-family:monospace;">${{ formatMoney(it.unit_price) }}</td>
                  <td style="text-align:right;">{{ it.vat_rate }}%</td>
                  <td style="text-align:right; font-weight:600; font-family:monospace;">${{ formatMoney(it.subtotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Resumen de Liquidación -->
          <div style="display:flex; justify-content:flex-end; margin-top:0.5rem;">
            <div style="width:240px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:0.5rem 0.75rem; font-size:0.8rem; display:flex; flex-direction:column; gap:0.25rem;">
              <div style="display:flex; justify-content:space-between;">
                <span>Subtotal 0%:</span>
                <span>${{ formatMoney(liquidacionSeleccionada.subtotal_0) }}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Subtotal IVA:</span>
                <span>${{ formatMoney(liquidacionSeleccionada.subtotal_iva) }}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>IVA:</span>
                <span>${{ formatMoney(liquidacionSeleccionada.vat) }}</span>
              </div>
              <div style="border-top:1px solid #cbd5e1; padding-top:0.25rem; font-weight:bold; font-size:0.9rem; display:flex; justify-content:space-between;">
                <span>Total:</span>
                <span>${{ formatMoney(liquidacionSeleccionada.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top:1.25rem; display:flex; justify-content:flex-end; gap:0.5rem;">
          <button class="btn btn-outline" @click="liquidacionSeleccionada = null">Cerrar</button>
          <button
            v-if="liquidacionSeleccionada.status === 'authorized' || liquidacionSeleccionada.status === 'autorizada'"
            class="btn"
            style="background:#0284c7; color:white;"
            :disabled="enviandoCorreoId === liquidacionSeleccionada.id"
            @click="abrirModalCorreo(liquidacionSeleccionada)"
          >
            <i class="fa-solid fa-paper-plane" style="margin-right:0.25rem;"></i>
            {{ enviandoCorreoId === liquidacionSeleccionada.id ? 'Enviando...' : 'Reenviar Correo' }}
          </button>
          <button class="btn" style="background:#8e44ad; color:white;" @click="verPDF(liquidacionSeleccionada)">
            <i class="fa-solid fa-file-pdf" style="margin-right:0.25rem;"></i> Imprimir RIDE PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Reenviar Correo Liquidación -->
    <div v-if="liquidacionParaCorreo" class="modal-overlay" @mousedown.self="liquidacionParaCorreo = null">
      <div class="modal" style="position:relative; max-width:440px;">
        <button class="btn" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;" @click="liquidacionParaCorreo = null" title="Cerrar">✕</button>
        <h3 style="margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">
          <span>📧</span> Enviar Liquidación de Compra por Correo
        </h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          Se enviará el <strong>RIDE en PDF</strong> y el <strong>XML autorizado</strong> de la liquidación <strong>{{ liquidacionParaCorreo.number }}</strong> al proveedor.
        </p>

        <div class="form-group" style="margin-bottom:1rem;">
          <label style="font-weight:600; display:block; margin-bottom:0.35rem; font-size:0.85rem;">Correo Electrónico Destinatario *</label>
          <input
            v-model="correoDestinatario"
            type="email"
            class="input"
            placeholder="proveedor@ejemplo.com"
            required
          />
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
          <button class="btn btn-outline" @click="liquidacionParaCorreo = null">Cancelar</button>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/shared/api'
import PurchaseSettlementFormModal from './PurchaseSettlementFormModal.vue'

const liquidaciones = ref([])
const cargando = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const liquidacionSeleccionada = ref(null)

const filtroTexto = ref('')
const filtroEstado = ref('')
const accionEnProceso = reactive({})

const badgeEstado = (status) => {
  switch (status) {
    case 'authorized':
    case 'autorizada':
      return 'badge badge-success'
    case 'sent_to_sri':
      return 'badge badge-warning'
    case 'not_authorized':
      return 'badge badge-danger'
    default:
      return 'badge badge-secondary'
  }
}

const labelEstado = (status) => {
  switch (status) {
    case 'authorized':
    case 'autorizada':
      return 'Autorizada'
    case 'sent_to_sri':
      return 'Enviada SRI'
    case 'not_authorized':
      return 'No Autorizada'
    case 'draft':
      return 'Borrador'
    default:
      return status || 'Borrador'
  }
}

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const liquidacionesFiltradas = computed(() => {
  return liquidaciones.value.filter(l => {
    const texto = filtroTexto.value.toLowerCase()
    const matchTexto = !texto ||
      (l.supplier && l.supplier.toLowerCase().includes(texto)) ||
      (l.supplier_identification && l.supplier_identification.includes(texto)) ||
      (l.number && l.number.toLowerCase().includes(texto))

    const matchEstado = !filtroEstado.value || l.status === filtroEstado.value
    return matchTexto && matchEstado
  })
})

const cargarLiquidaciones = async () => {
  cargando.value = true
  try {
    const res = await api.get('/facturacion/liquidaciones-compra/')
    liquidaciones.value = res.data || []
  } catch (error) {
    console.error('Error al cargar liquidaciones de compra:', error)
  } finally {
    cargando.value = false
  }
}

const guardarNuevaLiquidacion = async (formData) => {
  guardando.value = true
  try {
    const res = await api.post('/facturacion/liquidaciones-compra/', formData)
    liquidaciones.value.unshift(res.data)
    mostrarModal.value = false
    alert(`Liquidación de Compra ${res.data.number} creada exitosamente en estado borrador.`)
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Error al guardar liquidación'
    alert(msg)
  } finally {
    guardando.value = false
  }
}

const emitir = async (liq) => {
  if (!confirm(`¿Desea firmar digitalmente y enviar la Liquidación ${liq.number} al SRI?`)) return
  accionEnProceso[liq.id] = true
  try {
    const res = await api.post(`/facturacion/liquidaciones-compra/${liq.id}/emitir/`)
    Object.assign(liq, res.data)
    alert(`Liquidación ${liq.number} enviada al SRI. Estado: ${liq.sri_status}`)
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Error al emitir liquidación'
    alert(msg)
  } finally {
    accionEnProceso[liq.id] = false
  }
}

const consultarAutorizacion = async (liq) => {
  accionEnProceso[liq.id] = true
  try {
    const res = await api.post(`/facturacion/liquidaciones-compra/${liq.id}/autorizar/`)
    Object.assign(liq, res.data)
    alert(`Consulta SRI completada: Estado ${liq.sri_status}`)
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Error al consultar autorización'
    alert(msg)
  } finally {
    accionEnProceso[liq.id] = false
  }
}

const descargarXML = (liq) => {
  window.open(`${api.defaults.baseURL || ''}/facturacion/liquidaciones-compra/${liq.id}/xml/`, '_blank')
}

const verPDF = (liq) => {
  window.open(`${api.defaults.baseURL || ''}/reportes/pdf/purchase-settlement/${liq.id}/`, '_blank')
}

const enviandoCorreoId = ref(null)
const enviandoCorreo = ref(false)
const liquidacionParaCorreo = ref(null)
const correoDestinatario = ref('')

const abrirModalCorreo = (liq) => {
  liquidacionParaCorreo.value = liq
  correoDestinatario.value = liq.supplier_email || ''
}

const enviarCorreoConfirmado = async () => {
  if (!correoDestinatario.value || !liquidacionParaCorreo.value) return
  enviandoCorreo.value = true
  enviandoCorreoId.value = liquidacionParaCorreo.value.id
  try {
    const { data } = await api.post(`/facturacion/liquidaciones-compra/${liquidacionParaCorreo.value.id}/enviar-correo/`, {
      email: correoDestinatario.value
    })
    alert(data.mensaje || 'Liquidación de compra enviada exitosamente por correo electrónico.')
    liquidacionParaCorreo.value = null
  } catch (error) {
    alert(error.response?.data?.error || 'No se pudo enviar el correo de la liquidación de compra.')
  } finally {
    enviandoCorreo.value = false
    enviandoCorreoId.value = null
  }
}

onMounted(() => {
  cargarLiquidaciones()
})
</script>
