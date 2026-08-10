import { ref } from 'vue'
import api from '../shared/api'

export function useTenant() {
  const tenant = ref(null)
  const cargando = ref(true)

  async function cargarTenant() {
    try {
      const { data } = await api.get('/tenant/config/')
      tenant.value = data
      document.documentElement.style.setProperty('--color-primario', data.primary_color)
      document.documentElement.style.setProperty('--color-secundario', data.secondary_color)
    } catch {
      tenant.value = null
    } finally {
      cargando.value = false
    }
  }

  function tieneModulo(modulo) {
    return tenant.value?.modules?.includes(modulo) ?? false
  }

  return { tenant, cargando, cargarTenant, tieneModulo }
}
