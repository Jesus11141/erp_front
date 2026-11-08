<template>
  <div style="background: var(--bg-secundario); padding: 1rem; border-radius: 8px;">
    <label class="checkbox-container" style="margin-bottom: 1.5rem; font-weight: bold; font-size: 1.05rem;">
      <input type="checkbox" :value="'*'" v-model="model"> 🔴 Control Total (Super Administrador)
    </label>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem;">
      
      <!-- Ventas -->
      <div v-if="modulos.includes('ventas')" class="module-group">
        <h4>🤝 Ventas</h4>
        <label class="checkbox-container"><input type="checkbox" value="ventas.clientes" v-model="model"> Clientes</label>
        <label class="checkbox-container"><input type="checkbox" value="ventas.cotizaciones" v-model="model"> Cotizaciones</label>
        <label class="checkbox-container"><input type="checkbox" value="ventas.pedidos" v-model="model"> Pedidos</label>
        <label class="checkbox-container"><input type="checkbox" value="ventas.cuentas_cobrar" v-model="model"> Cuentas por Cobrar</label>
        <label class="checkbox-container"><input type="checkbox" value="ventas.metodos_pago" v-model="model"> Métodos de Pago</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="ventas.*" v-model="model"> Todo Ventas</label>
      </div>

      <!-- Facturación -->
      <div v-if="modulos.includes('facturacion')" class="module-group">
        <h4>📄 Facturación</h4>
        <label class="checkbox-container"><input type="checkbox" value="facturacion.facturas" v-model="model"> Facturas</label>
        <label class="checkbox-container"><input type="checkbox" value="facturacion.notas_credito" v-model="model"> Notas de Crédito</label>
        <label class="checkbox-container"><input type="checkbox" value="facturacion.retenciones" v-model="model"> Retenciones</label>
        <label class="checkbox-container"><input type="checkbox" value="facturacion.guias" v-model="model"> Guías de Remisión</label>
        <label class="checkbox-container"><input type="checkbox" value="facturacion.liquidaciones" v-model="model"> Liquidaciones de Compra</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="facturacion.*" v-model="model"> Todo Facturación</label>
      </div>

      <!-- Compras -->
      <div v-if="modulos.includes('compras')" class="module-group">
        <h4>🛒 Compras</h4>
        <label class="checkbox-container"><input type="checkbox" value="compras.proveedores" v-model="model"> Proveedores</label>
        <label class="checkbox-container"><input type="checkbox" value="compras.ordenes" v-model="model"> Órdenes de Compra</label>
        <label class="checkbox-container"><input type="checkbox" value="compras.facturas" v-model="model"> Facturas de Compra</label>
        <label class="checkbox-container"><input type="checkbox" value="compras.cuentas_pagar" v-model="model"> Cuentas por Pagar</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="compras.*" v-model="model"> Todo Compras</label>
      </div>

      <!-- Notas de Venta -->
      <div v-if="modulos.includes('notas_venta')" class="module-group">
        <h4>📝 Notas de Venta</h4>
        <label class="checkbox-container"><input type="checkbox" value="notas_venta.ver" v-model="model"> Ver / Emitir</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="notas_venta.*" v-model="model"> Todo Notas de Venta</label>
      </div>

      <!-- Inventario -->
      <div v-if="modulos.includes('inventario')" class="module-group">
        <h4>📦 Inventario</h4>
        <label class="checkbox-container"><input type="checkbox" value="inventario.productos" v-model="model"> Productos</label>
        <label class="checkbox-container"><input type="checkbox" value="inventario.cotizador" v-model="model"> Cotizador</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="inventario.*" v-model="model"> Todo Inventario</label>
      </div>

      <!-- POS -->
      <div v-if="modulos.includes('pos')" class="module-group">
        <h4>🖥️ Punto de Venta (POS)</h4>
        <label class="checkbox-container"><input type="checkbox" value="ventas.pos" v-model="model"> Ventas POS</label>
        <label class="checkbox-container"><input type="checkbox" value="pos.control_local" v-model="model"> Control de Local</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="pos.*" v-model="model"> Todo POS</label>
      </div>

      <!-- RRHH -->
      <div v-if="modulos.includes('rrhh')" class="module-group">
        <h4>👥 Recursos Humanos</h4>
        <label class="checkbox-container"><input type="checkbox" value="rrhh.empleados" v-model="model"> Empleados</label>
        <label class="checkbox-container"><input type="checkbox" value="rrhh.nominas" v-model="model"> Nóminas</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="rrhh.*" v-model="model"> Todo RRHH</label>
      </div>

      <!-- Clínica -->
      <div v-if="modulos.includes('clinica')" class="module-group">
        <h4>🏥 Clínica</h4>
        <label class="checkbox-container"><input type="checkbox" value="clinica.pacientes" v-model="model"> Pacientes</label>
        <label class="checkbox-container"><input type="checkbox" value="clinica.medicos" v-model="model"> Médicos</label>
        <label class="checkbox-container"><input type="checkbox" value="clinica.citas" v-model="model"> Citas</label>
        <label class="checkbox-container"><input type="checkbox" value="clinica.examenes" v-model="model"> Exámenes</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="clinica.*" v-model="model"> Todo Clínica</label>
      </div>
      
      <!-- Restaurante -->
      <div v-if="modulos.includes('restaurante') || modulos.includes('restaurantes')" class="module-group">
        <h4>🍽️ Restaurante</h4>
        <label class="checkbox-container"><input type="checkbox" value="restaurante.mesas" v-model="model"> Mapa de Mesas</label>
        <label class="checkbox-container"><input type="checkbox" value="restaurante.pedidos" v-model="model"> Tomar Pedidos (Mesero)</label>
        <label class="checkbox-container"><input type="checkbox" value="restaurante.cobrar" v-model="model"> Cobrar / Facturar (Cajero)</label>
        <label class="checkbox-container"><input type="checkbox" value="restaurante.cocina" v-model="model"> Pantalla de Cocina (KDS)</label>
        <label class="checkbox-container"><input type="checkbox" value="restaurante.config" v-model="model"> Configuración (Zonas/Mesas/Platos)</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="restaurante.*" v-model="model"> Todo Restaurante</label>
      </div>

      <!-- Contabilidad -->
      <div v-if="modulos.includes('contabilidad')" class="module-group">
        <h4>📊 Contabilidad</h4>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.plan_cuentas" v-model="model"> Plan de Cuentas</label>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.libro_diario" v-model="model"> Libro Diario</label>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.libro_mayor" v-model="model"> Libro Mayor</label>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.estados" v-model="model"> Estados Financieros</label>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.centros" v-model="model"> Centros de Costos</label>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.bancos" v-model="model"> Cuentas Bancarias</label>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.cash_management" v-model="model"> Cash Management</label>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.conciliacion" v-model="model"> Conciliación Bancaria</label>
        <label class="checkbox-container"><input type="checkbox" value="contabilidad.periodos" v-model="model"> Períodos Fiscales</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="contabilidad.*" v-model="model"> Todo Contabilidad</label>
      </div>

      <!-- Servicio Técnico -->
      <div v-if="modulos.includes('technical_service')" class="module-group">
        <h4>🔧 Servicio Técnico</h4>
        <label class="checkbox-container"><input type="checkbox" value="technical_service.orders" v-model="model"> Órdenes de Trabajo</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="technical_service.*" v-model="model"> Todo Servicio Técnico</label>
      </div>

      <!-- Administración y Reportes -->
      <div class="module-group">
        <h4>⚙️ Config y Otros</h4>
        <label class="checkbox-container"><input type="checkbox" value="reportes.ver" v-model="model"> Reportes y Gráficos</label>
        <label class="checkbox-container"><input type="checkbox" value="reportes.auditoria" v-model="model"> Ver Auditoría</label>
        <label class="checkbox-container"><input type="checkbox" value="parametros.configuracion" v-model="model"> Parametrización</label>
        <label class="checkbox-container"><input type="checkbox" value="usuarios.gestion" v-model="model"> Gestión de Usuarios</label>
        <label class="checkbox-container"><input type="checkbox" value="usuarios.roles" v-model="model"> Perfiles y Roles</label>
        <label class="checkbox-container" style="margin-top: 0.5rem; font-style: italic;"><input type="checkbox" value="admin.*" v-model="model"> Todo Config</label>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  modulos: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})
</script>

<style scoped>
.module-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.module-group h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
  color: var(--primary);
}
</style>
