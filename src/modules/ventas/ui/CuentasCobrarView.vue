<template>
  <div class="cuentas-cobrar-container p-6">
    <div class="page-header">
      <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Cuentas por Cobrar (Cartera)</h1>
      <button @click="cargarCuentas" class="btn btn-secondary">
        <i class="fa-solid fa-rotate-right mr-2"></i> Actualizar
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
        <div class="relative flex-1 max-w-md">
          <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            v-model="search"
            type="text" 
            placeholder="Buscar por cliente o referencia..." 
            class="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
          >
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
              <th class="p-4">Cliente</th>
              <th class="p-4">Referencia</th>
              <th class="p-4 text-right">Total Deuda</th>
              <th class="p-4 text-right">Saldo Pendiente</th>
              <th class="p-4 text-center">Estado</th>
              <th class="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="cuenta in cuentasFiltradas" :key="cuenta.id" class="hover:bg-gray-50/50 transition-colors">
              <td class="p-4 font-medium text-gray-800">{{ cuenta.customer_name }}</td>
              <td class="p-4 text-gray-600 text-sm">
                <span class="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                  {{ cuenta.reference_type }} #{{ cuenta.reference_id }}
                </span>
              </td>
              <td class="p-4 text-right font-medium text-gray-600">${{ parseFloat(cuenta.total_amount).toFixed(2) }}</td>
              <td class="p-4 text-right font-bold text-gray-900">${{ parseFloat(cuenta.balance_due).toFixed(2) }}</td>
              <td class="p-4 text-center">
                <span :class="['px-3 py-1 rounded-full text-xs font-medium', getStatusClass(cuenta.status)]">
                  {{ getStatusText(cuenta.status) }}
                </span>
              </td>
              <td class="p-4 text-center">
                <button 
                  v-if="cuenta.status !== 'PAID'"
                  @click="abrirModalAbono(cuenta)" 
                  class="bg-brand-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
                >
                  <i class="fa-solid fa-money-bill-wave mr-1"></i> Abonar
                </button>
              </td>
            </tr>
            <tr v-if="cuentasFiltradas.length === 0">
              <td colspan="6" class="p-0 border-none">
                <EmptyState 
                  :icon="search ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-hand-holding-dollar'"
                  :icon-color="search ? 'text-amber-500' : 'text-emerald-500'"
                  :icon-bg="search ? 'bg-amber-50' : 'bg-emerald-50'"
                  :title="search ? 'Sin coincidencias para la búsqueda' : '¡Excelente! No tienes cobros pendientes'"
                  :description="search ? `No encontramos ninguna cuenta que coincida con '${search}'.` : 'Todas tus facturas y ventas a crédito han sido canceladas al día.'"
                  :secondary-action-text="search ? 'Limpiar Búsqueda' : ''"
                  secondary-action-icon="fa-solid fa-rotate-left"
                  @secondary-action="search = ''"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Abono -->
    <div v-if="mostrarModalAbono" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 class="text-xl font-bold text-gray-800">Registrar Abono</h3>
          <button @click="cerrarModalAbono" class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <!-- Alerta de Caja Personalizada -->
        <div v-if="errorCaja" class="mx-6 mt-6 mb-2" style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 1rem; border-radius: 4px; display: flex; gap: 1rem; align-items: flex-start;">
          <span style="font-size: 1.5rem; color: #EF4444;">⚠️</span>
          <div>
            <h4 style="color: #991B1B; margin-top: 0; margin-bottom: 0.5rem; font-size: 1rem;">Acción Bloqueada: Caja Cerrada</h4>
            <p style="color: #B91C1C; margin: 0; font-size: 0.9rem;">
              No puedes registrar cobros porque no has iniciado tu turno de caja. 
              Por favor, dirígete al módulo POS y <strong>Abre tu Caja</strong> para poder registrar el ingreso de dinero.
            </p>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div class="bg-brand-50 p-4 rounded-lg border border-brand-500/10">
            <p class="text-sm text-gray-600">Cliente: <span class="font-bold text-gray-900">{{ cuentaSeleccionada.customer_name }}</span></p>
            <p class="text-sm text-gray-600">Saldo Pendiente: <span class="font-bold text-brand-600 text-lg">${{ parseFloat(cuentaSeleccionada.balance_due).toFixed(2) }}</span></p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Monto a Abonar ($)</label>
            <input 
              v-model.number="formAbono.amount" 
              type="number" 
              step="0.01"
              min="0.01"
              :max="cuentaSeleccionada.balance_due"
              class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium text-lg"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
            <select v-model="formAbono.payment_method" @change="onPaymentMethodChange" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
              <option v-for="pm in metodosPago" :key="pm.id" :value="pm.name">{{ pm.name }}</option>
            </select>
          </div>

          <div v-if="metodoSeleccionadoRequiereReferencia" class="animate-in fade-in slide-in-from-top-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Comprobante / Referencia</label>
            <input 
              v-model="formAbono.notes" 
              type="text" 
              placeholder="Número de transferencia, cheque, etc." 
              class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            >
          </div>
        </div>

        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button @click="cerrarModalAbono" class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button 
            @click="guardarAbono" 
            :disabled="cargandoAbono || !formAbono.amount || formAbono.amount <= 0 || formAbono.amount > cuentaSeleccionada.balance_due"
            class="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <i v-if="cargandoAbono" class="fa-solid fa-spinner fa-spin"></i>
            {{ cargandoAbono ? 'Procesando...' : 'Confirmar Abono' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/shared/api'
import { useParametrosStore } from '../../../stores/parametros'
import EmptyState from '@/components/EmptyState.vue'

const parametrosStore = useParametrosStore()
const cuentas = ref([])
const metodosPago = ref([])
const search = ref('')

// Modal Abono
const mostrarModalAbono = ref(false)
const cuentaSeleccionada = ref(null)
const procesandoAbono = ref(false)
const errorCaja = ref(false)
const formAbono = ref({
  amount: 0,
  payment_method: '',
  notes: ''
})

const metodoSeleccionadoRequiereReferencia = computed(() => {
  const method = metodosPago.value.find(m => m.name === formAbono.value.payment_method)
  return method ? method.requires_reference : false
})

const onPaymentMethodChange = () => {
  if (!metodoSeleccionadoRequiereReferencia.value) {
    formAbono.value.notes = ''
  }
}

const cuentasFiltradas = computed(() => {
  if (!search.value) return cuentas.value
  const query = search.value.toLowerCase()
  return cuentas.value.filter(c => 
    c.customer_name.toLowerCase().includes(query) ||
    c.reference_type.toLowerCase().includes(query)
  )
})

const cargarCuentas = async () => {
  try {
    const res = await api.get('/ventas/receivables/')
    cuentas.value = res.data
  } catch (error) {
    console.error('Error cargando cuentas:', error)
    alert('Error cargando la cartera de cuentas por cobrar')
  }
}

const cargarMetodosPago = async () => {
  try {
    const res = await api.get('/ventas/payment-methods/')
    metodosPago.value = res.data.filter(m => m.active)
    if (metodosPago.value.length > 0) {
      formAbono.value.payment_method = metodosPago.value[0].name
    }
  } catch (error) {
    console.error('Error cargando metodos de pago:', error)
  }
}

const getStatusText = (status) => {
  const map = {
    'PENDING': 'Pendiente',
    'PARTIAL': 'Parcial',
    'PAID': 'Pagado'
  }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = {
    'PENDING': 'bg-red-100 text-red-700',
    'PARTIAL': 'bg-yellow-100 text-yellow-800',
    'PAID': 'bg-green-100 text-green-700'
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const abrirModalAbono = (cuenta) => {
  cuentaSeleccionada.value = cuenta
  formAbono.value = {
    amount: parseFloat(cuenta.balance_due),
    payment_method: metodosPago.value.length > 0 ? metodosPago.value[0].name : '',
    notes: ''
  }
  errorCaja.value = false
  mostrarModalAbono.value = true
}

const cerrarModalAbono = () => {
  mostrarModalAbono.value = false
  cuentaSeleccionada.value = null
  errorCaja.value = false
}

const guardarAbono = async () => {
  if (formAbono.value.amount <= 0 || formAbono.value.amount > cuentaSeleccionada.value.balance_due) {
    alert('Monto inválido')
    return
  }
  procesandoAbono.value = true
  errorCaja.value = false
  try {
    const payload = {
      amount: formAbono.value.amount,
      payment_method: formAbono.value.payment_method,
      notes: formAbono.value.notes
    }
    await api.post(`/ventas/receivables/${cuentaSeleccionada.value.id}/pay/`, payload)
    alert('Abono registrado correctamente')
    cerrarModalAbono()
    cargarCuentas()
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message
    if (typeof errorMsg === 'string' && errorMsg.includes('Debe abrir caja')) {
      errorCaja.value = true
    } else {
      alert('Error registrando el abono: ' + (error.response?.data?.error || error.message))
    }
  } finally {
    procesandoAbono.value = false
  }
}

onMounted(() => {
  cargarMetodosPago()
  cargarCuentas()
})
</script>

<style scoped>
/* Scoped styles inherit layout from global css */
</style>
