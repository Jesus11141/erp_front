<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">📝 Notas de Venta</h1>
      <button class="btn btn-primary" @click="nuevaNotaVenta">+ Nueva Nota de Venta</button>
    </div>
    
    <div class="card">
      <div style="text-align:center; padding:3rem; color:var(--text-muted);">
        <h4>Módulo de Notas de Venta</h4>
        <p style="margin-top:0.5rem; font-size:0.9rem;">
          Aquí podrás emitir, gestionar e imprimir tus notas de venta o comprobantes internos.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from 'vue-toastification'
const toast = useToast()

function nuevaNotaVenta() {
  toast.info('Funcionalidad de Nueva Nota de Venta en desarrollo.')
}
</script>
