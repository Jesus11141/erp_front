import { ref } from 'vue'
import api from '../../../shared/api'
import { Factura } from '../domain/Factura'

export function useFacturas() {
  const invoices = ref([])
  const cargando = ref(false)
  const error = ref(null)

  async function listar() {
    cargando.value = true
    try {
      const { data } = await api.get('/facturacion/')
      invoices.value = data.map(f => new Factura(f))
    } catch (e) {
      error.value = 'Error al cargar invoices'
    } finally {
      cargando.value = false
    }
  }

  async function crear(customer, items) {
    const { data } = await api.post('/facturacion/', { customer, items })
    await listar()
    return data
  }

  async function emitir(id) {
    await api.post(`/facturacion/${id}/emitir/`)
    await listar()
  }

  async function cancelar(id) {
    await api.post(`/facturacion/${id}/cancelar/`)
    await listar()
  }

  return { invoices, cargando, error, listar, crear, emitir, cancelar }
}
