<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-scale-balanced text-brand-500"></i> Libro Mayor
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Saldos y movimientos acumulados de cada cuenta contable para el periodo seleccionado.
        </p>
      </div>

      <!-- Filtros de fecha y exportar -->
      <div class="flex items-center gap-2 flex-wrap w-full lg:w-auto">
        <select 
          v-model="filtroRapido" 
          @change="aplicarFiltroRapido" 
          class="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
          <option value="">Rango Rápido...</option>
          <option value="este_mes">Este Mes</option>
          <option value="mes_pasado">Mes Pasado</option>
          <option value="este_ano">Este Año</option>
        </select>
        
        <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-sm text-slate-600">
          <span class="text-xs text-slate-400 font-semibold uppercase">Desde</span>
          <input type="date" v-model="filtros.start_date" class="bg-transparent text-slate-800 text-sm outline-none" />
        </div>

        <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-sm text-slate-600">
          <span class="text-xs text-slate-400 font-semibold uppercase">Hasta</span>
          <input type="date" v-model="filtros.end_date" class="bg-transparent text-slate-800 text-sm outline-none" />
        </div>

        <button 
          @click="fetchMayor" 
          class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
          <i class="fa-solid fa-filter text-xs"></i> Filtrar
        </button>

        <button 
          @click="exportarCSV" 
          :disabled="registros.length === 0"
          class="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          title="Exportar a Excel (CSV)">
          <i class="fa-solid fa-file-excel text-emerald-600"></i> Exportar
        </button>
      </div>
    </div>

    <!-- Tarjetas de Resumen Financiero -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-100">
          <i class="fa-solid fa-arrow-down-left"></i>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Débitos (Debe)</div>
          <div class="text-2xl font-bold font-mono text-slate-800 mt-0.5">{{ formatCurrency(totalDebe) }}</div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl border border-rose-100">
          <i class="fa-solid fa-arrow-up-right"></i>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Créditos (Haber)</div>
          <div class="text-2xl font-bold font-mono text-slate-800 mt-0.5">{{ formatCurrency(totalHaber) }}</div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-100">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuentas con Movimiento</div>
          <div class="text-2xl font-bold font-mono text-slate-800 mt-0.5">{{ registros.length }}</div>
        </div>
      </div>
    </div>

    <!-- Tabla Principal -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-bold text-slate-700">Mayor General de Cuentas</h3>
          <span class="text-xs text-slate-500 italic hidden sm:inline">
            (Haz clic sobre una cuenta para consultar su libro auxiliar detallado)
          </span>
        </div>
        <button @click="fetchMayor" class="text-slate-400 hover:text-brand-500 transition-colors p-1" title="Actualizar">
          <i class="fa-solid fa-rotate-right" :class="{'fa-spin': loading}"></i>
        </button>
      </div>

      <div v-if="loading" class="p-0">
        <TableSkeleton :rows="6" :has-avatar="false" :has-badge="true" :has-actions="false" />
      </div>

      <div v-else-if="registros.length === 0" class="p-16 text-center text-slate-400">
        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <i class="fa-solid fa-scale-balanced text-2xl text-slate-300"></i>
        </div>
        <h3 class="text-base font-bold text-slate-700">No hay movimientos en este periodo</h3>
        <p class="text-sm text-slate-500 mt-1">Ajusta el rango de fechas en los filtros superiores para ver otros meses.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th class="p-4 w-40">Código</th>
              <th class="p-4">Cuenta</th>
              <th class="p-4 w-32">Tipo</th>
              <th class="p-4 text-right">Total Debe</th>
              <th class="p-4 text-right">Total Haber</th>
              <th class="p-4 text-right font-bold">Saldo Actual</th>
              <th class="p-4 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr 
              v-for="r in registros" 
              :key="r.account_id" 
              @click="abrirAuxiliar(r)"
              class="hover:bg-brand-50/40 cursor-pointer transition-colors group"
            >
              <td class="p-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                {{ r.code }}
              </td>
              <td class="p-4 font-semibold text-slate-800">
                {{ r.name }}
              </td>
              <td class="p-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {{ (r.type === 'is_active' ? 'Activo' : r.type).toUpperCase() }}
                </span>
              </td>
              <td class="p-4 text-right font-mono text-emerald-600 font-semibold">
                {{ formatCurrency(r.total_debit) }}
              </td>
              <td class="p-4 text-right font-mono text-rose-600 font-semibold">
                {{ formatCurrency(r.total_credit) }}
              </td>
              <td class="p-4 text-right font-mono font-bold" :class="r.balance < 0 ? 'text-rose-600' : 'text-slate-800'">
                {{ formatCurrency(r.balance) }}
              </td>
              <td class="p-4 text-center text-slate-300 group-hover:text-brand-500 transition-colors">
                <i class="fa-solid fa-chevron-right text-xs"></i>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-slate-50/80 border-t-2 border-slate-200 text-sm">
            <tr>
              <td colspan="3" class="p-4 font-bold text-slate-700 text-right uppercase text-xs tracking-wider">
                Totales Consolidados:
              </td>
              <td class="p-4 text-right font-mono font-black text-emerald-600 text-base">
                {{ formatCurrency(totalDebe) }}
              </td>
              <td class="p-4 text-right font-mono font-black text-rose-600 text-base">
                {{ formatCurrency(totalHaber) }}
              </td>
              <td class="p-4 text-right font-mono font-black text-slate-900 text-base">
                {{ formatCurrency(totalDebe - totalHaber) }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Modal Auxiliar de Cuenta -->
    <div 
      v-if="mostrarModalAuxiliar" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" 
      @click.self="mostrarModalAuxiliar = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Libro Mayor Auxiliar</div>
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2 mt-0.5">
              <span class="font-mono text-brand-600 font-bold">{{ cuentaSeleccionada?.code }}</span>
              <span>- {{ cuentaSeleccionada?.name }}</span>
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="cargarAuxiliarCSV" 
              class="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
              <i class="fa-solid fa-file-excel text-emerald-600"></i> Exportar
            </button>
            <button 
              @click="mostrarModalAuxiliar = false" 
              class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        
        <!-- Modal Body con tabla auxiliar -->
        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="cargandoAuxiliar" class="py-12 text-center text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-brand-500"></i>
            <p class="text-sm font-medium">Cargando movimientos de la cuenta...</p>
          </div>

          <div v-else-if="lineasAuxiliar.length === 0" class="py-12 text-center text-slate-400">
            <div class="w-12 h-12 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <i class="fa-solid fa-inbox text-xl text-slate-300"></i>
            </div>
            <p class="text-sm font-medium">No hay movimientos registrados para esta cuenta en el periodo.</p>
          </div>

          <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th class="p-3">Fecha</th>
                  <th class="p-3">Referencia</th>
                  <th class="p-3">Concepto / Glosa</th>
                  <th class="p-3 text-right">Debe</th>
                  <th class="p-3 text-right">Haber</th>
                  <th class="p-3 text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="linea in lineasAuxiliar" :key="linea.id" class="hover:bg-slate-50/60 transition-colors">
                  <td class="p-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                    {{ new Date(linea.date).toLocaleDateString() }}
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    <span v-if="linea.reference" class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">
                      {{ linea.reference }}
                    </span>
                    <span v-else class="text-slate-300 text-xs">-</span>
                  </td>
                  <td class="p-3 text-slate-800">
                    {{ linea.description }}
                  </td>
                  <td class="p-3 text-right font-mono text-emerald-600 font-semibold">
                    {{ linea.debit > 0 ? formatCurrency(linea.debit) : '-' }}
                  </td>
                  <td class="p-3 text-right font-mono text-rose-600 font-semibold">
                    {{ linea.credit > 0 ? formatCurrency(linea.credit) : '-' }}
                  </td>
                  <td class="p-3 text-right font-mono font-bold" :class="linea.running_balance < 0 ? 'text-rose-600' : 'text-slate-800'">
                    {{ formatCurrency(linea.running_balance) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button 
            @click="mostrarModalAuxiliar = false" 
            class="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm font-semibold transition-colors">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/shared/api'
import TableSkeleton from '@/components/TableSkeleton.vue'

const loading = ref(false)
const registros = ref([])
const filtros = ref({ start_date: '', end_date: '' })

// Auxiliar Modal state
const mostrarModalAuxiliar = ref(false)
const cuentaSeleccionada = ref(null)
const lineasAuxiliar = ref([])
const cargandoAuxiliar = ref(false)
const filtroRapido = ref('')

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const totalDebe = computed(() => {
  return registros.value.reduce((acc, r) => acc + Number(r.total_debit || 0), 0)
})

const totalHaber = computed(() => {
  return registros.value.reduce((acc, r) => acc + Number(r.total_credit || 0), 0)
})

const fetchMayor = async () => {
  loading.value = true
  try {
    const params = {}
    if (filtros.value.start_date) params.start_date = filtros.value.start_date
    if (filtros.value.end_date) params.end_date = filtros.value.end_date
    
    const { data } = await api.get('/contabilidad/reportes/mayor/', { params })
    registros.value = data
  } catch (error) {
    console.error('Error fetching general ledger', error)
  } finally {
    loading.value = false
  }
}

const abrirAuxiliar = async (cuenta) => {
  cuentaSeleccionada.value = cuenta
  mostrarModalAuxiliar.value = true
  cargandoAuxiliar.value = true
  lineasAuxiliar.value = []
  
  try {
    const params = {}
    if (filtros.value.start_date) params.start_date = filtros.value.start_date
    if (filtros.value.end_date) params.end_date = filtros.value.end_date
    
    const { data } = await api.get(`/contabilidad/reportes/mayor/auxiliar/${cuenta.account_id}/`, { params })
    lineasAuxiliar.value = data.lines
  } catch (error) {
    console.error('Error fetching account ledger', error)
    alert('Error al cargar el detalle de la cuenta.')
  } finally {
    cargandoAuxiliar.value = false
  }
}

const cargarAuxiliarCSV = () => {
  if (lineasAuxiliar.value.length === 0) return
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
  csvContent += "Fecha,Referencia,Concepto,Debe,Haber,Saldo\n"
  
  lineasAuxiliar.value.forEach(r => {
    let row = [
      new Date(r.date).toLocaleDateString(),
      `"${(r.reference || '').replace(/"/g, '""')}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.debit.toFixed(2),
      r.credit.toFixed(2),
      r.running_balance.toFixed(2)
    ]
    csvContent += row.join(",") + "\n"
  })

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `Libro_Auxiliar_${cuentaSeleccionada.value.code}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const aplicarFiltroRapido = () => {
  const hoy = new Date()
  let start = new Date()
  let end = new Date()

  if (filtroRapido.value === 'este_mes') {
    start = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    end = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  } else if (filtroRapido.value === 'mes_pasado') {
    start = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    end = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
  } else if (filtroRapido.value === 'este_ano') {
    start = new Date(hoy.getFullYear(), 0, 1)
    end = new Date(hoy.getFullYear(), 11, 31)
  } else {
    return
  }

  filtros.value.start_date = start.toISOString().split('T')[0]
  filtros.value.end_date = end.toISOString().split('T')[0]
  fetchMayor()
}

const exportarCSV = () => {
  if (registros.value.length === 0) {
    alert("No hay datos para exportar")
    return
  }

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
  csvContent += "Codigo,Cuenta,Tipo,Total Debe,Total Haber,Saldo Actual\n"
  
  registros.value.forEach(r => {
    let row = [
      r.code,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      (r.type === 'is_active' ? 'Activo' : r.type).toUpperCase(),
      r.total_debit.toFixed(2),
      r.total_credit.toFixed(2),
      r.balance.toFixed(2)
    ]
    csvContent += row.join(",") + "\n"
  })

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `Libro_Mayor.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  fetchMayor()
})
</script>
