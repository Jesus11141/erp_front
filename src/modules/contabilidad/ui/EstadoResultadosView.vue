<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-chart-pie text-brand-500"></i> Estado de Resultados (P&L)
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Rendimiento financiero: resumen de ingresos, costos y gastos operativos para determinar la utilidad neta.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
        <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-sm text-slate-600">
          <span class="text-xs text-slate-400 font-semibold uppercase">Desde</span>
          <input type="date" v-model="filtros.start_date" class="bg-transparent text-slate-800 text-sm outline-none" />
        </div>

        <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-sm text-slate-600">
          <span class="text-xs text-slate-400 font-semibold uppercase">Hasta</span>
          <input type="date" v-model="filtros.end_date" class="bg-transparent text-slate-800 text-sm outline-none" />
        </div>

        <button 
          @click="fetchPnL" 
          class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
          <i class="fa-solid fa-calculator text-xs"></i> Generar Reporte
        </button>

        <button 
          v-if="reporte"
          @click="imprimirReporte" 
          class="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
          title="Imprimir Estado de Resultados">
          <i class="fa-solid fa-print text-slate-500"></i> Imprimir
        </button>

        <button 
          v-if="reporte"
          @click="exportarPDF" 
          :disabled="exportandoPdf"
          class="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          title="Descargar Estado de Resultados en PDF Oficial con Firmas">
          <i v-if="exportandoPdf" class="fa-solid fa-spinner fa-spin text-rose-600"></i>
          <i v-else class="fa-solid fa-file-pdf text-rose-600"></i>
          <span>{{ exportandoPdf ? 'Generando...' : 'Exportar PDF' }}</span>
        </button>

        <button 
          v-if="reporte"
          @click="exportarExcel" 
          :disabled="exportandoExcel"
          class="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          title="Descargar Estado de Resultados en Excel Corporativo con Firmas">
          <i v-if="exportandoExcel" class="fa-solid fa-spinner fa-spin text-emerald-600"></i>
          <i v-else class="fa-solid fa-file-excel text-emerald-600"></i>
          <span>{{ exportandoExcel ? 'Generando...' : 'Exportar Excel' }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State con Esqueleto Animado -->
    <div v-if="loading" class="space-y-6">
      <CardSkeleton :count="3" :cols="3" />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <TableSkeleton :rows="4" :has-avatar="false" :has-badge="false" :has-actions="false" />
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <TableSkeleton :rows="4" :has-avatar="false" :has-badge="false" :has-actions="false" />
        </div>
      </div>
    </div>

    <div v-else-if="reporte" class="space-y-6">

      <!-- Tarjetas de Resumen Ejecutivo -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-100">
            <i class="fa-solid fa-arrow-trend-up"></i>
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ingresos</div>
            <div class="text-2xl font-bold font-mono text-emerald-600 mt-0.5">{{ formatCurrency(reporte.total_ingresos) }}</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl border border-rose-100">
            <i class="fa-solid fa-arrow-trend-down"></i>
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Costos y Gastos</div>
            <div class="text-2xl font-bold font-mono text-rose-600 mt-0.5">{{ formatCurrency(reporte.total_egresos) }}</div>
          </div>
        </div>

        <div 
          class="p-4 rounded-xl border shadow-sm flex items-center gap-4 transition-all"
          :class="reporte.utilidad_neta >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'">
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center text-xl border"
            :class="reporte.utilidad_neta >= 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'">
            <i class="fa-solid" :class="reporte.utilidad_neta >= 0 ? 'fa-wallet' : 'fa-circle-exclamation'"></i>
          </div>
          <div>
            <div class="text-xs font-semibold uppercase tracking-wider" :class="reporte.utilidad_neta >= 0 ? 'text-emerald-700' : 'text-rose-700'">
              {{ reporte.utilidad_neta >= 0 ? 'Utilidad Neta (Ganancia)' : 'Pérdida Neta (Déficit)' }}
            </div>
            <div class="text-2xl font-bold font-mono mt-0.5" :class="reporte.utilidad_neta >= 0 ? 'text-emerald-800' : 'text-rose-800'">
              {{ formatCurrency(reporte.utilidad_neta) }}
            </div>
          </div>
        </div>

      </div>

      <!-- Detalle por Secciones -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- INGRESOS -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div class="p-4 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 class="font-bold text-slate-800 text-base">Cuentas de Ingresos</h3>
              </div>
              <span class="text-xs bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full">
                {{ reporte.ingresos.length }} cuentas
              </span>
            </div>

            <div class="p-2">
              <table class="w-full text-left text-sm border-collapse">
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in reporte.ingresos" :key="item.id" class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3 text-slate-700 font-medium">{{ item.name }}</td>
                    <td class="p-3 text-right font-mono font-semibold text-emerald-600">{{ formatCurrency(item.balance) }}</td>
                  </tr>
                  <tr v-if="reporte.ingresos.length === 0">
                    <td colspan="2" class="p-8 text-center text-slate-400 italic">No se registraron ingresos en este periodo.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t-2 border-slate-200 flex justify-between items-center">
            <span class="text-xs uppercase font-black tracking-wider text-slate-700">Total Ingresos</span>
            <span class="text-lg font-mono font-black text-emerald-600">{{ formatCurrency(reporte.total_ingresos) }}</span>
          </div>
        </div>

        <!-- EGRESOS -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div class="p-4 bg-gradient-to-r from-rose-50 to-white border-b border-rose-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h3 class="font-bold text-slate-800 text-base">Costos y Gastos</h3>
              </div>
              <span class="text-xs bg-rose-100 text-rose-800 font-mono font-bold px-2 py-0.5 rounded-full">
                {{ reporte.egresos.length }} cuentas
              </span>
            </div>

            <div class="p-2">
              <table class="w-full text-left text-sm border-collapse">
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in reporte.egresos" :key="item.id" class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3 text-slate-700 font-medium">{{ item.name }}</td>
                    <td class="p-3 text-right font-mono font-semibold text-rose-600">{{ formatCurrency(item.balance) }}</td>
                  </tr>
                  <tr v-if="reporte.egresos.length === 0">
                    <td colspan="2" class="p-8 text-center text-slate-400 italic">No se registraron egresos en este periodo.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t-2 border-slate-200 flex justify-between items-center">
            <span class="text-xs uppercase font-black tracking-wider text-slate-700">Total Costos y Gastos</span>
            <span class="text-lg font-mono font-black text-rose-600">{{ formatCurrency(reporte.total_egresos) }}</span>
          </div>
        </div>

      </div>

      <!-- Gran Cuadro de Utilidad / Pérdida Neta -->
      <div 
        class="p-6 rounded-2xl shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
        :class="reporte.utilidad_neta >= 0 
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400' 
          : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white border-rose-400'">
        <div>
          <div class="text-xs uppercase font-bold tracking-widest text-white/80">Resultado Final del Periodo</div>
          <h2 class="text-2xl font-black mt-0.5 tracking-tight">
            {{ reporte.utilidad_neta >= 0 ? 'Utilidad Neta del Ejercicio' : 'Pérdida Neta del Ejercicio' }}
          </h2>
          <p class="text-xs text-white/80 mt-1">
            Calculado como: Total Ingresos ({{ formatCurrency(reporte.total_ingresos) }}) - Total Egresos ({{ formatCurrency(reporte.total_egresos) }})
          </p>
        </div>

        <div class="text-3xl sm:text-4xl font-black font-mono tracking-tight bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20">
          {{ formatCurrency(reporte.utilidad_neta) }}
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/shared/api'
import { descargar } from '@/shared/descargas'
import { useToast } from 'vue-toastification'
import CardSkeleton from '@/components/CardSkeleton.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

const toast = useToast()
const loading = ref(false)
const exportandoPdf = ref(false)
const exportandoExcel = ref(false)
const reporte = ref(null)
const filtros = ref({ start_date: '', end_date: '' })

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const fetchPnL = async () => {
  loading.value = true
  try {
    const params = {}
    if (filtros.value.start_date) params.start_date = filtros.value.start_date
    if (filtros.value.end_date) params.end_date = filtros.value.end_date
    
    const { data } = await api.get('/contabilidad/reportes/pnl/', { params })
    reporte.value = data
  } catch (error) {
    console.error('Error fetching PnL', error)
    toast.error('Error al generar el estado de resultados')
  } finally {
    loading.value = false
  }
}

const exportarPDF = async () => {
  exportandoPdf.value = true
  try {
    const s = filtros.value.start_date
    const e = filtros.value.end_date
    const query = new URLSearchParams()
    if (s) query.append('start_date', s)
    if (e) query.append('end_date', e)
    const qs = query.toString() ? `?${query.toString()}` : ''
    const nombre = `estado_resultados_${s || 'inicio'}_${e || 'fin'}.pdf`
    await descargar(`/contabilidad/reportes/pnl/export/pdf/${qs}`, nombre)
    toast.success('Estado de Resultados en PDF descargado exitosamente')
  } catch (error) {
    console.error('Error exportando PDF:', error)
    toast.error('Error al descargar el Estado de Resultados en PDF')
  } finally {
    exportandoPdf.value = false
  }
}

const exportarExcel = async () => {
  exportandoExcel.value = true
  try {
    const s = filtros.value.start_date
    const e = filtros.value.end_date
    const query = new URLSearchParams()
    if (s) query.append('start_date', s)
    if (e) query.append('end_date', e)
    const qs = query.toString() ? `?${query.toString()}` : ''
    const nombre = `estado_resultados_${s || 'inicio'}_${e || 'fin'}.xlsx`
    await descargar(`/contabilidad/reportes/pnl/export/excel/${qs}`, nombre)
    toast.success('Estado de Resultados en Excel descargado exitosamente')
  } catch (error) {
    console.error('Error exportando Excel:', error)
    toast.error('Error al descargar el Estado de Resultados en Excel')
  } finally {
    exportandoExcel.value = false
  }
}

const imprimirReporte = () => {
  window.print()
}

onMounted(() => {
  const date = new Date()
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  filtros.value.start_date = firstDay.toISOString().split('T')[0]
  filtros.value.end_date = date.toISOString().split('T')[0]
  fetchPnL()
})
</script>
