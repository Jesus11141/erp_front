<template>
  <div class="p-6 h-full flex flex-col bg-slate-50">
    <!-- Main Header -->
    <div class="flex justify-between items-end mb-6">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Portal SRI</h1>
        <p class="text-sm text-slate-500 mt-1">Conexión directa y extracción automatizada de comprobantes</p>
      </div>
      
      <!-- Control Buttons -->
      <div class="flex items-center gap-4">
        <!-- Caja Perfil RUC -->
        <div v-if="tenantStore.tieneModulo('sri_perfil') || tenantStore.tieneModulo('accounting') || tenantStore.tieneModulo('facturacion')" 
             class="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
          <button @click="showSettings = true" class="px-4 py-2 hover:bg-slate-100 text-slate-700 rounded-md transition-all font-medium flex items-center">
            <i class="fa-solid fa-cog mr-2 text-slate-400"></i>Configurar
          </button>
          <button @click="syncSri" :disabled="isSyncing" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md shadow-sm transition-all font-medium flex items-center gap-2 disabled:opacity-50">
            <i v-if="isSyncing" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-cloud-arrow-down"></i>
            {{ isSyncing ? 'Extrayendo...' : 'Extraer datos' }}
          </button>
        </div>
        
        <!-- Caja Facturas -->
        <div v-if="tenantStore.tieneModulo('sri_facturas') || tenantStore.tieneModulo('accounting') || tenantStore.tieneModulo('facturacion')" 
             class="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
          <button @click="showInvoiceSettings = true" class="px-4 py-2 hover:bg-slate-100 text-slate-700 rounded-md transition-all font-medium flex items-center">
            <i class="fa-solid fa-lock mr-2 text-slate-400"></i>Configurar Facturas
          </button>
          <div class="h-6 w-px bg-slate-200 mx-1"></div>
          <select v-model="selectedYear" class="px-3 py-2 bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer">
            <option :value="2026">2026</option>
            <option :value="2025">2025</option>
            <option :value="2024">2024</option>
          </select>
          <select v-model="selectedMonth" class="px-3 py-2 bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer">
            <option :value="0">Todo el Año</option>
            <option :value="1">Enero</option>
            <option :value="2">Febrero</option>
            <option :value="3">Marzo</option>
            <option :value="4">Abril</option>
            <option :value="5">Mayo</option>
            <option :value="6">Junio</option>
            <option :value="7">Julio</option>
            <option :value="8">Agosto</option>
            <option :value="9">Septiembre</option>
            <option :value="10">Octubre</option>
            <option :value="11">Noviembre</option>
            <option :value="12">Diciembre</option>
          </select>
            <button @click="clearInbox" class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md shadow-sm transition-all font-medium flex items-center gap-2 border border-red-200">
              <i class="fa-solid fa-trash"></i>
              Limpiar BD
            </button>
            <button @click="syncInvoices" :disabled="isSyncingInvoices" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition-all font-medium flex items-center gap-2 disabled:opacity-50">
              <i v-if="isSyncingInvoices" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-file-invoice-dollar"></i>
              {{ isSyncingInvoices ? 'Extrayendo...' : 'Extraer' }}
            </button>
        </div>
      </div>
    </div>

    <!-- RUC Profile Card -->
    <div v-if="companyName" class="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center text-xl">
          <i class="fa-solid fa-building"></i>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-800">{{ companyName }}</h2>
          <p class="text-sm text-slate-500 flex items-center gap-2">
            <span class="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">RUC: {{ companyRuc }}</span>
            <span v-if="taxStatus" class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" :class="taxStatus === 'ACTIVO' ? 'bg-green-500' : 'bg-red-500'"></span>
              {{ taxStatus }}
            </span>
          </p>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <p class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-0.5">Régimen</p>
          <p class="font-medium text-slate-700">{{ taxRegime || 'No extraído' }}</p>
        </div>
        <div>
          <p class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-0.5">Lleva Contabilidad</p>
          <p class="font-medium text-slate-700">{{ obligatedAccounting || 'No extraído' }}</p>
        </div>
      </div>
    </div>

      <!-- Tabs: Emitidas vs Recibidas vs Perfil -->
      <div class="flex mb-4 bg-slate-200/50 p-1 rounded-lg w-max border border-slate-200">
        <button 
          @click="activeTab = 'perfil'" 
          class="px-6 py-2 rounded-md font-medium text-sm transition-all"
          :class="activeTab === 'perfil' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'"
        >
          <i class="fa-solid fa-address-card mr-2"></i>Perfil RUC
        </button>
        <button 
          @click="activeTab = 'recibidas'" 
          class="px-6 py-2 rounded-md font-medium text-sm transition-all"
          :class="activeTab === 'recibidas' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'"
        >
          <i class="fa-solid fa-inbox mr-2"></i>Facturas Recibidas (Compras)
        </button>
        <button 
          @click="activeTab = 'emitidas'" 
          class="px-6 py-2 rounded-md font-medium text-sm transition-all"
          :class="activeTab === 'emitidas' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'"
        >
          <i class="fa-solid fa-paper-plane mr-2"></i>Facturas Emitidas (Ventas)
        </button>
      </div>

      <!-- Taxpayer Details Tables -->
      <div v-if="activeTab === 'perfil' && companyRuc" class="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col p-6 gap-6">
        <h3 class="text-xl font-bold text-slate-800">Detalles del Contribuyente</h3>
        
        <!-- Tabla 1: Estado y Suspensión -->
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-[#0f4b8f] text-white font-medium">
              <tr>
                <th class="py-2 px-4 border-r border-slate-400/30">Estado contribuyente en el RUC</th>
                <th class="py-2 px-4">Motivo suspensión</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-slate-50">
              <tr>
                <td class="py-3 px-4 font-bold border-r border-slate-200" :class="taxStatus === 'ACTIVO' ? 'text-green-600' : 'text-red-500'">
                  {{ taxStatus || 'No extraído' }}
                </td>
                <td class="py-3 px-4 font-medium text-slate-700 uppercase">
                  {{ suspensionReason || 'N/A' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabla 2: Actividad -->
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-[#0f4b8f] text-white font-medium">
              <tr>
                <th class="py-2 px-4 border-r border-slate-400/30">Tipo contribuyente</th>
                <th class="py-2 px-4 border-r border-slate-400/30 text-center">Régimen</th>
                <th class="py-2 px-4 text-center">Categoría</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-slate-50">
              <tr>
                <td class="py-3 px-4 uppercase border-r border-slate-200">{{ taxpayerType || 'N/A' }}</td>
                <td class="py-3 px-4 uppercase border-r border-slate-200 font-bold text-center text-slate-700">{{ taxRegime || 'N/A' }}</td>
                <td class="py-3 px-4 uppercase text-center">{{ taxCategory || 'N/A' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Tabla 3: Contabilidad -->
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-[#0f4b8f] text-white font-medium">
              <tr>
                <th class="py-2 px-4 border-r border-slate-400/30">Obligado a llevar contabilidad</th>
                <th class="py-2 px-4 border-r border-slate-400/30 text-center">Agente de retención</th>
                <th class="py-2 px-4 text-center">Fecha inicio actividades</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-slate-50">
              <tr>
                <td class="py-3 px-4 uppercase border-r border-slate-200 font-bold text-slate-700">{{ obligatedAccounting || 'N/A' }}</td>
                <td class="py-3 px-4 uppercase border-r border-slate-200">NO</td>
                <td class="py-3 px-4 font-medium">{{ activityStartDate || 'N/A' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabla de Facturas Recibidas -->
      <div v-if="activeTab === 'recibidas'" class="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col mt-0">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-700 text-lg">Facturas Recibidas (Vigentes)</h3>
          
          <div class="flex items-center gap-3">
            <div class="bg-slate-100 p-1 rounded-lg flex text-sm overflow-x-auto">
              <button @click="selectedViewMonth = 0" :class="selectedViewMonth === 0 ? 'bg-white shadow-sm text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 rounded-md whitespace-nowrap transition-all">Todas</button>
              <button v-for="(mesName, idx) in ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']" :key="idx" @click="selectedViewMonth = idx + 1" :class="selectedViewMonth === idx + 1 ? 'bg-white shadow-sm text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 rounded-md whitespace-nowrap transition-all">{{ mesName }}</button>
            </div>
            <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{{ filteredDocuments.length }}</span>
          </div>
        </div>
        
        <div class="overflow-auto flex-1 p-0">
          <div v-if="loadingDocs" class="flex flex-col items-center justify-center h-48 text-slate-400">
            <i class="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
            <p>Cargando comprobantes...</p>
          </div>
          
          <div v-else-if="filteredDocuments.length === 0" class="flex flex-col items-center justify-center h-48 text-slate-400">
            <i class="fa-solid fa-folder-open text-4xl mb-4 text-slate-300"></i>
            <p>No hay facturas para el mes seleccionado.</p>
          </div>
          
          <table v-else class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-500 font-medium sticky top-0 shadow-sm">
              <tr>
                <th class="py-3 px-6">Emisor</th>
                <th class="py-3 px-6">Documento</th>
                <th class="py-3 px-6">Fecha Emisión</th>
                <th class="py-3 px-6 text-right">Total</th>
                <th class="py-3 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="doc in filteredDocuments" :key="doc.id" class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-6">
                  <div class="font-bold text-slate-700">{{ doc.supplier_name }}</div>
                  <div class="text-xs text-slate-400">RUC: {{ doc.supplier_ruc }}</div>
                </td>
                <td class="py-3 px-6">
                  <div class="font-medium">{{ doc.document_type }}</div>
                  <div class="text-xs text-slate-500">{{ doc.document_number }}</div>
                </td>
                <td class="py-3 px-6">
                  <span class="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                    <i class="fa-regular fa-calendar mr-1"></i> {{ doc.emission_date }}
                  </span>
                </td>
                <td class="py-3 px-6 text-right font-bold text-slate-700">
                  ${{ parseFloat(doc.total_amount).toFixed(2) }}
                </td>
                <td class="py-3 px-6 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <button @click="viewXml(doc)" class="text-brand-600 hover:text-brand-800 p-2 rounded hover:bg-brand-50 transition-colors" title="Ver XML">
                      <i class="fa-solid fa-code"></i>
                    </button>
                    <button v-if="doc.status !== 'processed'" @click="openAccountingModal(doc)" class="text-emerald-600 hover:text-emerald-800 p-2 rounded hover:bg-emerald-50 transition-colors" title="Contabilizar">
                      <i class="fa-solid fa-file-invoice-dollar"></i>
                    </button>
                    <span v-else class="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-medium">
                      Contabilizado
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Tab 3: Documentos Emitidos (Ventas) -->
      <div v-if="activeTab === 'emitidas'" class="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col mt-0">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-700 text-lg">Facturas Emitidas (Ventas)</h3>
          
          <div class="flex items-center gap-4">
            <button @click="syncEmittedDocs('pruebas')" :disabled="isSyncingOutbox" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm transition-all font-medium flex items-center gap-2 disabled:opacity-50 text-sm" title="Extraer del entorno de Pruebas">
              <i v-if="isSyncingOutbox" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-flask"></i>
              Pruebas
            </button>
            <button @click="syncEmittedDocs('produccion')" :disabled="isSyncingOutbox" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md shadow-sm transition-all font-medium flex items-center gap-2 disabled:opacity-50 text-sm">
              <i v-if="isSyncingOutbox" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-cloud-arrow-down"></i>
              Producción
            </button>
            <select v-model="selectedViewMonthOutbox" class="text-sm border-slate-300 rounded-md shadow-sm focus:border-brand-500 focus:ring-brand-500 py-1.5 pl-3 pr-8">
              <option :value="0">Todos los meses</option>
              <option :value="1">Enero</option>
              <option :value="2">Febrero</option>
              <option :value="3">Marzo</option>
              <option :value="4">Abril</option>
              <option :value="5">Mayo</option>
              <option :value="6">Junio</option>
              <option :value="7">Julio</option>
              <option :value="8">Agosto</option>
              <option :value="9">Septiembre</option>
              <option :value="10">Octubre</option>
              <option :value="11">Noviembre</option>
              <option :value="12">Diciembre</option>
            </select>
          </div>
        </div>
        
        <div class="overflow-auto flex-1">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
              <tr>
                <th class="py-3 px-6">Emisor (Cliente)</th>
                <th class="py-3 px-6">Fecha Emisión</th>
                <th class="py-3 px-6 text-right">Total</th>
                <th class="py-3 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="loadingOutbox">
                <td colspan="4" class="py-8 text-center text-slate-500">
                  <i class="fa-solid fa-spinner fa-spin mr-2"></i>Cargando documentos...
                </td>
              </tr>
              <tr v-else-if="filteredOutboxDocuments.length === 0">
                <td colspan="4" class="py-8 text-center text-slate-500">
                  <i class="fa-regular fa-folder-open text-3xl mb-3 text-slate-300 block"></i>
                  No hay comprobantes emitidos descargados
                </td>
              </tr>
              <tr v-for="doc in filteredOutboxDocuments" :key="doc.id" class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-6">
                  <div class="font-medium text-slate-800">{{ doc.customer_name }}</div>
                  <div class="text-xs text-slate-500">RUC: {{ doc.customer_ruc }}</div>
                </td>
                <td class="py-3 px-6 text-slate-600">
                  <i class="fa-regular fa-calendar text-slate-400 mr-2"></i>{{ doc.emission_date }}
                </td>
                <td class="py-3 px-6 text-right font-medium text-emerald-600">
                  ${{ doc.total_amount }}
                </td>
                <td class="py-3 px-6 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <button @click="viewXml(doc)" class="text-brand-600 hover:text-brand-800 p-2 rounded hover:bg-brand-50 transition-colors" title="Ver XML">
                      <i class="fa-solid fa-code"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    
      <!-- Accounting Modal -->
      <div v-if="showAccountingModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
          <div class="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-200">
            <h3 class="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <i class="fa-solid fa-file-invoice-dollar text-xl"></i>
              </div>
              Contabilizar Factura de Compra
            </h3>
            <button @click="showAccountingModal = false" class="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Factura Info Box -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">PROVEEDOR</p>
                  <p class="font-medium text-slate-800">{{ selectedDocForAccounting?.supplier_name }}</p>
                  <p class="text-sm text-slate-500">RUC: {{ selectedDocForAccounting?.supplier_ruc }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">TOTAL A PAGAR</p>
                  <p class="text-3xl font-bold text-emerald-600">${{ selectedDocForAccounting?.total_amount }}</p>
                  <p class="text-sm text-slate-500 mt-1">Factura N° {{ selectedDocForAccounting?.secuencial }}</p>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Cuenta de Gasto -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Cuenta de Gasto <span class="text-red-500">*</span></label>
                <select v-model="selectedAccountId" class="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 bg-white border cursor-pointer hover:border-slate-400 transition-colors">
                  <option value="" disabled>Seleccione la cuenta para este egreso</option>
                  <option v-for="acc in expenseAccounts" :key="acc.id" :value="acc.id">
                    {{ acc.code }} - {{ acc.name }}
                  </option>
                </select>
                <p class="text-xs text-slate-500 mt-2"><i class="fa-solid fa-circle-info mr-1"></i>Esta cuenta aparecerá en tus Estados Financieros.</p>
                <p v-if="expenseAccounts.length === 0" class="text-xs text-orange-500 mt-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>No hay cuentas de egreso configuradas en contabilidad.</p>
              </div>
              
              <!-- Centro de Costo -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Centro de Costo <span class="text-xs font-normal text-slate-400">(Opcional)</span></label>
                <select v-model="selectedCostCenterId" class="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 bg-white border cursor-pointer hover:border-slate-400 transition-colors">
                  <option value="">Ninguno (Gasto general)</option>
                  <option v-for="cc in costCenters" :key="cc.id" :value="cc.id">
                    {{ cc.name }}
                  </option>
                </select>
                <p class="text-xs text-slate-500 mt-2"><i class="fa-solid fa-circle-info mr-1"></i>Para asignar este gasto a un proyecto o área.</p>
              </div>
            </div>
          </div>
          
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
            <button @click="showAccountingModal = false" class="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm">
              Cancelar
            </button>
            <button @click="processInvoice" :disabled="isAccounting" class="px-5 py-2.5 bg-emerald-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-700 flex items-center transition-colors shadow-sm disabled:opacity-70">
              <i v-if="isAccounting" class="fa-solid fa-spinner fa-spin mr-2"></i>
              <i v-else class="fa-solid fa-check mr-2"></i>
              Generar Asiento Contable
            </button>
          </div>
        </div>
      </div>

    <!-- XML Modal -->
      <div v-if="showXmlModal" class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
            <div class="flex items-center gap-4">
              <h3 class="font-bold text-slate-800">
                <i class="fa-solid fa-file-invoice text-brand-600 mr-2"></i>Detalle de Factura
              </h3>
              <div class="bg-slate-200/50 p-1 rounded-md flex">
                 <button @click="xmlTab = 'visual'" :class="xmlTab === 'visual' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'" class="px-3 py-1 text-xs font-medium rounded transition-all">Vista Amigable</button>
                 <button @click="xmlTab = 'raw'" :class="xmlTab === 'raw' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'" class="px-3 py-1 text-xs font-medium rounded transition-all">XML Original</button>
              </div>
            </div>
            <button @click="showXmlModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          
          <div class="p-6 overflow-auto flex-1 bg-slate-50" v-if="xmlTab === 'visual'">
            <div v-if="!parsedInvoice" class="text-center text-slate-500 py-10">
              <i class="fa-solid fa-triangle-exclamation text-3xl mb-3 text-slate-300"></i>
              <p>No se pudo procesar visualmente este XML.</p>
              <p class="text-sm mt-2">Puede cambiar a la pestaña "XML Original" para ver los datos crudos.</p>
            </div>
            <div v-else class="space-y-6">
              <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-lg text-slate-800">{{ parsedInvoice.razonSocial }}</h4>
                  <p class="text-slate-500 text-sm">RUC: {{ parsedInvoice.ruc }}</p>
                  <p class="text-slate-500 text-sm" v-if="parsedInvoice.dirEstablecimiento"><i class="fa-solid fa-location-dot mr-1"></i>{{ parsedInvoice.dirEstablecimiento }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-brand-700 text-xl">Factura N° {{ parsedInvoice.estab }}-{{ parsedInvoice.ptoEmi }}-{{ parsedInvoice.secuencial }}</p>
                  <p class="text-slate-500 text-sm"><i class="fa-regular fa-calendar mr-1"></i> Fecha: {{ parsedInvoice.fechaEmision }}</p>
                </div>
              </div>

              <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th class="px-4 py-3">Código</th>
                      <th class="px-4 py-3">Descripción</th>
                      <th class="px-4 py-3 text-right">Cant.</th>
                      <th class="px-4 py-3 text-right">P.Unitario</th>
                      <th class="px-4 py-3 text-right">Dcto.</th>
                      <th class="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(item, idx) in parsedInvoice.detalles" :key="idx" class="hover:bg-slate-50">
                      <td class="px-4 py-3 text-slate-500">{{ item.codigoPrincipal }}</td>
                      <td class="px-4 py-3 font-medium text-slate-800">{{ item.descripcion }}</td>
                      <td class="px-4 py-3 text-right">{{ item.cantidad }}</td>
                      <td class="px-4 py-3 text-right">${{ item.precioUnitario }}</td>
                      <td class="px-4 py-3 text-right text-red-500" v-if="parseFloat(item.descuento) > 0">-${{ item.descuento }}</td>
                      <td class="px-4 py-3 text-right text-slate-400" v-else>$0.00</td>
                      <td class="px-4 py-3 text-right font-bold">${{ item.precioTotalSinImpuesto }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex justify-end">
                <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm w-72 space-y-2">
                  <div class="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span class="font-medium">${{ parsedInvoice.totalSinImpuestos }}</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>Impuestos (IVA/ICE):</span>
                    <span class="font-medium">${{ (parseFloat(parsedInvoice.importeTotal) - parseFloat(parsedInvoice.totalSinImpuestos)).toFixed(2) }}</span>
                  </div>
                  <div class="border-t border-slate-100 pt-2 flex justify-between items-center mt-2">
                    <span class="font-bold text-slate-800 text-lg">Total General:</span>
                    <span class="font-bold text-brand-700 text-xl">${{ parsedInvoice.importeTotal }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="p-6 overflow-auto flex-1 bg-slate-900" v-if="xmlTab === 'raw'">
            <pre class="text-green-400 text-xs font-mono whitespace-pre-wrap">{{ selectedXml }}</pre>
          </div>
          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
            <button @click="showXmlModal = false" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium">
              Cerrar
            </button>
          </div>
        </div>
      </div>
      
      <SriSettingsModal :show="showSettings" @close="showSettings = false" @saved="syncSri" />
    <SriInvoiceSettingsModal :show="showInvoiceSettings" @close="showInvoiceSettings = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/shared/api'
import { useTenantStore } from '../../../stores/tenant'
import SriSettingsModal from './components/SriSettingsModal.vue'
import SriInvoiceSettingsModal from './components/SriInvoiceSettingsModal.vue'

const tenantStore = useTenantStore()
const showSettings = ref(false)
const showInvoiceSettings = ref(false)

const documents = ref([])
const loadingDocs = ref(true)
const isSyncing = ref(false)
const isSyncingInvoices = ref(false)

const selectedViewMonth = ref(0)

const outboxDocuments = ref([])
const loadingOutbox = ref(true)
const selectedViewMonthOutbox = ref(0)
const isSyncingOutbox = ref(false)

const filteredOutboxDocuments = computed(() => {
  if (selectedViewMonthOutbox.value === 0) return outboxDocuments.value
  return outboxDocuments.value.filter(doc => {
    if (!doc.emission_date) return true
    const parts = doc.emission_date.split('-')
    if (parts.length >= 2) {
      return parseInt(parts[1]) === selectedViewMonthOutbox.value
    }
    return true
  })
})

const filteredDocuments = computed(() => {
  if (selectedViewMonth.value === 0) return documents.value
  return documents.value.filter(doc => {
    if (!doc.emission_date) return true
    const parts = doc.emission_date.split('-')
    if (parts.length >= 2) {
      return parseInt(parts[1]) === selectedViewMonth.value
    }
    return true
  })
})

const companyName = ref('')
const companyRuc = ref('')
const taxStatus = ref('')
const taxRegime = ref('')
const obligatedAccounting = ref('')
const taxpayerType = ref('')
const taxCategory = ref('')
const suspensionReason = ref('')
const activityStartDate = ref('')

const activeTab = ref('perfil')
const showXmlModal = ref(false)
const showAccountingModal = ref(false)
const selectedDocForAccounting = ref(null)
const expenseAccounts = ref([])
const costCenters = ref([])
const selectedAccountId = ref('')
const selectedCostCenterId = ref('')
const isAccounting = ref(false)

const loadAccountingData = async () => {
  try {
    const resA = await api.get('/contabilidad/cuentas/')
    const dataA = resA.data
    let egresos = dataA.filter(a => a.type === 'egreso' || a.name.toLowerCase().includes('gasto'))
    
    if (egresos.length === 0) {
      const createRes = await api.post('/contabilidad/cuentas/', { code: '5.1.01.01', name: 'Gastos Generales', type: 'egreso' })
      if (createRes.status === 201) {
        egresos.push(createRes.data)
      }
    }
    
    expenseAccounts.value = egresos
    
    const resC = await api.get('/contabilidad/centros-costos/')
    costCenters.value = resC.data
  } catch(e) { console.error('Error loading accounting data', e) }
}

const openAccountingModal = (doc) => {
  selectedDocForAccounting.value = doc
  showAccountingModal.value = true
  if (expenseAccounts.value.length === 0) loadAccountingData()
}

const processInvoice = async () => {
  if (!selectedAccountId.value) return alert('Seleccione una cuenta de gasto')
  
  isAccounting.value = true
  try {
    const res = await api.post(`/accounting/sri-inbox/${selectedDocForAccounting.value.id}/process/`, {
      account_id: selectedAccountId.value,
      cost_center_id: selectedCostCenterId.value || null
    })
    if (res.data.status === 'success') {
      alert('Factura contabilizada con éxito!')
      showAccountingModal.value = false
      selectedDocForAccounting.value.status = 'processed'
    } else {
      alert('Error: ' + res.data.message)
    }
  } catch(e) {
    alert('Error de conexión: ' + (e.response?.data?.message || e.message))
  } finally {
    isAccounting.value = false
  }
}
const selectedXml = ref('')
const xmlTab = ref('visual')
const parsedInvoice = ref(null)

const parseSRIXml = (xmlString) => {
  try {
    if (!xmlString || !xmlString.includes('<factura')) return null
    
    // Parsear el string XML
    const parser = new DOMParser()
    let xmlDoc = parser.parseFromString(xmlString, "text/xml")
    
    // Si el XML viene con el wrapper <autorizacion> del SRI (descarga manual)
    const comprobanteNodes = xmlDoc.getElementsByTagName("comprobante")
    if (comprobanteNodes.length > 0 && comprobanteNodes[0].textContent) {
      // El contenido suele estar envuelto en CDATA
      const innerXml = comprobanteNodes[0].textContent
      xmlDoc = parser.parseFromString(innerXml, "text/xml")
    }
    
    // Check if there are parsing errors
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) return null

    const getText = (node, tag) => {
      if (!node) return ''
      const el = node.getElementsByTagName(tag)[0]
      return el ? el.textContent : ''
    }

    const infoTributaria = xmlDoc.getElementsByTagName("infoTributaria")[0]
    const infoFactura = xmlDoc.getElementsByTagName("infoFactura")[0]
    
    if (!infoTributaria || !infoFactura) return null

    const invoice = {
      razonSocial: getText(infoTributaria, 'razonSocial'),
      ruc: getText(infoTributaria, 'ruc'),
      claveAcceso: getText(infoTributaria, 'claveAcceso'),
      estab: getText(infoTributaria, 'estab'),
      ptoEmi: getText(infoTributaria, 'ptoEmi'),
      secuencial: getText(infoTributaria, 'secuencial'),
      fechaEmision: getText(infoFactura, 'fechaEmision'),
      dirEstablecimiento: getText(infoFactura, 'dirEstablecimiento'),
      totalSinImpuestos: getText(infoFactura, 'totalSinImpuestos'),
      importeTotal: getText(infoFactura, 'importeTotal'),
      detalles: []
    }

    const detalles = xmlDoc.getElementsByTagName("detalle")
    for (let i = 0; i < detalles.length; i++) {
      const d = detalles[i]
      invoice.detalles.push({
        codigoPrincipal: getText(d, 'codigoPrincipal') || getText(d, 'codigoAuxiliar') || 'S/N',
        descripcion: getText(d, 'descripcion'),
        cantidad: getText(d, 'cantidad'),
        precioUnitario: getText(d, 'precioUnitario'),
        descuento: getText(d, 'descuento') || '0.00',
        precioTotalSinImpuesto: getText(d, 'precioTotalSinImpuesto')
      })
    }
    
    return invoice
  } catch (e) {
    console.error("Error parsing XML", e)
    return null
  }
}

const viewXml = (doc) => {
  const xmlStr = doc.xml_content || 'No hay XML disponible para esta factura.'
  selectedXml.value = xmlStr
  parsedInvoice.value = parseSRIXml(xmlStr)
  xmlTab.value = parsedInvoice.value ? 'visual' : 'raw'
  showXmlModal.value = true
}

const handleRucSaved = () => {
  syncSri()
}

const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(0) // Default a Todo el Año

const clearInbox = async () => {
  if (!confirm('¿Estás seguro de que quieres borrar TODAS las facturas de la base de datos? Esto es útil para limpiar si mezclaste pruebas.')) return
  
  try {
    const res = await fetch('http://127.0.0.1:8000/api/accounting/sri-inbox/clear/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (data.status === 'success') {
      alert('Base de datos limpiada correctamente.')
      documents.value = []
    } else {
      alert('Error: ' + data.message)
    }
  } catch (e) {
    console.error(e)
    alert('Error al intentar limpiar la base de datos.')
  }
}

const syncInvoices = async () => {
  try {
    isSyncingInvoices.value = true
    const res = await fetch('http://127.0.0.1:8000/api/accounting/sri-extract-invoices/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ month: selectedMonth.value, year: selectedYear.value })
    })
    
    const data = await res.json()
    
    if (data.status === 'success') {
      alert(`¡Extracción exitosa! Se encontraron ${data.inserted} facturas nuevas.`)
      await fetchDocuments()
    } else {
      if (data.message.includes('No configuradas') || data.message.includes('no configurado') || data.message.includes('Credenciales')) {
        alert('Por favor, haz clic en Configurar Facturas para ingresar tu contraseña del SRI.')
      } else {
        alert('Error: ' + data.message)
      }
    }
  } catch (e) {
    console.error(e)
    alert('Error de conexión al extraer facturas.')
  } finally {
    isSyncingInvoices.value = false
  }
}

const fetchStatus = async () => {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/accounting/sri-status/')
    const data = await res.json()
    if (data.status === 'configured') {
      companyName.value = data.company_name || ''
      companyRuc.value = data.ruc || ''
      taxStatus.value = data.tax_status || ''
      taxRegime.value = data.tax_regime || ''
      obligatedAccounting.value = data.obligated_accounting || ''
      taxpayerType.value = data.taxpayer_type || ''
      taxCategory.value = data.tax_category || ''
      suspensionReason.value = data.suspension_reason || ''
      activityStartDate.value = data.activity_start_date || ''
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchDocuments = async () => {
  try {
    loadingDocs.value = true
    const res = await fetch('http://127.0.0.1:8000/api/accounting/sri-inbox/')
    const data = await res.json()
    if (data.status === 'success') {
      documents.value = data.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingDocs.value = false
  }
}

const onSettingsSaved = () => {
  syncSri()
}

const syncSri = async () => {
  try {
    isSyncing.value = true
    const res = await fetch('http://127.0.0.1:8000/api/accounting/sri-extract/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ month: selectedMonth.value, year: selectedYear.value })
    })
    
    const data = await res.json()
    
    if (data.status === 'success') {
      await fetchDocuments()
      await fetchStatus()
    } else {
      if (data.message.includes('No configuradas') || data.message.includes('no configurado')) {
        alert('Por favor, haz clic en Configurar para guardar el RUC a consultar.')
      } else {
        alert('Error: ' + data.message)
      }
    }
  } catch (e) {
    console.error(e)
    alert('Error de conexión al sincronizar.')
  } finally {
    isSyncing.value = false
  }
}

const fetchOutboxDocuments = async () => {
  try {
    loadingOutbox.value = true
    const res = await api.get('/accounting/sri-outbox/')
    outboxDocuments.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loadingOutbox.value = false
  }
}

const syncEmittedDocs = async (env = 'produccion') => {
  try {
    isSyncingOutbox.value = true
    const res = await api.post('/accounting/sri-extract-emitted/', {
      tenant_id: tenantStore.tenantId,
      month: selectedViewMonthOutbox.value,
      year: new Date().getFullYear(),
      env: env
    })
    if (res.data.status === 'success') {
      alert(`Sincronización completada. Se guardaron ${res.data.inserted} facturas emitidas.`)
      fetchOutboxDocuments()
    } else {
      alert('Error: ' + res.data.message)
    }
  } catch (e) {
    alert('Ocurrió un error al conectar con el servidor')
  } finally {
    isSyncingOutbox.value = false
  }
}

onMounted(() => {
  fetchDocuments()
  fetchOutboxDocuments()
  fetchStatus()
})
</script>
