<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">{{ saludo }}, {{ authStore.usuario?.name?.split(' ')[0] }} 👋</p>
      </div>
      <span class="date-hoy">{{ fechaHoy }}</span>
    </div>

    <div v-if="cargando" style="display:flex; justify-content:center; padding:4rem;">
      <span class="spinner"></span>
    </div>

    <template v-else>
      <!-- KPIs -->
      <div class="stats-grid">
        <div v-if="tenantStore.tieneModulo('ventas')" class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-value">{{ data.sales?.total_orders ?? 0 }}</div>
          <div class="stat-label">Total Pedidos</div>
        </div>
        <div v-if="tenantStore.tieneModulo('ventas')" class="stat-card alerta">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">{{ data.sales?.pending_orders ?? 0 }}</div>
          <div class="stat-label">Pedidos Pendientes</div>
        </div>
        <div v-if="tenantStore.tieneModulo('ventas')" class="stat-card acento">
          <div class="stat-icon">📋</div>
          <div class="stat-value">{{ data.sales?.total_quotes ?? 0 }}</div>
          <div class="stat-label">Cotizaciones</div>
        </div>
        <div v-if="tenantStore.tieneModulo('inventario')" class="stat-card exito">
          <div class="stat-icon">🏭</div>
          <div class="stat-value">{{ data.inventory?.total_products ?? 0 }}</div>
          <div class="stat-label">Productos Activos</div>
        </div>
        <div v-if="tenantStore.tieneModulo('inventario')" class="stat-card peligro">
          <div class="stat-icon">⚠️</div>
          <div class="stat-value">{{ data.inventory?.low_stock_products ?? 0 }}</div>
          <div class="stat-label">Bajo Stock</div>
        </div>
        <div v-if="tenantStore.tieneModulo('rrhh')" class="stat-card purple">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ data.rrhh?.total_empleados ?? 0 }}</div>
          <div class="stat-label">Empleados Activos</div>
        </div>
        <div v-if="tenantStore.tieneModulo('rrhh')" class="stat-card exito">
          <div class="stat-icon">💰</div>
          <div class="stat-value">{{ simbolo }}{{ formatNum(data.rrhh?.nomina_mensual) }}</div>
          <div class="stat-label">Nómina Mensual</div>
        </div>
      </div>

      <!-- Alertas -->
      <div
        v-if="tenantStore.tieneModulo('inventario') && data.inventory?.low_stock_products > 0"
        class="alert alert-warning"
      >
        <span>⚠️</span>
        <div>
          <strong>{{ data.inventory.low_stock_products }} product(s) con stock bajo.</strong>
          <router-link to="/inventory?bajo_stock=true" style="margin-left:0.5rem; color:inherit; font-weight:700;">
            Ver products →
          </router-link>
        </div>
      </div>

      <!-- Accesos rápidos -->
      <div class="card" style="margin-top:0.5rem;">
        <div class="card-header">
          <span class="card-title">Accesos rápidos</span>
        </div>
        <div class="accesos-grid">
          <router-link
            v-for="acceso in accesosRapidos"
            :key="acceso.ruta"
            :to="acceso.ruta"
            class="acceso-card"
          >
            <span class="acceso-icon">{{ acceso.icono }}</span>
            <span class="acceso-label">{{ acceso.label }}</span>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTenantStore } from '../stores/tenant'
import { useAuthStore } from '../stores/auth'
import { useParametrosStore } from '../stores/parametros'
import api from '../shared/api'

const tenantStore = useTenantStore()
const authStore = useAuthStore()
const parametrosStore = useParametrosStore()
const data = ref({})
const cargando = ref(true)

const simbolo = computed(() => parametrosStore.company.simbolo || '$')

const saludo = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
)

function formatNum(val) {
  if (!val) return '0'
  return Number(val).toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const accesosRapidos = computed(() => {
  const items = []
  if (tenantStore.tieneModulo('facturacion')) items.push({ ruta: '/facturacion', icono: '🧾', label: 'Nueva Factura' })
  if (tenantStore.tieneModulo('ventas'))      items.push({ ruta: '/ventas/customers', icono: '🤝', label: 'Clientes' })
  if (tenantStore.tieneModulo('ventas'))      items.push({ ruta: '/ventas/quotations', icono: '📋', label: 'Cotizaciones' })
  if (tenantStore.tieneModulo('inventario'))  items.push({ ruta: '/inventory', icono: '🏭', label: 'Inventario' })
  if (tenantStore.tieneModulo('pos'))         items.push({ ruta: '/pos', icono: '🖥️', label: 'Punto de Venta' })
  if (tenantStore.tieneModulo('rrhh'))        items.push({ ruta: '/rrhh/employees', icono: '👥', label: 'Empleados' })
  items.push({ ruta: '/reportes', icono: '📈', label: 'Reportes' })
  items.push({ ruta: '/parametros', icono: '⚙️', label: 'Configuración' })
  return items
})

onMounted(async () => {
  try {
    const { data: d } = await api.get('/reportes/dashboard/')
    data.value = d
  } catch {
    data.value = {}
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.date-hoy {
  font-size: 0.8rem; color: var(--text-muted);
  background: var(--bg); padding: 0.4rem 0.875rem;
  border-radius: 20px; border: 1px solid var(--border);
  text-transform: capitalize;
}

.accesos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}
.acceso-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 1.25rem 0.75rem;
  background: var(--bg); border-radius: var(--radius-sm);
  border: 1.5px solid var(--border); text-decoration: none;
  color: var(--text); transition: var(--transition); cursor: pointer;
}
.acceso-card:hover {
  border-color: var(--color-primario);
  background: var(--color-primario-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.acceso-icon { font-size: 1.75rem; }
.acceso-label { font-size: 0.78rem; font-weight: 600; text-align: center; }
</style>


