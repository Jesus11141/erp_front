import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../shared/api'

export const useAuthStore = defineStore('auth', () => {
  let initialUser = null
  try {
    const stored = localStorage.getItem('usuario')
    if (stored && stored !== 'undefined') {
      initialUser = JSON.parse(stored)
    } else {
      localStorage.removeItem('usuario')
    }
  } catch (e) {
    localStorage.removeItem('usuario')
  }

  const usuario = ref(initialUser)
  const token = ref(localStorage.getItem('token') || null)

  const estaAutenticado = computed(() => !!token.value)
  const rol = computed(() => usuario.value?.role || '')

  function tienePermiso(permiso) {
    const permisosPorRol = {
      superadmin: ['*'],
      admin:       ['facturacion.*', 'inventory.*', 'sales.*', 'rrhh.*', 'compras.*'],
      vendedor:    ['sales.*', 'facturacion.ver', 'facturacion.crear'],
      contador:    ['facturacion.*', 'contabilidad.*'],
      almacenista: ['inventory.*'],
      rrhh:        ['rrhh.*'],
    }
    const permisos = permisosPorRol[rol.value] || []
    if (permisos.includes('*')) return true
    const modulo = permiso.split('.')[0]
    return permisos.includes(permiso) || permisos.includes(`${modulo}.*`)
  }

  function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = window.crypto && window.crypto.randomUUID 
        ? window.crypto.randomUUID() 
        : 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2)
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }

  async function login(email, password) {
    const device_id = getOrCreateDeviceId()
    const device_name = navigator.userAgent.substring(0, 95) // limit length
    const { data } = await api.post('/auth/login/', { email, password, device_id, device_name })
    token.value = data.access
    usuario.value = data.user
    localStorage.setItem('token', data.access)
    localStorage.setItem('refresh', data.refresh)
    localStorage.setItem('usuario', JSON.stringify(data.user))
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`

    // Importar dinámicamente los stores de tenant y parametros para recargar el contexto del nuevo customer
    const { useTenantStore } = await import('./tenant')
    const { useParametrosStore } = await import('./parametros')
    const tenantStore = useTenantStore()
    const parametrosStore = useParametrosStore()
    await Promise.all([tenantStore.cargar(), parametrosStore.cargar()])
  }

  async function refrescarToken() {
    const refresh = localStorage.getItem('refresh')
    if (!refresh) { logout(); return }
    try {
      const { data } = await api.post('/auth/token/refresh/', { refresh })
      token.value = data.access
      localStorage.setItem('token', data.access)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
    } catch {
      logout()
    }
  }

  async function logout() {
    token.value = null
    usuario.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    delete api.defaults.headers.common['Authorization']

    const { useTenantStore } = await import('./tenant')
    const tenantStore = useTenantStore()
    await tenantStore.cargar()
  }

  // Restaurar token al iniciar y programar refresco (token dura 8h, refresca a las 7h)
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    setTimeout(refrescarToken, 7 * 60 * 60 * 1000)
  }

  return { usuario, token, estaAutenticado, rol, tienePermiso, login, logout, refrescarToken }
})
