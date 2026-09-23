<template>
  <div class="p-6 h-full flex flex-col bg-slate-50">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Declaraciones y Reportes</h1>
        <p class="text-sm text-slate-500">Exporta tu contabilidad en los formatos oficiales del SRI</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Formulario 104 -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl mb-4">
          <i class="fa-solid fa-file-excel"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Formulario 104</h3>
        <p class="text-sm text-slate-500 mt-1 mb-6">Declaración del Impuesto al Valor Agregado (IVA). Genera un consolidado de todas tus ventas y compras.</p>
        <button @click="downloadForm('104')" :disabled="loading['104']" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <i class="fa-solid" :class="loading['104'] ? 'fa-spinner fa-spin' : 'fa-download'"></i> 
          {{ loading['104'] ? 'Generando...' : 'Generar Excel' }}
        </button>
      </div>

      <!-- Formulario 103 -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xl mb-4">
          <i class="fa-solid fa-file-excel"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Formulario 103</h3>
        <p class="text-sm text-slate-500 mt-1 mb-6">Retenciones en la Fuente del Impuesto a la Renta. Extrae las retenciones emitidas a proveedores.</p>
        <button @click="downloadForm('103')" :disabled="loading['103']" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <i class="fa-solid" :class="loading['103'] ? 'fa-spinner fa-spin' : 'fa-download'"></i> 
          {{ loading['103'] ? 'Generando...' : 'Generar Excel' }}
        </button>
      </div>
      
      <!-- Formulario 107 -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-xl mb-4">
          <i class="fa-solid fa-file-excel"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Formulario 107</h3>
        <p class="text-sm text-slate-500 mt-1 mb-6">Retenciones por ingresos del trabajo en relación de dependencia (Anual). Para tus empleados en nómina.</p>
        <button @click="downloadForm('107')" :disabled="loading['107']" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <i class="fa-solid" :class="loading['107'] ? 'fa-spinner fa-spin' : 'fa-download'"></i> 
          {{ loading['107'] ? 'Generando...' : 'Generar Excel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const loading = reactive({
  '103': false,
  '104': false,
  '107': false
})

const downloadForm = (formNumber) => {
  loading[formNumber] = true
  
  // Simulamos el tiempo de generación del backend (1 segundo)
  setTimeout(() => {
    loading[formNumber] = false
    
    // Por ahora, para la demostración, descargamos las plantillas vacías recuperadas de tu viejo ERP
    const url = `/FORM${formNumber}.xlsx`
    const a = document.createElement('a')
    a.href = url
    a.download = `Formulario_${formNumber}_Plantilla.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, 1000)
}
</script>
