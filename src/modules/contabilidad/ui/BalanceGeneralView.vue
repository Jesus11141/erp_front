<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-landmark text-brand-500"></i> Balance General
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Estado de situación financiera: fotografía de los activos, pasivos y patrimonio a una fecha de corte.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
        <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-600">
          <span class="text-xs text-slate-400 font-semibold uppercase">Corte al</span>
          <input type="date" v-model="fecha" class="bg-transparent text-slate-800 text-sm outline-none" />
        </div>

        <button 
          @click="fetchBalance" 
          class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
          <i class="fa-solid fa-calculator text-xs"></i> Generar Reporte
        </button>

        <button 
          v-if="reporte"
          @click="imprimirReporte" 
          class="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
          title="Imprimir Balance">
          <i class="fa-solid fa-print text-slate-500"></i> Imprimir
        </button>

        <button 
          v-if="reporte"
          @click="exportarPDF" 
          :disabled="exportandoPdf"
          class="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          title="Descargar Balance General en PDF Oficial con Firmas">
          <i v-if="exportandoPdf" class="fa-solid fa-spinner fa-spin text-rose-600"></i>
          <i v-else class="fa-solid fa-file-pdf text-rose-600"></i>
          <span>{{ exportandoPdf ? 'Generando...' : 'Exportar PDF' }}</span>
        </button>

        <button 
          v-if="reporte"
          @click="exportarExcel" 
          :disabled="exportandoExcel"
          class="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          title="Descargar Balance General en Excel Corporativo con Firmas">
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
          <TableSkeleton :rows="5" :has-avatar="false" :has-badge="false" :has-actions="false" />
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <TableSkeleton :rows="5" :has-avatar="false" :has-badge="false" :has-actions="false" />
        </div>
      </div>
    </div>

    <div v-else-if="reporte" class="space-y-6">
      
      <!-- Indicador de Cuadre de Ecuación Contable -->
      <div 
        class="p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all"
        :class="reporte.ecuacion_balance 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
          : 'bg-rose-50/70 border-rose-200 text-rose-800'">
        <div class="flex items-center gap-3">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            :class="reporte.ecuacion_balance ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
            <i class="fa-solid" :class="reporte.ecuacion_balance ? 'fa-check-double' : 'fa-triangle-exclamation'"></i>
          </div>
          <div>
            <div class="font-bold text-sm">
              {{ reporte.ecuacion_balance ? 'Ecuación Contable Cuadrada' : 'Descuadre en la Ecuación Contable' }}
            </div>
            <div class="text-xs opacity-90 mt-0.5 font-mono">
              Activo (${{ formatNumber(reporte.total_activos) }}) = Pasivo (${{ formatNumber(reporte.total_pasivos) }}) + Patrimonio (${{ formatNumber(reporte.total_patrimonio) }})
            </div>
          </div>
        </div>

        <div v-if="!reporte.ecuacion_balance" class="text-right">
          <span class="text-xs uppercase font-bold text-rose-600 block">Diferencia</span>
          <span class="font-mono font-bold text-rose-700 text-base">
            ${{ formatNumber(Math.abs(reporte.total_activos - (reporte.total_pasivos + reporte.total_patrimonio))) }}
          </span>
        </div>
      </div>

      <!-- Tarjetas de Resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center text-xl border border-blue-100">
            <i class="fa-solid fa-coins"></i>
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Activos</div>
            <div class="text-2xl font-bold font-mono text-slate-800 mt-0.5">{{ formatCurrency(reporte.total_activos) }}</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl border border-amber-100">
            <i class="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pasivos</div>
            <div class="text-2xl font-bold font-mono text-slate-800 mt-0.5">{{ formatCurrency(reporte.total_pasivos) }}</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl border border-purple-100">
            <i class="fa-solid fa-vault"></i>
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patrimonio</div>
            <div class="text-2xl font-bold font-mono text-slate-800 mt-0.5">{{ formatCurrency(reporte.total_patrimonio) }}</div>
          </div>
        </div>
      </div>

      <!-- Grid de Balance (Dos Columnas) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Columna Izquierda: ACTIVOS -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div class="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
                <h3 class="font-bold text-slate-800 text-base">Activos</h3>
              </div>
              <span class="text-xs bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded-full">
                {{ reporte.activos.length }} cuentas
              </span>
            </div>

            <div class="p-2">
              <table class="w-full text-left text-sm border-collapse">
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in reporte.activos" :key="item.id" class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3 text-slate-700 font-medium">{{ item.name }}</td>
                    <td class="p-3 text-right font-mono font-semibold text-slate-800">{{ formatCurrency(item.balance) }}</td>
                  </tr>
                  <tr v-if="reporte.activos.length === 0">
                    <td colspan="2" class="p-8 text-center text-slate-400 italic">No hay cuentas de activos con saldo.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Total Activos Footer -->
          <div class="p-4 bg-slate-50 border-t-2 border-slate-200 flex justify-between items-center">
            <span class="text-xs uppercase font-black tracking-wider text-slate-700">Total Activos</span>
            <span class="text-lg font-mono font-black text-brand-600">{{ formatCurrency(reporte.total_activos) }}</span>
          </div>
        </div>

        <!-- Columna Derecha: PASIVOS Y PATRIMONIO -->
        <div class="space-y-6">
          
          <!-- Bloque Pasivos -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-4 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 class="font-bold text-slate-800 text-base">Pasivos</h3>
              </div>
              <span class="text-xs bg-amber-100 text-amber-800 font-mono font-bold px-2 py-0.5 rounded-full">
                {{ reporte.pasivos.length }} cuentas
              </span>
            </div>

            <div class="p-2">
              <table class="w-full text-left text-sm border-collapse">
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in reporte.pasivos" :key="item.id" class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3 text-slate-700 font-medium">{{ item.name }}</td>
                    <td class="p-3 text-right font-mono font-semibold text-slate-800">{{ formatCurrency(item.balance) }}</td>
                  </tr>
                  <tr v-if="reporte.pasivos.length === 0">
                    <td colspan="2" class="p-6 text-center text-slate-400 italic">No hay cuentas de pasivos con saldo.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-sm">
              <span class="text-xs uppercase font-bold text-slate-600">Total Pasivos</span>
              <span class="font-mono font-bold text-amber-700">{{ formatCurrency(reporte.total_pasivos) }}</span>
            </div>
          </div>

          <!-- Bloque Patrimonio -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-4 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h3 class="font-bold text-slate-800 text-base">Patrimonio</h3>
              </div>
              <span class="text-xs bg-purple-100 text-purple-800 font-mono font-bold px-2 py-0.5 rounded-full">
                {{ reporte.patrimonio.length }} cuentas
              </span>
            </div>

            <div class="p-2">
              <table class="w-full text-left text-sm border-collapse">
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in reporte.patrimonio" :key="item.id" class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3 text-slate-700 font-medium">{{ item.name }}</td>
                    <td class="p-3 text-right font-mono font-semibold text-slate-800">{{ formatCurrency(item.balance) }}</td>
                  </tr>
                  <tr v-if="reporte.patrimonio.length === 0">
                    <td colspan="2" class="p-6 text-center text-slate-400 italic">No hay cuentas de patrimonio con saldo.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-sm">
              <span class="text-xs uppercase font-bold text-slate-600">Total Patrimonio</span>
              <span class="font-mono font-bold text-purple-700">{{ formatCurrency(reporte.total_patrimonio) }}</span>
            </div>
          </div>

          <!-- Total Pasivo + Patrimonio -->
          <div class="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
            <span class="text-xs uppercase font-bold tracking-wider text-slate-300">Total Pasivo + Patrimonio</span>
            <span class="text-xl font-mono font-bold text-emerald-400">
              {{ formatCurrency(reporte.total_pasivos + reporte.total_patrimonio) }}
            </span>
          </div>

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
const fecha = ref('')

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const formatNumber = (val) => {
  return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fetchBalance = async () => {
  loading.value = true
  try {
    const params = {}
    if (fecha.value) params.date = fecha.value
    
    const { data } = await api.get('/contabilidad/reportes/balance/', { params })
    reporte.value = data
  } catch (error) {
    console.error('Error fetching Balance Sheet', error)
    toast.error('Error al generar el balance general')
  } finally {
    loading.value = false
  }
}

const exportarPDF = async () => {
  exportandoPdf.value = true
  try {
    const p = fecha.value ? `?date=${fecha.value}` : ''
    const nombre = `balance_general_${fecha.value || 'corte'}.pdf`
    await descargar(`/contabilidad/reportes/balance/export/pdf/${p}`, nombre)
    toast.success('Balance General en PDF descargado exitosamente')
  } catch (error) {
    console.error('Error exportando PDF:', error)
    toast.error('Error al descargar el Balance General en PDF')
  } finally {
    exportandoPdf.value = false
  }
}

const exportarExcel = async () => {
  exportandoExcel.value = true
  try {
    const p = fecha.value ? `?date=${fecha.value}` : ''
    const nombre = `balance_general_${fecha.value || 'corte'}.xlsx`
    await descargar(`/contabilidad/reportes/balance/export/excel/${p}`, nombre)
    toast.success('Balance General en Excel descargado exitosamente')
  } catch (error) {
    console.error('Error exportando Excel:', error)
    toast.error('Error al descargar el Balance General en Excel')
  } finally {
    exportandoExcel.value = false
  }
}

const imprimirReporte = () => {
  window.print()
}

onMounted(() => {
  const date = new Date()
  fecha.value = date.toISOString().split('T')[0]
  fetchBalance()
})
</script>
