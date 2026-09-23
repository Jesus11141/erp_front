<template>
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-scale-up">
      <div class="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-user-edit text-brand-500"></i>
          {{ isNew ? 'Nuevo Cliente' : 'Editar Cliente' }}
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-rose-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-5 space-y-4">
        <div v-if="!isNew" class="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium mb-2">
          <input type="checkbox" id="updateCustModal" v-model="localUpdateCustomer" @change="emitUpdateFlag" class="accent-brand-500 w-3.5 h-3.5">
          <label for="updateCustModal" class="cursor-pointer">Actualizar datos permanentemente en la base de datos al cobrar</label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo Doc.</label>
            <select v-model="localForm.tipo_id" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors">
              <option value="04">RUC</option>
              <option value="05">Cédula</option>
              <option value="06">Pasaporte</option>
              <option value="07">Consumidor Final</option>
              <option value="08">Identificación Exterior</option>
            </select>
          </div>
          
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Identificación</label>
            <input v-model="localForm.identification" type="text" placeholder="Cédula/RUC" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors">
          </div>

          <div class="col-span-2">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Razón Social / Nombre Completo</label>
            <input v-model="localForm.name" type="text" placeholder="Nombre completo" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors">
          </div>

          <div class="col-span-2">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
            <input v-model="localForm.email" type="email" placeholder="cliente@correo.com" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors">
          </div>

          <div class="col-span-2">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dirección</label>
            <input v-model="localForm.address" type="text" placeholder="Dirección completa" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors">
          </div>
        </div>
      </div>

      <div class="bg-slate-50 px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
        <button @click="$emit('close')" class="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
          Cancelar
        </button>
        <button @click="save" class="px-5 py-2 text-sm font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-lg shadow-md shadow-brand-500/20 transition-all active:scale-95">
          Aceptar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  updateCustomer: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'update:form', 'update:updateCustomer'])

const localForm = ref({ ...props.form })
const localUpdateCustomer = ref(props.updateCustomer)

// Is new if it doesn't have an ID and is not Consumer Final default ID
const isNew = ref(!props.form.id && props.form.identification !== '9999999999999')

watch(() => props.form, (newVal) => {
  localForm.value = { ...newVal }
  isNew.value = !newVal.id && newVal.identification !== '9999999999999'
}, { deep: true })

watch(() => props.updateCustomer, (newVal) => {
  localUpdateCustomer.value = newVal
})

function emitUpdateFlag() {
  emit('update:updateCustomer', localUpdateCustomer.value)
}

function save() {
  emit('update:form', localForm.value)
  emit('close')
}
</script>
