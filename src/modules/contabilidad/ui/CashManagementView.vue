<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-money-bill-transfer text-brand-500"></i> Cash Management Bancario
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Generador de transferencias masivas a proveedores para Banca Empresas (Pichincha, Guayaquil, Produbanco).
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link 
          to="/contabilidad/bancos" 
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
          <i class="fa-solid fa-building-columns text-slate-500"></i> Administrar Cuentas Propias
        </router-link>
      </div>
    </div>

    <!-- Advertencia si no hay cuentas bancarias propias registradas -->
    <div v-if="!loadingBancos && bancos.length === 0" class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-triangle-exclamation text-amber-600 text-xl"></i>
        <div>
          <div class="font-bold text-sm">No has configurado cuentas bancarias de tu empresa</div>
          <div class="text-xs text-amber-700 mt-0.5">
            Para debitar fondos y generar los archivos bancarios, registre al menos una cuenta en "Cuentas Bancarias".
          </div>
        </div>
      </div>
      <router-link to="/contabilidad/bancos" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0">
        Registrar Cuenta
      </router-link>
    </div>

    <!-- Panel de Configuración del Lote de Pago -->
    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Cuenta Bancaria Origen -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            1. Cuenta Origen (Tu Empresa) *
          </label>
          <select 
            v-model="selectedBankAccountId" 
            class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-brand-500 outline-none">
            <option :value="null" disabled>-- Seleccione cuenta de débito --</option>
            <option v-for="b in bancos" :key="b.id" :value="b.id">
              {{ b.bank_name }} - {{ b.account_number }} (Saldo: {{ formatCurrency(b.current_balance) }})
            </option>
          </select>
        </div>

        <!-- Formato Bancario Oficial -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            2. Formato Bancario *
          </label>
          <select 
            v-model="selectedBankFormat" 
            class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white font-semibold text-brand-700 focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="pichincha">Banco Pichincha · Cash Management (.txt)</option>
            <option value="guayaquil">Banco Guayaquil · Multicash / Pagos (.txt)</option>
            <option value="produbanco">Produbanco · Pagos Masivos (.txt)</option>
          </select>
        </div>

        <!-- Búsqueda y Filtro -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Buscar Factura / Proveedor
          </label>
          <div class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text" 
              v-model="filtroBusqueda" 
              placeholder="Buscar por proveedor o N° factura..." 
              class="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
        </div>

      </div>

      <!-- Barra de Estado y Botones Rápidos de Selección -->
      <div class="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
        <div class="flex items-center gap-2">
          <button 
            @click="seleccionarTodosListos" 
            class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors">
            Seleccionar Todos los Listos
          </button>
          <button 
            @click="deseleccionarTodos" 
            class="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors">
            Limpiar Selección
          </button>
        </div>

        <div class="text-xs text-slate-500 flex items-center gap-4">
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Cuenta lista
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Requiere datos bancarios
          </span>
        </div>
      </div>
    </div>

    <!-- Tabla de Cuentas por Pagar -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div v-if="loadingItems" class="p-8 text-center text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-2xl text-brand-500"></i>
        <p class="mt-2 text-sm font-medium">Cargando cuentas por pagar pendientes...</p>
      </div>

      <div v-else-if="itemsFiltrados.length === 0" class="p-12 text-center text-slate-400 space-y-2">
        <i class="fa-solid fa-clipboard-check text-4xl text-slate-300"></i>
        <h3 class="font-bold text-slate-700 text-base">No hay facturas por pagar pendientes</h3>
        <p class="text-xs text-slate-400">Todas las obligaciones a proveedores se encuentran canceladas o no coinciden con la búsqueda.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase">
              <th class="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  :checked="estanTodosSeleccionados" 
                  @change="toggleTodos"
                  class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
              </th>
              <th class="p-4">Factura</th>
              <th class="p-4">Proveedor</th>
              <th class="p-4">Cuenta Destino (Proveedor)</th>
              <th class="p-4">Vencimiento</th>
              <th class="p-4 text-right">Saldo a Pagar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="item in itemsFiltrados" 
              :key="item.id" 
              class="hover:bg-slate-50/70 transition-colors"
              :class="{'bg-blue-50/40': selectedIds.includes(item.id)}">
              
              <!-- Checkbox -->
              <td class="p-4 text-center">
                <input 
                  type="checkbox" 
                  :value="item.id" 
                  v-model="selectedIds"
                  :disabled="!item.is_ready"
                  class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" />
              </td>

              <!-- Factura -->
              <td class="p-4 font-mono font-semibold text-slate-800">
                {{ item.invoice_number }}
              </td>

              <!-- Proveedor -->
              <td class="p-4">
                <div class="font-semibold text-slate-800">{{ item.supplier_name }}</div>
                <div class="text-xs font-mono text-slate-400">RUC: {{ item.supplier_identification }}</div>
              </td>

              <!-- Cuenta Destino -->
              <td class="p-4">
                <div v-if="item.is_ready" class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <div>
                    <span class="font-semibold text-slate-700">{{ item.bank_name }}</span>
                    <span class="text-xs font-mono text-slate-500 block">
                      {{ item.bank_account_type === 'CTE' ? 'Cta. Cte.' : 'Cta. Ahorros' }}: {{ item.bank_account_number }}
                    </span>
                  </div>
                </div>
                <div v-else class="flex items-center gap-2">
                  <button 
                    @click="abrirModalCompletarCuenta(item)"
                    class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs">
                    <i class="fa-solid fa-pen text-amber-600 text-[10px]"></i>
                    Completar Cuenta Bancaria
                  </button>
                </div>
              </td>

              <!-- Vencimiento -->
              <td class="p-4 text-xs font-mono text-slate-600">
                {{ item.due_date || 'Inmediato' }}
              </td>

              <!-- Saldo a Pagar -->
              <td class="p-4 text-right font-mono font-bold text-slate-800 text-base">
                {{ formatCurrency(item.balance_due) }}
              </td>

            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Barra Inferior Fija de Acción (Sticky Action Bar) -->
    <div 
      v-if="selectedIds.length > 0" 
      class="sticky bottom-6 z-40 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-4 duration-200 border border-slate-800">
      
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center text-lg border border-brand-500/30">
          <i class="fa-solid fa-file-invoice-dollar"></i>
        </div>
        <div>
          <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Resumen de Transferencia</div>
          <div class="text-sm font-bold mt-0.5">
            {{ selectedIds.length }} facturas seleccionadas &nbsp;·&nbsp;
            <span class="text-emerald-400 font-mono text-base font-black">{{ formatCurrency(totalMontoSeleccionado) }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
        <button 
          @click="generarArchivoCashManagement" 
          :disabled="generando"
          class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
          <i v-if="generando" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-download"></i>
          <span>Descargar Archivo {{ labelBancoActual }}</span>
        </button>

        <button 
          @click="asentarPagosContables" 
          :disabled="asentando"
          class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
          title="Registra los pagos en el sistema y genera el asiento contable">
          <i v-if="asentando" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-check-double text-brand-400"></i>
          <span>Asentar Pagos</span>
        </button>
      </div>

    </div>

    <!-- Modal Rápido: Completar Datos Bancarios del Proveedor -->
    <div v-if="modalCuentaProveedorVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
            <i class="fa-solid fa-building-columns text-brand-500"></i>
            Datos Bancarios del Proveedor
          </h3>
          <button @click="modalCuentaProveedorVisible = false" class="text-slate-400 hover:text-slate-600 p-1">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form @submit.prevent="guardarDatosBancariosProveedor" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Proveedor</label>
            <div class="text-sm font-bold text-slate-800">{{ formProveedor.supplier_name }}</div>
            <div class="text-xs font-mono text-slate-500">RUC: {{ formProveedor.supplier_identification }}</div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Banco Destino *</label>
            <input 
              type="text" 
              v-model="formProveedor.bank_name" 
              list="bancos-prov"
              required 
              placeholder="Ej. Banco Pichincha, Banco Guayaquil..."
              class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            <datalist id="bancos-prov">
              <option value="Banco Pichincha" />
              <option value="Banco Guayaquil" />
              <option value="Produbanco" />
              <option value="Banco del Pacífico" />
              <option value="Banco Bolivariano" />
              <option value="Banco Internacional" />
              <option value="Banco del Austro" />
              <option value="Banco Solidario" />
              <option value="Banco ProCredit" />
              <option value="Cooperativa JEP" />
            </datalist>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo Cuenta *</label>
              <select 
                v-model="formProveedor.bank_account_type" 
                required 
                class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="AHO">Ahorros</option>
                <option value="CTE">Corriente</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">N° de Cuenta *</label>
              <input 
                type="text" 
                v-model="formProveedor.bank_account_number" 
                required 
                placeholder="Ej. 2200123456"
                class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Titular de la Cuenta (Beneficiario)</label>
            <input 
              type="text" 
              v-model="formProveedor.beneficiary_name" 
              placeholder="Razón Social o Nombres del titular"
              class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              @click="modalCuentaProveedorVisible = false" 
              class="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="guardandoProveedor"
              class="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
              <i v-if="guardandoProveedor" class="fa-solid fa-spinner fa-spin"></i>
              <span>Guardar Cuenta</span>
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

const loadingBancos = ref(true)
const loadingItems = ref(true)
const generando = ref(false)
const asentando = ref(false)
const guardandoProveedor = ref(false)

const bancos = ref([])
const items = ref([])
const selectedIds = ref([])
const selectedBankAccountId = ref(null)
const selectedBankFormat = ref('pichincha')
const filtroBusqueda = ref('')

const modalCuentaProveedorVisible = ref(false)
const formProveedor = ref({
  supplier_id: null,
  supplier_name: '',
  supplier_identification: '',
  bank_name: '',
  bank_account_type: 'AHO',
  bank_account_number: '',
  beneficiary_name: '',
  beneficiary_id: '',
})

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const labelBancoActual = computed(() => {
  if (selectedBankFormat.value === 'pichincha') return 'Pichincha (.txt)'
  if (selectedBankFormat.value === 'guayaquil') return 'Guayaquil (.txt)'
  if (selectedBankFormat.value === 'produbanco') return 'Produbanco (.txt)'
  return 'Bancario (.txt)'
})

const itemsFiltrados = computed(() => {
  if (!filtroBusqueda.value.trim()) return items.value
  const q = filtroBusqueda.value.toLowerCase()
  return items.value.filter(it => 
    it.supplier_name.toLowerCase().includes(q) ||
    it.supplier_identification.includes(q) ||
    it.invoice_number.toLowerCase().includes(q)
  )
})

const estanTodosSeleccionados = computed(() => {
  const disponibles = itemsFiltrados.value.filter(it => it.is_ready)
  return disponibles.length > 0 && disponibles.every(it => selectedIds.value.includes(it.id))
})

const totalMontoSeleccionado = computed(() => {
  return items.value
    .filter(it => selectedIds.value.includes(it.id))
    .reduce((sum, it) => sum + it.balance_due, 0)
})

const fetchBancosPropios = async () => {
  loadingBancos.value = true
  try {
    const { data } = await api.get('/contabilidad/bancos/')
    bancos.value = data.filter(b => b.is_active)
    if (bancos.value.length > 0 && !selectedBankAccountId.value) {
      selectedBankAccountId.value = bancos.value[0].id
    }
  } catch (err) {
    console.error('Error fetching bank accounts', err)
  } finally {
    loadingBancos.value = false
  }
}

const fetchItemsPendientes = async () => {
  loadingItems.value = true
  try {
    const { data } = await api.get('/contabilidad/cash-management/items/')
    items.value = data
  } catch (err) {
    console.error('Error fetching payables', err)
    toast.error('Error al cargar cuentas por pagar pendientes')
  } finally {
    loadingItems.value = false
  }
}

const toggleTodos = () => {
  const listos = itemsFiltrados.value.filter(it => it.is_ready).map(it => it.id)
  if (estanTodosSeleccionados.value) {
    selectedIds.value = selectedIds.value.filter(id => !listos.includes(id))
  } else {
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...listos]))
  }
}

