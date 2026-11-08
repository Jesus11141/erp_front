<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-sitemap text-brand-500"></i> Plan de Cuentas
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Estructura contable jerárquica para la clasificación de activos, pasivos y resultados.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button 
          class="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2"
          @click="mostrarModalImportar = true"
          title="Importar catálogo de cuentas desde Excel">
          <i class="fa-solid fa-file-excel text-emerald-600"></i> Importar Excel
        </button>
        <button 
          class="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          @click="descargarExcel"
          :disabled="downloading"
          title="Descargar en formato Excel (.xlsx)">
          <i v-if="downloading" class="fa-solid fa-spinner fa-spin text-emerald-600"></i>
          <i v-else class="fa-solid fa-file-excel text-emerald-600"></i> Descargar Excel
        </button>
        <button 
          class="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2" 
          @click="confirmSeed" 
          :disabled="seeding">
          <i v-if="seeding" class="fa-solid fa-spinner fa-spin text-emerald-600"></i>
          <i v-else class="fa-solid fa-wand-magic-sparkles text-emerald-600"></i> Generar Plan Base
        </button>
        <button 
          class="px-4 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2" 
          @click="abrirNuevaCuenta">
          <i class="fa-solid fa-plus"></i> Nueva Cuenta
        </button>
      </div>
    </div>

    <!-- Stats / Resumen rápido -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      <div v-for="t in resumenTipos" :key="t.key" class="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ t.label }}</span>
        <span class="text-xl font-bold text-slate-800 mt-1 font-mono">{{ t.count }}</span>
      </div>
    </div>

    <!-- Tabla Principal -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold text-slate-700">Catálogo de Cuentas</span>
          <span class="text-xs bg-slate-200/70 text-slate-600 font-mono px-2 py-0.5 rounded-full font-semibold">
            {{ cuentas.length }} cuentas
          </span>
        </div>
        <button @click="fetchCuentas" class="text-slate-400 hover:text-brand-500 transition-colors p-1" title="Actualizar">
          <i class="fa-solid fa-rotate-right" :class="{'fa-spin': loading}"></i>
        </button>
      </div>

      <div v-if="loading" class="p-0">
        <TableSkeleton :rows="8" :has-avatar="false" :has-badge="true" :has-actions="true" />
      </div>

      <div v-else-if="cuentas.length === 0" class="p-16 text-center text-slate-400">
        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <i class="fa-solid fa-folder-open text-2xl text-slate-300"></i>
        </div>
        <h3 class="text-base font-bold text-slate-700">No hay cuentas registradas</h3>
        <p class="text-sm text-slate-500 mt-1">Genera el plan base oficial para Ecuador o crea cuentas manualmente.</p>
        <div class="flex justify-center gap-3 mt-4">
          <button @click="confirmSeed" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm">
            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Generar Plan Base
          </button>
          <button @click="abrirNuevaCuenta" class="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm">
            + Crear Manual
          </button>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th class="p-4 w-48">Código</th>
              <th class="p-4">Nombre de la Cuenta</th>
              <th class="p-4 w-36">Tipo</th>
              <th class="p-4 w-28 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr 
              v-for="cuenta in cuentasOrdenadas" 
              :key="cuenta.id"
              class="hover:bg-slate-50/80 transition-colors group"
              :class="{'bg-slate-50/30': isBase(cuenta.code)}"
            >
              <td class="p-4 whitespace-nowrap font-mono text-slate-700" :style="{ paddingLeft: getIndent(cuenta.code) + 'px' }">
                <span :class="{'font-bold text-slate-900': isBase(cuenta.code)}">
                  {{ cuenta.code }}
                </span>
              </td>
              <td class="p-4 text-slate-800">
                <span :class="{'font-bold text-slate-900': isBase(cuenta.code)}">
                  {{ cuenta.name }}
                </span>
              </td>
              <td class="p-4">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                  :class="badgeColor(cuenta.type)">
                  {{ formatTipo(cuenta.type) }}
                </span>
              </td>
              <td class="p-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="abrirEdicion(cuenta)" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors" 
                    title="Editar Cuenta">
                    <i class="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button 
                    @click="eliminarCuenta(cuenta)" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" 
                    title="Eliminar Cuenta">
                    <i class="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para confirmar Plan Base -->
    <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="showConfirmModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center overflow-hidden">
        <div class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl border border-emerald-100">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800 mb-2">¿Autogenerar Plan Base?</h3>
        <p class="text-slate-600 text-sm mb-6 leading-relaxed">
          Esto creará las cuentas esenciales estandarizadas para Ecuador. Tus cuentas previamente creadas se conservarán intactas.
        </p>
        <div class="flex justify-center gap-3">
          <button type="button" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors" @click="showConfirmModal = false">
            Cancelar
          </button>
          <button type="button" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-sm" @click="executeSeed">
            Sí, Generar Plan
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Nueva / Editar Cuenta -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="showModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-sm border border-brand-100">
              <i class="fa-solid" :class="form.id ? 'fa-pen' : 'fa-plus'"></i>
            </div>
            {{ form.id ? 'Editar Cuenta Contable' : 'Nueva Sub-Cuenta' }}
          </h3>
          <button @click="showModal = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="guardarCuenta" class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Código Contable</label>
            <input 
              type="text" 
              v-model="form.code" 
              placeholder="Ej: 1.1.01.02" 
              required 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none disabled:opacity-50 disabled:bg-slate-100" 
              :disabled="!!form.id" 
            />
            <p v-if="form.id" class="text-[11px] text-slate-400">El código contable no se puede modificar para preservar la integridad histórica.</p>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre de la Cuenta</label>
            <input 
              type="text" 
              v-model="form.name" 
              placeholder="Ej: Banco Pichincha Corriente"
              required 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tipo de Cuenta</label>
            <select 
              v-model="form.type" 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
              required
            >
              <option value="is_active">Activo</option>
              <option value="pasivo">Pasivo</option>
              <option value="patrimonio">Patrimonio</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors" @click="showModal = false">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50" 
              :disabled="saving">
              <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
              {{ saving ? 'Guardando...' : (form.id ? 'Actualizar Cuenta' : 'Guardar Cuenta') }}
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- Modal Importación Masiva Excel -->
    <ExcelImportModal
      :show="mostrarModalImportar"
      entity="plan-cuentas"
      title="Importar Plan de Cuentas Masivamente"
      description="Cargue su catálogo contable oficial desde Excel. El sistema enlazará automáticamente las cuentas padre e hijas."
      icon="fa-sitemap"
      @close="mostrarModalImportar = false"
      @success="fetchCuentas"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/shared/api'
