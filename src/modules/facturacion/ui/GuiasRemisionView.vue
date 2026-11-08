<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title" style="margin:0;">🚚 Guías de Remisión Electrónicas</h1>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0.25rem 0 0 0;">
          Gestión y emisión oficial SRI (Tipo 06) para amparar el transporte interprovincial y urbano de mercadería
        </p>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-outline" @click="cargarGuias" :disabled="cargando">
          <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': cargando }" style="margin-right:0.25rem;"></i>
          Refrescar
        </button>
        <button class="btn btn-primary" @click="mostrarModal = true">
          <i class="fa-solid fa-plus" style="margin-right:0.25rem;"></i>
          + Nueva Guía de Remisión
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
          placeholder="Buscar por transportista, placa, destinatario, RUC o número..."
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
              <th>Transportista & Placa</th>
              <th>Destinatario</th>
              <th>Motivo</th>
              <th>Fechas Traslado</th>
              <th>Estado SRI</th>
              <th style="min-width:180px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="guia in guiasFiltradas" :key="guia.id">
              <td style="font-family:monospace; font-weight:600; white-space:nowrap;">
                {{ guia.number || 'Borrador' }}
              </td>
              <td>
                <div style="font-weight:500; color:#1e293b;">{{ guia.carrier_name }}</div>
                <div style="font-size:0.75rem; color:#64748b; display:flex; gap:0.5rem; align-items:center;">
                  <span style="font-family:monospace;">{{ guia.carrier_ruc }}</span>
                  <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700;">
                    🚘 {{ guia.vehicle_plate }}
                  </span>
                </div>
              </td>
              <td>
                <div style="font-weight:500; color:#1e293b;">{{ guia.recipient_name }}</div>
                <div style="font-size:0.75rem; color:#94a3b8; font-family:monospace;">
                  {{ guia.recipient_id }}
                </div>
              </td>
              <td style="font-size:0.8rem; color:#475569;">
                <span class="badge" style="background:#f1f5f9; color:#475569;">{{ guia.transfer_reason }}</span>
              </td>
              <td style="white-space:nowrap; font-size:0.8rem; color:#64748b;">
                <div><i class="fa-regular fa-calendar-check" style="margin-right:0.25rem;"></i> {{ guia.start_date }}</div>
                <div><i class="fa-regular fa-calendar-xmark" style="margin-right:0.25rem;"></i> {{ guia.end_date }}</div>
              </td>
              <td>
                <span :class="badgeEstado(guia.status)">
                  {{ labelEstado(guia.status) }}
                </span>
              </td>
              <td>
                <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">
                  <!-- Emitir al SRI -->
                  <button
                    v-if="guia.status === 'draft' || guia.status === 'not_authorized'"
                    class="btn btn-primary"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    :disabled="accionEnProceso[guia.id]"
                    @click="emitir(guia)"
                    title="Firmar digitalmente y enviar al SRI"
                  >
                    <i class="fa-solid fa-paper-plane" :class="{ 'fa-spin': accionEnProceso[guia.id] }" style="margin-right:0.25rem;"></i>
                    Emitir
                  </button>

                  <!-- Consultar Autorización -->
                  <button
                    v-if="guia.status === 'sent_to_sri'"
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    :disabled="accionEnProceso[guia.id]"
                    @click="consultarAutorizacion(guia)"
                    title="Consultar estado de autorización en el SRI"
                  >
                    <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': accionEnProceso[guia.id] }" style="margin-right:0.25rem;"></i>
                    Consultar
                  </button>

                  <!-- Descargar XML -->
                  <button
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    @click="descargarXML(guia)"
                    title="Descargar archivo XML"
                  >
                    <i class="fa-solid fa-file-code" style="margin-right:0.25rem; color:#0284c7;"></i>
                    XML
                  </button>

                  <!-- Descargar RIDE PDF -->
                  <button
                    class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#8e44ad; color:white;"
                    @click="verPDF(guia)"
                    title="Ver RIDE en PDF Oficial SRI para transporte en carretera"
                  >
                    <i class="fa-solid fa-file-pdf" style="margin-right:0.25rem;"></i>
                    PDF
                  </button>

                  <!-- Enviar Correo -->
                  <button
                    v-if="guia.status === 'authorized' || guia.status === 'autorizada'"
                    class="btn"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#0284c7; color:white;"
                    :disabled="enviandoCorreoId === guia.id"
                    @click="abrirModalCorreo(guia)"
                    title="Enviar guía de remisión por correo"
                  >
                    <i class="fa-solid fa-envelope" style="margin-right:0.25rem;"></i>
                    {{ enviandoCorreoId === guia.id ? '...' : 'Correo' }}
                  </button>

                  <!-- Detalle -->
                  <button
                    class="btn btn-outline"
                    style="padding:0.2rem 0.5rem; font-size:0.75rem;"
                    @click="guiaSeleccionada = guia"
                    title="Ver detalle del comprobante y clave de acceso"
                  >
                    <i class="fa-solid fa-eye" style="margin-right:0.25rem;"></i>
                    Detalle
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!cargando && !guiasFiltradas.length">
              <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
                <i class="fa-solid fa-truck" style="font-size:2rem; margin-bottom:0.5rem; display:block; opacity:0.3;"></i>
                No se encontraron guías de remisión registradas
              </td>
            </tr>

            <tr v-if="cargando">
              <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right:0.5rem;"></i>
                Cargando guías de remisión...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Creación de Guía de Remisión -->
    <DispatchGuideFormModal
      :show="mostrarModal"
      :procesando="guardando"
      @close="mostrarModal = false"
      @submit="guardarNuevaGuia"
    />

    <!-- Modal de Detalle SRI -->
    <div v-if="guiaSeleccionada" class="modal-overlay" @mousedown.self="guiaSeleccionada = null">
      <div class="modal" style="position:relative; max-width:700px; width:95%; max-height:90vh; overflow-y:auto;">
        <button
          class="btn"
          style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;"
          @click="guiaSeleccionada = null"
        >
          ✕
        </button>

        <h3 style="margin:0 0 1rem 0;">Detalle Guía de Remisión (Tipo 06 SRI)</h3>
        
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.85rem;">
          <div><strong>Comprobante:</strong> {{ guiaSeleccionada.number }}</div>
          <div><strong>Transportista:</strong> {{ guiaSeleccionada.carrier_name }} ({{ guiaSeleccionada.carrier_ruc }}) - Placa: <strong>{{ guiaSeleccionada.vehicle_plate }}</strong></div>
          <div><strong>Destinatario:</strong> {{ guiaSeleccionada.recipient_name }} ({{ guiaSeleccionada.recipient_id }})</div>
          <div><strong>Dirección Partida:</strong> {{ guiaSeleccionada.starting_address }}</div>
          <div><strong>Dirección Destino:</strong> {{ guiaSeleccionada.recipient_address }}</div>
          <div><strong>Motivo Traslado:</strong> {{ guiaSeleccionada.transfer_reason }}</div>
          <div v-if="guiaSeleccionada.route"><strong>Ruta:</strong> {{ guiaSeleccionada.route }}</div>
          <div v-if="guiaSeleccionada.origin_doc_number">
            <strong>Factura de Sustento:</strong> {{ guiaSeleccionada.origin_doc_number }}
          </div>
          
          <div>
            <strong>Clave de Acceso SRI (49 dígitos):</strong>
            <div style="font-family:monospace; font-size:0.75rem; background:#f1f5f9; padding:0.4rem; border-radius:6px; word-break:break-all; margin-top:0.25rem;">
              {{ guiaSeleccionada.access_key || 'No asignada' }}
            </div>
          </div>

          <div>
            <strong>Estado:</strong>
            <span :class="badgeEstado(guiaSeleccionada.status)" style="margin-left:0.35rem;">
              {{ labelEstado(guiaSeleccionada.status) }}
            </span>
          </div>

          <div v-if="guiaSeleccionada.authorization_number">
            <strong>N° Autorización:</strong>
            <span style="font-family:monospace; margin-left:0.35rem;">{{ guiaSeleccionada.authorization_number }}</span>
          </div>

          <div v-if="guiaSeleccionada.authorization_date">
            <strong>Fecha de Autorización:</strong>
            <span style="margin-left:0.35rem;">{{ guiaSeleccionada.authorization_date }}</span>
          </div>

          <div v-if="guiaSeleccionada.sri_message" style="background:#fef2f2; color:#b91c1c; padding:0.5rem; border-radius:6px; font-size:0.8rem;">
            <strong>Mensaje SRI:</strong> {{ guiaSeleccionada.sri_message }}
          </div>

          <!-- Mercadería Detallada -->
          <div style="margin-top:0.5rem; border-top:1px solid #e2e8f0; padding-top:0.5rem;">
            <strong>Mercadería Trasladada:</strong>
            <table class="table" style="font-size:0.8rem; margin-top:0.35rem;">
              <thead>
                <tr>
                  <th style="width:120px;">Código</th>
                  <th>Descripción</th>
                  <th style="width:100px; text-align:right;">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in guiaSeleccionada.items" :key="i">
                  <td style="font-family:monospace;">{{ it.internal_code || '-' }}</td>
                  <td>{{ it.description }}</td>
                  <td style="text-align:right; font-weight:600;">{{ it.quantity }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top:1.25rem; display:flex; justify-content:flex-end; gap:0.5rem;">
          <button class="btn btn-outline" @click="guiaSeleccionada = null">Cerrar</button>
          <button
            v-if="guiaSeleccionada.status === 'authorized' || guiaSeleccionada.status === 'autorizada'"
            class="btn"
            style="background:#0284c7; color:white;"
            :disabled="enviandoCorreoId === guiaSeleccionada.id"
            @click="abrirModalCorreo(guiaSeleccionada)"
          >
            <i class="fa-solid fa-paper-plane" style="margin-right:0.25rem;"></i>
            {{ enviandoCorreoId === guiaSeleccionada.id ? 'Enviando...' : 'Reenviar Correo' }}
          </button>
          <button class="btn" style="background:#8e44ad; color:white;" @click="verPDF(guiaSeleccionada)">
            <i class="fa-solid fa-file-pdf" style="margin-right:0.25rem;"></i> Imprimir RIDE PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Reenviar Correo Guía -->
    <div v-if="guiaParaCorreo" class="modal-overlay" @mousedown.self="guiaParaCorreo = null">
      <div class="modal" style="position:relative; max-width:440px;">
        <button class="btn" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;" @click="guiaParaCorreo = null" title="Cerrar">✕</button>
        <h3 style="margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">
          <span>📧</span> Enviar Guía de Remisión por Correo
        </h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          Se enviará el <strong>RIDE en PDF</strong> y el <strong>XML autorizado</strong> de la guía <strong>{{ guiaParaCorreo.number }}</strong> al destinatario.
        </p>

        <div class="form-group" style="margin-bottom:1rem;">
          <label style="font-weight:600; display:block; margin-bottom:0.35rem; font-size:0.85rem;">Correo Electrónico Destinatario *</label>
          <input
            v-model="correoDestinatario"
            type="email"
            class="input"
            placeholder="destinatario@ejemplo.com"
            required
          />
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
          <button class="btn btn-outline" @click="guiaParaCorreo = null">Cancelar</button>
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
import DispatchGuideFormModal from './DispatchGuideFormModal.vue'

const guias = ref([])
const cargando = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const guiaSeleccionada = ref(null)

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

const guiasFiltradas = computed(() => {
  return guias.value.filter(g => {
    const texto = filtroTexto.value.toLowerCase()
    const matchTexto = !texto ||
      (g.carrier_name && g.carrier_name.toLowerCase().includes(texto)) ||
      (g.carrier_ruc && g.carrier_ruc.includes(texto)) ||
      (g.vehicle_plate && g.vehicle_plate.toLowerCase().includes(texto)) ||
      (g.recipient_name && g.recipient_name.toLowerCase().includes(texto)) ||
      (g.recipient_id && g.recipient_id.includes(texto)) ||
      (g.number && g.number.toLowerCase().includes(texto))

    const matchEstado = !filtroEstado.value || g.status === filtroEstado.value
    return matchTexto && matchEstado
  })
})

const cargarGuias = async () => {
  cargando.value = true
  try {
    const res = await api.get('/facturacion/guias-remision/')
    guias.value = res.data || []
  } catch (error) {
    console.error('Error al cargar guías de remisión:', error)
  } finally {
    cargando.value = false
  }
}

const guardarNuevaGuia = async (formData) => {
  guardando.value = true
  try {
    const res = await api.post('/facturacion/guias-remision/', formData)
    guias.value.unshift(res.data)
    mostrarModal.value = false
    alert(`Guía de Remisión ${res.data.number} creada exitosamente en estado borrador.`)
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Error al guardar guía de remisión'
    alert(msg)
  } finally {
    guardando.value = false
  }
}

const emitir = async (guia) => {
  if (!confirm(`¿Desea firmar digitalmente y enviar la Guía ${guia.number} al SRI?`)) return
  accionEnProceso[guia.id] = true
  try {
    const res = await api.post(`/facturacion/guias-remision/${guia.id}/emitir/`)
    Object.assign(guia, res.data)
    alert(`Guía ${guia.number} enviada al SRI. Estado: ${guia.sri_status}`)
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Error al emitir guía'
    alert(msg)
  } finally {
    accionEnProceso[guia.id] = false
  }
}

const consultarAutorizacion = async (guia) => {
  accionEnProceso[guia.id] = true
  try {
    const res = await api.post(`/facturacion/guias-remision/${guia.id}/autorizar/`)
    Object.assign(guia, res.data)
    alert(`Consulta SRI completada: Estado ${guia.sri_status}`)
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Error al consultar autorización'
    alert(msg)
  } finally {
    accionEnProceso[guia.id] = false
  }
}

const descargarXML = (guia) => {
  window.open(`${api.defaults.baseURL || ''}/facturacion/guias-remision/${guia.id}/xml/`, '_blank')
}

const verPDF = (guia) => {
  window.open(`${api.defaults.baseURL || ''}/reportes/pdf/dispatch-guide/${guia.id}/`, '_blank')
}

const enviandoCorreoId = ref(null)
const enviandoCorreo = ref(false)
const guiaParaCorreo = ref(null)
const correoDestinatario = ref('')

const abrirModalCorreo = (guia) => {
  guiaParaCorreo.value = guia
  correoDestinatario.value = guia.recipient_email || ''
}

const enviarCorreoConfirmado = async () => {
  if (!correoDestinatario.value || !guiaParaCorreo.value) return
  enviandoCorreo.value = true
  enviandoCorreoId.value = guiaParaCorreo.value.id
  try {
    const { data } = await api.post(`/facturacion/guias-remision/${guiaParaCorreo.value.id}/enviar-correo/`, {
      email: correoDestinatario.value
    })
    alert(data.mensaje || 'Guía de remisión enviada exitosamente por correo electrónico.')
    guiaParaCorreo.value = null
  } catch (error) {
    alert(error.response?.data?.error || 'No se pudo enviar el correo de la guía de remisión.')
  } finally {
    enviandoCorreo.value = false
    enviandoCorreoId.value = null
  }
}

onMounted(() => {
  cargarGuias()
})
</script>
