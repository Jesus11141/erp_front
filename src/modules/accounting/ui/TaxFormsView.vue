<template>
  <div class="p-6 min-h-screen flex flex-col bg-slate-50">
    <!-- Header Principal -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-file-invoice text-blue-600"></i>
          Declaraciones y Anexos Tributarios
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Generador oficial del Anexo Transaccional Simplificado (ATS) en XML y reportes tributarios SRI
        </p>
      </div>

      <!-- Selector de Período Fiscal -->
      <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div class="flex items-center gap-2 px-2 text-slate-600 text-sm font-medium">
          <i class="fa-regular fa-calendar"></i>
          <span>Período:</span>
        </div>
        <select
          v-model="selectedMonth"
          @change="fetchAtsSummary"
          class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option v-for="m in months" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>
        <select
          v-model="selectedYear"
          @change="fetchAtsSummary"
          class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option v-for="y in years" :key="y" :value="y">
            {{ y }}
          </option>
        </select>
        <button
          @click="resetToCurrentPeriod"
          title="Ir al mes actual"
          class="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
        >
          Mes Actual
        </button>
      </div>
    </div>

    <!-- SECCIÓN ATS (HERO CARD) -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 relative overflow-hidden">
      <!-- Decorative background accent -->
      <div class="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full blur-2xl pointer-events-none opacity-60"></div>

      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20 shrink-0">
            <i class="fa-solid fa-file-code"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-bold text-slate-800">Anexo Transaccional Simplificado (ATS)</h2>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <i class="fa-solid fa-circle-check text-[10px] mr-1"></i> Formato XML SRI
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-1">
              Consolida automáticamente todas las compras registradas, ventas autorizadas y comprobantes anulados del período
              <span class="font-bold text-slate-700">{{ periodLabel }}</span> listo para subir al sistema DIMM Anexos o SRI en línea.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <button
            @click="fetchAtsSummary"
            :disabled="loadingSummary"
            class="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-slate-200"
            title="Actualizar datos del período"
          >
            <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': loadingSummary }"></i>
            <span>Refrescar</span>
          </button>

          <button
            @click="downloadAtsXml"
            :disabled="loadingDownload"
            class="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <i class="fa-solid" :class="loadingDownload ? 'fa-spinner fa-spin' : 'fa-download'"></i>
            <span>{{ loadingDownload ? 'Generando XML...' : `Descargar ATS_${String(selectedMonth).padStart(2, '0')}_${selectedYear}.xml` }}</span>
          </button>
        </div>
      </div>

      <!-- Informante Datos -->
      <div v-if="atsData?.informante" class="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
        <div>
          <span class="font-semibold text-slate-600">Contribuyente Informante:</span>
          <span class="ml-1 text-slate-800 font-medium">{{ atsData.informante.razon_social || 'No configurado' }}</span>
        </div>
        <div class="h-3 w-px bg-slate-300"></div>
        <div>
          <span class="font-semibold text-slate-600">RUC:</span>
          <span class="ml-1 font-mono text-slate-800">{{ atsData.informante.ruc || 'Sin RUC' }}</span>
        </div>
        <div class="h-3 w-px bg-slate-300"></div>
        <div>
          <span class="font-semibold text-slate-600">Tipo de Documento:</span>
          <span class="ml-1 text-slate-800">XML Estándar &lt;iva&gt;</span>
        </div>
      </div>

      <!-- Tarjetas de Resumen Numérico -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <!-- Tarjeta Ventas -->
        <div class="bg-gradient-to-br from-blue-50/50 to-white p-4 rounded-xl border border-blue-100/80">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Ventas Emitidas</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {{ atsData?.sales?.count || 0 }} comprobantes
            </span>
          </div>
          <div class="text-2xl font-extrabold text-slate-800">
            ${{ formatMoney(atsData?.sales?.total_sin_iva || 0) }}
          </div>
          <div class="mt-2 text-xs text-slate-500 space-y-0.5">
            <div class="flex justify-between">
              <span>Tarifa 0%:</span>
              <span class="font-medium text-slate-700">${{ formatMoney(atsData?.sales?.subtotal_0 || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tarifa Gravada:</span>
              <span class="font-medium text-slate-700">${{ formatMoney(atsData?.sales?.subtotal_iva || 0) }}</span>
            </div>
            <div class="flex justify-between font-semibold text-blue-700 pt-1 border-t border-blue-100/60">
              <span>IVA Cobrado:</span>
              <span>${{ formatMoney(atsData?.sales?.vat || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Tarjeta Compras -->
        <div class="bg-gradient-to-br from-emerald-50/50 to-white p-4 rounded-xl border border-emerald-100/80">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">Compras Registradas</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              {{ atsData?.purchases?.count || 0 }} facturas
            </span>
          </div>
          <div class="text-2xl font-extrabold text-slate-800">
            ${{ formatMoney((atsData?.purchases?.subtotal_0 || 0) + (atsData?.purchases?.subtotal_iva || 0)) }}
          </div>
          <div class="mt-2 text-xs text-slate-500 space-y-0.5">
            <div class="flex justify-between">
              <span>Base Tarifa 0%:</span>
              <span class="font-medium text-slate-700">${{ formatMoney(atsData?.purchases?.subtotal_0 || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Base Gravada:</span>
              <span class="font-medium text-slate-700">${{ formatMoney(atsData?.purchases?.subtotal_iva || 0) }}</span>
            </div>
            <div class="flex justify-between font-semibold text-emerald-700 pt-1 border-t border-emerald-100/60">
              <span>IVA Crédito Trib.:</span>
              <span>${{ formatMoney(atsData?.purchases?.vat || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Tarjeta Anulados -->
        <div class="bg-gradient-to-br from-amber-50/50 to-white p-4 rounded-xl border border-amber-100/80">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">Anulados</span>
            <i class="fa-solid fa-ban text-amber-500"></i>
          </div>
          <div class="text-2xl font-extrabold text-slate-800">
            {{ atsData?.cancelled?.count || 0 }}
          </div>
          <p class="text-xs text-slate-500 mt-2">
            Comprobantes con autorización reportados como cancelados según reglamento de facturación.
          </p>
        </div>

        <!-- Tarjeta Validación / Diagnóstico -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pre-Validación SRI</span>
              <i class="fa-solid" :class="hasWarnings ? 'fa-triangle-exclamation text-amber-500' : 'fa-check-double text-emerald-500'"></i>
            </div>
            <div class="text-sm font-semibold" :class="hasWarnings ? 'text-amber-700' : 'text-emerald-700'">
              {{ hasWarnings ? `${atsData.warnings.length} Inconsistencia(s)` : 'Estructura Correcta' }}
            </div>
            <p class="text-xs text-slate-500 mt-1">
              {{ hasWarnings ? 'Se detectaron campos que podrían requerir revisión antes de presentar ante el SRI.' : 'Todos los campos cumplen con el formato DIMM Anexos.' }}
            </p>
          </div>
          <div class="pt-2 text-xs font-mono text-slate-400">
            XML UTF-8 Estándar
          </div>
        </div>
      </div>

      <!-- Alertas de Prevalidación -->
      <div v-if="hasWarnings" class="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800">
        <div class="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Observaciones detectadas para el ATS:
        </div>
        <ul class="list-disc list-inside space-y-0.5 text-amber-700 pl-1">
          <li v-for="(warn, idx) in atsData.warnings" :key="idx">{{ warn }}</li>
        </ul>
      </div>
    </div>

    <!-- SECCIÓN OTROS FORMULARIOS FISCALES -->
    <div class="mb-4">
      <h2 class="text-lg font-bold text-slate-800 mb-1">Formularios Declarativos (Plantillas Oficiales)</h2>
      <p class="text-xs text-slate-500">Descarga las hojas de trabajo para cálculo previo y cuadre contable mensual</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Formulario 104 -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-4">
            <i class="fa-solid fa-file-excel"></i>
          </div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-slate-800">Formulario 104</h3>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">IVA</span>
          </div>
          <p class="text-xs text-slate-500 mt-2 mb-6">
            Declaración del Impuesto al Valor Agregado. Resumen consolidado para casilleros de ventas brutas, crédito tributario y factor de proporcionalidad.
          </p>
        </div>
        <button
          @click="downloadForm('104')"
          :disabled="loading['104']"
          class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <i class="fa-solid" :class="loading['104'] ? 'fa-spinner fa-spin' : 'fa-download'"></i>
          {{ loading['104'] ? 'Generando...' : 'Descargar Plantilla 104' }}
        </button>
      </div>

      <!-- Formulario 103 -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl mb-4">
            <i class="fa-solid fa-file-excel"></i>
          </div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-slate-800">Formulario 103</h3>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Renta</span>
          </div>
          <p class="text-xs text-slate-500 mt-2 mb-6">
            Retenciones en la Fuente del Impuesto a la Renta. Clasificación por códigos de retención (303, 304, 307, etc.) y liquidación mensual.
          </p>
        </div>
        <button
          @click="downloadForm('103')"
          :disabled="loading['103']"
          class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <i class="fa-solid" :class="loading['103'] ? 'fa-spinner fa-spin' : 'fa-download'"></i>
          {{ loading['103'] ? 'Generando...' : 'Descargar Plantilla 103' }}
        </button>
      </div>

      <!-- Formulario 107 -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl mb-4">
            <i class="fa-solid fa-file-excel"></i>
          </div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-slate-800">Formulario 107</h3>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Nómina</span>
          </div>
          <p class="text-xs text-slate-500 mt-2 mb-6">
            Comprobante de Retención en la Fuente por Ingresos del Trabajo en Relación de Dependencia. Consolidado anual de retenciones a empleados.
          </p>
        </div>
        <button
          @click="downloadForm('107')"
          :disabled="loading['107']"
          class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <i class="fa-solid" :class="loading['107'] ? 'fa-spinner fa-spin' : 'fa-download'"></i>
          {{ loading['107'] ? 'Generando...' : 'Descargar Plantilla 107' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/shared/api'

// Fechas
const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

const years = [2024, 2025, 2026, 2027]
const months = [
  { value: 1, label: '01 - Enero' },
  { value: 2, label: '02 - Febrero' },
  { value: 3, label: '03 - Marzo' },
  { value: 4, label: '04 - Abril' },
  { value: 5, label: '05 - Mayo' },
  { value: 6, label: '06 - Junio' },
  { value: 7, label: '07 - Julio' },
  { value: 8, label: '08 - Agosto' },
  { value: 9, label: '09 - Septiembre' },
  { value: 10, label: '10 - Octubre' },
  { value: 11, label: '11 - Noviembre' },
  { value: 12, label: '12 - Diciembre' }
]

const periodLabel = computed(() => {
  const m = months.find(item => item.value === selectedMonth.value)
  return `${m?.label || selectedMonth.value} de ${selectedYear.value}`
})

// Estados de Carga
const loadingSummary = ref(false)
const loadingDownload = ref(false)
const loading = reactive({
  '103': false,
  '104': false,
  '107': false
})

// Datos del ATS
const atsData = ref(null)

const hasWarnings = computed(() => {
  return atsData.value?.warnings && atsData.value.warnings.length > 0
})

const formatMoney = (val) => {
  if (val === undefined || val === null) return '0.00'
  return Number(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const resetToCurrentPeriod = () => {
  const d = new Date()
  selectedYear.value = d.getFullYear()
  selectedMonth.value = d.getMonth() + 1
  fetchAtsSummary()
}

// Consultar Métricas Previas del ATS
const fetchAtsSummary = async () => {
  loadingSummary.value = true
  try {
    const res = await api.get('/accounting/ats/summary/', {
      params: {
        year: selectedYear.value,
        month: selectedMonth.value
      }
    })
    if (res.data?.status === 'success') {
      atsData.value = res.data.data
    }
  } catch (error) {
    console.error('Error al cargar resumen de ATS:', error)
  } finally {
    loadingSummary.value = false
  }
}

// Descargar XML del ATS
const downloadAtsXml = async () => {
  loadingDownload.value = true
  try {
    const res = await api.get('/accounting/ats/download/', {
      params: {
        year: selectedYear.value,
        month: selectedMonth.value
      },
      responseType: 'blob'
    })

    const monthStr = String(selectedMonth.value).padStart(2, '0')
    const fileName = `ATS_${monthStr}_${selectedYear.value}.xml`
    
    const blob = new Blob([res.data], { type: 'application/xml; charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error al descargar XML del ATS:', error)
    alert('No se pudo generar el archivo XML del ATS. Verifica que existan registros válidos para el período.')
  } finally {
    loadingDownload.value = false
  }
}

// Descargar Plantillas Secundarias
const downloadForm = (formNumber) => {
  loading[formNumber] = true
  setTimeout(() => {
    loading[formNumber] = false
    const url = `/FORM${formNumber}.xlsx`
    const a = document.createElement('a')
    a.href = url
    a.download = `Formulario_${formNumber}_Plantilla.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, 800)
}

onMounted(() => {
  fetchAtsSummary()
})
</script>
