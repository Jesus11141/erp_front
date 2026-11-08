<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="cerrarModal">
    <div class="modal invoice-modal">
      <!-- ── ENCABEZADO MODAL ── -->
      <div class="modal-header-modern">
        <div class="header-title-wrap">
          <div class="header-icon-badge">
            <i class="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <h2 class="header-title">Nueva Factura Electrónica</h2>
            <p class="header-subtitle">Emisión y autorización inmediata de comprobantes tributarios ante el SRI</p>
          </div>
        </div>
        <button class="btn-close-modal" @click="cerrarModal" title="Cerrar (Esc)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-scroll-body">
        <!-- ── SECCIÓN 1: DATOS DEL CLIENTE ── -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-title">
              <span class="step-num">1</span>
              <i class="fa-solid fa-user-tag section-icon"></i>
              <span>Datos del Cliente / Receptor</span>
            </div>
            <!-- Botones rápidos de selección de cliente -->
            <div class="quick-client-bar">
              <button
                type="button"
                :class="['btn-quick-consumer', form.cliente_tipo_id === '07' ? 'active' : '']"
                @click="setConsumidorFinal"
                title="Consumidor Final (9999999999999)"
              >
                <i class="fa-solid fa-user-shield"></i>
                <span>Consumidor Final</span>
              </button>
              <button
                type="button"
                :class="['btn-quick-consumer', form.cliente_tipo_id !== '07' ? 'active-datos' : '']"
                @click="setClienteConDatos"
                title="Factura con Datos (Cédula o RUC)"
              >
                <i class="fa-solid fa-id-card"></i>
                <span>Factura con Datos</span>
              </button>
            </div>
          </div>

          <!-- Buscador de cliente existente -->
          <div class="search-client-box">
            <div class="search-input-wrapper">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                v-model="busquedaCliente"
                class="input search-input"
                placeholder="Buscar cliente existente por nombre, RUC o cédula..."
                @input="buscarClientes"
                @keydown.escape="sugerencias = []; sinResultados = false"
              />
              <span v-if="buscando" class="search-spinner">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
              </span>
            </div>

            <!-- Dropdown sugerencias de clientes -->
            <div v-if="buscando || sugerencias.length || sinResultados" class="client-suggestions-dropdown">
              <div v-if="buscando" class="suggestion-loading">
                <i class="fa-solid fa-spinner fa-spin"></i> Buscando clientes...
              </div>
              <template v-else>
                <div
                  v-for="c in sugerencias"
                  :key="c.id"
                  class="suggestion-item"
                  @click="seleccionarCliente(c)"
                >
                  <div class="suggestion-name">{{ c.name }}</div>
                  <div class="suggestion-meta">
                    <span class="meta-tag"><i class="fa-solid fa-id-card"></i> {{ c.rfc || 'Sin identificación' }}</span>
                    <span v-if="c.email" class="meta-tag"><i class="fa-solid fa-envelope"></i> {{ c.email }}</span>
                    <span v-if="c.address" class="meta-tag"><i class="fa-solid fa-location-dot"></i> {{ c.address }}</span>
                  </div>
                </div>
                <div v-if="sinResultados" class="suggestion-new-client" @click="iniciarNuevoCliente">
                  <i class="fa-solid fa-user-plus"></i> Registrar <strong>"{{ busquedaCliente }}"</strong> como nuevo cliente
                </div>
              </template>
            </div>
          </div>

          <!-- Aviso informativo Consumidor Final -->
          <div v-if="form.cliente_tipo_id === '07'" class="consumer-notice">
            <i class="fa-solid fa-circle-info"></i>
            <span>Facturando a <strong>Consumidor Final (9999999999999)</strong>. Puedes dejar 'CONSUMIDOR FINAL' o ingresar el nombre y correo del cliente si desea recibir su factura electrónica.</span>
          </div>

          <!-- Campos del cliente -->
          <div class="client-grid">
            <div class="form-group grid-col-2">
              <label><i class="fa-solid fa-building label-icon"></i> Razón Social / Nombre Completo *</label>
              <input 
                v-model="form.customer" 
                class="input" 
                :placeholder="form.cliente_tipo_id === '07' ? 'CONSUMIDOR FINAL (o escribe el nombre)' : 'Nombre completo del cliente o empresa'" 
              />
            </div>

            <div class="form-group">
              <label><i class="fa-solid fa-list-check label-icon"></i> Tipo de Identificación *</label>
              <select v-model="form.cliente_tipo_id" class="input" @change="onTipoIdChange">
                <option value="04">RUC (13 dígitos)</option>
                <option value="05">Cédula (10 dígitos)</option>
                <option value="06">Pasaporte</option>
                <option value="07">Consumidor Final</option>
              </select>
            </div>

            <div class="form-group">
              <label><i class="fa-solid fa-id-card label-icon"></i> Nro. Identificación *</label>
              <input
                v-model="form.cliente_identificacion"
                class="input font-mono"
                :placeholder="form.cliente_tipo_id === '07' ? '9999999999999' : 'Ej: 1712345678001'"
                :readonly="form.cliente_tipo_id === '07'"
              />
            </div>

            <div class="form-group grid-col-2">
              <label><i class="fa-solid fa-location-dot label-icon"></i> Dirección del Receptor</label>
              <input v-model="form.cliente_direccion" class="input" placeholder="Ej: Av. Principal 123 y Secundaria" />
            </div>

            <div class="form-group grid-col-2">
              <label><i class="fa-solid fa-envelope label-icon"></i> Correo Electrónico (Para envío de RIDE y XML)</label>
              <input v-model="form.cliente_email" type="email" class="input" placeholder="correo@ejemplo.com" />
            </div>
          </div>
        </div>

        <!-- ── SECCIÓN 2: DETALLE DE PRODUCTOS / SERVICIOS ── -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-title">
              <span class="step-num">2</span>
              <i class="fa-solid fa-boxes-stacked section-icon"></i>
              <span>Detalle de Productos / Servicios</span>
            </div>
            <span class="items-count-badge">
              {{ form.items.length }} {{ form.items.length === 1 ? 'ítem' : 'ítems' }}
            </span>
          </div>

          <div class="table-container">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="min-width: 250px;">Producto / Descripción *</th>
                  <th style="width: 80px; text-align: center;">Cant.</th>
                  <th style="width: 120px; text-align: right;">P. Unit. (Inc. IVA)</th>
                  <th style="width: 85px; text-align: center;">Desc. %</th>
                  <th style="width: 95px; text-align: center;">Tarifa IVA</th>
                  <th style="width: 120px; text-align: right;">Subtotal</th>
                  <th style="width: 45px; text-align: center;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in form.items" :key="idx" class="item-row">
                  <!-- Autocomplete Producto -->
                  <td style="position: relative;">
                    <input
                      v-model="item.description"
                      class="input input-table"
                      placeholder="Escribe o busca un producto..."
                      @input="buscarProductoItem(idx, item.description)"
                      @keydown.escape="item._sugerencias = []"
                    />
                    <!-- Sugerencias de productos -->
                    <div v-if="item._sugerencias && item._sugerencias.length" class="prod-suggestions-dropdown">
                      <div
                        v-for="p in item._sugerencias"
                        :key="p.id"
                        class="prod-suggestion-item"
                        @click="seleccionarProductoItem(idx, p)"
                      >
                        <div class="prod-name">{{ p.name }}</div>
                        <div class="prod-tags">
                          <span class="prod-code">{{ p.code }}</span>
                          <span class="prod-price">${{ parseFloat(p.sale_price).toFixed(2) }}</span>
                          <span v-if="p.current_stock !== undefined" class="prod-stock">Stock: {{ p.current_stock }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Cantidad -->
                  <td>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      class="input input-table text-center"
                      min="0.01"
                      step="0.01"
                    />
                  </td>

                  <!-- Precio Unitario -->
                  <td>
                    <div class="input-prefix-wrap">
                      <span class="input-prefix">{{ simbolo }}</span>
                      <input
                        v-model.number="item.unit_price"
                        type="number"
                        class="input input-table text-right font-mono"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </td>

                  <!-- Descuento % -->
                  <td>
                    <input
                      v-model.number="item.discount"
                      type="number"
                      class="input input-table text-center"
                      min="0"
                      max="100"
                      placeholder="0"
                    />
                  </td>

                  <!-- Tarifa IVA -->
                  <td>
                    <select v-model="item.tarifa_iva" class="input input-table text-center font-bold">
                      <option value="15">15%</option>
                      <option value="8">8%</option>
                      <option value="5">5%</option>
                      <option value="0">0%</option>
                    </select>
                  </td>

                  <!-- Subtotal -->
                  <td class="subtotal-cell">
                    {{ simbolo }}{{ subtotalItem(item).toFixed(2) }}
                  </td>

                  <!-- Botón Eliminar Fila -->
                  <td style="text-align: center;">
                    <button
                      type="button"
                      class="btn-delete-row"
                      @click="form.items.splice(idx, 1)"
                      title="Eliminar esta línea"
                    >
                      <i class="fa-regular fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-actions">
            <button type="button" class="btn-add-line" @click="agregarItem">
              <i class="fa-solid fa-plus"></i>
              <span>Agregar nueva línea</span>
            </button>
          </div>
        </div>

        <!-- ── SECCIÓN 3: FORMA DE PAGO Y TOTALES ── -->
        <div class="grid-split-section">
          <!-- Izquierda: Forma de pago y Notas -->
          <div class="payment-notes-card">
            <div class="section-title" style="margin-bottom: 0.85rem;">
              <span class="step-num">3</span>
              <i class="fa-solid fa-credit-card section-icon"></i>
              <span>Forma de Pago y Condiciones</span>
            </div>

            <div v-if="!hidePaymentForm" class="form-group" style="margin-bottom: 0.85rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                <label style="margin:0;"><i class="fa-solid fa-money-check-dollar label-icon"></i> Forma de Pago</label>
                <span v-if="metodoSeleccionado" class="badge-sri-info" :title="'Código SRI: ' + form.forma_pago">
                  SRI: {{ form.forma_pago }} - {{ labelSri(form.forma_pago) }}
                </span>
              </div>
              
              <!-- Selector con los Métodos de Pago configurados en el ERP -->
              <select 
                v-if="metodosConfigurados.length > 0" 
                v-model="metodoSeleccionadoId" 
                class="input"
                @change="onMetodoConfiguradoChange"
              >
                <option v-for="m in metodosConfigurados" :key="m.id" :value="m.id">
                  {{ m.name }}
                </option>
              </select>

              <!-- Fallback con catálogo SRI estándar si aún no ha configurado métodos -->
              <select v-else v-model="form.forma_pago" class="input">
                <option value="01">01 - Sin utilización del sistema financiero (Efectivo)</option>
                <option value="20">20 - Otros con utilización del sistema financiero (Transferencia / Depósito / Cheque)</option>
                <option value="16">16 - Tarjeta de Débito</option>
                <option value="19">19 - Tarjeta de Crédito</option>
                <option value="15">15 - Compensación de deudas</option>
                <option value="17">17 - Dinero electrónico</option>
                <option value="18">18 - Tarjeta prepago</option>
                <option value="21">21 - Endoso de títulos</option>
              </select>

              <div v-if="metodoSeleccionado?.requires_reference" style="margin-top:0.45rem;">
                <label style="font-size:0.75rem; color:#64748b; font-weight:600; display:block; margin-bottom:2px;">
                  <i class="fa-solid fa-receipt"></i> Nro. de Referencia / Comprobante (Opcional)
                </label>
                <input 
                  v-model="referenciaPago" 
                  class="input" 
                  style="padding:0.4rem 0.6rem; font-size:0.85rem;" 
                  placeholder="Ej: Transferencia #00123456" 
                />
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label><i class="fa-solid fa-comment-dots label-icon"></i> Notas / Observaciones en la Factura</label>
              <textarea
                v-model="form.notes"
                class="input textarea-notes"
                rows="3"
                placeholder="Información adicional visible en el RIDE (ej. Nro. de Orden, condiciones de entrega, etc.)"
              ></textarea>
            </div>
          </div>

          <!-- Derecha: Resumen de Totales (Card Premium) -->
          <div class="totals-summary-card">
            <div class="totals-header">
              <i class="fa-solid fa-calculator"></i>
              <span>Resumen de Liquidación</span>
            </div>

            <div class="totals-rows">
              <div class="totals-row">
                <span class="label">Subtotal sin impuestos:</span>
                <span class="value font-mono">{{ simbolo }}{{ subtotalForm.toFixed(2) }}</span>
              </div>

              <!-- Desglose por tarifas de IVA -->
              <div v-for="(base, tarifa) in resumenIva" :key="tarifa" class="totals-row sub-iva-row">
                <span class="label">Base Imponible IVA {{ tarifa }}%:</span>
                <span class="value font-mono">{{ simbolo }}{{ base.toFixed(2) }}</span>
              </div>

              <!-- IVA Calculado -->
              <div v-for="(valor, tarifa) in ivaDesglosado" :key="'vat'+tarifa" class="totals-row iva-highlight">
                <span class="label">IVA {{ tarifa }}%:</span>
                <span class="value font-mono">+ {{ simbolo }}{{ valor.toFixed(2) }}</span>
              </div>
            </div>

            <div class="totals-divider"></div>

            <div class="total-final-row">
              <div class="total-final-label">
                <span class="total-title">TOTAL FACTURA</span>
                <span class="total-subtitle">Valor final a pagar</span>
              </div>
              <div class="total-final-amount font-mono">
                {{ simbolo }}{{ totalForm.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje de error de validación -->
        <div v-if="errorForm" class="error-banner">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>{{ errorForm }}</span>
        </div>
      </div>

      <!-- ── FOOTER DE ACCIONES ── -->
      <div class="modal-footer-modern">
        <button class="btn btn-outline" @click="cerrarModal" :disabled="procesando">
          Cancelar
        </button>
        <button class="btn btn-submit-invoice" @click="guardar" :disabled="procesando">
          <i v-if="procesando" class="fa-solid fa-circle-notch fa-spin"></i>
          <i v-else class="fa-solid fa-paper-plane"></i>
          <span>{{ procesando ? 'Emitiendo ante el SRI...' : 'Guardar y Emitir al SRI' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '../../../../shared/api'
import { useParametrosStore } from '../../../../stores/parametros'

const props = defineProps({
  show: Boolean,
  initialItems: {
    type: Array,
    default: () => []
  },
  hidePaymentForm: {
    type: Boolean,
    default: false
  },
  initialPaymentForm: {
    type: String,
    default: '01'
  },
  procesando: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const parametrosStore = useParametrosStore()
const simbolo = computed(() => parametrosStore.company?.simbolo || '$')

const errorForm = ref('')
const busquedaCliente = ref('')
const sugerencias = ref([])
const buscando = ref(false)
const sinResultados = ref(false)
let busquedaTimer = null

const metodosConfigurados = ref([])
const metodoSeleccionadoId = ref(null)
const referenciaPago = ref('')

const metodoSeleccionado = computed(() => {
  return metodosConfigurados.value.find(m => m.id === metodoSeleccionadoId.value)
})

function inferSriCode(name) {
  if (!name) return '01'
  const n = (name || '').toLowerCase()
  if (n.includes('efectivo') || n.includes('cash')) return '01'
  if (n.includes('débito') || n.includes('debito')) return '16'
  if (n.includes('crédito') || n.includes('credito') || n.includes('tarjeta') || n.includes('card')) return '19'
  if (n.includes('transfer') || n.includes('banco') || n.includes('depósito') || n.includes('deposito') || n.includes('cheque') || n.includes('pichincha') || n.includes('guayaquil') || n.includes('produbanco') || n.includes('pacifico') || n.includes('deuna') || n.includes('de una')) return '20'
  if (n.includes('compensaci')) return '15'
  if (n.includes('dinero elect')) return '17'
  if (n.includes('prepago')) return '18'
  if (n.includes('endoso')) return '21'
  return '20'
}

function labelSri(codigo) {
  const map = {
    '01': 'Efectivo',
    '16': 'Tarjeta de Débito',
    '19': 'Tarjeta de Crédito',
    '20': 'Transferencia / Bancos',
    '15': 'Compensación',
    '17': 'Dinero Elect.',
    '18': 'Prepago',
    '21': 'Endoso'
  }
  return map[codigo] || ('Código ' + codigo)
}

async function cargarMetodosPago() {
  try {
    const { data } = await api.get('/ventas/payment-methods/')
    if (data && data.length > 0) {
      metodosConfigurados.value = data.filter(m => m.active !== false).map(m => ({
        id: m.id,
        name: m.name,
        requires_reference: !!m.requires_reference,
        sri_code: m.sri_code || inferSriCode(m.name)
      }))

      if (metodosConfigurados.value.length > 0) {
        const initCode = form.value.forma_pago || props.initialPaymentForm || '01'
        const match = metodosConfigurados.value.find(m => m.sri_code === initCode) || metodosConfigurados.value[0]
        metodoSeleccionadoId.value = match.id
        form.value.forma_pago = match.sri_code
      }
    }
  } catch (err) {
    console.warn('Error al cargar métodos de pago:', err)
  }
}

function onMetodoConfiguradoChange() {
  const m = metodoSeleccionado.value
  if (m) {
    form.value.forma_pago = m.sri_code || inferSriCode(m.name)
  }
}

onMounted(() => {
  cargarMetodosPago()
})

const formVacio = () => ({
  customer: '',
  cliente_identificacion: '',
  cliente_tipo_id: '05',
  cliente_direccion: '',
  cliente_email: '',
  cliente_telefono: '',
  forma_pago: props.initialPaymentForm,
  notes: '',
  _guardar_cliente: false,
  items: props.initialItems && props.initialItems.length > 0 
    ? props.initialItems.map(i => ({ 
        description: i.description, 
        quantity: i.quantity, 
        unit_price: i.unit_price, 
        discount: i.discount || 0, 
        tarifa_iva: String(i.tarifa_iva || i.vat_rate || '15'), 
        codigo_principal: i.codigo_principal || i.code || '', 
        _sugerencias: [] 
      }))
    : [{ description: '', quantity: 1, unit_price: 0, discount: 0, tarifa_iva: '15', codigo_principal: '', _sugerencias: [] }],
})

const form = ref(formVacio())

watch(() => props.show, (newVal) => {
  if (newVal) {
    form.value = formVacio()
    errorForm.value = ''
    busquedaCliente.value = ''
    sugerencias.value = []
    referenciaPago.value = ''
    cargarMetodosPago()
  }
})

function onTipoIdChange() {
  if (form.value.cliente_tipo_id === '07') {
    form.value.cliente_identificacion = '9999999999999'
    if (!form.value.customer || !form.value.customer.trim()) {
      form.value.customer = 'CONSUMIDOR FINAL'
    }
    form.value.cliente_direccion = form.value.cliente_direccion || 'S/D'
  } else {
    if (form.value.cliente_identificacion === '9999999999999') {
      form.value.cliente_identificacion = ''
    }
    if (form.value.customer === 'CONSUMIDOR FINAL') {
      form.value.customer = ''
    }
    if (form.value.cliente_direccion === 'S/D') {
      form.value.cliente_direccion = ''
    }
  }
}

function iniciarNuevoCliente() {
  form.value.customer = busquedaCliente.value
  form.value.cliente_tipo_id = '05'
  form.value.cliente_identificacion = ''
  form.value.cliente_direccion = ''
  form.value.cliente_email = ''
  form.value._guardar_cliente = true
  sugerencias.value = []
  sinResultados.value = false
}

function setConsumidorFinal() {
  form.value.cliente_tipo_id = '07'
  form.value.cliente_identificacion = '9999999999999'
  if (!form.value.customer || !form.value.customer.trim()) {
    form.value.customer = 'CONSUMIDOR FINAL'
  }
  if (!form.value.cliente_direccion || !form.value.cliente_direccion.trim()) {
    form.value.cliente_direccion = 'S/D'
  }
  busquedaCliente.value = ''
  sugerencias.value = []
  sinResultados.value = false
  errorForm.value = ''
}

function setClienteConDatos() {
  form.value.cliente_tipo_id = '05'
  if (form.value.cliente_identificacion === '9999999999999') {
    form.value.cliente_identificacion = ''
  }
  if (form.value.customer === 'CONSUMIDOR FINAL') {
    form.value.customer = ''
  }
  if (form.value.cliente_direccion === 'S/D') {
    form.value.cliente_direccion = ''
  }
  busquedaCliente.value = ''
  sugerencias.value = []
  sinResultados.value = false
  errorForm.value = ''
}

function seleccionarCliente(c) {
  const id = c.rfc || ''
  form.value.cliente_tipo_id = id.length === 13 ? '04' : id.length === 10 ? '05' : '06'
  form.value.cliente_identificacion = id
  form.value.customer = c.name
  form.value.cliente_direccion = c.address || ''
  form.value.cliente_email = c.email || ''
  busquedaCliente.value = c.name
  sugerencias.value = []
  sinResultados.value = false
}

function buscarClientes() {
  clearTimeout(busquedaTimer)
  sinResultados.value = false
  if (busquedaCliente.value.length < 2) { sugerencias.value = []; buscando.value = false; return }
  buscando.value = true
  busquedaTimer = setTimeout(async () => {
    try {
      const res = await api.get(`/ventas/customers/?q=${busquedaCliente.value}`)
      sugerencias.value = res.data
      if (res.data.length === 0) sinResultados.value = true
    } catch {
      sugerencias.value = []
    } finally {
      buscando.value = false
    }
  }, 300)
}

function agregarItem() {
  form.value.items.push({ description: '', quantity: 1, unit_price: 0, discount: 0, tarifa_iva: '15', codigo_principal: '', _sugerencias: [] })
}

const _itemTimers = {}
function buscarProductoItem(idx, query) {
  const item = form.value.items[idx]
  item._sugerencias = []
  if (!query || query.length < 2) return
  clearTimeout(_itemTimers[idx])
  _itemTimers[idx] = setTimeout(async () => {
    try {
      const { data } = await api.get(`/inventario/products/?q=${query}`)
      item._sugerencias = data.slice(0, 6)
    } catch { item._sugerencias = [] }
  }, 250)
}

function seleccionarProductoItem(idx, product) {
  const item = form.value.items[idx]
  item.description = product.name
  item.unit_price = parseFloat(product.sale_price)
  item.codigo_principal = product.code
  item.tarifa_iva = String(product.vat_rate || '15')
  item._sugerencias = []
}

function cerrarModal() {
  emit('close')
}

const subtotalItem = (item) => {
  const factorIva = 1 + (parseFloat(item.tarifa_iva || '0') / 100)
  const unitPriceSinIva = (item.unit_price || 0) / factorIva
  const base = (item.quantity || 0) * unitPriceSinIva
  return base - (base * ((item.discount || 0) / 100))
}

const resumenIva = computed(() => {
  const grupos = {}
  for (const item of form.value.items) {
    const t = String(item.tarifa_iva || '15')
    grupos[t] = (grupos[t] || 0) + subtotalItem(item)
  }
  return grupos
})

const ivaDesglosado = computed(() => {
  const result = {}
  for (const [tarifa, base] of Object.entries(resumenIva.value)) {
    if (parseFloat(tarifa) > 0) {
      result[tarifa] = base * parseFloat(tarifa) / 100
    }
  }
  return result
})

const subtotalForm = computed(() => Object.values(resumenIva.value).reduce((a, b) => a + b, 0))
const ivaForm = computed(() => Object.values(ivaDesglosado.value).reduce((a, b) => a + b, 0))
const totalForm = computed(() => subtotalForm.value + ivaForm.value)

function guardar() {
  if (form.value.cliente_tipo_id === '07') {
    if (!form.value.customer || !form.value.customer.trim()) {
      form.value.customer = 'CONSUMIDOR FINAL'
    }
    if (!form.value.cliente_identificacion || !form.value.cliente_identificacion.trim()) {
      form.value.cliente_identificacion = '9999999999999'
    }
    if (!form.value.cliente_direccion || !form.value.cliente_direccion.trim()) {
      form.value.cliente_direccion = 'S/D'
    }
  }

  if (!form.value.customer || !form.value.customer.trim()) {
    errorForm.value = 'El nombre o razón social del cliente es obligatorio'
    alert(errorForm.value)
    return
  }
  if (!form.value.cliente_identificacion || !form.value.cliente_identificacion.trim()) {
    errorForm.value = 'El número de identificación (RUC, Cédula o Consumidor Final) es obligatorio'
    alert(errorForm.value)
    return
  }
  const itemsValidos = form.value.items.filter(i => i.description && i.description.trim() && i.quantity > 0 && i.unit_price >= 0)
      .map(({ _sugerencias, ...i }) => {
        const factorIva = 1 + (parseFloat(i.tarifa_iva || '0') / 100)
        return {
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price / factorIva,
          discount: i.discount,
          vat_rate: i.tarifa_iva,
          main_code: i.codigo_principal,
          auxiliary_code: ''
        }
      })
  
  if (!itemsValidos.length) {
    errorForm.value = 'Agrega al menos un ítem con descripción y cantidad válida'
    alert(errorForm.value)
    return
  }

  if (referenciaPago.value && referenciaPago.value.trim()) {
    const refText = 'Ref. Pago: ' + referenciaPago.value.trim()
    if (!form.value.notes.includes(refText)) {
      form.value.notes = form.value.notes ? (form.value.notes + ' | ' + refText) : refText
    }
  }

  errorForm.value = ''
  
  const payload = {
    form: { ...form.value },
    itemsValidos,
    totals: {
      subtotal: subtotalForm.value,
      vat: ivaForm.value,
      total: totalForm.value
    }
  }

  emit('submit', payload)
}
</script>

<style scoped>
/* ── CONTENEDOR MODAL PRINCIPAL ── */
.invoice-modal {
  max-width: 1040px !important;
  width: 95vw !important;
  max-height: 92vh !important;
  padding: 0 !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  background: #ffffff !important;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25) !important;
}

/* ── HEADER MODAL ── */
.modal-header-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.header-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0.2rem 0 0 0;
}

.btn-close-modal {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1rem;
}

.btn-close-modal:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

/* ── CUERPO CON SCROLL ── */
.modal-scroll-body {
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #f8fafc;
}

/* ── TARJETAS DE SECCIÓN ── */
.section-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.92rem;
  color: #1e293b;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
}

.section-icon {
  color: #2563eb;
  font-size: 0.95rem;
}

/* Botón Consumidor Final */
.btn-quick-consumer {
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
}

.btn-quick-consumer:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.quick-client-bar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-quick-consumer.active {
  background: #ecfdf5;
  border-color: #10b981;
  color: #047857;
  font-weight: 700;
}

.btn-quick-consumer.active-datos {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  font-weight: 700;
}

/* Buscador de Cliente */
.search-client-box {
  position: relative;
  margin-bottom: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}

.search-input {
  padding-left: 2.35rem !important;
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 10px !important;
  height: 40px !important;
  font-size: 0.88rem !important;
}

.search-input:focus {
  background: #ffffff !important;
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

.search-spinner {
  position: absolute;
  right: 0.85rem;
  color: #2563eb;
  font-size: 0.9rem;
}

/* Dropdown sugerencias cliente */
.client-suggestions-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  z-index: 1000;
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.suggestion-loading {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.suggestion-item {
  padding: 0.65rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.suggestion-item:hover {
  background: #f8fafc;
}

.suggestion-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
}

.suggestion-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.meta-tag {
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.suggestion-new-client {
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #2563eb;
  background: #eff6ff;
  border-top: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s;
}

.suggestion-new-client:hover {
  background: #dbeafe;
}

/* Grid del cliente */
.client-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
}

.grid-col-2 {
  grid-column: span 2;
}

.label-icon {
  margin-right: 0.3rem;
  color: #64748b;
  font-size: 0.8rem;
}

.label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.35rem;
  display: block;
}

/* ── TABLA DE ÍTEMS ── */
.items-count-badge {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
}

.table-container {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: visible;
  background: #ffffff;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.items-table td {
  padding: 0.5rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.item-row:hover td {
  background: #fafafa;
}

.input-table {
  height: 36px !important;
  font-size: 0.85rem !important;
  padding: 0.35rem 0.6rem !important;
  border-radius: 7px !important;
  border: 1px solid #cbd5e1 !important;
  width: 100% !important;
}

.input-table:focus {
  border-color: #2563eb !important;
  background: #ffffff !important;
}

.input-prefix-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 0.5rem;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 700;
  pointer-events: none;
}

.input-prefix-wrap .input-table {
  padding-left: 1.25rem !important;
}

.subtotal-cell {
  font-weight: 800;
  font-size: 0.92rem;
  color: #0f172a;
  text-align: right;
  padding-right: 0.75rem !important;
  font-family: monospace;
}

.btn-delete-row {
  background: transparent;
  border: none;
  color: #cbd5e1;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-delete-row:hover {
  background: #fef2f2;
  color: #ef4444;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.75rem;
}

.btn-add-line {
  background: #ffffff;
  border: 1px dashed #2563eb;
  color: #2563eb;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
}

.btn-add-line:hover {
  background: #eff6ff;
  border-color: #1d4ed8;
}

/* Sugerencias de productos */
.prod-suggestions-dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  z-index: 500;
  max-height: 180px;
  overflow-y: auto;
  box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.15);
}

.prod-suggestion-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.15s;
}

.prod-suggestion-item:hover {
  background: #f8fafc;
}

.prod-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
}

.prod-tags {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.prod-code {
  font-size: 0.7rem;
  background: #f1f5f9;
  color: #64748b;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-family: monospace;
}

.prod-price {
  font-size: 0.78rem;
  font-weight: 700;
  color: #059669;
}

.prod-stock {
  font-size: 0.7rem;
  background: #ecfdf5;
  color: #047857;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

/* ── SECCIÓN INFERIOR DIVIDIDA ── */
.grid-split-section {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.25rem;
}

.badge-sri-info {
  font-size: 0.72rem;
  background: #f1f5f9;
  color: #475569;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-weight: 600;
}

.consumer-notice {
  margin-bottom: 0.85rem;
  padding: 0.6rem 0.85rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #15803d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.payment-notes-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.textarea-notes {
  resize: vertical;
  min-height: 65px;
  font-size: 0.85rem !important;
}

/* ── RESUMEN DE TOTALES (CARD PREMIUM) ── */
.totals-summary-card {
  background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
  color: #ffffff;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.totals-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 0.85rem;
}

.totals-rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.sub-iva-row {
  font-size: 0.78rem;
  color: #94a3b8;
  padding-left: 0.5rem;
}

.iva-highlight {
  color: #38bdf8;
  font-weight: 700;
}

.totals-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0.85rem 0;
}

.total-final-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.total-title {
  display: block;
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #f8fafc;
}

.total-subtitle {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
}

.total-final-amount {
  font-size: 1.85rem;
  font-weight: 900;
  color: #34d399;
  line-height: 1;
}

/* ── BANNER DE ERROR ── */
.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── FOOTER DE ACCIONES ── */
.modal-footer-modern {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  padding: 1.15rem 1.75rem;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.btn-submit-invoice {
  background: #2563eb !important;
  color: white !important;
  font-weight: 700 !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 10px !important;
  font-size: 0.92rem !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  border: none !important;
  cursor: pointer !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25) !important;
  transition: all 0.2s !important;
}

.btn-submit-invoice:hover:not(:disabled) {
  background: #1d4ed8 !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(37, 99, 235, 0.35) !important;
}

.btn-submit-invoice:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* ── RESPONSIVIDAD ── */
@media (max-width: 840px) {
  .client-grid {
    grid-template-columns: 1fr 1fr;
  }
  .grid-split-section {
    grid-template-columns: 1fr;
  }
}
</style>