import { useToast } from 'vue-toastification'
import TableSkeleton from '@/components/TableSkeleton.vue'
import ExcelImportModal from '@/shared/components/ExcelImportModal.vue'

const toast = useToast()
const cuentas = ref([])
const loading = ref(true)
const showModal = ref(false)
const mostrarModalImportar = ref(false)
const showConfirmModal = ref(false)
const saving = ref(false)
const seeding = ref(false)
const downloading = ref(false)

const form = ref({
  id: null,
  code: '',
  name: '',
  type: 'is_active'
})

const abrirNuevaCuenta = () => {
  form.value = { id: null, code: '', name: '', type: 'is_active' }
  showModal.value = true
}

const abrirEdicion = (cuenta) => {
  form.value = {
    id: cuenta.id,
    code: cuenta.code,
    name: cuenta.name,
    type: cuenta.type
  }
  showModal.value = true
}

const eliminarCuenta = async (cuenta) => {
  if (!confirm(`¿Estás seguro de eliminar la cuenta ${cuenta.code} - ${cuenta.name}?`)) return
  
  try {
    const res = await api.delete(`/contabilidad/cuentas/${cuenta.id}/`)
    if (res.data.status === 'success') {
      toast.success('Cuenta eliminada correctamente')
      fetchCuentas()
    }
  } catch (error) {
    if (error.response?.data?.error) {
      toast.error(error.response.data.error)
    } else {
      toast.error('Error al eliminar la cuenta')
    }
  }
}

