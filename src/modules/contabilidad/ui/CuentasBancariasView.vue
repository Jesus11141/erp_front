<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-building-columns text-brand-500"></i> Cuentas Bancarias de la Empresa
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Administre las cuentas corrientes y de ahorros de su empresa vinculadas al Plan de Cuentas NIIF.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link 
          to="/contabilidad/cash-management" 
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
          <i class="fa-solid fa-money-bill-transfer text-brand-600"></i> Ir a Cash Management
        </router-link>
        <button 
          @click="abrirModalCrear" 
          class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
          <i class="fa-solid fa-plus text-xs"></i> Nueva Cuenta Bancaria
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="i in 3" :key="i" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse space-y-4">
        <div class="h-6 bg-slate-100 rounded w-1/2"></div>
        <div class="h-4 bg-slate-100 rounded w-3/4"></div>
        <div class="h-8 bg-slate-100 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Lista de Cuentas Bancarias -->
    <div v-else-if="cuentas.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div 
        v-for="c in cuentas" 
        :key="c.id" 
        class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
        :class="{'opacity-60': !c.is_active}">
        <div>
          <div class="flex justify-between items-start gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-brand-600 flex items-center justify-center text-xl">
                <i class="fa-solid fa-building-columns"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-base leading-tight">{{ c.bank_name }}</h3>
                <span class="text-xs font-mono font-medium text-slate-500">N° {{ c.account_number }}</span>
              </div>
            </div>
            <span 
              class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              :class="c.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'">
              {{ c.is_active ? c.account_type_label : 'Inactiva' }}
            </span>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Cuenta Contable:</span>
              <span class="font-mono font-semibold text-slate-700 text-right truncate max-w-[180px]" :title="c.account_code + ' - ' + c.account_name">
                {{ c.account_code }} - {{ c.account_name }}
              </span>
            </div>
            <div v-if="c.company_code" class="flex justify-between items-center">
              <span class="text-slate-400">Cód. Convenio Banco:</span>
              <span class="font-mono font-semibold text-slate-700">{{ c.company_code }}</span>
            </div>
            <div v-if="c.description" class="text-slate-500 italic mt-1">
              "{{ c.description }}"
            </div>
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Saldo Contable</div>
            <div class="text-lg font-bold font-mono text-slate-800" :class="{'text-rose-600': c.current_balance < 0}">
              {{ formatCurrency(c.current_balance) }}
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button 
              @click="abrirModalEditar(c)" 
              class="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Editar Cuenta">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button 
              v-if="c.is_active"
              @click="desactivarCuenta(c)" 
              class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Desactivar Cuenta">
              <i class="fa-solid fa-ban"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-xl mx-auto space-y-4">
      <div class="w-16 h-16 bg-blue-50 text-brand-600 rounded-2xl mx-auto flex items-center justify-center text-2xl border border-blue-100">
        <i class="fa-solid fa-landmark"></i>
      </div>
      <h2 class="text-xl font-bold text-slate-800">No hay cuentas bancarias registradas</h2>
      <p class="text-slate-500 text-sm">
        Para utilizar el generador de Cash Management y la Conciliación Bancaria Automática, agregue las cuentas corrientes o de ahorros de su empresa.
      </p>
      <button 
        @click="abrirModalCrear" 
        class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 shadow-sm">
        <i class="fa-solid fa-plus text-xs"></i> Agregar Primera Cuenta
      </button>
    </div>

    <!-- Modal Formulario Cuenta Bancaria -->
    <div v-if="modalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
            <i class="fa-solid fa-building-columns text-brand-500"></i>
            {{ form.id ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria' }}
          </h3>
          <button @click="modalVisible = false" class="text-slate-400 hover:text-slate-600 p-1">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form @submit.prevent="guardarCuenta" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Entidad Bancaria *</label>
            <input 
              type="text" 
              v-model="form.bank_name" 
              list="bancos-ec"
              required 
              placeholder="Ej. Banco Pichincha, Banco Guayaquil, Produbanco..."
              class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            <datalist id="bancos-ec">
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
              <option value="Cooperativa Policía Nacional" />
              <option value="Cooperativa Alianza del Valle" />
            </datalist>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Cuenta *</label>
              <select 
                v-model="form.account_type" 
                required 
                class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                <option value="corriente">Cuenta Corriente</option>
                <option value="ahorros">Cuenta de Ahorros</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Número de Cuenta *</label>
              <input 
                type="text" 
                v-model="form.account_number" 
                required 
                placeholder="Ej. 2100123456"
                class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Cuenta Contable enlazada (Plan de Cuentas) *</label>
            <select 
              v-model="form.account_id" 
              required 
              class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white font-mono">
              <option :value="null" disabled>-- Seleccione la cuenta de activo/bancos --</option>
              <option v-for="cta in catalogoCuentas" :key="cta.id" :value="cta.id">
                {{ cta.code }} - {{ cta.name }}
              </option>
            </select>
            <p class="text-[11px] text-slate-400 mt-1">
              Todos los movimientos de esta cuenta bancaria afectarán automáticamente esta partida contable.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Cód. Convenio Cash Management</label>
              <input 
                type="text" 
                v-model="form.company_code" 
                placeholder="Ej. 12345 (Opcional)"
                class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Moneda</label>
              <input 
                type="text" 
                v-model="form.currency" 
                disabled
                class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 font-mono outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción / Alias</label>
            <input 
              type="text" 
              v-model="form.description" 
              placeholder="Ej. Cuenta Principal Matriz, Nómina, Recaudaciones..."
              class="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              @click="modalVisible = false" 
              class="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="saving"
              class="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
              <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ saving ? 'Guardando...' : (form.id ? 'Actualizar Cuenta' : 'Guardar Cuenta') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/shared/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const cuentas = ref([])
const catalogoCuentas = ref([])
const modalVisible = ref(false)

const form = ref({
  id: null,
  bank_name: '',
  bank_code: '',
  account_number: '',
  account_type: 'corriente',
  currency: 'USD',
  account_id: null,
  company_code: '',
  description: '',
  is_active: true
})

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const fetchCuentasBancarias = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/contabilidad/bancos/')
    cuentas.value = data
  } catch (error) {
    console.error('Error fetching bank accounts', error)
    toast.error('Error al cargar las cuentas bancarias')
  } finally {
    loading.value = false
  }
}

