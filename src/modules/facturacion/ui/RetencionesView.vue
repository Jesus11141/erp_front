<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title" style="margin:0;">Comprobantes de Retención</h1>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0.25rem 0 0 0;">
          Gestión y emisión electrónica de retenciones en la fuente (Tipo 07 SRI)
        </p>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-outline" @click="cargarRetenciones" :disabled="cargando">
          <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': cargando }" style="margin-right:0.25rem;"></i>
          Refrescar
        </button>
        <button class="btn btn-primary" @click="mostrarModal = true">
          <i class="fa-solid fa-plus" style="margin-right:0.25rem;"></i>
          + Nueva Retención
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
          placeholder="Buscar por proveedor, RUC o número de comprobante..."
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
              <th>Factura Sustento</th>
              <th>Proveedor</th>
              <th>Período</th>
              <th>Fecha</th>
              <th>Total Retenido</th>
              <th>Estado SRI</th>
              <th style="min-width:180px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ret in retencionesFiltradas" :key="ret.id">
              <td style="font-family:monospace; font-weight:600; white-space:nowrap;">
                {{ ret.number || 'Borrador' }}
              </td>
              <td style="font-family:monospace; color:#64748b; white-space:nowrap;">
                {{ ret.origin_invoice_number || '-' }}
              </td>
              <td>
                <div style="font-weight:500; color:#1e293b;">{{ ret.supplier }}</div>
                <div style="font-size:0.75rem; color:#94a3b8; font-family:monospace;">
                  {{ ret.supplier_identification }}
                </div>
              </td>
              <td style="font-family:monospace; font-size:0.8rem; white-space:nowrap;">
                {{ ret.fiscal_period }}
              </td>
              <td style="white-space:nowrap; color:#64748b;">
                {{ ret.date }}
              </td>
              <td style="font-weight:bold; color:#0f172a; white-space:nowrap;">
                ${{ formatMoney(ret.total_withheld) }}
              </td>
              <td>
                <span :class="badgeEstado(ret.status)">
                  {{ labelEstado(ret.status) }}
                </span>
              </td>
              <td>
                <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">
                  <!-- Emitir al SRI -->
                  <button
                    v-if="ret.status === 'draft' || ret.status === 'not_authorized'"
                    class="btn btn-primary"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    :disabled="accionEnProceso[ret.id]"
                    @click="emitir(ret)"
                    title="Firmar digitalmente y enviar al SRI"
                  >
                    <i class="fa-solid" :class="accionEnProceso[ret.id] ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
                    Emitir
                  </button>

                  <!-- Consultar Autorización -->
                  <button
                    v-if="ret.status === 'sent_to_sri' || (ret.status === 'not_authorized' && ret.access_key)"
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    :disabled="accionEnProceso[ret.id]"
                    @click="consultar(ret)"
                    title="Consultar autorización ante el SRI"
                  >
                    <i class="fa-solid" :class="accionEnProceso[ret.id] ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'"></i>
                    Consultar
                  </button>

                  <!-- Descargar XML -->
                  <button
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    @click="descargarXML(ret)"
                    title="Descargar archivo XML"
                  >
                    <i class="fa-solid fa-download"></i>
                    XML
                  </button>

                  <!-- Descargar RIDE PDF -->
                  <button
                    class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#8e44ad; color:white;"
                    @click="verPDF(ret)"
                    title="Ver RIDE en PDF Oficial SRI"
                  >
                    <i class="fa-solid fa-file-pdf"></i>
                    PDF
                  </button>

                  <!-- Enviar Correo -->
                  <button
                    v-if="ret.status === 'authorized' || ret.status === 'autorizada'"
                    class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#0284c7; color:white;"
                    :disabled="enviandoCorreoId === ret.id"
                    @click="abrirModalCorreo(ret)"
                    title="Enviar comprobante de retención por correo"
                  >
                    <i class="fa-solid fa-envelope"></i>
                    {{ enviandoCorreoId === ret.id ? '...' : 'Correo' }}
                  </button>

                  <!-- Detalle SRI -->
                  <button
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    @click="retencionSeleccionada = ret"
                    title="Ver detalle y clave de acceso"
                  >
                    <i class="fa-solid fa-eye"></i>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!retencionesFiltradas.length && !cargando">
              <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
                No se encontraron comprobantes de retención registrados.
              </td>
            </tr>
            <tr v-if="cargando">
              <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:0.5rem;"></i>
                Cargando retenciones...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Creación de Retención -->
    <WithholdingFormModal
      :show="mostrarModal"
      :procesando="guardando"
      @close="mostrarModal = false"
      @submit="guardarNuevaRetencion"
    />

    <!-- Modal de Detalle SRI -->
    <div v-if="retencionSeleccionada" class="modal-overlay" @mousedown.self="retencionSeleccionada = null">
      <div class="modal" style="position:relative; max-width:650px;">
        <button
          class="btn"
          style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;"
          @click="retencionSeleccionada = null"
        >
          ✕
        </button>

        <h3 style="margin:0 0 1rem 0;">Detalle de Retención Electrónica</h3>
        
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.85rem;">
          <div><strong>Comprobante:</strong> {{ retencionSeleccionada.number }}</div>
          <div><strong>Proveedor:</strong> {{ retencionSeleccionada.supplier }} ({{ retencionSeleccionada.supplier_identification }})</div>
          <div><strong>Factura de Sustento:</strong> {{ retencionSeleccionada.origin_invoice_number || 'N/A' }}</div>
          <div><strong>Período Fiscal:</strong> {{ retencionSeleccionada.fiscal_period }}</div>
          <div><strong>Total Retenido:</strong> ${{ formatMoney(retencionSeleccionada.total_withheld) }}</div>
          
          <div>
            <strong>Clave de Acceso SRI (49 dígitos):</strong>
            <div style="font-family:monospace; font-size:0.75rem; background:#f1f5f9; padding:0.4rem; border-radius:6px; word-break:break-all; margin-top:0.25rem;">
              {{ retencionSeleccionada.access_key || 'No asignada' }}
            </div>
          </div>

          <div>
            <strong>Estado:</strong>
            <span :class="badgeEstado(retencionSeleccionada.status)" style="margin-left:0.35rem;">
              {{ labelEstado(retencionSeleccionada.status) }}
            </span>
          </div>

          <div v-if="retencionSeleccionada.authorization_number">
            <strong>N° Autorización:</strong>
            <span style="font-family:monospace; margin-left:0.35rem;">{{ retencionSeleccionada.authorization_number }}</span>
          </div>

          <div v-if="retencionSeleccionada.authorization_date">
            <strong>Fecha de Autorización:</strong>
            <span style="margin-left:0.35rem;">{{ retencionSeleccionada.authorization_date }}</span>
          </div>

          <div v-if="retencionSeleccionada.sri_message" style="background:#fef2f2; color:#b91c1c; padding:0.5rem; border-radius:6px; font-size:0.8rem;">
            <strong>Mensaje SRI:</strong> {{ retencionSeleccionada.sri_message }}
          </div>

          <!-- Desglose de Líneas de Impuesto -->
          <div style="margin-top:0.5rem; border-top:1px solid #e2e8f0; padding-top:0.5rem;">
            <strong>Líneas Retenidas:</strong>
            <table class="table" style="font-size:0.8rem; margin-top:0.35rem;">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Código</th>
                  <th>Base</th>
                  <th>%</th>
                  <th>Valor Retenido</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in retencionSeleccionada.items" :key="i">
                  <td>{{ it.type_code === '2' ? 'IVA' : 'Renta' }}</td>
                  <td>{{ it.withholding_code }}</td>
                  <td>${{ formatMoney(it.tax_base) }}</td>
                  <td>{{ it.percentage }}%</td>
                  <td><strong>${{ formatMoney(it.withheld_value) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top:1.25rem; display:flex; justify-content:flex-end; gap:0.5rem;">
          <button class="btn btn-outline" @click="retencionSeleccionada = null">Cerrar</button>
          <button
            v-if="retencionSeleccionada.status === 'authorized' || retencionSeleccionada.status === 'autorizada'"
            class="btn"
            style="background:#0284c7; color:white;"
            :disabled="enviandoCorreoId === retencionSeleccionada.id"
            @click="abrirModalCorreo(retencionSeleccionada)"
          >
            <i class="fa-solid fa-paper-plane" style="margin-right:0.25rem;"></i>
            {{ enviandoCorreoId === retencionSeleccionada.id ? 'Enviando...' : 'Reenviar Correo' }}
          </button>
          <button class="btn" style="background:#8e44ad; color:white;" @click="verPDF(retencionSeleccionada)">
            <i class="fa-solid fa-file-pdf" style="margin-right:0.25rem;"></i> Imprimir RIDE PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Reenviar Correo Retención -->
    <div v-if="retencionParaCorreo" class="modal-overlay" @mousedown.self="retencionParaCorreo = null">
      <div class="modal" style="position:relative; max-width:440px;">
        <button class="btn" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;" @click="retencionParaCorreo = null" title="Cerrar">✕</button>
        <h3 style="margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">
          <span>📧</span> Enviar Retención por Correo
        </h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          Se enviará el <strong>RIDE en PDF</strong> y el <strong>XML autorizado</strong> de la retención <strong>{{ retencionParaCorreo.number }}</strong> al proveedor.
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
          <button class="btn btn-outline" @click="retencionParaCorreo = null">Cancelar</button>
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
import WithholdingFormModal from './WithholdingFormModal.vue'

const retenciones = ref([])
const cargando = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const retencionSeleccionada = ref(null)

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

const retencionesFiltradas = computed(() => {
  return retenciones.value.filter(r => {
    const texto = filtroTexto.value.toLowerCase()
    const matchTexto = !texto || 
      (r.supplier && r.supplier.toLowerCase().includes(texto)) ||
      (r.supplier_identification && r.supplier_identification.includes(texto)) ||
      (r.number && r.number.toLowerCase().includes(texto)) ||
      (r.origin_invoice_number && r.origin_invoice_number.includes(texto))

    const matchEstado = !filtroEstado.value || r.status === filtroEstado.value
    return matchTexto && matchEstado
  })
})

const cargarRetenciones = async () => {
  cargando.value = true
  try {
    const res = await api.get('/facturacion/retenciones/')
    retenciones.value = res.data || []
  } catch (error) {
    console.error('Error al cargar retenciones:', error)
  } finally {
    cargando.value = false
  }
}

const guardarNuevaRetencion = async (payload) => {
  guardando.value = true
  try {
    await api.post('/facturacion/retenciones/', payload)
    mostrarModal.value = false
    await cargarRetenciones()
  } catch (error) {
    console.error('Error al crear retención:', error)
    alert(error.response?.data?.error || 'No se pudo guardar la retención. Verifique los datos.')
  } finally {
    guardando.value = false
  }
}

const emitir = async (ret) => {
  accionEnProceso[ret.id] = true
  try {
    const res = await api.post(`/facturacion/retenciones/${ret.id}/emitir/`)
    Object.assign(ret, res.data)
  } catch (error) {
    console.error('Error al emitir retención:', error)
    alert(error.response?.data?.error || 'Error al emitir la retención ante el SRI.')
  } finally {
    accionEnProceso[ret.id] = false
  }
}

const consultar = async (ret) => {
  accionEnProceso[ret.id] = true
  try {
    const res = await api.post(`/facturacion/retenciones/${ret.id}/autorizar/`)
    Object.assign(ret, res.data)
  } catch (error) {
    console.error('Error al consultar retención:', error)
    alert(error.response?.data?.error || 'Error al consultar estado en el SRI.')
  } finally {
    accionEnProceso[ret.id] = false
  }
}

const descargarXML = async (ret) => {
  try {
    const res = await api.get(`/facturacion/retenciones/${ret.id}/xml/`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/xml; charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `retencion-${ret.number || ret.id}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error al descargar XML:', error)
    alert('No se pudo descargar el archivo XML.')
  }
}

const verPDF = (ret) => {
  window.open(`${api.defaults.baseURL || ''}/reportes/pdf/withholding/${ret.id}/`, '_blank')
}

const enviandoCorreoId = ref(null)
const enviandoCorreo = ref(false)
const retencionParaCorreo = ref(null)
const correoDestinatario = ref('')

const abrirModalCorreo = (ret) => {
  retencionParaCorreo.value = ret
  correoDestinatario.value = ret.supplier_email || ret.email || ''
}

const enviarCorreoConfirmado = async () => {
  if (!correoDestinatario.value || !retencionParaCorreo.value) return
  enviandoCorreo.value = true
  enviandoCorreoId.value = retencionParaCorreo.value.id
  try {
    const { data } = await api.post(`/facturacion/retenciones/${retencionParaCorreo.value.id}/enviar-correo/`, {
      email: correoDestinatario.value
    })
    alert(data.mensaje || 'Comprobante de retención enviado exitosamente por correo electrónico.')
    retencionParaCorreo.value = null
  } catch (error) {
    alert(error.response?.data?.error || 'No se pudo enviar el correo de retención.')
  } finally {
    enviandoCorreo.value = false
    enviandoCorreoId.value = null
  }
}

onMounted(() => {
  cargarRetenciones()
})
</script>
