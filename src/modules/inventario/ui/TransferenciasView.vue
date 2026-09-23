<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-truck-fast text-brand-500"></i> Transferencias de Stock
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Mueve inventario entre sucursales o bodegas y mantén el kardex actualizado.
        </p>
      </div>
      <button @click="abrirNuevaTransferencia" class="btn btn-primary flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md transition-shadow">
        <i class="fa-solid fa-plus"></i> Nueva Transferencia
      </button>
    </div>

    <!-- Stats / Overview (Optional) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
          <i class="fa-solid fa-truck-moving"></i>
        </div>
        <div>
          <div class="text-sm text-slate-500 font-medium">Total Transferencias</div>
          <div class="text-2xl font-bold text-slate-800">{{ transfers.length }}</div>
        </div>
      </div>
    </div>

    <!-- Lista de Transferencias -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="font-bold text-slate-700">Historial de Movimientos</h3>
        <button @click="cargarDatos" class="text-slate-400 hover:text-brand-500 transition-colors" title="Actualizar">
          <i class="fa-solid fa-rotate-right" :class="{'fa-spin': isLoading}"></i>
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
              <th class="p-4 font-semibold">Fecha</th>
              <th class="p-4 font-semibold">Producto</th>
              <th class="p-4 font-semibold text-center">Origen <i class="fa-solid fa-arrow-right mx-1 opacity-50"></i> Destino</th>
              <th class="p-4 font-semibold text-right">Cantidad</th>
              <th class="p-4 font-semibold">Estado / Obs.</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr v-if="isLoading && transfers.length === 0">
              <td colspan="5" class="p-0 border-none">
                <TableSkeleton :rows="5" :has-avatar="false" :has-badge="true" :has-actions="false" />
              </td>
            </tr>
            <tr v-else-if="transfers.length === 0">
              <td colspan="5" class="p-8 text-center text-slate-400">
                <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <i class="fa-solid fa-box-open text-2xl text-slate-300"></i>
                </div>
                <p>No hay transferencias registradas.</p>
                <button @click="abrirNuevaTransferencia" class="mt-3 text-brand-500 text-sm font-medium hover:underline">Crear la primera</button>
              </td>
            </tr>
            <tr v-for="t in transfers" :key="t.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="p-4 text-slate-600 whitespace-nowrap">
                <div class="font-medium text-slate-700">{{ formatearFecha(t.created_at) }}</div>
                <div class="text-[10px] text-slate-400">{{ formatearHora(t.created_at) }}</div>
              </td>
              <td class="p-4">
                <div class="font-medium text-slate-800">{{ t.product_name }}</div>
                <div class="text-xs text-slate-400 font-mono">ID: {{ t.product_id }}</div>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-3">
                  <span class="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium border border-orange-100 w-32 text-center truncate" :title="t.source_branch_name">
                    <i class="fa-solid fa-arrow-up-from-bracket mr-1 opacity-50"></i> {{ t.source_branch_name }}
                  </span>
                  <i class="fa-solid fa-arrow-right text-slate-300 text-xs"></i>
                  <span class="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium border border-emerald-100 w-32 text-center truncate" :title="t.destination_branch_name">
                    <i class="fa-solid fa-arrow-right-to-bracket mr-1 opacity-50"></i> {{ t.destination_branch_name }}
                  </span>
                </div>
              </td>
              <td class="p-4 text-right">
                <span class="font-bold text-slate-700 text-base">{{ t.quantity }}</span>
              </td>
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700">
                  <i class="fa-solid fa-check-circle"></i> {{ t.status === 'completed' ? 'Completada' : t.status }}
                </span>
                <div v-if="t.observations" class="text-[11px] text-slate-500 mt-1 max-w-[200px] truncate" :title="t.observations">
                  "{{ t.observations }}"
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nueva Transferencia -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
              <i class="fa-solid fa-exchange-alt"></i>
            </div>
            Transferir Stock
          </h3>
          <button @click="showModal = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-6 space-y-5">
          <!-- Alerta -->
          <div class="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-3 rounded-lg flex gap-3 items-start">
            <i class="fa-solid fa-circle-info mt-0.5 text-blue-500"></i>
            <div>
              <p class="font-medium">Acerca de las transferencias</p>
              <p class="text-blue-600/80 mt-0.5 leading-relaxed text-xs">Esta acción descontará el inventario de la sucursal de origen y lo sumará a la de destino. Se registrará automáticamente en el kardex.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Origen -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Sucursal Origen</label>
              <select v-model="form.source_branch_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none">
                <option :value="null" disabled>Selecciona origen...</option>
                <option v-for="b in branches" :key="b.id" :value="b.id" :disabled="b.id === form.destination_branch_id">
                  {{ b.name }}
                </option>
              </select>
            </div>
            
            <!-- Destino -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Sucursal Destino</label>
              <select v-model="form.destination_branch_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none">
                <option :value="null" disabled>Selecciona destino...</option>
                <option v-for="b in branches" :key="b.id" :value="b.id" :disabled="b.id === form.source_branch_id">
                  {{ b.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="pt-2">
            <div class="h-px bg-slate-100 w-full mb-4"></div>
          </div>

          <!-- Producto -->
          <div class="space-y-1.5 relative">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Producto a Transferir</label>
            <!-- Custom Select / Search for products (simplified for now to a regular select, or searchable if many) -->
            <select v-model="form.product_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none">
              <option :value="null" disabled>Selecciona el producto...</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                [{{ p.code }}] {{ p.name }}
              </option>
            </select>
            
            <!-- Stock Info (Solo visible si hay producto y origen seleccionado) -->
            <div v-if="form.product_id && form.source_branch_id" class="mt-2 text-xs flex justify-between items-center px-1">
              <span class="text-slate-500">Stock disponible en origen:</span>
              <span class="font-bold font-mono px-2 py-0.5 rounded" :class="stockDisponibleEnOrigen > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ stockDisponibleEnOrigen }}
              </span>
            </div>
          </div>

          <!-- Cantidad y Observaciones -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="space-y-1.5 md:col-span-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Cantidad</label>
              <input type="number" v-model="form.quantity" min="0.01" step="0.01" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-mono" placeholder="0.00" />
            </div>
            
            <div class="space-y-1.5 md:col-span-2">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Observaciones (Opcional)</label>
              <input type="text" v-model="form.observations" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" placeholder="Motivo de la transferencia..." maxlength="150" />
            </div>
          </div>

        </div>
        
        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors">
            Cancelar
          </button>
          <button @click="ejecutarTransferencia" :disabled="isSaving || !esFormularioValido" class="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fa-solid fa-spinner fa-spin" v-if="isSaving"></i>
            <i class="fa-solid fa-paper-plane" v-else></i>
            Ejecutar Traspaso
          </button>
        </div>
        
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../../shared/api'
import { useToast } from 'vue-toastification'
import TableSkeleton from '@/components/TableSkeleton.vue'

const toast = useToast()

const showModal = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)

const transfers = ref([])
const branches = ref([])
const products = ref([])

const form = ref({
  source_branch_id: null,
  destination_branch_id: null,
  product_id: null,
  quantity: 1,
  observations: ''
})

onMounted(() => {
  cargarDatos()
})

async function cargarDatos() {
  isLoading.value = true
  try {
    const [resTransfers, resBranches, resProducts] = await Promise.all([
      api.get('/inventario/transfers/'),
      api.get('/inventario/branches/'),
      api.get('/inventario/products/')
    ])
    transfers.value = resTransfers.data || []
    branches.value = resBranches.data || []
    products.value = resProducts.data || []
  } catch (error) {
    console.error("Error cargando datos", error)
    alert('Error al cargar datos del servidor')
  } finally {
    isLoading.value = false
  }
}

function abrirNuevaTransferencia() {
  form.value = {
    source_branch_id: null,
    destination_branch_id: null,
    product_id: null,
    quantity: 1,
    observations: ''
  }
  showModal.value = true
}

const productoSeleccionado = computed(() => {
  if (!form.value.product_id) return null
  return products.value.find(p => p.id === form.value.product_id)
})

const stockDisponibleEnOrigen = computed(() => {
  if (!productoSeleccionado.value || !form.value.source_branch_id) return 0
  
  // Buscar en branch_stocks
  if (productoSeleccionado.value.branch_stocks) {
    const bs = productoSeleccionado.value.branch_stocks.find(b => b.branch_id === form.value.source_branch_id)
    if (bs) return parseFloat(bs.quantity) || 0
  }
  return 0
})

const esFormularioValido = computed(() => {
  return form.value.source_branch_id 
    && form.value.destination_branch_id 
    && form.value.product_id 
    && form.value.quantity > 0
    && form.value.source_branch_id !== form.value.destination_branch_id
})

async function ejecutarTransferencia() {
  if (form.value.quantity > stockDisponibleEnOrigen.value) {
    if (!confirm(`ATENCIÓN: Estás intentando transferir más cantidad (${form.value.quantity}) de la que hay disponible en la sucursal de origen (${stockDisponibleEnOrigen.value}). Esto dejará el stock en negativo. ¿Deseas continuar?`)) {
      return
    }
  }

  isSaving.value = true
  try {
    await api.post('/inventario/transfers/', form.value)
    toast.success('¡Transferencia ejecutada con éxito!')
    showModal.value = false
    await cargarDatos() // Recargar para ver la nueva transferencia y actualizar stocks
  } catch (error) {
    toast.error(error.response?.data?.error || 'Error al ejecutar la transferencia')
  } finally {
    isSaving.value = false
  }
}

// Helpers
function formatearFecha(fechaStr) {
  if (!fechaStr) return ''
  const date = new Date(fechaStr)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatearHora(fechaStr) {
  if (!fechaStr) return ''
  const date = new Date(fechaStr)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
/* Optional custom styles */
</style>
