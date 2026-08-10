<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="cerrarModal">
    <div class="modal" style="max-width:780px; max-height:90vh; overflow-y:auto; position:relative;">
      <button class="btn" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;" @click="cerrarModal" title="Cerrar (Esc)">✕</button>
      <h3 style="margin-bottom:1.25rem">Nueva Factura Electrónica</h3>

      <!-- Sección customer -->
      <div style="font-weight:600; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">
        Cliente
      </div>

      <!-- Buscador de customer -->
      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; align-items:flex-end;">
        <div class="form-group" style="flex:1; margin:0; position:relative;">
          <label>Buscar cliente existente</label>
          <input v-model="busquedaCliente" class="input" placeholder="Nombre, RUC o cédula..."
            @input="buscarClientes" @keydown.escape="sugerencias = []; sinResultados = false" />
          <!-- Dropdown sugerencias -->
          <div v-if="buscando || sugerencias.length || sinResultados" style="position:absolute; top:100%; left:0; right:0; background:#ffffff; border:1px solid var(--border); border-radius:var(--radius); z-index:1000; max-height:200px; overflow-y:auto; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <div v-if="buscando" style="padding:0.6rem 0.75rem; font-size:0.875rem; color:var(--text-muted);">Buscando...</div>
            <template v-else>
              <div v-for="c in sugerencias" :key="c.id"
                @click="seleccionarCliente(c)"
                style="padding:0.6rem 0.75rem; cursor:pointer; font-size:0.875rem; border-bottom:1px solid var(--border);"
                @mouseenter="$event.currentTarget.style.background='var(--bg)'"
                @mouseleave="$event.currentTarget.style.background=''">
                <strong>{{ c.name }}</strong>
                <span style="font-size:0.75rem; color:var(--text-muted); display:block;">RUC/CI: {{ c.rfc }}</span>
              </div>
              <div @click="iniciarNuevoCliente"
                style="padding:0.6rem 0.75rem; cursor:pointer; font-size:0.875rem; color:var(--color-primario); font-weight:600; border-top:1px solid var(--border);"
                @mouseenter="$event.currentTarget.style.background='var(--bg)'"
                @mouseleave="$event.currentTarget.style.background=''">
                ➕ Crear "{{ busquedaCliente }}" como nuevo cliente
              </div>
            </template>
          </div>
        </div>
        <button type="button" class="btn btn-outline" style="white-space:nowrap; height:38px;"
          @click="setConsumidorFinal">
          👤 Consumidor Final
        </button>
      </div>

      <!-- Datos del customer (se autocompletan o se llenan manual) -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
        <div class="form-group" style="grid-column:1/-1">
          <label>Razón Social / Nombre *</label>
          <input v-model="form.customer" class="input" placeholder="Nombre completo o razón social" />
        </div>
        <div class="form-group">
          <label>Tipo de identificación</label>
          <select v-model="form.cliente_tipo_id" class="input" @change="onTipoIdChange">
            <option value="04">RUC</option>
            <option value="05">Cédula</option>
            <option value="06">Pasaporte</option>
            <option value="07">Consumidor Final</option>
          </select>
        </div>
        <div class="form-group">
          <label>Número de identificación *</label>
          <input v-model="form.cliente_identificacion" class="input"
            :placeholder="form.cliente_tipo_id === '07' ? '9999999999999' : 'RUC o cédula'"
            :readonly="form.cliente_tipo_id === '07'" />
        </div>
        <div class="form-group">
          <label>Dirección</label>
          <input v-model="form.cliente_direccion" class="input" placeholder="Dirección del cliente" />
        </div>
        <div class="form-group">
          <label>Email (para envío RIDE)</label>
          <input v-model="form.cliente_email" type="email" class="input" placeholder="cliente@email.com" />
        </div>
      </div>

      <!-- Sección ítems -->
      <div style="font-weight:600; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">
        Detalle de Productos / Servicios
      </div>
      <table class="table" style="margin-bottom:0.5rem; font-size:0.85rem;">
        <thead>
          <tr>
            <th style="min-width:200px">Producto / Descripción *</th>
            <th style="width:70px">Cant.</th>
            <th style="width:100px">P. Unit.</th>
            <th style="width:70px">Desc.%</th>
            <th style="width:80px">IVA%</th>
            <th style="width:90px">Subtotal</th>
            <th style="width:30px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in form.items" :key="idx">
            <td style="position:relative;">
              <input v-model="item.description" class="input" style="min-width:180px"
                @input="buscarProductoItem(idx, item.description)"
                @keydown.escape="item._sugerencias = []"
                placeholder="Buscar o escribir descripción" />
              <div v-if="item._sugerencias && item._sugerencias.length"
                style="position:absolute; top:100%; left:0; right:0; background:white; border:1px solid var(--border); border-radius:var(--radius); z-index:200; max-height:160px; overflow-y:auto; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                <div v-for="p in item._sugerencias" :key="p.id"
                  @click="seleccionarProductoItem(idx, p)"
                  style="padding:0.45rem 0.75rem; cursor:pointer; font-size:0.82rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                  <span>{{ p.name }}</span>
                  <span style="color:var(--text-muted); font-size:0.78rem;">{{ p.code }} · ${{ p.sale_price }}</span>
                </div>
              </div>
            </td>
            <td><input v-model.number="item.quantity" type="number" class="input" style="width:65px" min="0.01" step="0.01" /></td>
            <td><input v-model.number="item.unit_price" type="number" class="input" style="width:90px" step="0.01" min="0" /></td>
            <td><input v-model.number="item.discount" type="number" class="input" style="width:60px" min="0" max="100" /></td>
            <td>
              <select v-model="item.tarifa_iva" class="input" style="width:75px">
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="8">8%</option>
                <option value="15">15%</option>
              </select>
            </td>
            <td style="font-weight:600; text-align:right;">{{ simbolo }}{{ subtotalItem(item).toFixed(2) }}</td>
            <td>
              <button type="button" @click="form.items.splice(idx,1)"
                style="color:#e74c3c; background:none; border:none; cursor:pointer; font-size:1rem;">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button type="button" class="btn btn-outline" style="font-size:0.8rem; margin-bottom:1rem"
        @click="agregarItem">
        + Agregar línea
      </button>

      <!-- Totales -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
        <!-- Forma de pago y notes -->
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <div class="form-group" v-if="!hidePaymentForm">
            <label>Forma de pago SRI</label>
            <select v-model="form.forma_pago" class="input">
              <option value="01">Sin utilización del sistema financiero (efectivo)</option>
              <option value="15">Compensación de deudas</option>
              <option value="16">Tarjeta de débito</option>
              <option value="17">Dinero electrónico</option>
              <option value="18">Tarjeta prepago</option>
              <option value="19">Tarjeta de crédito</option>
              <option value="20">Otros con utilización del sistema financiero</option>
              <option value="21">Endoso de títulos</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notas / Observaciones</label>
            <textarea v-model="form.notes" class="input" rows="2" placeholder="Observaciones internas o para el cliente" style="resize:vertical;"></textarea>
          </div>
        </div>

        <!-- Resumen totales -->
        <div style="background:var(--bg); border-radius:var(--radius); padding:1rem; align-self:start;">
          <div v-for="(base, tarifa) in resumenIva" :key="tarifa"
            style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
            <span>Subtotal IVA {{ tarifa }}%</span>
            <span>{{ simbolo }}{{ base.toFixed(2) }}</span>
          </div>
          <hr style="margin:0.5rem 0; border-color:var(--border);" />
          <div style="display:flex; justify-content:space-between; font-size:0.875rem; margin-bottom:0.25rem;">
            <span>Subtotal sin impuestos</span><span>{{ simbolo }}{{ subtotalForm.toFixed(2) }}</span>
          </div>
          <div v-for="(valor, tarifa) in ivaDesglosado" :key="'vat'+tarifa"
            style="display:flex; justify-content:space-between; font-size:0.875rem; margin-bottom:0.25rem; color:#e67e22;">
            <span>IVA {{ tarifa }}%</span>
            <span>{{ simbolo }}{{ valor.toFixed(2) }}</span>
          </div>
          <hr style="margin:0.5rem 0; border-color:var(--border);" />
          <div style="display:flex; justify-content:space-between; font-weight:700; font-size:1rem;">
            <span>TOTAL</span><span>{{ simbolo }}{{ totalForm.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <p v-if="errorForm" class="error-msg" style="margin-bottom:1rem; text-align:center;">{{ errorForm }}</p>

      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem; padding-top:1rem; border-top:1px solid var(--border)">
        <button class="btn btn-outline" @click="cerrarModal" :disabled="procesando">Cancelar</button>
        <button class="btn btn-primary" @click="guardar" :disabled="procesando">
          {{ procesando ? 'Guardando...' : 'Guardar y Procesar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
  }
})

function onTipoIdChange() {
  if (form.value.cliente_tipo_id === '07') {
    form.value.cliente_identificacion = '9999999999999'
  } else {
    if (form.value.cliente_identificacion === '9999999999999') {
      form.value.cliente_identificacion = ''
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
  form.value.customer = 'CONSUMIDOR FINAL'
  form.value.cliente_tipo_id = '07'
  form.value.cliente_identificacion = '9999999999999'
  form.value.cliente_direccion = ''
  form.value.cliente_email = ''
  busquedaCliente.value = ''
  sugerencias.value = []
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
  const base = (item.quantity || 0) * (item.unit_price || 0)
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
  if (!form.value.customer.trim()) {
    errorForm.value = 'El nombre del cliente es requerido'
    return
  }
  if (!form.value.cliente_identificacion.trim()) {
    errorForm.value = 'La identificación del cliente es requerida'
    return
  }
  const itemsValidos = form.value.items.filter(i => i.description.trim() && i.quantity > 0 && i.unit_price >= 0)
      .map(({ _sugerencias, ...i }) => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        vat_rate: i.tarifa_iva,
        main_code: i.codigo_principal,
        auxiliary_code: ''
      }))
  
  if (!itemsValidos.length) {
    errorForm.value = 'Agrega al menos un ítem con descripción y cantidad válida'
    return
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
