<template>
  <div>
    <div class="page-header">
      <h1 class="page-title" style="margin:0">Órdenes de Servicio Técnico</h1>
      <button class="btn btn-primary" @click="abrirModal">+ Nueva Orden</button>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <input v-model="busqueda" class="input" placeholder="Buscar por cliente o IMEI..." style="max-width:300px" />
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Dispositivo</th>
            <th>IMEI/Serie</th>
            <th>Estado</th>
            <th style="text-align:right">Saldo Pendiente</th>
            <th style="text-align:center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="7" style="text-align:center; color:var(--text-muted)">Cargando órdenes...</td>
          </tr>
          <tr v-else-if="ordenesFiltradas.length === 0">
            <td colspan="7" style="padding: 0; border: none;">
              <EmptyState 
                :icon="busqueda ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-wrench'"
                :icon-color="busqueda ? 'text-amber-500' : 'text-brand-500'"
                :icon-bg="busqueda ? 'bg-amber-50' : 'bg-brand-50'"
                :title="busqueda ? 'Sin órdenes encontradas' : 'No hay órdenes de servicio técnico'"
                :description="busqueda ? `No encontramos ninguna orden que coincida con '${busqueda}'.` : 'Registra equipos, diagnósticos, fallas y repuestos para tus clientes.'"
                :action-text="busqueda ? '' : '+ Nueva Orden'"
                :secondary-action-text="busqueda ? 'Limpiar Búsqueda' : ''"
                action-icon="fa-solid fa-plus"
                secondary-action-icon="fa-solid fa-rotate-left"
                @action="mostrarModalForm = true"
                @secondary-action="busqueda = ''"
              />
            </td>
          </tr>
          <tr v-for="orden in ordenesFiltradas" :key="orden.id">
            <td>{{ formatFecha(orden.created_at) }}</td>
            <td style="font-weight:bold">{{ orden.customer_name }}</td>
            <td>{{ orden.device_type }}<br><small style="color:var(--text-muted)">{{ orden.device_model || '' }}</small></td>
            <td>{{ orden.device_identifier }}</td>
            <td>
              <span class="badge">{{ mapEstado(orden.status) }}</span>
            </td>
            <td style="text-align:right; font-family:monospace">${{ orden.balance_due.toFixed(2) }}</td>
            <td style="text-align:center">
              <button @click="cambiarEstado(orden)" class="btn btn-outline" style="margin-right:0.5rem" title="Cambiar Estado">
                ✏️ Estado
              </button>
              <button v-if="orden.balance_due > 0" @click="abrirCobro(orden)" class="btn btn-outline" style="margin-right:0.5rem; color:var(--success-color); border-color:var(--success-color)" title="Cobrar Saldo">
                💰 Cobrar
              </button>
              <button @click="imprimirTicket(orden)" class="btn btn-outline" title="Imprimir Orden">
                🖨️ Imprimir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modales -->
    <WorkOrderForm 
      v-if="mostrarModalForm" 
      @close="mostrarModalForm = false" 
      @saved="onOrdenGuardada" 
    />
    
    <WorkOrderTicket 
      v-if="mostrarModalTicket" 
      :order="ordenSeleccionada" 
      @close="mostrarModalTicket = false" 
    />

    <!-- Modal Cambiar Estado -->
    <div v-if="mostrarModalEstado" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-bold text-slate-800 text-lg">Cambiar Estado</h3>
          <button @click="mostrarModalEstado = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        <div class="p-6">
          <p class="text-sm text-slate-600 mb-4">Seleccione el nuevo estado para la orden de <strong class="text-slate-800">{{ ordenParaEstado?.customer_name }}</strong>:</p>
          <div class="flex flex-col gap-2">
            <button @click="guardarNuevoEstado('RECEIVED')" class="w-full text-left px-4 py-3 rounded-lg border transition-all" :class="ordenParaEstado?.status === 'RECEIVED' ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold' : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50'">
              <span class="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-2"></span> Recibido
            </button>
            <button @click="guardarNuevoEstado('IN_REPAIR')" class="w-full text-left px-4 py-3 rounded-lg border transition-all" :class="ordenParaEstado?.status === 'IN_REPAIR' ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold' : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50'">
              <span class="inline-block w-3 h-3 rounded-full bg-blue-400 mr-2"></span> En Reparación
            </button>
            <button @click="guardarNuevoEstado('READY')" class="w-full text-left px-4 py-3 rounded-lg border transition-all" :class="ordenParaEstado?.status === 'READY' ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold' : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50'">
              <span class="inline-block w-3 h-3 rounded-full bg-emerald-400 mr-2"></span> Listo
            </button>
            <button @click="guardarNuevoEstado('DELIVERED')" class="w-full text-left px-4 py-3 rounded-lg border transition-all" :class="ordenParaEstado?.status === 'DELIVERED' ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold' : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50'">
              <span class="inline-block w-3 h-3 rounded-full bg-slate-400 mr-2"></span> Entregado
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Cobrar -->
    <div v-if="mostrarModalCobro" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-bold text-slate-800 text-lg">Cobrar Orden</h3>
          <button @click="mostrarModalCobro = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        <div class="p-6">
          <div class="mb-4 text-center">
            <p class="text-sm text-slate-500">Saldo Pendiente</p>
            <p class="text-3xl font-bold text-slate-800">${{ ordenParaCobro?.balance_due.toFixed(2) }}</p>
          </div>
          <div class="mb-4">
            <label class="label">Monto a Abonar</label>
            <input type="number" v-model.number="montoAbono" class="input" step="0.01" min="0.01" :max="ordenParaCobro?.balance_due" />
          </div>
          <div class="flex gap-2">
            <button @click="montoAbono = ordenParaCobro?.balance_due" class="btn btn-outline flex-1 text-xs">Liquidar Todo</button>
            <button @click="procesarCobro" class="btn btn-primary flex-1" :disabled="!montoAbono || montoAbono <= 0 || montoAbono > ordenParaCobro?.balance_due">
              Procesar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../../shared/api'