const fetchCatalogoCuentas = async () => {
  try {
    const { data } = await api.get('/contabilidad/cuentas/')
    // Filtrar cuentas de tipo 'is_active' (Activos)
    catalogoCuentas.value = (data || []).filter(c => c.type === 'is_active')
  } catch (error) {
    console.error('Error fetching accounting accounts', error)
  }
}

const abrirModalCrear = () => {
  form.value = {
    id: null,
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_type: 'corriente',
    currency: 'USD',
    account_id: null,
    company_code: '',
    description: '',
    is_active: true
  }
  modalVisible.value = true
}

const abrirModalEditar = (c) => {
  form.value = {
    id: c.id,
    bank_name: c.bank_name,
    bank_code: c.bank_code,
    account_number: c.account_number,
    account_type: c.account_type,
    currency: c.currency || 'USD',
    account_id: c.account_id,
    company_code: c.company_code || '',
    description: c.description || '',
    is_active: c.is_active
  }
  modalVisible.value = true
}

const guardarCuenta = async () => {
  saving.value = true
  try {
    if (form.value.id) {
      await api.put(`/contabilidad/bancos/${form.value.id}/`, form.value)
      toast.success('Cuenta bancaria actualizada con éxito')
    } else {
      await api.post('/contabilidad/bancos/', form.value)
      toast.success('Cuenta bancaria registrada con éxito')
    }
    modalVisible.value = false
    await fetchCuentasBancarias()
  } catch (error) {
    console.error('Error saving bank account', error)
    toast.error(error.response?.data?.error || 'Error al guardar cuenta bancaria')
  } finally {
    saving.value = false
  }
}

const desactivarCuenta = async (c) => {
  if (!confirm(`¿Está seguro de desactivar la cuenta ${c.bank_name} ${c.account_number}?`)) return
  try {
    await api.delete(`/contabilidad/bancos/${c.id}/`)
    toast.success('Cuenta bancaria desactivada')
    await fetchCuentasBancarias()
  } catch (error) {
    console.error('Error disabling bank account', error)
    toast.error('Error al desactivar cuenta')
  }
}

onMounted(() => {
  fetchCuentasBancarias()
  fetchCatalogoCuentas()
})
</script>
