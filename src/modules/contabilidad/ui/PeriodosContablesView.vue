<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-lock text-brand-600"></i> Períodos Fiscales y Cierre Contable
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Control de candados mensuales para auditoría y declaraciones SRI. Impide alteraciones retroactivas de declaraciones fiscales.
        </p>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Año Fiscal:</span>
          <select 
            v-model="selectedYear" 
            @change="fetchPeriods"
            class="bg-transparent font-bold text-sm text-slate-800 outline-none cursor-pointer">
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <button 
          @click="fetchPeriods" 
          :disabled="cargando"
          class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-1.5"
          title="Actualizar">
          <i class="fa-solid fa-rotate" :class="{ 'fa-spin': cargando }"></i>
          <span class="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Stats resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meses Cerrados</span>
          <p class="text-2xl font-bold text-rose-600 mt-1 font-mono">{{ closedCount }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-lock"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bloqueo Operativo</span>
          <p class="text-2xl font-bold text-amber-600 mt-1 font-mono">{{ lockedCount }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meses Abiertos</span>
          <p class="text-2xl font-bold text-emerald-600 mt-1 font-mono">{{ openCount }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-lock-open"></i>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Año en Consulta</span>
          <p class="text-2xl font-bold text-slate-800 mt-1 font-mono">{{ selectedYear }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-calendar-days"></i>
        </div>
      </div>
    </div>

    <!-- Indicador de Criterio de Auditoría -->
    <div class="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
      <i class="fa-solid fa-circle-info text-blue-600 text-base mt-0.5"></i>
      <div class="space-y-1">
        <p class="font-bold text-sm">Reglas de Control Interno Contable y Tributario:</p>
        <p>
          <span class="font-semibold text-emerald-700">🔓 Abierto:</span> Ventas, compras, retenciones y asientos permitidos para todos los usuarios autorizados.
        </p>
        <p>
          <span class="font-semibold text-amber-700">⚠️ Bloqueo Operativo:</span> Vendedores y cajeros no pueden registrar ventas ni compras. Solo contabilidad puede asentar ajustes manuales.
        </p>
        <p>
          <span class="font-semibold text-rose-700">🔒 Cerrado Definitivo:</span> Candado total de declaración SRI. Nadie puede registrar, modificar ni anular ningún comprobante en ese mes.
        </p>
      </div>
    </div>

    <!-- Rejilla de los 12 meses -->
    <div v-if="cargando" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse space-y-4">
        <div class="h-6 bg-slate-100 rounded w-1/3"></div>
        <div class="h-16 bg-slate-50 rounded"></div>
        <div class="h-8 bg-slate-100 rounded"></div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div 
        v-for="p in periods" 
        :key="p.month"
        class="bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden"
        :class="{
          'border-emerald-200/80': p.status === 'open',
          'border-amber-200/80': p.status === 'locked',
          'border-rose-200/80': p.status === 'closed'
        }">
        
        <!-- Header del mes -->
        <div class="p-5 border-b border-slate-100 flex items-center justify-between"
          :class="{
            'bg-emerald-50/40': p.status === 'open',
            'bg-amber-50/40': p.status === 'locked',
            'bg-rose-50/40': p.status === 'closed'
          }">
          <div>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mes {{ String(p.month).padStart(2, '0') }}</span>
            <h3 class="text-lg font-bold text-slate-800">{{ p.month_name }}</h3>
          </div>

          <div>
            <span v-if="p.status === 'open'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <i class="fa-solid fa-lock-open text-[10px]"></i> Abierto
            </span>
            <span v-else-if="p.status === 'locked'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <i class="fa-solid fa-triangle-exclamation text-[10px]"></i> Bloqueo Op.
            </span>
            <span v-else class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <i class="fa-solid fa-lock text-[10px]"></i> Cerrado
            </span>
          </div>
        </div>

        <!-- Métricas del mes -->
        <div class="p-5 space-y-3.5 text-xs">
          <div class="flex justify-between items-center py-1.5 border-b border-slate-50">
            <span class="text-slate-500 flex items-center gap-1.5">
              <i class="fa-solid fa-receipt text-slate-400"></i> Ventas del Período:
            </span>
            <div class="text-right">
              <span class="font-bold font-mono text-slate-800 text-sm">${{ formatMoney(p.metrics?.sales_total || 0) }}</span>
              <span class="text-[10px] text-slate-400 block">({{ p.metrics?.sales_count || 0 }} facturas)</span>
            </div>
          </div>

          <div class="flex justify-between items-center py-1.5 border-b border-slate-50">
            <span class="text-slate-500 flex items-center gap-1.5">
              <i class="fa-solid fa-cart-shopping text-slate-400"></i> Compras y Gastos:
            </span>
            <div class="text-right">
              <span class="font-bold font-mono text-slate-800 text-sm">${{ formatMoney(p.metrics?.purchases_total || 0) }}</span>
              <span class="text-[10px] text-slate-400 block">({{ p.metrics?.purchases_count || 0 }} comprobantes)</span>
            </div>
          </div>

          <div class="flex justify-between items-center py-1">
            <span class="text-slate-500 flex items-center gap-1.5">
              <i class="fa-solid fa-book text-slate-400"></i> Asientos en Diario:
            </span>
            <span class="font-bold font-mono text-slate-700">{{ p.metrics?.entries_count || 0 }} asientos</span>
          </div>

          <!-- Auditoría de Cierre -->
          <div v-if="p.status !== 'open'" class="pt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
            <p v-if="p.closed_by">
              <strong class="text-slate-700">Por:</strong> {{ p.closed_by }}
            </p>
            <p v-if="p.closed_at">
              <strong class="text-slate-700">Fecha:</strong> {{ formatDateTime(p.closed_at) }}
            </p>
            <p v-if="p.notes" class="italic text-slate-600 truncate" :title="p.notes">
              <strong class="text-slate-700">Nota:</strong> "{{ p.notes }}"
            </p>
          </div>
          <div v-else-if="p.reopened_by" class="pt-1 text-[11px] text-slate-400">
            <span>Reabierto por {{ p.reopened_by }}</span>
          </div>
        </div>

        <!-- Acciones según estado -->
        <div class="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
          <!-- Si está abierto -->
          <template v-if="p.status === 'open'">
            <button 
              @click="abrirModalCambio(p, 'locked')"
              class="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1">
              <i class="fa-solid fa-triangle-exclamation text-[10px]"></i> Bloqueo Op.
            </button>
            <button 
              @click="abrirModalCambio(p, 'closed')"
              class="flex-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm flex items-center justify-center gap-1">
              <i class="fa-solid fa-lock text-[10px]"></i> Cerrar Mes
            </button>
          </template>

          <!-- Si está bloqueado operativo -->
          <template v-else-if="p.status === 'locked'">
            <button 
              @click="abrirModalCambio(p, 'open')"
              class="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1">
              <i class="fa-solid fa-lock-open text-[10px]"></i> Desbloquear
            </button>
            <button 
              @click="abrirModalCambio(p, 'closed')"
              class="flex-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm flex items-center justify-center gap-1">
              <i class="fa-solid fa-lock text-[10px]"></i> Cerrar Definitivo
            </button>
          </template>

          <!-- Si está cerrado definitivo -->
          <template v-else>
            <button 
              @click="abrirModalCambio(p, 'open')"
              class="w-full px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-unlock text-[10px]"></i> Reabrir Período (Auditoría)
            </button>
          </template>
        </div>

      </div>
    </div>

    <!-- Modal de Confirmación y Justificación de Cambio de Estado -->
    <div v-if="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="mostrarModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <i class="fa-solid" :class="modalIcon"></i>
            {{ modalTitulo }}
          </h3>
          <button @click="mostrarModal = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="guardarCambioEstado" class="p-6 space-y-4">
          <div class="p-3.5 rounded-xl border text-xs" :class="modalAlertClass">
            <p class="font-bold mb-1">{{ modalAlertHeader }}</p>
            <p>{{ modalAlertDesc }}</p>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Nota / Justificación de Auditoría (Opcional):
            </label>
            <textarea 
              v-model="modalNotas"
              rows="3"
              placeholder="Ej: Declaración del Formulario 104 y ATS presentada al SRI..."
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button 
              type="button" 
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors" 
              @click="mostrarModal = false">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              :class="modalBotonClass"
              :disabled="procesando">
              <i v-if="procesando" class="fa-solid fa-spinner fa-spin"></i>
              {{ procesando ? 'Aplicando...' : modalBotonTexto }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/shared/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const availableYears = ref([currentYear - 2, currentYear - 1, currentYear, currentYear + 1])

const periods = ref([])
const cargando = ref(true)
const procesando = ref(false)

const mostrarModal = ref(false)
const modalPeriod = ref(null)
const modalTargetStatus = ref('open')
const modalNotas = ref('')

const closedCount = computed(() => periods.value.filter(p => p.status === 'closed').length)
const lockedCount = computed(() => periods.value.filter(p => p.status === 'locked').length)
const openCount = computed(() => periods.value.filter(p => p.status === 'open').length)

const modalTitulo = computed(() => {
  if (!modalPeriod.value) return ''
  const m = modalPeriod.value.month_name
  const y = modalPeriod.value.year
  if (modalTargetStatus.value === 'closed') return `Cierre Definitivo: ${m} ${y}`
  if (modalTargetStatus.value === 'locked') return `Bloqueo Operativo: ${m} ${y}`
  return `Reapertura de Período: ${m} ${y}`
})

const modalIcon = computed(() => {
  if (modalTargetStatus.value === 'closed') return 'fa-lock text-rose-600'
  if (modalTargetStatus.value === 'locked') return 'fa-triangle-exclamation text-amber-600'
  return 'fa-lock-open text-emerald-600'
})

const modalAlertClass = computed(() => {
  if (modalTargetStatus.value === 'closed') return 'bg-rose-50 border-rose-200 text-rose-900'
  if (modalTargetStatus.value === 'locked') return 'bg-amber-50 border-amber-200 text-amber-900'
  return 'bg-blue-50 border-blue-200 text-blue-900'
})

const modalAlertHeader = computed(() => {
  if (modalTargetStatus.value === 'closed') return '¡Atención! Candado Total de Auditoría'
  if (modalTargetStatus.value === 'locked') return 'Modo Restringido Operativo'
  return 'Reapertura para Corrección'
})

const modalAlertDesc = computed(() => {
  if (modalTargetStatus.value === 'closed') {
    return 'Al cerrar definitivamente este período, ningún usuario (ni administradores ni contadores) podrá registrar o modificar facturas, retenciones, cobros ni asientos con fecha de este mes.'
  }
  if (modalTargetStatus.value === 'locked') {
    return 'Se detendrán ventas y compras de los usuarios operativos en este mes. Solo usuarios con rol contable podrán realizar asientos de ajuste en el Libro Diario.'
  }
  return 'El período volverá a quedar habilitado para todas las transacciones regulares. Úsalo con precaución si ya declaraste al SRI.'
})

const modalBotonClass = computed(() => {
  if (modalTargetStatus.value === 'closed') return 'bg-rose-600 hover:bg-rose-700'
  if (modalTargetStatus.value === 'locked') return 'bg-amber-600 hover:bg-amber-700'
  return 'bg-emerald-600 hover:bg-emerald-700'
})

const modalBotonTexto = computed(() => {
  if (modalTargetStatus.value === 'closed') return 'Confirmar Cierre Definitivo'
  if (modalTargetStatus.value === 'locked') return 'Confirmar Bloqueo Operativo'
  return 'Confirmar Reapertura'
})

const fetchPeriods = async () => {
  cargando.value = true
  try {
    const { data } = await api.get(`/contabilidad/periodos/?year=${selectedYear.value}`)
    periods.value = data.periods || []
  } catch (err) {
    console.error('Error cargando períodos contables:', err)
    toast.error('No se pudieron cargar los períodos fiscales')
  } finally {
    cargando.value = false
  }
}

const abrirModalCambio = (period, targetStatus) => {
  modalPeriod.value = period
  modalTargetStatus.value = targetStatus
  modalNotas.value = ''
  mostrarModal.value = true
}

const guardarCambioEstado = async () => {
  if (!modalPeriod.value) return
  procesando.value = true
  try {
    await api.post('/contabilidad/periodos/status/', {
      year: modalPeriod.value.year,
      month: modalPeriod.value.month,
      status: modalTargetStatus.value,
      notes: modalNotas.value
    })
    toast.success(`Período ${modalPeriod.value.month_name} actualizado a ${modalTargetStatus.value.toUpperCase()}`)
    mostrarModal.value = false
    await fetchPeriods()
  } catch (err) {
    console.error('Error actualizando período:', err)
    toast.error(err.response?.data?.error || 'Error al actualizar estado del período')
  } finally {
    procesando.value = false
  }
}

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDateTime = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchPeriods()
})
</script>
