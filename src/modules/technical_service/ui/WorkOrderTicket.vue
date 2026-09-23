<template>
  <div class="modal-overlay print-view" style="background-color: white; color: black; z-index: 1000; align-items: flex-start; overflow-y: auto;">
    <div style="max-width: 800px; margin: 2rem auto; padding: 2rem; background: white; min-height: 100vh;">
      
      <!-- Cabecera -->
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 1rem; margin-bottom: 1rem;">
        <div>
          <h1 style="font-size: 1.5rem; text-transform: uppercase; margin: 0;">Orden de Trabajo</h1>
          <p style="margin: 0; font-family: monospace; color: #555;">ID: #{{ order.id ? order.id.toString().padStart(6, '0') : '------' }}</p>
          <p style="margin: 0; font-size: 0.9rem; color: #777;">Fecha: {{ formatFecha(order.created_at) }}</p>
        </div>
        <div style="text-align: right;">
          <div v-if="logoUrl" style="height: 50px; display: inline-flex; align-items: center; justify-content: flex-end; margin-bottom: 0.5rem;">
            <img :src="logoUrl" alt="Logo" style="max-height: 100%; max-width: 120px; object-fit: contain;" />
          </div>
          <div v-else style="width: 120px; height: 50px; background: #eee; border: 1px dashed #ccc; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; font-size: 0.8rem; color: #888;">
            SIN LOGO
          </div>
          <h3 style="margin: 0;">{{ tenantStore.tenant?.name || authStore.tenantName || 'Nuestra Empresa' }}</h3>
        </div>
      </div>

      <!-- Datos del Cliente y Equipo -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem;">
        <div>
          <h4 style="border-bottom: 1px solid #ccc; margin-bottom: 0.5rem; padding-bottom: 0.2rem; font-size: 0.8rem; text-transform: uppercase;">Datos del Cliente</h4>
          <p style="margin: 0; font-weight: bold;">{{ order.customer_name }}</p>
        </div>
        
        <div>
          <h4 style="border-bottom: 1px solid #ccc; margin-bottom: 0.5rem; padding-bottom: 0.2rem; font-size: 0.8rem; text-transform: uppercase;">Datos del Equipo</h4>
          <p style="margin: 0;"><strong>Tipo:</strong> {{ order.device_type }}</p>
          <p style="margin: 0;"><strong>Modelo:</strong> {{ order.device_model || 'N/A' }}</p>
          <p style="margin: 0;"><strong>IMEI/Serie:</strong> {{ order.device_identifier }}</p>
        </div>
      </div>

      <!-- Detalles del Problema -->
      <div style="border: 1px solid #ddd; padding: 1rem; background: #f9f9f9; margin-bottom: 1.5rem;">
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.8rem; text-transform: uppercase;">Falla Reportada</h4>
        <p style="margin: 0 0 1rem 0;">{{ order.reported_fault }}</p>
        
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.8rem; text-transform: uppercase;">Condiciones Físicas al recibir</h4>
        <p style="margin: 0;">{{ order.physical_conditions || 'Sin observaciones.' }}</p>
      </div>

      <!-- Tabla de Costos (Si hay items o abono) -->
      <div style="margin-bottom: 2rem;" v-if="order.items && order.items.length > 0">
        <h4 style="border-bottom: 1px solid #ccc; margin-bottom: 0.5rem; padding-bottom: 0.2rem; font-size: 0.8rem; text-transform: uppercase;">Detalle de Reparación / Repuestos</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid #ccc;">
              <th style="text-align: left; padding: 0.5rem 0;">Descripción</th>
              <th style="text-align: right; padding: 0.5rem 0;">Cant.</th>
              <th style="text-align: right; padding: 0.5rem 0;">P.Unit</th>
              <th style="text-align: right; padding: 0.5rem 0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.id" style="border-bottom: 1px solid #eee;">
              <td style="padding: 0.5rem 0;">{{ item.description }}</td>
              <td style="text-align: right; padding: 0.5rem 0;">{{ item.quantity }}</td>
              <td style="text-align: right; padding: 0.5rem 0;">${{ Number(item.unit_price).toFixed(2) }}</td>
              <td style="text-align: right; padding: 0.5rem 0;">${{ Number(item.subtotal).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 250px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem; font-weight: bold;">
              <span>Total Reparación:</span>
              <span style="font-family: monospace;">${{ Number(order.total).toFixed(2) }}</span>
            </div>
            <div style="text-align: right; font-size: 0.75rem; color: #666; margin-bottom: 0.5rem;">
              (Precios incluyen IVA)
            </div>
            <div v-if="order.advance_payment > 0" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #2e7d32;">
              <span>Abono Recibido:</span>
              <span style="font-family: monospace;">-${{ Number(order.advance_payment).toFixed(2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 2px solid black; padding-top: 0.5rem; font-weight: bold; font-size: 1.1rem;">
              <span>SALDO A PAGAR:</span>
              <span style="font-family: monospace;">${{ Number(order.balance_due).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else style="margin-bottom: 2rem;">
         <p style="font-style: italic; color: #777;">Los costos de reparación se definirán luego de la revisión técnica.</p>
         <div v-if="order.advance_payment > 0" style="margin-top: 1rem; display: flex; justify-content: space-between; width: 250px; padding: 0.5rem; background: #f0f0f0;">
            <strong>Abono Recibido:</strong>
            <span style="font-family: monospace;">${{ Number(order.advance_payment).toFixed(2) }}</span>
         </div>
      </div>

      <!-- Firmas -->
      <div style="margin-top: 5rem; display: flex; justify-content: space-between; padding: 0 3rem;">
        <div style="text-align: center; width: 200px;">
          <div style="border-top: 1px solid black; margin-bottom: 0.5rem;"></div>
          <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: bold;">Firma del Técnico</span>
        </div>
        <div style="text-align: center; width: 200px;">
          <div style="border-top: 1px solid black; margin-bottom: 0.5rem;"></div>
          <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: bold;">Firma del Cliente</span><br>
          <span style="font-size: 0.65rem; color: #666;">Acepto los términos y condiciones</span>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="no-print" style="margin-top: 3rem; display: flex; justify-content: center; gap: 1rem; background: #f5f5f5; padding: 1rem; border-radius: 8px;">
        <button @click="$emit('close')" class="btn btn-outline" style="background: white;">Cerrar</button>
        <button @click="imprimir" class="btn btn-primary" style="display: flex; gap: 0.5rem; align-items: center;">
          🖨️ Imprimir Ticket
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../../stores/auth'
import { useTenantStore } from '../../../stores/tenant'

const props = defineProps({
  order: Object
})

defineEmits(['close'])

const authStore = useAuthStore()
const tenantStore = useTenantStore()

const logoUrl = computed(() => {
  const logo = tenantStore.tenant?.logo_url || ''
  if (!logo) return ''
  if (logo.startsWith('http://') || logo.startsWith('https://')) return logo
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '')
  return base + logo
})

const formatFecha = (str) => {
  if (!str) return new Date().toLocaleDateString()
  return new Date(str).toLocaleString()
}

const imprimir = () => {
  window.print()
}
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .print-view {
    position: relative !important;
    z-index: 0 !important;
  }
  body {
    background-color: white !important;
  }
}
</style>
