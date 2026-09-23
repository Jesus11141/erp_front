<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-slate-800">
          <i class="fa-solid fa-search text-brand-600 mr-2"></i> Consultar RUC
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>
      
      <p class="text-sm text-slate-600 mb-6">
        Ingresa el RUC de la empresa para extraer su perfil público desde el SRI automáticamente.
      </p>

      <form @submit.prevent="saveCredentials">
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1">RUC de la Empresa</label>
          <input type="text" v-model="ruc" required maxlength="13" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" placeholder="Ej: 1790012345001" />
        </div>

        <div class="flex justify-end gap-3">
          <button type="button" @click="$emit('close')" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium border border-slate-300">
            Cancelar
          </button>
          <button type="submit" :disabled="loading" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-50">
            <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
            Guardar RUC
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['close', 'saved'])

const ruc = ref('')
const loading = ref(false)

const saveCredentials = async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:8000/api/accounting/sri-credentials/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ruc: ruc.value, password: '' })
    })
    
    if (res.ok) {
      emit('saved')
      emit('close')
    } else {
      const err = await res.json()
      alert('Error: ' + err.message)
    }
  } catch (error) {
    console.error(error)
    alert('Error al conectar con el servidor')
  } finally {
    loading.value = false
  }
}
</script>