const seleccionarTodosListos = () => {
  selectedIds.value = items.value.filter(it => it.is_ready).map(it => it.id)
}

const deseleccionarTodos = () => {
  selectedIds.value = []
}

const abrirModalCompletarCuenta = (item) => {
  formProveedor.value = {
    supplier_id: item.supplier_id,
    supplier_name: item.supplier_name,
    supplier_identification: item.supplier_identification,
    bank_name: item.bank_name || '',
    bank_account_type: item.bank_account_type || 'AHO',
    bank_account_number: item.bank_account_number || '',
    beneficiary_name: item.beneficiary_name || item.supplier_name,
    beneficiary_id: item.beneficiary_id || item.supplier_identification,
  }
  modalCuentaProveedorVisible.value = true
}

const guardarDatosBancariosProveedor = async () => {
  guardandoProveedor.value = true
  try {
    await api.put(`/compras/proveedores/${formProveedor.value.supplier_id}/`, {
      bank_name: formProveedor.value.bank_name,
      bank_account_type: formProveedor.value.bank_account_type,
      bank_account_number: formProveedor.value.bank_account_number,
      beneficiary_name: formProveedor.value.beneficiary_name,
      beneficiary_id: formProveedor.value.beneficiary_id,
    })
    toast.success('Datos bancarios del proveedor actualizados')
    modalCuentaProveedorVisible.value = false
    await fetchItemsPendientes()
  } catch (err) {
    console.error('Error saving supplier bank data', err)
    toast.error('Error al guardar datos bancarios del proveedor')
  } finally {
    guardandoProveedor.value = false
  }
}

