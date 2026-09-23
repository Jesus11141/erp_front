<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-building-user text-brand-500"></i> Centros de Costos
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Gestiona las áreas, proyectos o departamentos para la asignación analítica de gastos y compras.
        </p>
      </div>
      <button 
        @click="abrirModal()" 
        class="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 whitespace-nowrap">
        <i class="fa-solid fa-plus"></i> Nuevo Centro
      </button>
    </div>

    <!-- Tabla Principal -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-bold text-slate-700">Listado de Centros</h3>
          <span class="text-xs bg-slate-200/70 text-slate-600 font-mono px-2 py-0.5 rounded-full font-semibold">
            {{ centros.length }} registrados
          </span>
        </div>
        <button @click="cargarCentros" class="text-slate-400 hover:text-brand-500 transition-colors p-1" title="Actualizar">
          <i class="fa-solid fa-rotate-right" :class="{'fa-spin': cargando}"></i>
        </button>
      </div>

      <div v-if="cargando" class="p-12 text-center text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-brand-500"></i>
        <p class="text-sm font-medium">Cargando centros de costos...</p>
      </div>

      <div v-else-if="centros.length === 0" class="p-16 text-center text-slate-400">
        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <i class="fa-solid fa-building text-2xl text-slate-300"></i>
        </div>
        <h3 class="text-base font-bold text-slate-700">No tienes centros de costos creados</h3>
        <p class="text-sm text-slate-500 mt-1">Crea tu primer centro (ej: Ventas, Administración, Sucursal Norte) para clasificar gastos.</p>
        <button 
          @click="abrirModal()" 
          class="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all shadow-sm">
          + Crear Centro
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th class="p-4 w-40">Código</th>
              <th class="p-4">Nombre del Centro</th>
              <th class="p-4">Descripción</th>
              <th class="p-4 w-32 text-center">Estado</th>
              <th class="p-4 w-24 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr v-for="cc in centros" :key="cc.id" class="hover:bg-slate-50/80 transition-colors group">
              <td class="p-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                {{ cc.code }}
              </td>
              <td class="p-4 font-semibold text-slate-800">
                {{ cc.name }}
              </td>
              <td class="p-4 text-slate-500 text-xs">
                {{ cc.description || 'Sin descripción' }}
              </td>
              <td class="p-4 text-center">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                  :class="cc.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                  {{ cc.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="p-4 text-right whitespace-nowrap">
                <button 
                  @click="abrirModal(cc)" 
                  class="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  title="Editar">
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Formulario -->
    <div 
      v-if="mostrarModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" 
      @click.self="cerrarModal">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-sm border border-brand-100">
              <i class="fa-solid" :class="editando ? 'fa-pen' : 'fa-plus'"></i>
            </div>
            {{ editando ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo' }}
          </h3>
          <button @click="cerrarModal" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="guardar" class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Código del Centro *</label>
            <input 
              v-model="form.code" 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
              placeholder="Ej: 100 o CC-ADMIN" 
              required 
            />
            <p class="text-[11px] text-slate-400">Identificador único dentro de la empresa.</p>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre del Centro *</label>
            <input 
              v-model="form.name" 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
              placeholder="Ej: Ventas y Mercadeo, Sucursal Cumbayá..." 
              required 
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Descripción (Opcional)</label>
            <textarea 
              v-model="form.description" 
              rows="3" 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
              placeholder="Notas o alcance de este centro de costos..."></textarea>
          </div>

          <div v-if="editando" class="pt-2">
            <label class="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input type="checkbox" v-model="form.is_active" class="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
              <span>Centro de Costo Activo</span>
            </label>
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors" 
              @click="cerrarModal">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50" 
              :disabled="guardando">
              <i v-if="guardando" class="fa-solid fa-spinner fa-spin"></i>
              {{ guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Guardar') }}
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
const centros = ref([])
const cargando = ref(false)
const mostrarModal = ref(false)
const editando = ref(false)
const guardando = ref(false)

const form = ref({
  id: null,
  code: '',
  name: '',
  description: '',
  is_active: true
})

const cargarCentros = async () => {
  cargando.value = true
  try {
    const res = await api.get('/contabilidad/centros-costos/')
    centros.value = res.data
  } catch (error) {
    console.error('Error fetching centros de costos', error)
    toast.error('Error al cargar centros de costos')
  } finally {
    cargando.value = false
  }
}

const abrirModal = (cc = null) => {
  if (cc) {
    editando.value = true
    form.value = { ...cc }
  } else {
    editando.value = false
    form.value = { id: null, code: '', name: '', description: '', is_active: true }
  }
  mostrarModal.value = true
}

const cerrarModal = () => {
  mostrarModal.value = false
}

const guardar = async () => {
  if (!form.value.code || !form.value.name) {
    toast.warning('Código y nombre son obligatorios')
    return
  }

  guardando.value = true
  try {
    if (editando.value) {
      await api.put(`/contabilidad/centros-costos/${form.value.id}/`, form.value)
      toast.success('Centro de costo actualizado correctamente')
    } else {
      await api.post('/contabilidad/centros-costos/', form.value)
      toast.success('Centro de costo creado exitosamente')
    }
    cerrarModal()
    cargarCentros()
  } catch (error) {
    console.error('Error saving centro de costo', error)
    toast.error(error.response?.data?.error || 'Error al guardar el centro de costo')
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarCentros()
})
</script>