import WorkOrderForm from './WorkOrderForm.vue'
import WorkOrderTicket from './WorkOrderTicket.vue'
import EmptyState from '@/components/EmptyState.vue'

const ordenes = ref([])
const busqueda = ref('')
const cargando = ref(true)

const mostrarModalForm = ref(false)
const mostrarModalTicket = ref(false)
const ordenSeleccionada = ref(null)

const mostrarModalEstado = ref(false)
const ordenParaEstado = ref(null)

const mostrarModalCobro = ref(false)
const ordenParaCobro = ref(null)
const montoAbono = ref(0)

onMounted(async () => {
  await cargarOrdenes()
})

const cargarOrdenes = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/technical-service/orders/')
    ordenes.value = data
  } catch (error) {
    console.error('Error cargando ordenes', error)
  }
  cargando.value = false
}

const ordenesFiltradas = computed(() => {
  return ordenes.value.filter(o => 
    o.customer_name.toLowerCase().includes(busqueda.value.toLowerCase()) ||
    o.device_identifier.toLowerCase().includes(busqueda.value.toLowerCase())
  )
})

const formatFecha = (str) => {
  if (!str) return ''
  return new Date(str).toLocaleDateString()
}

const mapEstado = (status) => {
  const map = {
    'RECEIVED': 'Recibido',
    'IN_REPAIR': 'En Reparación',
    'READY': 'Listo',
    'DELIVERED': 'Entregado'
  }
  return map[status] || status
}

const badgeEstado = (status) => {
  if (status === 'RECEIVED') return 'px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs'
  if (status === 'IN_REPAIR') return 'px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs'
  if (status === 'READY') return 'px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs'
  if (status === 'DELIVERED') return 'px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs'
  return 'px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs'
}

const abrirModal = () => {
  mostrarModalForm.value = true
}

const onOrdenGuardada = () => {
  mostrarModalForm.value = false
  cargarOrdenes()
}

const cambiarEstado = (orden) => {
  ordenParaEstado.value = orden
  mostrarModalEstado.value = true
}

const guardarNuevoEstado = async (nuevo) => {
  if (!ordenParaEstado.value) return
  try {
    await api.patch(`/technical-service/orders/${ordenParaEstado.value.id}/status/`, { status: nuevo })
    mostrarModalEstado.value = false
    await cargarOrdenes()
  } catch(e) {
    alert('Error cambiando estado')
  }
}

const imprimirTicket = (orden) => {
  ordenSeleccionada.value = orden
  mostrarModalTicket.value = true
}

const abrirCobro = (orden) => {
  ordenParaCobro.value = orden
  montoAbono.value = orden.balance_due
  mostrarModalCobro.value = true
}

const procesarCobro = async () => {
  if (!ordenParaCobro.value || montoAbono.value <= 0) return
  
  try {
    await api.post(`/technical-service/orders/${ordenParaCobro.value.id}/pay/`, {
      amount: montoAbono.value
    })
    mostrarModalCobro.value = false
    await cargarOrdenes()
    alert('¡Pago procesado y registrado en contabilidad correctamente!')
  } catch (error) {
    console.error(error)
    alert('Hubo un error al procesar el cobro: ' + (error.response?.data?.error || error.message))
  }
}
</script>
