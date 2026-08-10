import { ref } from 'vue'
import api from '../../../shared/api'

export function useParametros() {
  const parametros = ref({})
  const cargando = ref(false)
  const guardando = ref(false)
  const error = ref(null)
  const exito = ref(false)

  async function cargar() {
    cargando.value = true
    error.value = null
    try {
      const { data } = await api.get('/parametros/')
      parametros.value = data
    } catch (e) {
      error.value = 'Error al cargar parámetros'
    } finally {
      cargando.value = false
    }
  }

  async function guardarModulo(modulo, valores) {
    guardando.value = true
    error.value = null
    exito.value = false
    try {
      const { data } = await api.post('/parametros/', { modulo, parametros: valores })
      parametros.value = data
      exito.value = true
      setTimeout(() => (exito.value = false), 3000)
    } catch (e) {
      error.value = 'Error al guardar parámetros'
    } finally {
      guardando.value = false
    }
  }

  return { parametros, cargando, guardando, error, exito, cargar, guardarModulo }
}
