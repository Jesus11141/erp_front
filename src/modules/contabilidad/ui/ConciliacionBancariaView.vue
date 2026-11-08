<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-scale-balanced text-brand-500"></i> Conciliación Bancaria Automática
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Cruce inteligente de extractos bancarios (Excel/CSV) contra el Libro Mayor Contable NIIF.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <button 
          v-if="reconActiva"
          @click="exportarPDF" 
          :disabled="exportandoPdf"
          class="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50">
          <i v-if="exportandoPdf" class="fa-solid fa-spinner fa-spin text-rose-600"></i>
          <i v-else class="fa-solid fa-file-pdf text-rose-600"></i>
          <span>Acta PDF</span>
        </button>

        <button 
          v-if="reconActiva"
          @click="exportarExcel" 
          :disabled="exportandoExcel"
          class="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50">
          <i v-if="exportandoExcel" class="fa-solid fa-spinner fa-spin text-emerald-600"></i>
          <i v-else class="fa-solid fa-file-excel text-emerald-600"></i>
          <span>Acta Excel</span>
        </button>

        <button 
          @click="tabActual = 'nueva'" 
          class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
          <i class="fa-solid fa-plus text-xs"></i> Nueva Conciliación
        </button>
      </div>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="flex gap-2 border-b border-slate-200 pb-2">
      <button 
        @click="tabActual = 'tablero'" 
        v-if="reconActiva"
        class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
        :class="tabActual === 'tablero' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-slate-500 hover:text-slate-800'">
        <i class="fa-solid fa-columns"></i> Tablero de Conciliación
      </button>

      <button 
        @click="tabActual = 'nueva'" 
        class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
        :class="tabActual === 'nueva' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-slate-500 hover:text-slate-800'">
        <i class="fa-solid fa-file-arrow-up"></i> Cargar Extracto
      </button>

      <button 
        @click="tabActual = 'historial'" 
        class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
        :class="tabActual === 'historial' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-slate-500 hover:text-slate-800'">
        <i class="fa-solid fa-clock-rotate-left"></i> Historial de Conciliaciones
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB 1: CARGA DE EXTRACTO BANCARIO (NUEVA CONCILIACIÓN) -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-if="tabActual === 'nueva'" class="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <div class="text-center space-y-1">
        <div class="w-14 h-14 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center text-2xl mx-auto border border-blue-100">
          <i class="fa-solid fa-cloud-arrow-up"></i>
        </div>
        <h2 class="text-xl font-bold text-slate-800">Cargar Extracto Bancario</h2>
        <p class="text-slate-500 text-xs">
          Suba el archivo de movimientos (.xlsx o .csv) descargado de la banca virtual para cruzarlo automáticamente con el Libro Mayor.
        </p>
      </div>

      <form @submit.prevent="procesarExtracto" class="space-y-4">
        <!-- Cuenta Bancaria -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Cuenta Bancaria de la Empresa *</label>
          <select 
            v-model="uploadForm.bank_account_id" 
            required 
            class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-brand-500 outline-none">
            <option :value="null" disabled>-- Seleccione la cuenta bancaria a conciliar --</option>
            <option v-for="b in bancos" :key="b.id" :value="b.id">
              {{ b.bank_name }} - {{ b.account_number }} ({{ b.account_type_label }})
            </option>
          </select>
          <div v-if="bancos.length === 0" class="text-xs text-amber-600 mt-1">
            ⚠ No tiene cuentas bancarias registradas. <router-link to="/contabilidad/bancos" class="underline font-bold">Cree una aquí</router-link>.
          </div>
        </div>

        <!-- Período de Conciliación -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Fecha Inicio Período *</label>
            <input 
              type="date" 
              v-model="uploadForm.period_start" 
              required 
              class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Fecha Fin Período (Corte) *</label>
            <input 
              type="date" 
              v-model="uploadForm.period_end" 
              required 
              class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
        </div>

        <!-- Saldo Final según Extracto -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Saldo Final según Extracto del Banco ($ USD) *</label>
          <input 
            type="number" 
            step="0.01" 
            v-model="uploadForm.statement_balance" 
            required 
            placeholder="0.00"
            class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none" />
          <p class="text-[11px] text-slate-400 mt-1">
            Ingrese el saldo final que indica el extracto bancario a la fecha de corte.
          </p>
        </div>

        <!-- Dropzone Archivo Excel / CSV -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Archivo de Extracto (.xlsx o .csv) *</label>
          <div 
            class="border-2 border-dashed border-slate-200 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
            @click="$refs.fileInput.click()">
            <input 
              type="file" 
              ref="fileInput" 
              @change="onFileSelected" 
              accept=".xlsx,.xls,.csv,.txt" 
              class="hidden" />
            <i class="fa-solid fa-file-excel text-3xl text-emerald-600 mb-2"></i>
            <div class="text-sm font-bold text-slate-700">
              {{ selectedFile ? selectedFile.name : 'Haga clic para seleccionar o arrastre su extracto bancario' }}
            </div>
            <p class="text-xs text-slate-400 mt-1">Formatos compatibles: Excel (.xlsx, .xls) o CSV con columnas de Fecha, Detalle y Montos.</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Notas / Observaciones (Opcional)</label>
          <input 
            type="text" 
            v-model="uploadForm.notes" 
            placeholder="Ej. Conciliación mensual de cierre septiembre..." 
            class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>

        <button 
          type="submit" 
          :disabled="procesando || !selectedFile || !uploadForm.bank_account_id"
          class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <i v-if="procesando" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
          <span>{{ procesando ? 'Procesando y Conciliando...' : 'Iniciar Conciliación Automática' }}</span>
        </button>
      </form>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB 2: TABLERO DE CONCILIACIÓN ACTIVA (SIDE BY SIDE) -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="tabActual === 'tablero' && reconActiva" class="space-y-6">
      
      <!-- Indicador de Cuadre y Resumen de la Ecuación Contable -->
      <div 
        class="p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
        :class="Math.abs(reconActiva.difference) < 0.01 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
          : 'bg-rose-50/70 border-rose-200 text-rose-900'">
        
        <div class="flex items-center gap-3">
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
            :class="Math.abs(reconActiva.difference) < 0.01 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
            <i class="fa-solid" :class="Math.abs(reconActiva.difference) < 0.01 ? 'fa-check-double' : 'fa-triangle-exclamation'"></i>
          </div>
          <div>
            <h3 class="font-bold text-base leading-tight">
              {{ Math.abs(reconActiva.difference) < 0.01 ? 'Conciliación Bancaria Cuadrada' : 'Descuadre en Conciliación Bancaria' }}
            </h3>
            <p class="text-xs opacity-90 mt-0.5">
              {{ reconActiva.bank_name }} Nro. {{ reconActiva.account_number }} · Período: {{ reconActiva.period_start }} al {{ reconActiva.period_end }}
            </p>
          </div>
        </div>

        <div class="text-right flex items-center gap-6">
          <div>
            <span class="text-[11px] uppercase tracking-wider font-bold block opacity-75">Diferencia</span>
            <span class="font-mono text-xl font-black">
              {{ formatCurrency(reconActiva.difference) }}
            </span>
          </div>

          <button 
            v-if="reconActiva.status !== 'closed'"
            @click="finalizarConciliacion"
            class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
            <i class="fa-solid fa-lock"></i> Cerrar y Aprobar
          </button>
        </div>
      </div>

      <!-- Tarjetas de Saldos Contables -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo s/ Extracto</div>
          <div class="text-xl font-bold font-mono text-slate-800 mt-1">{{ formatCurrency(reconActiva.statement_balance) }}</div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Depósitos en Tránsito (+)</div>
          <div class="text-xl font-bold font-mono text-emerald-600 mt-1">{{ formatCurrency(totalDepositosTransito) }}</div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cheques en Tránsito (-)</div>
          <div class="text-xl font-bold font-mono text-rose-600 mt-1">({{ formatCurrency(totalChequesTransito) }})</div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo s/ Libro Mayor</div>
          <div class="text-xl font-bold font-mono text-brand-600 mt-1">{{ formatCurrency(reconActiva.book_balance) }}</div>
        </div>
      </div>

      <!-- Paneles Side by Side (Extracto vs. Libros) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- PANEL IZQUIERDO: EXTRACTO BANCARIO -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div class="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-file-invoice text-blue-600"></i>
                <h3 class="font-bold text-slate-800 text-sm">Partidas del Extracto Bancario</h3>
              </div>
              <span class="text-xs font-mono font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {{ reconActiva.statement_items.length }} movimientos
              </span>
            </div>

            <div class="p-2 overflow-x-auto max-h-[500px]">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="text-slate-400 border-b border-slate-100">
                    <th class="p-2">Fecha</th>
                    <th class="p-2">Detalle / Ref</th>
                    <th class="p-2 text-right">Monto</th>
                    <th class="p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr 
                    v-for="it in reconActiva.statement_items" 
                    :key="it.id" 
                    class="hover:bg-slate-50/70 transition-colors"
                    :class="{'bg-emerald-50/30': it.is_matched}">
                    <td class="p-2 font-mono text-slate-600 whitespace-nowrap">{{ it.date }}</td>
                    <td class="p-2">
                      <div class="font-medium text-slate-800 truncate max-w-[200px]" :title="it.description">{{ it.description }}</div>
                      <div class="text-[10px] font-mono text-slate-400">{{ it.reference || 'S/R' }}</div>
                    </td>
                    <td class="p-2 text-right font-mono font-bold whitespace-nowrap" :class="it.movement_type === 'debit' ? 'text-rose-600' : 'text-emerald-600'">
                      {{ it.movement_type === 'debit' ? '-' : '+' }}{{ formatCurrency(it.amount) }}
                    </td>
                    <td class="p-2 text-center">
                      <button 
                        @click="toggleMatch(it)"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all"
                        :class="it.is_matched ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'">
                        {{ it.is_matched ? '✓ Conciliado' : 'Pendiente' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- PANEL DERECHO: LIBROS CONTABLES -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            <div class="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-book-journal-whills text-emerald-600"></i>
                <h3 class="font-bold text-slate-800 text-sm">Partidas del Libro Mayor (Contabilidad)</h3>
              </div>
              <span class="text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {{ reconActiva.book_items.length }} asientos
              </span>
            </div>

            <div class="p-2 overflow-x-auto max-h-[500px]">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="text-slate-400 border-b border-slate-100">
                    <th class="p-2">Fecha</th>
                    <th class="p-2">Glosa / Referencia</th>
                    <th class="p-2 text-right">Monto</th>
                    <th class="p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr 
                    v-for="b in reconActiva.book_items" 
                    :key="b.id" 
                    class="hover:bg-slate-50/70 transition-colors"
                    :class="{'bg-emerald-50/30': b.is_matched}">
                    <td class="p-2 font-mono text-slate-600 whitespace-nowrap">{{ b.date }}</td>
                    <td class="p-2">
                      <div class="font-medium text-slate-800 truncate max-w-[200px]" :title="b.description">{{ b.description }}</div>
                      <div class="text-[10px] font-mono text-slate-400">{{ b.reference || 'S/R' }}</div>
                    </td>
                    <td class="p-2 text-right font-mono font-bold whitespace-nowrap" :class="b.movement_type === 'debit' ? 'text-rose-600' : 'text-emerald-600'">
                      {{ b.movement_type === 'debit' ? '-' : '+' }}{{ formatCurrency(b.amount) }}
                    </td>
                    <td class="p-2 text-center">
                      <button 
                        @click="toggleMatch(b)"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all"
                        :class="b.is_matched ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'">
                        {{ b.is_matched ? '✓ Conciliado' : 'Pendiente' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB 3: HISTORIAL DE CONCILIACIONES BANCARIAS -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="tabActual === 'historial'" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="font-bold text-slate-800 text-sm">Historial de Conciliaciones</h3>
        <button @click="fetchHistorial" class="text-slate-400 hover:text-brand-500 transition-colors p-1" title="Actualizar">
          <i class="fa-solid fa-rotate-right" :class="{'fa-spin': loadingHistorial}"></i>
        </button>
      </div>

      <div v-if="loadingHistorial" class="p-8 text-center text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-2xl text-brand-500"></i>
        <p class="mt-2 text-sm">Cargando historial...</p>
      </div>

      <div v-else-if="historial.length === 0" class="p-12 text-center text-slate-400">
        <i class="fa-solid fa-box-open text-3xl mb-2"></i>
        <p class="text-sm">No se han registrado conciliaciones previamente.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase">
              <th class="p-3.5">Banco / Cuenta</th>
              <th class="p-3.5">Período</th>
              <th class="p-3.5 text-right">Saldo Extracto</th>
              <th class="p-3.5 text-right">Saldo Libros</th>
              <th class="p-3.5 text-right">Diferencia</th>
              <th class="p-3.5 text-center">Estado</th>
              <th class="p-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="h in historial" :key="h.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="p-3.5 font-medium text-slate-800">
                <div>{{ h.bank_name }}</div>
                <div class="text-xs font-mono text-slate-400">{{ h.account_number }}</div>
              </td>
              <td class="p-3.5 text-xs font-mono text-slate-600">
                {{ h.period_start }} al {{ h.period_end }}
              </td>
              <td class="p-3.5 text-right font-mono">{{ formatCurrency(h.statement_balance) }}</td>
              <td class="p-3.5 text-right font-mono">{{ formatCurrency(h.book_balance) }}</td>
              <td class="p-3.5 text-right font-mono font-bold" :class="Math.abs(h.difference) < 0.01 ? 'text-emerald-600' : 'text-rose-600'">
                {{ formatCurrency(h.difference) }}
              </td>
              <td class="p-3.5 text-center">
                <span 
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  :class="h.status === 'closed' ? 'bg-slate-100 text-slate-700' : (Math.abs(h.difference) < 0.01 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200')">
                  {{ h.status_label }}
                </span>
              </td>
              <td class="p-3.5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button 
                    @click="cargarConciliacion(h.id)" 
                    class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Ver Tablero de Conciliación">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  <button 
                    @click="descargarPDFDirecto(h.id)" 
                    class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Descargar Acta PDF">
                    <i class="fa-solid fa-file-pdf"></i>
                  </button>
                  <button 
                    @click="descargarExcelDirecto(h.id)" 
                    class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Descargar Excel">
                    <i class="fa-solid fa-file-excel"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/shared/api'
import { descargar } from '@/shared/descargas'
import { useToast } from 'vue-toastification'

const toast = useToast()

const tabActual = ref('nueva')
const bancos = ref([])
const historial = ref([])
const reconActiva = ref(null)

const procesando = ref(false)
const loadingHistorial = ref(false)
const exportandoPdf = ref(false)
const exportandoExcel = ref(false)
const selectedFile = ref(null)

const uploadForm = ref({
  bank_account_id: null,
  period_start: '',
  period_end: '',
  statement_balance: '',
  notes: ''
})

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const totalDepositosTransito = computed(() => {
  if (!reconActiva.value) return 0
  return reconActiva.value.book_items
    .filter(b => !b.is_matched && b.movement_type === 'credit')
    .reduce((s, b) => s + b.amount, 0)
})

const totalChequesTransito = computed(() => {
  if (!reconActiva.value) return 0
  return reconActiva.value.book_items
    .filter(b => !b.is_matched && b.movement_type === 'debit')
    .reduce((s, b) => s + b.amount, 0)
})

const fetchBancos = async () => {
  try {
    const { data } = await api.get('/contabilidad/bancos/')
    bancos.value = data.filter(b => b.is_active)
    if (bancos.value.length > 0 && !uploadForm.value.bank_account_id) {
      uploadForm.value.bank_account_id = bancos.value[0].id
    }
  } catch (err) {
    console.error('Error fetching bank accounts', err)
  }
}

const fetchHistorial = async () => {
  loadingHistorial.value = true
  try {
    const { data } = await api.get('/contabilidad/conciliaciones/')
    historial.value = data
  } catch (err) {
    console.error('Error fetching history', err)
  } finally {
    loadingHistorial.value = false
  }
}

const onFileSelected = (e) => {
  const f = e.target.files[0]
  if (f) selectedFile.value = f
}

const procesarExtracto = async () => {
  if (!selectedFile.value) {
    toast.warning('Seleccione el archivo de extracto bancario.')
    return
  }

  procesando.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('bank_account_id', uploadForm.value.bank_account_id)
    formData.append('period_start', uploadForm.value.period_start)
    formData.append('period_end', uploadForm.value.period_end)
    formData.append('statement_balance', uploadForm.value.statement_balance)
    formData.append('notes', uploadForm.value.notes)

    const { data } = await api.post('/contabilidad/conciliaciones/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    toast.success('¡Extracto procesado y auto-matching completado!')
    await cargarConciliacion(data.id)
    tabActual.value = 'tablero'
  } catch (err) {
    console.error('Error uploading statement', err)
    toast.error(err.response?.data?.error || 'Error al procesar extracto bancario')
  } finally {
    procesando.value = false
  }
}

const cargarConciliacion = async (reconId) => {
  try {
    const { data } = await api.get(`/contabilidad/conciliaciones/${reconId}/`)
    reconActiva.value = data
    tabActual.value = 'tablero'
  } catch (err) {
    console.error('Error loading reconciliation', err)
    toast.error('Error al cargar la conciliación')
  }
}

const toggleMatch = async (item) => {
  if (!reconActiva.value || reconActiva.value.status === 'closed') {
    toast.info('La conciliación está cerrada.')
    return
  }

  try {
    const nuevoEstado = !item.is_matched
    const { data } = await api.post(`/contabilidad/conciliaciones/${reconActiva.value.id}/match/`, {
      item_id: item.id,
      matched: nuevoEstado
    })

    item.is_matched = nuevoEstado
    reconActiva.value.status = data.status
    reconActiva.value.reconciled_balance = data.reconciled_balance
    reconActiva.value.difference = data.difference
  } catch (err) {
    console.error('Error toggling match', err)
    toast.error('Error al actualizar partida')
  }
}

const finalizarConciliacion = async () => {
  if (!confirm('¿Confirma cerrar y aprobar formalmente esta conciliación bancaria?')) return
  try {
    await api.post(`/contabilidad/conciliaciones/${reconActiva.value.id}/finalize/`)
    toast.success('Conciliación cerrada y aprobada formalmente.')
    reconActiva.value.status = 'closed'
    await fetchHistorial()
  } catch (err) {
    console.error('Error finalizing reconciliation', err)
    toast.error('Error al cerrar conciliación')
  }
}

const exportarPDF = async () => {
  if (!reconActiva.value) return
  exportandoPdf.value = true
  try {
    const nombre = `acta_conciliacion_${reconActiva.value.bank_name}_${reconActiva.value.period_end}.pdf`
    await descargar(`/contabilidad/conciliaciones/${reconActiva.value.id}/export/pdf/`, nombre)
    toast.success('Acta de Conciliación en PDF descargada')
  } catch (err) {
    console.error('Error downloading PDF', err)
    toast.error('Error al descargar Acta en PDF')
  } finally {
    exportandoPdf.value = false
  }
}

const exportarExcel = async () => {
  if (!reconActiva.value) return
  exportandoExcel.value = true
  try {
    const nombre = `conciliacion_${reconActiva.value.bank_name}_${reconActiva.value.period_end}.xlsx`
    await descargar(`/contabilidad/conciliaciones/${reconActiva.value.id}/export/excel/`, nombre)
    toast.success('Conciliación en Excel descargada')
  } catch (err) {
    console.error('Error downloading Excel', err)
    toast.error('Error al descargar conciliación en Excel')
  } finally {
    exportandoExcel.value = false
  }
}

const descargarPDFDirecto = async (id) => {
  await descargar(`/contabilidad/conciliaciones/${id}/export/pdf/`, `acta_conciliacion_${id}.pdf`)
}

const descargarExcelDirecto = async (id) => {
  await descargar(`/contabilidad/conciliaciones/${id}/export/excel/`, `conciliacion_${id}.xlsx`)
}

onMounted(() => {
  const d = new Date()
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
  uploadForm.value.period_start = firstDay.toISOString().slice(0, 10)
  uploadForm.value.period_end = d.toISOString().slice(0, 10)

  fetchBancos()
  fetchHistorial()
})
</script>
