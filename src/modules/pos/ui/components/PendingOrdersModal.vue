<template>
  <div v-if="show" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div class="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-900 flex items-center gap-2">
                <i class="fa-solid" :class="tipoLista === 'pendientes' ? 'fa-file-invoice text-amber-500' : 'fa-file-contract text-indigo-500'"></i> 
                {{ tipoLista === 'pendientes' ? 'Pre-Facturas Pendientes' : 'Cotizaciones Guardadas' }}
            </h3>
            <button @click="$emit('close')" class="text-slate-600 hover:text-slate-900 text-sm"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-4 overflow-y-auto flex-1 bg-white">
            <div v-if="cargandoOrdenes" class="text-center py-8 text-slate-400">
                <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Cargando órdenes...</p>
            </div>
            <div v-else-if="ordenesPendientesList.length === 0" class="text-center py-8 text-slate-400">
                <i class="fa-solid fa-folder-open text-4xl mb-3 opacity-30"></i>
                <p>{{ tipoLista === 'pendientes' ? 'No hay pre-facturas pendientes.' : 'No hay cotizaciones guardadas.' }}</p>
            </div>
            <table v-else class="w-full text-left text-sm">
                <thead>
                    <tr class="text-xs text-slate-500 border-b border-slate-200">
                        <th class="pb-2 font-semibold">Fecha</th>
                        <th class="pb-2 font-semibold">Cliente</th>
                        <th class="pb-2 font-semibold text-right">Total</th>
                        <th class="pb-2 font-semibold text-center">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="orden in ordenesPendientesList" :key="orden.id" class="border-b border-slate-100 hover:bg-slate-50">
                        <td class="py-3 text-slate-600">{{ orden.date }}</td>
                        <td class="py-3 font-medium text-slate-900">{{ orden.customer_name || orden.customer }}</td>
                        <td class="py-3 text-right font-bold text-slate-900">${{ parseFloat(orden.total).toFixed(2) }}</td>
                        <td class="py-3 text-center">
                            <div class="flex items-center justify-center space-x-2">
                                <button @click="$emit('cargar', orden)" class="bg-brand-100 text-brand-700 hover:bg-brand-200 px-3 py-1 rounded text-xs font-bold transition-colors">
                                    {{ tipoLista === 'pendientes' ? 'Cobrar' : 'Cargar' }}
                                </button>
                                <button @click="$emit('eliminar', orden.id)" class="text-rose-500 hover:text-rose-700 p-1 transition-colors" title="Eliminar">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="p-4 bg-white border-t border-slate-200 flex justify-end">
            <button @click="$emit('close')" class="bg-slate-100 hover:bg-slate-700 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold">Cerrar</button>
        </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  tipoLista: {
    type: String,
    default: 'pendientes'
  },
  cargandoOrdenes: {
    type: Boolean,
    default: false
  },
  ordenesPendientesList: {
    type: Array,
    default: () => []
  }
})

defineEmits(['close', 'cargar', 'eliminar'])
</script>
