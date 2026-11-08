<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-users text-brand-500"></i> Clientes
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Directorio de clientes para emisión de facturas electrónicas, notas de venta y cobranzas.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          class="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 whitespace-nowrap" 
          @click="mostrarModalImportar = true">
          <i class="fa-solid fa-file-excel text-emerald-600"></i> Importar Excel
        </button>
        <button 
          class="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 whitespace-nowrap" 
          @click="abrirNuevoCliente">
          <i class="fa-solid fa-user-plus"></i> Nuevo Cliente
        </button>
      </div>
    </div>

    <!-- Barra de Búsqueda -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="busqueda" 
          class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
          placeholder="Buscar por nombre, RUC o email..." 
        />
      </div>
      <span class="text-xs text-slate-500 font-semibold hidden sm:inline">
        {{ clientesFiltrados.length }} clientes encontrados
      </span>
    </div>

    <!-- Tabla de Clientes -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div v-if="cargando" class="p-0">
        <TableSkeleton :rows="5" :has-avatar="true" :has-badge="false" :has-actions="false" />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th class="p-4">Cliente</th>
              <th class="p-4 w-40">RUC / Cédula</th>
              <th class="p-4 w-48">Teléfono</th>
              <th class="p-4">Email</th>
              <th class="p-4">Dirección</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr v-for="c in clientesFiltrados" :key="c.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="p-4 font-semibold text-slate-800">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs border border-brand-100">
                    {{ (c.name || 'C').charAt(0).toUpperCase() }}
                  </div>
                  <span>{{ c.name }}</span>
                </div>
              </td>
              <td class="p-4 font-mono text-slate-600 font-medium">
                {{ c.rfc || c.identification || '-' }}
              </td>
              <td class="p-4 text-slate-600">
                {{ c.phone || '-' }}
              </td>
              <td class="p-4 text-slate-600">
                {{ c.email || '-' }}
              </td>
              <td class="p-4 text-slate-500 text-xs">
                {{ c.address || '-' }}
              </td>
            </tr>
            <tr v-if="!clientesFiltrados.length">
              <td colspan="5" class="p-0 border-none">
                <EmptyState 
                  :icon="busqueda ? 'fa-solid fa-user-xmark' : 'fa-solid fa-users'"
                  :icon-color="busqueda ? 'text-amber-500' : 'text-brand-500'"
                  :icon-bg="busqueda ? 'bg-amber-50' : 'bg-brand-50'"
                  :title="busqueda ? 'Sin resultados para la búsqueda' : 'Aún no tienes clientes registrados'"
                  :description="busqueda ? `No encontramos ningún cliente que coincida con '${busqueda}'. Intenta con otro término o limpia el filtro.` : 'Registra tus clientes habituales para facturarles en segundos desde el punto de venta o el módulo de facturación.'"
                  :action-text="busqueda ? '' : '+ Nuevo Cliente'"
                  :secondary-action-text="busqueda ? 'Limpiar Búsqueda' : ''"
                  action-icon="fa-solid fa-user-plus"
                  secondary-action-icon="fa-solid fa-rotate-left"
                  @action="abrirNuevoCliente"
                  @secondary-action="busqueda = ''"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nuevo Cliente -->
    <div 
      v-if="mostrarForm" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" 
      @click.self="mostrarForm = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-sm border border-brand-100">
              <i class="fa-solid fa-user-plus"></i>
            </div>
            Nuevo Cliente
          </h3>
          <button @click="mostrarForm = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="guardar" class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre Completo o Razón Social *</label>
            <input 
              v-model="form.name" 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
              placeholder="Ej: Juan Pérez o Distribuidora S.A." 
              required 
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">RUC / Cédula</label>
              <input 
                v-model="form.rfc" 
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
                placeholder="Ej: 1790012345001" 
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Teléfono</label>
              <input 
                v-model="form.phone" 
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
                placeholder="Ej: 0991234567" 
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Correo Electrónico (para RIDE y XML)</label>
            <input 
              v-model="form.email" 
              type="email" 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
              placeholder="cliente@ejemplo.com" 
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Dirección</label>
            <input 
              v-model="form.address" 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
              placeholder="Av. Principal y Secundaria..." 
            />
          </div>

          <p v-if="error" class="text-rose-600 text-xs font-semibold">⚠️ {{ error }}</p>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors" 
              @click="mostrarForm = false">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-sm"
              :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Cliente' }}
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- Modal Importación Masiva Excel -->
    <ExcelImportModal
      :show="mostrarModalImportar"
      entity="clientes"
      title="Importar Clientes Masivamente"
      description="Cargue su cartera de clientes con cédula/RUC, email y dirección desde un archivo Excel."
      icon="fa-users"
      @close="mostrarModalImportar = false"
      @success="cargarClientes"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../../shared/api'
import { useToast } from 'vue-toastification'
import EmptyState from '@/components/EmptyState.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import ExcelImportModal from '@/shared/components/ExcelImportModal.vue'

const toast = useToast()
const customers = ref([])
const busqueda = ref('')
const mostrarForm = ref(false)
const mostrarModalImportar = ref(false)
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')
const form = ref({ name: '', email: '', phone: '', rfc: '', address: '' })

const clientesFiltrados = computed(() => {
  if (!busqueda.value.trim()) return customers.value
  const q = busqueda.value.toLowerCase().trim()
  return customers.value.filter(c => 
    (c.name || '').toLowerCase().includes(q) ||
    (c.rfc || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  )
})

const abrirNuevoCliente = () => {
  form.value = { name: '', email: '', phone: '', rfc: '', address: '' }
  error.value = ''
  mostrarForm.value = true
}

const cargarClientes = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/ventas/customers/')
    customers.value = data
  } catch (e) {
    console.error('Error fetching customers', e)
    toast.error('Error al cargar clientes')
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  error.value = ''
  if (!form.value.name.trim()) { 
    error.value = 'El nombre es requerido'
    return 
  }
  
  guardando.value = true
  try {
    const { data } = await api.post('/ventas/customers/', form.value)
    customers.value.unshift({ ...form.value, id: data.id })
    toast.success('Cliente registrado exitosamente')
    mostrarForm.value = false
    form.value = { name: '', email: '', phone: '', rfc: '', address: '' }
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al guardar el cliente'
    toast.error(error.value)
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarClientes()
})
</script>
