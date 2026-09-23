<template>
  <div>
    <div class="page-header">
      <h1 class="page-title" style="margin:0">Cotizaciones</h1>
      <router-link to="/pos" class="btn btn-primary" style="text-decoration:none;">
        <i class="fa-solid fa-plus mr-2"></i> Nueva Cotización
      </router-link>
    </div>
    <div class="card">
      <table class="table">
        <thead>
          <tr><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in quotations" :key="c.id">
            <td>{{ c.customer }}</td><td>{{ c.date }}</td>
            <td>{{ parametrosStore.company.simbolo }}{{ c.total }}</td>
            <td><span :class="badgeEstado(c.status)">{{ c.status }}</span></td>
            <td style="display:flex; gap:0.5rem;">
              <button v-if="c.status === 'draft'" class="btn btn-primary" style="padding:0.25rem 0.75rem; font-size:0.8rem" @click="enviar(c.id)">Enviar</button>
              <button v-if="c.status === 'enviada'" class="btn btn-success" style="padding:0.25rem 0.75rem; font-size:0.8rem" @click="convertir(c.id)">→ Pedido</button>
              <button class="btn btn-secondary" style="padding:0.25rem 0.75rem; font-size:0.8rem" @click="abrirConfig(c.id)">⚙ Formato</button>
              <button class="btn btn-secondary" style="padding:0.25rem 0.75rem; font-size:0.8rem" @click="descargarPDF(c.id)">📄 PDF</button>
            </td>
          </tr>
          <tr v-if="!quotations.length">
            <td colspan="5" style="padding: 0; border: none;">
              <EmptyState 
                icon="fa-solid fa-file-signature"
                icon-color="text-brand-500"
                icon-bg="bg-brand-50"
                title="Aún no has generado proformas o cotizaciones"
                description="Crea cotizaciones personalizadas con validez, condiciones comerciales y formato formal para presentar a tus clientes."
                action-text="+ Nueva Cotización"
                action-icon="fa-solid fa-plus"
                @action="router.push('/pos')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Modal Configuración -->
    <div v-if="showConfigModal" class="modal-overlay" @click.self="showConfigModal = false">
      <div class="modal">
        <h3 style="margin-bottom:1.5rem; font-weight: 700; color: #1e293b;">Formato de Cotización</h3>
        
        <div class="form-group" style="margin-bottom: 1rem;">
          <label>Días de Validez</label>
          <input type="number" class="input" v-model="configForm.validity_days">
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label>Términos de Pago</label>
          <input type="text" class="input" v-model="configForm.payment_terms" placeholder="Ej. 50% anticipo, 50% entrega">
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label>Tiempo de Entrega</label>
          <input type="text" class="input" v-model="configForm.delivery_time" placeholder="Ej. 15 días laborables">
        </div>
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label>Estilo de Impresión</label>
          <select v-model="configForm.print_style" class="input">
            <option value="corporativo">Corporativo</option>
            <option value="ejecutivo">Ejecutivo</option>
            <option value="estandar">Estándar</option>
          </select>
        </div>
        
        <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
          <button class="btn btn-outline" @click="showConfigModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarConfig">Guardar y Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../../shared/api'
import { useParametrosStore } from '../../../stores/parametros'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const parametrosStore = useParametrosStore()

const quotations = ref([])
const showConfigModal = ref(false)
const configForm = ref({ id: null, validity_days: 15, payment_terms: '', delivery_time: '', print_style: 'corporativo', show_images: false })

const badgeEstado = (e) => ({
  draft: 'badge badge-secondary', enviada: 'badge badge-info',
  aceptada: 'badge badge-success', rechazada: 'badge badge-danger',
}[e] || 'badge badge-secondary')

onMounted(async () => {
  const { data } = await api.get('/ventas/quotations/')
  quotations.value = data
})

async function enviar(id) {
  await api.post(`/sales/quotations/${id}/enviar/`)
  const { data } = await api.get('/ventas/quotations/')
  quotations.value = data
}

async function convertir(id) {
  await api.post(`/sales/quotations/${id}/convertir/`)
  const { data } = await api.get('/ventas/quotations/')
  quotations.value = data
}

async function descargarPDF(id) {
  try {
    const response = await api.get(`/ventas/quotations/${id}/pdf/`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `cotizacion_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error al descargar PDF:', error)
  }
}

function abrirConfig(id) {
  configForm.value = { id, validity_days: 15, payment_terms: '', delivery_time: '', print_style: 'corporativo', show_images: false }
  showConfigModal.value = true
}

async function guardarConfig() {
  await api.put(`/ventas/quotations/${configForm.value.id}/config/`, configForm.value)
  showConfigModal.value = false
}
</script>

