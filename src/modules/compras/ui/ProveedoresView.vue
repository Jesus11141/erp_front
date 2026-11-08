<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-truck-field text-brand-500"></i> Proveedores
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Directorio y catálogo oficial de proveedores para compras, órdenes y abastecimiento.
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
          @click="abrirNuevoProveedor">
          <i class="fa-solid fa-plus"></i> Nuevo Proveedor
        </button>
      </div>
    </div>

    <!-- Stats / Resumen Rápido -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Proveedores</span>
          <p class="text-2xl font-bold text-slate-800 mt-1 font-mono">{{ proveedores.length }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-building"></i>
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proveedores Activos</span>
          <p class="text-2xl font-bold text-emerald-600 mt-1 font-mono">{{ proveedoresActivos }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-check"></i>
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Con Crédito Habilitado</span>
          <p class="text-2xl font-bold text-amber-600 mt-1 font-mono">{{ proveedoresConCredito }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
      </div>
    </div>

    <!-- Barra de Búsqueda -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="busqueda" 
          class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
          placeholder="Buscar por RUC, nombre o email..." 
        />
      </div>
      <span class="text-xs text-slate-500 font-semibold hidden sm:inline">
        {{ proveedoresFiltrados.length }} proveedores encontrados
      </span>
    </div>

    <!-- Tabla de Proveedores -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div v-if="cargando" class="p-0">
        <TableSkeleton :rows="6" :has-avatar="true" :has-badge="true" :has-actions="true" />
      </div>

      <div v-else-if="proveedoresFiltrados.length === 0" class="p-16 text-center text-slate-400">
        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <i class="fa-solid fa-truck-ramp-box text-2xl text-slate-300"></i>
        </div>
        <h3 class="text-base font-bold text-slate-700">No hay proveedores registrados</h3>
        <p class="text-sm text-slate-500 mt-1">Registra tu primer proveedor para compras y órdenes.</p>
        <button @click="abrirNuevoProveedor" class="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all shadow-sm">
          + Crear Proveedor
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th class="p-4">Razón Social / Proveedor</th>
              <th class="p-4 w-36">RUC / Cédula</th>
              <th class="p-4">Contacto</th>
              <th class="p-4 w-44">Cuenta Bancaria</th>
              <th class="p-4 w-28">Crédito</th>
              <th class="p-4 w-24 text-center">Estado</th>
              <th class="p-4 w-24 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr v-for="p in proveedoresFiltrados" :key="p.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="p-4 font-semibold text-slate-800">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                    {{ (p.business_name || 'P').charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="block">{{ p.business_name }}</span>
                    <span v-if="p.commercial_name" class="text-xs text-slate-400 font-normal">{{ p.commercial_name }}</span>
                  </div>
                </div>
              </td>
              <td class="p-4 font-mono text-slate-700 font-medium">
                {{ p.identification }}
              </td>
              <td class="p-4 text-slate-600">
                <div class="space-y-0.5 text-xs">
                  <p v-if="p.email"><i class="fa-solid fa-envelope mr-1 text-slate-400"></i>{{ p.email }}</p>
                  <p v-if="p.phone"><i class="fa-solid fa-phone mr-1 text-slate-400"></i>{{ p.phone }}</p>
                  <p v-if="p.address" class="text-slate-400 truncate max-w-xs"><i class="fa-solid fa-location-dot mr-1"></i>{{ p.address }}</p>
                </div>
              </td>
              <td class="p-4 text-xs">
                <div v-if="p.bank_name && p.bank_account_number" class="space-y-0.5">
                  <div class="font-semibold text-slate-700 flex items-center gap-1">
                    <i class="fa-solid fa-building-columns text-brand-500 text-[10px]"></i>
                    {{ p.bank_name }}
                  </div>
                  <div class="font-mono text-slate-500">
                    <span class="text-[10px] font-bold uppercase text-slate-400 mr-1">{{ p.bank_account_type === 'CTE' ? 'Cte' : 'Aho' }}</span>
                    {{ p.bank_account_number }}
                  </div>
                </div>
                <span v-else class="text-slate-400 italic text-[11px]">
                  <i class="fa-solid fa-circle-exclamation text-amber-500 mr-0.5"></i> Sin cuenta
                </span>
              </td>
              <td class="p-4">
                <span v-if="p.credit_days > 0" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  {{ p.credit_days }} días
                </span>
                <span v-else class="text-xs text-slate-400">Contado</span>
              </td>
              <td class="p-4 text-center">
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                  :class="p.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                  {{ p.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="p-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <button 
                    @click="abrirEditarProveedor(p)" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors" 
                    title="Editar">
                    <i class="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button 
                    @click="eliminarProveedor(p)" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" 
                    title="Eliminar">
                    <i class="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Formulario Proveedor -->
    <div v-if="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="mostrarModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-sm border border-brand-100">
              <i class="fa-solid" :class="form.id ? 'fa-pen' : 'fa-building'"></i>
            </div>
            {{ form.id ? 'Editar Proveedor' : 'Nuevo Proveedor' }}
          </h3>
          <button @click="mostrarModal = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="guardarProveedor" class="p-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Tipo Doc.</label>
              <select v-model="form.id_type" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                <option value="04">RUC</option>
                <option value="05">Cédula</option>
                <option value="06">Pasaporte</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Identificación *</label>
              <input 
                v-model="form.identification" 
                type="text" 
                required 
                placeholder="Ej: 1790012345001" 
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
              />
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Razón Social *</label>
            <input 
              v-model="form.business_name" 
              type="text" 
              required 
              placeholder="Ej: Distribuidora Nacional S.A." 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Nombre Comercial</label>
            <input 
              v-model="form.commercial_name" 
              type="text" 
              placeholder="Ej: Disnacional" 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Email</label>
              <input 
                v-model="form.email" 
                type="email" 
                placeholder="ventas@proveedor.com" 
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Teléfono</label>
              <input 
                v-model="form.phone" 
                type="text" 
                placeholder="0991234567" 
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Días de Crédito</label>
              <input 
                v-model.number="form.credit_days" 
                type="number" 
                min="0" 
                placeholder="0 = Contado" 
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
              />
            </div>
            <div class="flex items-center gap-2 pt-6">
              <input type="checkbox" id="prov-active" v-model="form.active" class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
              <label for="prov-active" class="text-sm font-medium text-slate-700">Proveedor Activo</label>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Dirección</label>
            <textarea 
              v-model="form.address" 
              rows="2" 
              placeholder="Dirección o bodega del proveedor..." 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
            ></textarea>
          </div>

          <!-- Datos Bancarios (Cash Management) -->
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <i class="fa-solid fa-building-columns text-brand-600"></i> Datos Bancarios (Cash Management)
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="text-[11px] font-semibold text-slate-600 uppercase block mb-1">Banco Destino</label>
                <input 
                  v-model="form.bank_name" 
                  list="bancos-ecuador-list"
                  type="text" 
                  placeholder="Ej: Banco Pichincha, Produbanco..." 
                  class="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
                />
                <datalist id="bancos-ecuador-list">
                  <option value="Banco Pichincha" />
                  <option value="Banco Guayaquil" />
                  <option value="Produbanco" />
                  <option value="Banco Bolivariano" />
                  <option value="Banco del Pacífico" />
                  <option value="Banco Internacional" />
                  <option value="Banco del Austro" />
                  <option value="Cooperativa JEP" />
                  <option value="Mutualista Pichincha" />
                </datalist>
              </div>
              <div>
                <label class="text-[11px] font-semibold text-slate-600 uppercase block mb-1">Tipo Cuenta</label>
                <select v-model="form.bank_account_type" class="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                  <option value="AHO">Ahorros</option>
                  <option value="CTE">Corriente</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-[11px] font-semibold text-slate-600 uppercase block mb-1">Número de Cuenta</label>
              <input 
                v-model="form.bank_account_number" 
                type="text" 
                placeholder="Ej: 2200123456" 
                class="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] font-semibold text-slate-600 uppercase block mb-1">Titular Cuenta (Opcional)</label>
                <input 
                  v-model="form.beneficiary_name" 
                  type="text" 
                  placeholder="Dejar vacío si es el mismo" 
                  class="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
                />
              </div>
              <div>
                <label class="text-[11px] font-semibold text-slate-600 uppercase block mb-1">Cédula/RUC Titular (Opcional)</label>
                <input 
                  v-model="form.beneficiary_id" 
                  type="text" 
                  placeholder="Dejar vacío si es el mismo" 
                  class="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
                />
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors" @click="mostrarModal = false">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50" 
              :disabled="guardando">
              <i v-if="guardando" class="fa-solid fa-spinner fa-spin"></i>
              {{ guardando ? 'Guardando...' : (form.id ? 'Actualizar' : 'Guardar Proveedor') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Importación Masiva Excel -->
    <ExcelImportModal
      :show="mostrarModalImportar"
      entity="proveedores"
      title="Importar Proveedores Masivamente"
      description="Cargue su catálogo de proveedores con RUC, datos bancarios para transferencias y días de crédito desde Excel."
      icon="fa-truck-field"
      @close="mostrarModalImportar = false"
      @success="cargarProveedores"
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
const proveedores = ref([])
const cargando = ref(true)
const guardando = ref(false)
const busqueda = ref('')
const mostrarModal = ref(false)
const mostrarModalImportar = ref(false)

const form = ref({
  id: null,
  identification: '',
  id_type: '04',
  business_name: '',
  commercial_name: '',
  email: '',
  phone: '',
  address: '',
  credit_days: 0,
  active: true,
  bank_name: '',
  bank_account_type: 'AHO',
  bank_account_number: '',
  beneficiary_name: '',
  beneficiary_id: '',
})

const proveedoresFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return proveedores.value
  return proveedores.value.filter(p => 
    (p.business_name || '').toLowerCase().includes(q) ||
    (p.commercial_name || '').toLowerCase().includes(q) ||
    (p.identification || '').includes(q) ||
    (p.email || '').toLowerCase().includes(q) ||
    (p.bank_name || '').toLowerCase().includes(q)
  )
})

const proveedoresActivos = computed(() => proveedores.value.filter(p => p.active).length)
const proveedoresConCredito = computed(() => proveedores.value.filter(p => p.credit_days > 0).length)

const fetchProveedores = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/compras/proveedores/')
    proveedores.value = data
  } catch (error) {
    console.error('Error cargando proveedores:', error)
    toast.error('Error al cargar catálogo de proveedores')
  } finally {
    cargando.value = false
  }
}

const abrirNuevoProveedor = () => {
  form.value = {
    id: null,
    identification: '',
    id_type: '04',
    business_name: '',
    commercial_name: '',
    email: '',
    phone: '',
    address: '',
    credit_days: 0,
    active: true,
    bank_name: '',
    bank_account_type: 'AHO',
    bank_account_number: '',
    beneficiary_name: '',
    beneficiary_id: '',
  }
  mostrarModal.value = true
}

const abrirEditarProveedor = (p) => {
  form.value = { 
    ...p,
    bank_name: p.bank_name || '',
    bank_account_type: p.bank_account_type || 'AHO',
    bank_account_number: p.bank_account_number || '',
    beneficiary_name: p.beneficiary_name || '',
    beneficiary_id: p.beneficiary_id || '',
  }
  mostrarModal.value = true
}

const guardarProveedor = async () => {
  guardando.value = true
  try {
    if (form.value.id) {
      await api.put(`/compras/proveedores/${form.value.id}/`, form.value)
      toast.success('Proveedor actualizado exitosamente')
    } else {
      await api.post('/compras/proveedores/', form.value)
      toast.success('Proveedor registrado exitosamente')
    }
    mostrarModal.value = false
    await fetchProveedores()
  } catch (error) {
    console.error('Error guardando proveedor:', error)
    toast.error(error.response?.data?.error || 'Error al guardar proveedor')
  } finally {
    guardando.value = false
  }
}

const eliminarProveedor = async (p) => {
  if (!confirm(`¿Estás seguro de eliminar al proveedor "${p.business_name}"?`)) return
  try {
    await api.delete(`/compras/proveedores/${p.id}/`)
    toast.success('Proveedor eliminado correctamente')
    await fetchProveedores()
  } catch (error) {
    console.error('Error eliminando proveedor:', error)
    toast.error(error.response?.data?.error || 'No se pudo eliminar el proveedor')
  }
}

onMounted(() => {
  fetchProveedores()
})
</script>