const generarArchivoCashManagement = async () => {
  if (!selectedBankAccountId.value) {
    toast.warning('Por favor seleccione la cuenta bancaria de origen.')
    return
  }
  if (selectedIds.value.length === 0) {
    toast.warning('Seleccione al menos una factura para pagar.')
    return
  }

  generando.value = true
  try {
    const payload = {
      bank_account_id: selectedBankAccountId.value,
      bank_format: selectedBankFormat.value,
      payable_ids: selectedIds.value
    }

    const response = await api.post('/contabilidad/cash-management/generate/?download=true', payload, {
      responseType: 'blob'
    })

    // Extraer nombre del archivo del header o generar fallback
    let filename = `CASH_${selectedBankFormat.value.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.txt`
    const disp = response.headers['content-disposition']
    if (disp && disp.includes('filename=')) {
      filename = disp.split('filename=')[1].replace(/"/g, '')
    }

    const blob = new Blob([response.data], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    toast.success(`Archivo ${filename} generado y descargado exitosamente`)
  } catch (err) {
    console.error('Error generating cash management file', err)
    toast.error('Error al generar archivo de pago masivo')
  } finally {
    generando.value = false
  }
}

const asentarPagosContables = async () => {
  if (!confirm(`¿Confirma asentar los pagos de las ${selectedIds.value.length} facturas seleccionadas por un total de ${formatCurrency(totalMontoSeleccionado.value)}?\n\nEsto rebajará las cuentas por pagar y generará el asiento contable en el Libro Diario debitando a Proveedores y acreditando a la cuenta bancaria.`)) {
    return
  }

  asentando.value = true
  try {
    const payload = {
      bank_account_id: selectedBankAccountId.value,
      payable_ids: selectedIds.value,
      payment_date: new Date().toISOString().slice(0, 10)
    }

    const { data } = await api.post('/contabilidad/cash-management/apply-payments/', payload)
    toast.success(`¡Se asentaron exitosamente ${data.applied_count} pagos por ${formatCurrency(data.total_applied)}!`)
    selectedIds.value = []
    await fetchItemsPendientes()
    await fetchBancosPropios()
  } catch (err) {
    console.error('Error applying payments', err)
    toast.error(err.response?.data?.error || 'Error al asentar pagos en contabilidad')
  } finally {
    asentando.value = false
  }
}

onMounted(() => {
  fetchBancosPropios()
  fetchItemsPendientes()
})
</script>
