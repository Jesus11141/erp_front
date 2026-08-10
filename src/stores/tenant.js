import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../shared/api'

export const useTenantStore = defineStore('tenant', () => {
  const tenant = ref(null)
  const cargando = ref(true)

  let cargarPromise = null

  async function cargar() {
    if (cargarPromise) return cargarPromise
    cargarPromise = (async () => {
      try {
        const { data } = await api.get('/tenant/config/')
        tenant.value = data
        document.documentElement.style.setProperty('--color-primario', data.primary_color)
        document.documentElement.style.setProperty('--color-secundario', data.secondary_color)
      } catch {
        tenant.value = null
      } finally {
        cargando.value = false
        cargarPromise = null
      }
    })()
    return cargarPromise
  }

  function tieneModulo(modulo) {
    return tenant.value?.modules?.includes(modulo) ?? false
  }

  return { tenant, cargando, cargar, tieneModulo }
})
