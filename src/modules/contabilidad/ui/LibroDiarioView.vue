<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-book-open text-brand-500"></i> Libro Diario
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Registro cronológico de todos los asientos contables y transacciones financieras del sistema.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button 
          @click="downloadCSV" 
          :disabled="asientos.length === 0"
          class="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2">
          <i class="fa-solid fa-file-excel text-emerald-600"></i> Exportar a Excel
        </button>
        <button 
          @click="fetchAsientos" 
          class="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
          title="Actualizar">
          <i class="fa-solid fa-rotate-right" :class="{'fa-spin': loading}"></i>
        </button>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="relative w-full sm:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="busqueda" 
          type="text" 
          placeholder="Buscar por concepto, referencia o cuenta..." 
          class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
        />
      </div>

      <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 self-end sm:self-auto">
        <span>Mostrando: <strong class="text-slate-800 font-mono">{{ asientosFiltrados.length }}</strong> de {{ asientos.length }} asientos</span>
      </div>
    </div>

    <!-- Loading State con Esqueleto Animado -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 3" :key="i" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
        <div class="bg-slate-50/70 px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-200"></div>
            <div class="space-y-1.5">
              <div class="h-4 bg-slate-200 rounded w-36"></div>
              <div class="h-3 bg-slate-100 rounded w-20"></div>
            </div>
          </div>
          <div class="h-3 bg-slate-200 rounded w-48 hidden sm:block"></div>
        </div>
        <div class="p-6">
          <TableSkeleton :rows="3" :has-avatar="false" :has-badge="false" :has-actions="false" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="asientosFiltrados.length === 0" class="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
      <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fa-solid fa-folder-open text-3xl text-slate-300"></i>
      </div>
      <h3 class="text-base font-bold text-slate-700">No se encontraron asientos contables</h3>
      <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        {{ busqueda ? 'No hay asientos que coincidan con tu criterio de búsqueda.' : 'Los asientos se generan automáticamente al emitir facturas en el POS o registrar movimientos contables.' }}
      </p>
    </div>

    <!-- Lista de Asientos -->
    <div v-else class="space-y-6">
      <div 
        v-for="asiento in asientosFiltrados" 
        :key="asiento.id" 
        class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
      >
        <!-- Asiento Header -->
        <div class="bg-slate-50/70 px-6 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs border border-brand-100">
              #{{ asiento.id }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-slate-800">Asiento Contable #{{ asiento.id }}</span>
                <span v-if="asiento.reference" class="bg-slate-200/80 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  {{ asiento.reference }}
                </span>
              </div>
              <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                <i class="fa-regular fa-calendar text-[11px]"></i>
                {{ formatearFecha(asiento.date) }}
              </p>
            </div>
          </div>
          
          <div class="text-xs text-slate-500 italic max-w-md truncate" :title="asiento.description">
            "{{ asiento.description }}"
          </div>
        </div>

        <!-- Asiento Body / Tabla de Líneas -->
        <div class="p-4 sm:p-6">
          <div class="overflow-x-auto rounded-xl border border-slate-100">
            <table class="w-full text-sm text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th class="p-3 w-36">Código</th>
                  <th class="p-3">Cuenta Contable</th>
                  <th class="p-3 text-right w-36 text-emerald-600 font-bold">Debe</th>
                  <th class="p-3 text-right w-36 text-rose-600 font-bold">Haber</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="linea in asiento.lines" :key="linea.id" class="hover:bg-slate-50/60 transition-colors">
                  <td class="p-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {{ linea.account_code }}
                  </td>
                  <td class="p-3 text-slate-800 font-medium">
                    <div class="flex items-center gap-2" :style="{ paddingLeft: linea.credit > 0 ? '1.5rem' : '0' }">
                      <i v-if="linea.credit > 0" class="fa-solid fa-arrow-turn-down fa-rotate-270 text-slate-300 text-[10px]"></i>
                      <span>{{ linea.account_name }}</span>
                    </div>
                  </td>
                  <td class="p-3 text-right font-mono font-semibold text-slate-700">
                    {{ linea.debit > 0 ? formatNum(linea.debit) : '-' }}
                  </td>
                  <td class="p-3 text-right font-mono font-semibold text-slate-700">
                    {{ linea.credit > 0 ? formatNum(linea.credit) : '-' }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-slate-50/80 border-t-2 border-slate-200">
                <tr>
                  <td colspan="2" class="p-3 text-right font-black text-slate-700 uppercase text-xs tracking-wider">
                    Sumas Iguales:
                  </td>
                  <td class="p-3 text-right font-mono font-black text-emerald-600 text-sm">
                    ${{ formatNum(calcularTotal(asiento, 'debit')) }}
                  </td>
                  <td class="p-3 text-right font-mono font-black text-rose-600 text-sm">
                    ${{ formatNum(calcularTotal(asiento, 'credit')) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
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
const asientos = ref([])
const loading = ref(true)
const busqueda = ref('')

const formatNum = (val) => {
  return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return ''
  const date = new Date(fechaStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

const calcularTotal = (asiento, tipo) => {
  return asiento.lines.reduce((sum, linea) => sum + Number(linea[tipo] || 0), 0)
}

const asientosFiltrados = computed(() => {
  if (!busqueda.value.trim()) return asientos.value
  const q = busqueda.value.toLowerCase().trim()
  return asientos.value.filter(a => {
    const matchDesc = (a.description || '').toLowerCase().includes(q)
    const matchRef = (a.reference || '').toLowerCase().includes(q)
    const matchId = a.id.toString() === q
    const matchLine = a.lines.some(l => 
      (l.account_name || '').toLowerCase().includes(q) || 
      (l.account_code || '').toLowerCase().includes(q)
    )
    return matchDesc || matchRef || matchId || matchLine
  })
})

const fetchAsientos = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/contabilidad/asientos/')
    asientos.value = data
  } catch (error) {
    console.error('Error fetching asientos', error)
    toast.error('Error cargando los asientos contables')
  } finally {
    loading.value = false
  }
}

const downloadCSV = () => {
  if (asientos.value.length === 0) return

  let csv = 'ID Asiento,Fecha,Referencia,Descripcion,Codigo Cuenta,Nombre Cuenta,Debe,Haber\n'
  
  asientos.value.forEach(asiento => {
    asiento.lines.forEach(line => {
      const desc = `"${(asiento.description || '').replace(/"/g, '""')}"`
      const ref = asiento.reference ? `"${asiento.reference}"` : '""'
      const name = `"${(line.account_name || '').replace(/"/g, '""')}"`
      
      csv += `${asiento.id},${asiento.date},${ref},${desc},${line.account_code},${name},${line.debit},${line.credit}\n`
    })
  })

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `libro_diario_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.success('¡Archivo exportado correctamente!')
}

onMounted(() => {
  fetchAsientos()
})
</script>
