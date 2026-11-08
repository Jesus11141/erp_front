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
        if (data.primary_color) {
          document.documentElement.style.setProperty('--color-primario', data.primary_color)
        }
        if (data.secondary_color) {
          document.documentElement.style.setProperty('--color-secundario', data.secondary_color)
        }
      } catch (err) {
        // Si falló y hay un token potencialmente corrupto/expirado en localStorage, limpiarlo y reintentar
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token')
          localStorage.removeItem('usuario')
          try {
            const { data } = await api.get('/tenant/config/')
            tenant.value = data
            if (data.primary_color) {
              document.documentElement.style.setProperty('--color-primario', data.primary_color)
            }
            if (data.secondary_color) {
              document.documentElement.style.setProperty('--color-secundario', data.secondary_color)
            }
            return
          } catch {
            tenant.value = null
          }
        } else {
          tenant.value = null
        }
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