const descargarExcel = async () => {
  if (cuentas.value.length === 0) {
    toast.info('No hay cuentas para descargar')
    return
  }
  
  downloading.value = true
  try {
    const res = await api.get('/contabilidad/cuentas/export/excel/', { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'Plan_de_Cuentas.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    toast.success('Plan de Cuentas descargado exitosamente en Excel')
  } catch (err) {
    console.error('Error generando Excel nativo, usando respaldo CSV:', err)
    // Fallback: CSV con UTF-8 BOM (\ufeff) y formato de texto ="codigo" para preservar ceros
    let csv = 'CÓDIGO,NOMBRE,TIPO\n'
    cuentasOrdenadas.value.forEach(c => {
      csv += `="${c.code}","${(c.name || '').replace(/"/g, '""')}","${formatTipo(c.type)}"\n`
    })
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'Plan_de_Cuentas.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } finally {
    downloading.value = false
  }
}

const confirmSeed = () => {
  showConfirmModal.value = true
}

const executeSeed = async () => {
  showConfirmModal.value = false
  seeding.value = true
  try {
    const res = await api.post('/contabilidad/cuentas/seed/', {})
    if (res.data.status === 'success') {
      toast.success('¡Plan de Cuentas autogenerado con éxito!')
      fetchCuentas()
    } else {
      toast.error('Ocurrió un error al generar las cuentas')
    }
  } catch (err) {
    console.error(err)
    toast.error('Error de red al intentar generar las cuentas')
  } finally {
    seeding.value = false
  }
}

const cuentasOrdenadas = computed(() => {
  return [...cuentas.value].sort((a, b) => a.code.localeCompare(b.code))
})

const resumenTipos = computed(() => {
  const map = {
    'is_active': { label: 'Activos', count: 0 },
    'pasivo': { label: 'Pasivos', count: 0 },
    'patrimonio': { label: 'Patrimonio', count: 0 },
    'ingreso': { label: 'Ingresos', count: 0 },
    'egreso': { label: 'Egresos', count: 0 },
  }
  cuentas.value.forEach(c => {
    if (map[c.type]) map[c.type].count++
  })
  return [
    { key: 'total', label: 'Total', count: cuentas.value.length },
    ...Object.values(map)
  ]
})

const getIndent = (code) => {
  const dots = (code.match(/\./g) || []).length
  return 16 + (dots * 18)
}

const isBase = (code) => {
  return code.endsWith('.00.00')
}

const formatTipo = (type) => {
  const m = {
    'is_active': 'Activo',
    'pasivo': 'Pasivo',
    'patrimonio': 'Patrimonio',
    'ingreso': 'Ingreso',
    'egreso': 'Egreso'
  }
  return m[type] || type
}

const badgeColor = (type) => {
  const m = {
    'is_active': 'bg-blue-50 text-blue-700 border-blue-200',
    'pasivo': 'bg-amber-50 text-amber-700 border-amber-200',
    'patrimonio': 'bg-purple-50 text-purple-700 border-purple-200',
    'ingreso': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'egreso': 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return m[type] || 'bg-slate-50 text-slate-700 border-slate-200'
}

const fetchCuentas = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/contabilidad/cuentas/')
    cuentas.value = data
  } catch (error) {
    console.error('Error fetching cuentas', error)
    toast.error('Error cargando el plan de cuentas')
  } finally {
    loading.value = false
  }
}

const guardarCuenta = async () => {
  saving.value = true
  try {
    if (form.value.id) {
      await api.put(`/contabilidad/cuentas/${form.value.id}/`, form.value)
      toast.success('Cuenta contable actualizada exitosamente')
    } else {
      await api.post('/contabilidad/cuentas/', form.value)
      toast.success('Cuenta contable guardada exitosamente')
    }
    showModal.value = false
    form.value = { id: null, code: '', name: '', type: 'is_active' }
    await fetchCuentas()
  } catch (error) {
    console.error(error)
    toast.error(error.response?.data?.error || 'Error al guardar la cuenta')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchCuentas()
})
</script>
