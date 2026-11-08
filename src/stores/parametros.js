import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../shared/api'

export const useParametrosStore = defineStore('parametros', () => {
  const todos = ref({})
  const company = ref({ name: '', logo: '' })

  let cargarPromise = null

  async function cargar(force = false) {
    if (cargarPromise && !force) return cargarPromise
    cargarPromise = (async () => {
      try {
        const { data } = await api.get('/parametros/')
        todos.value = data
        company.value = {
          name:  data.general?.empresa_nombre?.value || '',
          logo:    data.general?.logo_url?.value || '',
          simbolo: data.general?.moneda_simbolo?.value || '$',
        }
      } catch {
        todos.value = {}
      } finally {
        cargarPromise = null
      }
    })()
    return cargarPromise
  }

  function obtener(modulo, clave, defecto = '') {
    return todos.value[modulo]?.[clave]?.value ?? defecto
  }

  return { todos, company, cargar, obtener }
})
