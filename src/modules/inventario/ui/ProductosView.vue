<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 class="page-title" style="margin:0">Productos</h1>
      <button class="btn btn-primary" @click="abrirNuevoProducto">+ Nuevo Producto</button>
    </div>

    <!-- Filtros -->
    <div class="card" style="margin-bottom:1rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
      <input v-model="busqueda" class="input" placeholder="Buscar por name o código..."
        style="max-width:300px" @input="cargar" />
      <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; cursor:pointer;">
        <input type="checkbox" v-model="soloBajoStock" @change="cargar" /> Solo bajo stock
      </label>
    </div>

    <!-- Tabla -->
    <div class="card table-card">
      <div class="table-responsive">
        <table class="table modern-table">
        <thead>
          <tr>
            <th>Código</th><th>Nombre</th><th>Stock</th><th>Mín.</th>
            <th>P. Compra</th><th>P. Venta</th><th>IVA</th><th>Margen</th>
            <th>Estado</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td style="font-family:monospace; font-size:0.85rem;">{{ p.code }}</td>
            <td>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <img v-if="p.image" :src="p.image.startsWith('http') ? p.image : api.defaults.baseURL.replace('/api', '') + p.image" style="width:32px; height:32px; object-fit:cover; border-radius:6px; border:1px solid #e2e8f0;" />
                <div v-else style="width:32px; height:32px; border-radius:6px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:#94a3b8; font-weight:600; border:1px dashed #cbd5e1;">
                  📦
                </div>
                <span>{{ p.name }}</span>
              </div>
            </td>
            <td>
              <span :style="p.low_stock ? 'color:#e74c3c; font-weight:600' : ''">
                {{ p.current_stock }} {{ p.unit }}
              </span>
            </td>
            <td>{{ p.minimum_stock }}</td>
            <td>{{ simbolo }}{{ p.purchase_price }}</td>
            <td>{{ simbolo }}{{ p.sale_price }}</td>
            <td>{{ p.vat_rate }}%</td>
            <td>{{ p.margin }}%</td>
            <td>
              <span :class="p.low_stock ? 'badge badge-danger' : 'badge badge-success'">
                {{ p.low_stock ? 'Bajo stock' : 'OK' }}
              </span>
            </td>
            <td style="display:flex; gap:0.4rem; white-space: nowrap;">
              <button class="btn btn-sm btn-success"
                @click="abrirEntradaStock(p)" title="Registrar entrada de mercadería">
                ➕ Stock
              </button>
              <button class="btn btn-sm btn-outline-secondary"
                @click="verMovimientos(p)" title="Ver historial de movimientos">
                ⏱️ Historial
              </button>
              <button class="btn btn-sm btn-outline-primary"
                @click="abrirEscalasVolumen(p)" title="Configurar Escalas de Descuento por Volumen">
                📊 Escalas
              </button>
            </td>
          </tr>
          <tr v-if="!products.length">
            <td colspan="10" style="text-align:center; padding: 3rem; color: #94a3b8; font-size: 1.1rem;">
              <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">📦</span>
              No se encontraron products
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- ── MODAL NUEVO PRODUCTO ── -->
    <div v-if="mostrarFormProducto" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1rem">Nuevo Producto</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
          <div class="form-group"><label>Código *</label>
            <input v-model="formProducto.code" class="input" placeholder="COD-001" />
          </div>
          <div class="form-group"><label>Nombre *</label>
            <input v-model="formProducto.name" class="input" placeholder="Nombre del product" />
          </div>
          <div class="form-group"><label>Precio Compra</label>
            <input v-model.number="formProducto.precio_compra" type="number" class="input" min="0" step="0.01" />
          </div>
          <div class="form-group"><label>Precio Venta (Inc. IVA) *</label>
            <input v-model.number="formProducto.precio_venta" type="number" class="input" min="0" step="0.01" />
          </div>
          <div class="form-group"><label>Stock Inicial</label>
            <input v-model.number="formProducto.stock_inicial" type="number" class="input" min="0" />
          </div>
          <div class="form-group"><label>Stock Mínimo</label>
            <input v-model.number="formProducto.stock_minimo" type="number" class="input" min="0" />
          </div>
          <div class="form-group"><label>Unidad</label>
            <select v-model="formProducto.unidad" class="input">
              <option value="pza">Pieza</option>
              <option value="kg">Kilogramo</option>
              <option value="lt">Litro</option>
              <option value="register">Caja</option>
              <option value="m">Metro</option>
              <option value="par">Par</option>
            </select>
          </div>
          <div class="form-group"><label>Tarifa IVA</label>
            <select v-model="formProducto.tarifa_iva" class="input">
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="8">8%</option>
              <option value="15">15%</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1"><label>Descripción</label>
            <input v-model="formProducto.description" class="input" placeholder="Descripción opcional" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Foto del Artículo (opcional)</label>
            <div class="upload-dropzone" style="border: 2px dashed #cbd5e1; border-radius: 8px; background-color: #f8fafc; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.2s ease;">
              <input type="file" @change="onFileChange" accept="image/*" class="file-input-hidden" id="product-photo-upload" style="display: none;" />
              <label for="product-photo-upload" class="dropzone-label" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; color: #64748b; font-size: 0.875rem;">
                <span v-if="!fotoPreview" class="upload-icon" style="font-size: 2rem;">📷</span>
                <img v-else :src="fotoPreview" class="upload-preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
                <span class="upload-text" style="font-weight: 600;">{{ fotoPreview ? 'Cambiar imagen' : 'Haz click para subir o arrastrar foto' }}</span>
              </label>
            </div>
          </div>
        </div>
        <p v-if="errorProducto" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem;">⚠️ {{ errorProducto }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="mostrarFormProducto = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarProducto" :disabled="guardandoProducto">
            {{ guardandoProducto ? 'Guardando...' : 'Guardar Producto' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL ENTRADA DE STOCK ── -->
    <div v-if="productoSeleccionado" class="modal-overlay">
      <div class="modal" style="max-width:420px;">
        <h3 style="margin-bottom:0.25rem">Entrada de Mercadería</h3>
        <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:1rem;">
          {{ productoSeleccionado.name }} —
          Stock actual: <strong>{{ productoSeleccionado.current_stock }} {{ productoSeleccionado.unit }}</strong>
        </p>

        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <div class="form-group">
            <label>Tipo de movimiento</label>
            <select v-model="formStock.type" class="input">
              <option value="entrada">Entrada (compra / recepción)</option>
              <option value="ajuste">Ajuste (corrección de inventory)</option>
            </select>
          </div>
          <div class="form-group">
            <label>
              {{ formStock.type === 'ajuste' ? 'Nuevo stock total' : 'Cantidad a ingresar' }} *
            </label>
            <input v-model.number="formStock.quantity" type="number" class="input"
              min="0.01" step="0.01" :placeholder="formStock.type === 'ajuste' ? 'Ej: 50' : 'Ej: 10'" />
            <small v-if="formStock.type === 'entrada' && formStock.quantity > 0" style="color:var(--text-muted);">
              Stock resultante: {{ (parseFloat(productoSeleccionado.current_stock) + formStock.quantity).toFixed(2) }}
              {{ productoSeleccionado.unit }}
            </small>
          </div>
          <div class="form-group">
            <label>Referencia (invoice, orden de compra, etc.)</label>
            <input v-model="formStock.referencia" class="input" placeholder="Ej: FAC-001-000000123" />
          </div>
        </div>

        <p v-if="errorStock" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem;">⚠️ {{ errorStock }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem">
          <button class="btn btn-outline" @click="productoSeleccionado = null">Cancelar</button>
          <button class="btn btn-primary" style="background:#27ae60;"
            @click="guardarStock" :disabled="guardandoStock">
            {{ guardandoStock ? 'Guardando...' : 'Registrar Entrada' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL HISTORIAL ── -->
    <div v-if="movimientos !== null" class="modal-overlay">
      <div class="modal" style="max-width:600px;">
        <h3 style="margin-bottom:1rem">Historial — {{ productoHistorial?.name }}</h3>
        <table class="table" style="font-size:0.85rem;">
          <thead>
            <tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Stock resultante</th><th>Referencia</th></tr>
          </thead>
          <tbody>
            <tr v-for="m in movimientos" :key="m.created_at">
              <td>{{ new Date(m.created_at).toLocaleString() }}</td>
              <td>
                <span :class="m.type === 'entrada' ? 'badge badge-success' : m.type === 'salida' ? 'badge badge-danger' : 'badge badge-info'">
                  {{ m.type }}
                </span>
              </td>
              <td>{{ m.type === 'salida' ? '-' : '+' }}{{ m.quantity }}</td>
              <td>{{ m.new_stock }}</td>
              <td style="color:var(--text-muted); font-size:0.8rem;">{{ m.reference || '-' }}</td>
            </tr>
            <tr v-if="!movimientos.length">
              <td colspan="5" style="text-align:center; color:var(--text-muted)">Sin movimientos registrados</td>
            </tr>
          </tbody>
        </table>
        <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
          <button class="btn btn-outline" @click="movimientos = null">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- ── MODAL ESCALAS DE VOLUMEN ── -->
    <div v-if="productoEscalas" class="modal-overlay">
      <div class="modal" style="max-width:550px;">
        <h3 style="margin-bottom:0.25rem">Escalas por Volumen — {{ productoEscalas.name }}</h3>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1rem;">
          Define los precios especiales que se aplicarán según la quantity comprada.
        </p>

        <!-- Tabla de Escalas del Producto -->
        <table class="table" style="font-size:0.85rem; margin-bottom:1rem;">
          <thead>
            <tr><th>Cant. Mínima</th><th>Cant. Máxima</th><th>Precio Oferta</th><th>Acción</th></tr>
          </thead>
          <tbody>
            <tr v-for="e in listaEscalas" :key="e.id">
              <td><strong>{{ parseFloat(e.minimum_quantity) }}</strong></td>
              <td>{{ e.maximum_quantity ? parseFloat(e.maximum_quantity) : 'En adelante' }}</td>
              <td><strong style="color:var(--color-primario)">{{ simbolo }}{{ parseFloat(e.unit_price).toFixed(2) }}</strong></td>
              <td>
                <button class="btn btn-danger btn-sm" style="padding:0.15rem 0.4rem; font-size:0.7rem;" @click="eliminarEscala(e.id)">
                  ✕
                </button>
              </td>
            </tr>
            <tr v-if="!listaEscalas.length">
              <td colspan="4" style="text-align:center; color:var(--text-muted)">Sin escalas configuradas</td>
            </tr>
          </tbody>
        </table>

        <!-- Formulario agregar nueva escala -->
        <div style="background:#f8fafc; padding:0.875rem; border-radius:8px; border:1px solid var(--border);">
          <h4 style="margin:0 0 0.5rem 0; font-size:0.85rem;">➕ Agregar Nueva Escala</h4>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem;">
            <div class="form-group" style="margin:0;">
              <label style="font-size:0.75rem;">Mínimo *</label>
              <input v-model.number="formEscala.cantidad_minima" type="number" class="input" placeholder="Ej: 5" min="1" />
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size:0.75rem;">Máximo (opcional)</label>
              <input v-model.number="formEscala.cantidad_maxima" type="number" class="input" placeholder="Ej: 9" />
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size:0.75rem;">Precio Unitario *</label>
              <input v-model.number="formEscala.unit_price" type="number" step="0.01" class="input" placeholder="Ej: 9.00" />
            </div>
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top:0.75rem; width:100%;" @click="guardarEscala" :disabled="guardandoEscala">
            {{ guardandoEscala ? 'Guardando...' : 'Guardar Escala' }}
          </button>
        </div>

        <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
          <button class="btn btn-outline" @click="productoEscalas = null">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../../shared/api'
import { useParametrosStore } from '../../../stores/parametros'

const parametrosStore = useParametrosStore()
const simbolo = computed(() => parametrosStore.company?.simbolo || '$')

const products = ref([])
const busqueda = ref('')
const soloBajoStock = ref(false)

// Nuevo product
const mostrarFormProducto = ref(false)
const guardandoProducto = ref(false)
const errorProducto = ref('')
const formProductoVacio = () => ({
  code: '', name: '', description: '',
  precio_compra: 0, precio_venta: 0,
  stock_inicial: 0, stock_minimo: 0,
  unidad: 'pza', tarifa_iva: '15',
})
const formProducto = ref(formProductoVacio())
const fotoFile = ref(null)
const fotoPreview = ref(null)

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  fotoFile.value = file
  fotoPreview.value = URL.createObjectURL(file)
}

// Entrada de stock
const productoSeleccionado = ref(null)
const guardandoStock = ref(false)
const errorStock = ref('')
const formStock = ref({ type: 'entrada', quantity: 0, referencia: '' })

// Historial
const movimientos = ref(null)
const productoHistorial = ref(null)

async function cargar() {
  const params = {}
  if (busqueda.value) params.q = busqueda.value
  if (soloBajoStock.value) params.bajo_stock = 'true'
  try {
    const { data } = await api.get('/inventario/products/', { params })
    products.value = data
  } catch {
    products.value = []
  }
}

onMounted(cargar)

function abrirNuevoProducto() {
  formProducto.value = formProductoVacio()
  fotoFile.value = null
  fotoPreview.value = null
  errorProducto.value = ''
  mostrarFormProducto.value = true
}

async function guardarProducto() {
  errorProducto.value = ''
  if (!formProducto.value.code || !formProducto.value.name || !formProducto.value.precio_venta) {
    errorProducto.value = 'Código, name y price de sale son requeridos'
    return
  }
  guardandoProducto.value = true
  try {
    const formData = new FormData()
    formData.append('code', formProducto.value.code)
    formData.append('name', formProducto.value.name)
    formData.append('description', formProducto.value.description || '')
    formData.append('purchase_price', formProducto.value.precio_compra || 0)
    formData.append('sale_price', formProducto.value.precio_venta)
    formData.append('initial_stock', formProducto.value.stock_inicial || 0)
    formData.append('minimum_stock', formProducto.value.stock_minimo || 0)
    formData.append('unit', formProducto.value.unidad)
    formData.append('vat_rate', formProducto.value.tarifa_iva)
    if (fotoFile.value) {
      formData.append('image', fotoFile.value)
    }

    await api.post('/inventario/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    await cargar()
    mostrarFormProducto.value = false
    fotoFile.value = null
    fotoPreview.value = null
  } catch (e) {
    errorProducto.value = e.response?.data?.error || 'Error al guardar'
  } finally {
    guardandoProducto.value = false
  }
}

function abrirEntradaStock(product) {
  productoSeleccionado.value = product
  formStock.value = { type: 'entrada', quantity: 0, referencia: '' }
  errorStock.value = ''
}

async function guardarStock() {
  errorStock.value = ''
  if (!formStock.value.quantity || formStock.value.quantity <= 0) {
    errorStock.value = 'La quantity debe ser mayor a 0'
    return
  }
  guardandoStock.value = true
  try {
    await api.post(`/inventory/products/${productoSeleccionado.value.id}/stock/`, {
      quantity: formStock.value.quantity,
      type: formStock.value.type,
      referencia: formStock.value.referencia,
    })
    await cargar()
    productoSeleccionado.value = null
  } catch (e) {
    errorStock.value = e.response?.data?.error || 'Error al registrar entrada'
  } finally {
    guardandoStock.value = false
  }
}

async function verMovimientos(product) {
  productoHistorial.value = product
  try {
    const { data } = await api.get(`/inventory/products/${product.id}/movements/`)
    movimientos.value = data
  } catch {
    movimientos.value = []
  }
}

// Escalas por Volumen
const productoEscalas = ref(null)
const listaEscalas = ref([])
const guardandoEscala = ref(false)
const formEscala = ref({ cantidad_minima: 5, cantidad_maxima: null, unit_price: 0 })

async function abrirEscalasVolumen(product) {
  productoEscalas.value = product
  formEscala.value = { cantidad_minima: 5, cantidad_maxima: null, unit_price: (parseFloat(product.sale_price) * 0.9).toFixed(2) }
  await cargarEscalas()
}

async function cargarEscalas() {
  if (!productoEscalas.value) return
  try {
    const { data } = await api.get(`/inventory/products/${productoEscalas.value.id}/discount-tiers/`)
    listaEscalas.value = data
  } catch {
    listaEscalas.value = []
  }
}

async function guardarEscala() {
  if (!formEscala.value.cantidad_minima || !formEscala.value.unit_price) return
  guardandoEscala.value = true
  try {
    await api.post(`/inventory/products/${productoEscalas.value.id}/discount-tiers/`, formEscala.value)
    await cargarEscalas()
    formEscala.value.cantidad_minima = parseFloat(formEscala.value.cantidad_minima) + 5
  } catch (e) {
    alert(e.response?.data?.error || 'Error al guardar escala')
  } finally {
    guardandoEscala.value = false
  }
}

async function eliminarEscala(escalaId) {
  try {
    await api.delete(`/inventory/discount-tiers/${escalaId}/`)
    await cargarEscalas()
  } catch (e) {
    alert(e.response?.data?.error || 'Error al eliminar escala')
  }
}
</script>

<style scoped>
.page-title {
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.table-card {
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.modern-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}
.modern-table th {
  background-color: #f8fafc;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  padding: 1rem;
  border-bottom: 2px solid #e2e8f0;
}
.modern-table td {
  padding: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}
.modern-table tbody tr:hover {
  background-color: #f8fafc;
}
.btn-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.btn-success { background: #10b981; color: white; border: none; }
.btn-success:hover { background: #059669; }
.btn-outline-primary { border: 1px solid #3b82f6; color: #3b82f6; background: transparent; }
.btn-outline-primary:hover { background: #eff6ff; }
.btn-outline-secondary { border: 1px solid #94a3b8; color: #64748b; background: transparent; }
.btn-outline-secondary:hover { background: #f1f5f9; color: #334155; }
</style>

