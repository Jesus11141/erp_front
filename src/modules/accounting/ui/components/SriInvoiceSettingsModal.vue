<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-slate-800">
          <i class="fa-solid fa-key text-brand-600 mr-2"></i> Credenciales SRI
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>
      
      <p class="text-sm text-slate-600 mb-6">
        Ingresa el RUC y tu clave del SRI para extraer y descargar las facturas.
      </p>

      <form @submit.prevent="saveCredentials">
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-1">RUC de la Empresa</label>
          <input type="text" v-model="ruc" required maxlength="13" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" placeholder="Ej: 1790012345001" />
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1">Contraseña SRI</label>
          <div class="relative">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all pr-10" placeholder="Ingresa tu contraseña" />
            <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600">
              <i class="fa-solid" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button type="button" @click="$emit('close')" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium border border-slate-300">
            Cancelar
          </button>
          <button type="submit" :disabled="loading" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-50">
            <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
            Guardar Credenciales
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
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const saveCredentials = async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:8000/api/accounting/sri-credentials/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ruc: ruc.value, password: password.value })
    })
    
    if (res.ok) {
      alert('Credenciales guardadas. Ahora puedes extraer las facturas.')
      emit('saved')
      emit('close')
    } else {
      const err = await res.json()
      alert('Error: ' + err.message)
    }
  } catch (e) {
    console.error(e)
    alert('Error de conexión al guardar credenciales')
  } finally {
    loading.value = false
  }
}
</script>
