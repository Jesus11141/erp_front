<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-clipboard-list text-brand-500"></i> Órdenes de Compra (PO)
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Solicitudes y acuerdos de abastecimiento emitidos a proveedores antes de recibir la factura.
        </p>
      </div>
      <button 
        class="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 whitespace-nowrap" 
        @click="abrirNuevaOrden">
        <i class="fa-solid fa-plus"></i> Nueva Orden de Compra
      </button>
    </div>

    <!-- Filtros por Estado -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1">
      <button 
        v-for="f in filtrosEstado" 
        :key="f.key" 
        @click="estadoSeleccionado = f.key" 
        class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap"
        :class="estadoSeleccionado === f.key ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
        {{ f.label }}
        <span class="ml-1 text-[11px] opacity-75">({{ contarPorEstado(f.key) }})</span>
      </button>
    </div>

    <!-- Tabla de Órdenes -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div v-if="cargando" class="p-0">
        <TableSkeleton :rows="5" :has-avatar="false" :has-badge="true" :has-actions="true" />
      </div>

      <div v-else-if="ordenesFiltradas.length === 0" class="p-16 text-center text-slate-400">
        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <i class="fa-solid fa-file-circle-question text-2xl text-slate-300"></i>
        </div>
        <h3 class="text-base font-bold text-slate-700">No hay órdenes de compra registradas</h3>
        <p class="text-sm text-slate-500 mt-1">Crea una orden para planificar compras a tus proveedores.</p>
        <button @click="abrirNuevaOrden" class="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all shadow-sm">
          + Crear Orden de Compra
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th class="p-4 w-32">Número</th>
              <th class="p-4">Proveedor</th>
              <th class="p-4 w-32">Fecha</th>
              <th class="p-4 w-36">Entrega Est.</th>
              <th class="p-4 w-28 text-center">Ítems</th>
              <th class="p-4 w-32 text-right">Total</th>
              <th class="p-4 w-32 text-center">Estado</th>
              <th class="p-4 w-36 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr v-for="o in ordenesFiltradas" :key="o.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="p-4 font-mono font-bold text-slate-900">
                {{ o.number }}
              </td>
              <td class="p-4 font-semibold text-slate-800">
                {{ o.supplier_name }}
              </td>
              <td class="p-4 text-slate-600 font-mono text-xs">
                {{ o.date }}
              </td>
              <td class="p-4 text-slate-600 text-xs">
                {{ o.expected_delivery_date || '---' }}
              </td>
              <td class="p-4 text-center">
                <span class="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                  {{ o.items_count || (o.items ? o.items.length : 0) }}
                </span>
              </td>
              <td class="p-4 text-right font-mono font-bold text-slate-900">
                ${{ parseFloat(o.total).toFixed(2) }}
              </td>
              <td class="p-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border" :class="badgeEstado(o.status)">
                  {{ labelEstado(o.status) }}
                </span>
              </td>
              <td class="p-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <button 
                    @click="verDetalle(o)" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors" 
                    title="Ver Detalle">
                    <i class="fa-solid fa-eye text-xs"></i>
                  </button>
                  <button 
                    v-if="o.status === 'borrador'" 
                    @click="cambiarEstado(o, 'solicitada')" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors" 
                    title="Marcar como Solicitada">
                    <i class="fa-solid fa-paper-plane text-xs"></i>
                  </button>
                  <button 
                    v-if="o.status === 'solicitada'" 
                    @click="cambiarEstado(o, 'aprobada')" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors" 
                    title="Aprobar Orden">
                    <i class="fa-solid fa-check text-xs"></i>
                  </button>
                  <router-link 
                    v-if="['solicitada', 'aprobada'].includes(o.status)" 
                    :to="{ path: '/compras/facturas', query: { po_id: o.id } }"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors" 
                    title="Convertir a Factura de Compra">
                    <i class="fa-solid fa-receipt text-xs"></i>
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nueva Orden de Compra -->
    <div v-if="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="mostrarModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-sm border border-brand-100">
              <i class="fa-solid fa-clipboard-list"></i>
            </div>
            Nueva Orden de Compra (PO)
          </h3>
          <button @click="mostrarModal = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="guardarOrden" class="p-6 overflow-y-auto space-y-6 flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Proveedor *</label>
              <select v-model="form.supplier_id" required class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                <option value="" disabled>Selecciona un proveedor...</option>
                <option v-for="p in proveedores" :key="p.id" :value="p.id">{{ p.business_name }} ({{ p.identification }})</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Entrega Esperada</label>
              <input v-model="form.expected_delivery_date" type="date" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Términos de Pago</label>
              <input v-model="form.payment_terms" type="text" placeholder="Ej: Crédito 30 días" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            </div>
          </div>

          <!-- Ítems de la Orden -->
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Productos / Ítems</h4>
              <button type="button" @click="agregarItem" class="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                <i class="fa-solid fa-plus"></i> Agregar Ítem
              </button>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th class="p-2.5">Producto / Catálogo</th>
                    <th class="p-2.5">Descripción</th>
                    <th class="p-2.5 w-20 text-center">Cant.</th>
                    <th class="p-2.5 w-24 text-right">Costo Unit.</th>
                    <th class="p-2.5 w-24 text-right">Desc. ($)</th>
                    <th class="p-2.5 w-24 text-center">IVA</th>
                    <th class="p-2.5 w-24 text-right">Subtotal</th>
                    <th class="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(it, idx) in form.items" :key="idx" class="hover:bg-slate-50/50">
                    <td class="p-2">
                      <select 
                        v-model="it.product_id" 
                        @change="alSeleccionarProducto(it)"
                        class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none">
                        <option :value="null">-- Manual / Servicio --</option>
                        <option v-for="prod in productos" :key="prod.id" :value="prod.id">
                          {{ prod.code }} - {{ prod.name }}
                        </option>
                      </select>
                    </td>
                    <td class="p-2">
                      <input v-model="it.description" required placeholder="Descripción..." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none" />
                    </td>
                    <td class="p-2">
                      <input v-model.number="it.quantity" type="number" min="0.01" step="0.01" required class="w-full text-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono outline-none" />
                    </td>
                    <td class="p-2">
                      <input v-model.number="it.unit_price" type="number" min="0" step="0.0001" required class="w-full text-right bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono outline-none" />
                    </td>
                    <td class="p-2">
                      <input v-model.number="it.discount" type="number" min="0" step="0.01" class="w-full text-right bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono outline-none" />
                    </td>
                    <td class="p-2">
                      <select v-model="it.vat_rate" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center outline-none">
                        <option value="15">15%</option>
                        <option value="8">8%</option>
                        <option value="5">5%</option>
                        <option value="0">0%</option>
                      </select>
                    </td>
                    <td class="p-2 text-right font-mono font-bold text-slate-800">
                      ${{ calcularSubtotalItem(it) }}
                    </td>
                    <td class="p-2 text-center">
                      <button 
                        type="button" 
                        @click="eliminarItem(idx)" 
                        :disabled="form.items.length === 1" 
                        class="text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totales -->
            <div class="flex justify-end pt-2">
              <div class="w-64 space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span class="font-mono font-semibold">${{ totalesCalculados.subtotal }}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Descuento:</span>
                  <span class="font-mono font-semibold">-${{ totalesCalculados.descuento }}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>IVA:</span>
                  <span class="font-mono font-semibold">${{ totalesCalculados.iva }}</span>
                </div>
                <div class="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>TOTAL PO:</span>
                  <span class="font-mono text-brand-700">${{ totalesCalculados.total }}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Notas / Observaciones</label>
            <textarea v-model="form.notes" rows="2" placeholder="Instrucciones de despacho, transportista..." class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors" @click="mostrarModal = false">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50" :disabled="guardando">
              <i v-if="guardando" class="fa-solid fa-spinner fa-spin"></i>
              {{ guardando ? 'Guardando...' : 'Crear Orden de Compra' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Ver Detalle PO -->
    <div v-if="ordenDetalle" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="ordenDetalle = null">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden p-6 space-y-4">
        <div class="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Orden de Compra {{ ordenDetalle.number }}</h3>
            <p class="text-xs text-slate-500">Proveedor: <strong class="text-slate-700">{{ ordenDetalle.supplier_name }}</strong> · Fecha: {{ ordenDetalle.date }}</p>
          </div>
          <button @click="ordenDetalle = null" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
        </div>

        <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3">Descripción</th>
                <th class="p-3 text-center">Cant.</th>
                <th class="p-3 text-right">Precio Unit.</th>
                <th class="p-3 text-right">Desc.</th>
                <th class="p-3 text-center">Tarifa IVA</th>
                <th class="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="it in ordenDetalle.items" :key="it.id">
                <td class="p-3 font-medium text-slate-800">{{ it.description }}</td>
                <td class="p-3 text-center font-mono">{{ it.quantity }}</td>
                <td class="p-3 text-right font-mono">${{ parseFloat(it.unit_price).toFixed(2) }}</td>
                <td class="p-3 text-right font-mono">${{ parseFloat(it.discount).toFixed(2) }}</td>
                <td class="p-3 text-center">{{ it.vat_rate }}%</td>
                <td class="p-3 text-right font-mono font-bold">${{ parseFloat(it.subtotal).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-between items-center pt-2">
          <div class="text-xs text-slate-500">
            <span class="font-semibold">Estado:</span> 
            <span class="ml-1 px-2.5 py-0.5 rounded-full font-semibold border" :class="badgeEstado(ordenDetalle.status)">{{ labelEstado(ordenDetalle.status) }}</span>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-500 uppercase block">Total Orden</span>
            <span class="text-xl font-bold font-mono text-slate-900">${{ parseFloat(ordenDetalle.total).toFixed(2) }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button @click="ordenDetalle = null" class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50">Cerrar</button>
          <router-link 
            v-if="['solicitada', 'aprobada'].includes(ordenDetalle.status)"
            :to="{ path: '/compras/facturas', query: { po_id: ordenDetalle.id } }"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5">
            <i class="fa-solid fa-receipt"></i> Convertir a Factura de Compra
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/shared/api'
import { useToast } from 'vue-toastification'
import TableSkeleton from '@/components/TableSkeleton.vue'

const toast = useToast()
const ordenes = ref([])
const proveedores = ref([])
const productos = ref([])
const cargando = ref(true)
const guardando = ref(false)
const estadoSeleccionado = ref('todas')
const mostrarModal = ref(false)
const ordenDetalle = ref(null)

const filtrosEstado = [
  { key: 'todas', label: 'Todas' },
  { key: 'borrador', label: 'Borrador' },
  { key: 'solicitada', label: 'Solicitada' },
  { key: 'aprobada', label: 'Aprobada' },
  { key: 'recibida', label: 'Recibida' },
  { key: 'cancelada', label: 'Cancelada' },
]

const form = ref({
  supplier_id: '',
  expected_delivery_date: null,
  payment_terms: '',
  notes: '',
  items: []
})

const ordenesFiltradas = computed(() => {
  if (estadoSeleccionado.value === 'todas') return ordenes.value
  return ordenes.value.filter(o => o.status === estadoSeleccionado.value)
})

const contarPorEstado = (st) => {
  if (st === 'todas') return ordenes.value.length
  return ordenes.value.filter(o => o.status === st).length
}

const badgeEstado = (st) => {
  const m = {
    'borrador': 'bg-slate-100 text-slate-700 border-slate-200',
    'solicitada': 'bg-blue-50 text-blue-700 border-blue-200',
    'aprobada': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'recibida': 'bg-purple-50 text-purple-700 border-purple-200',
    'cancelada': 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return m[st] || 'bg-slate-50 text-slate-600 border-slate-200'
}

const labelEstado = (st) => {
  const m = {
    'borrador': 'Borrador',
    'solicitada': 'Solicitada',
    'aprobada': 'Aprobada',
    'recibida': 'Recibida',
    'cancelada': 'Cancelada',
  }
  return m[st] || st
}

const calcularSubtotalItem = (it) => {
  const q = Number(it.quantity) || 0
  const p = Number(it.unit_price) || 0
  const d = Number(it.discount) || 0
  return Math.max(0, (q * p) - d).toFixed(2)
}

const totalesCalculados = computed(() => {
  let subtotal = 0
  let descuento = 0
  let iva = 0

  form.value.items.forEach(it => {
    const q = Number(it.quantity) || 0
    const p = Number(it.unit_price) || 0
    const d = Number(it.discount) || 0
    const rate = Number(it.vat_rate) || 0

    const baseBruta = q * p
    const baseNeta = Math.max(0, baseBruta - d)
    const ivaVal = baseNeta * (rate / 100)

    subtotal += baseBruta
    descuento += d
    iva += ivaVal
  })

  return {
    subtotal: subtotal.toFixed(2),
    descuento: descuento.toFixed(2),
    iva: iva.toFixed(2),
    total: (subtotal - descuento + iva).toFixed(2)
  }
})

const fetchOrdenes = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/compras/ordenes/')
    ordenes.value = data
  } catch (error) {
    console.error('Error cargando órdenes de compra:', error)
    toast.error('Error al cargar órdenes de compra')
  } finally {
    cargando.value = false
  }
}

const fetchAuxiliares = async () => {
  try {
    const [resSupp, resProd] = await Promise.all([
      api.get('/compras/proveedores/'),
      api.get('/inventario/productos/')
    ])
    proveedores.value = resSupp.data
    productos.value = resProd.data
  } catch (err) {
    console.error('Error cargando auxiliares:', err)
  }
}

const abrirNuevaOrden = () => {
  form.value = {
    supplier_id: '',
    expected_delivery_date: null,
    payment_terms: '',
    notes: '',
    items: [
      { product_id: null, description: '', quantity: 1, unit_price: 0, discount: 0, vat_rate: '15' }
    ]
  }
  mostrarModal.value = true
}

const agregarItem = () => {
  form.value.items.push({
    product_id: null,
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    vat_rate: '15'
  })
}

const eliminarItem = (index) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

const alSeleccionarProducto = (item) => {
  if (!item.product_id) return
  const p = productos.value.find(x => x.id === item.product_id)
  if (p) {
    item.description = p.name
    item.unit_price = Number(p.purchase_price) || 0
    item.vat_rate = p.vat_rate || '15'
  }
}

const guardarOrden = async () => {
  if (!form.value.supplier_id) {
    toast.warning('Por favor selecciona un proveedor')
    return
  }
  guardando.value = true
  try {
    await api.post('/compras/ordenes/', form.value)
    toast.success('Orden de compra registrada exitosamente')
    mostrarModal.value = false
    await fetchOrdenes()
  } catch (error) {
    console.error('Error guardando orden:', error)
    toast.error(error.response?.data?.error || 'Error al guardar orden de compra')
  } finally {
    guardando.value = false
  }
}

const cambiarEstado = async (orden, nuevoEstado) => {
  try {
    await api.post(`/compras/ordenes/${orden.id}/estado/`, { status: nuevoEstado })
    toast.success(`Estado cambiado a ${labelEstado(nuevoEstado)}`)
    await fetchOrdenes()
  } catch (error) {
    console.error('Error actualizando estado:', error)
    toast.error(error.response?.data?.error || 'No se pudo cambiar el estado')
  }
}

const verDetalle = (o) => {
  ordenDetalle.value = o
}

onMounted(() => {
  fetchOrdenes()
  fetchAuxiliares()
})
</script>
