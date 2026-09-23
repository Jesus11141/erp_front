<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-header">
          <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">{{ saludo }}, {{ authStore.usuario?.name?.split(' ')[0] }} 👋</p>
          </div>
        </div>
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

      <!-- Accesos rápidos -->
      <div class="card" style="margin-top:0.5rem; margin-bottom:1.5rem;">
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

      <!-- Advanced BI Dashboard -->
      <div v-if="biData" class="bi-grid">
        
        <!-- Sales Trend Chart -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Ventas de Hoy por Hora</span>
          </div>
          <div style="height:250px; padding:1rem; position:relative;">
            <Bar :data="salesChartData" :options="barOptions" v-if="salesChartData" />
            <div v-else style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted);">Sin ventas hoy</div>
          </div>
        </div>

        <!-- Top Products Chart -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Top 5 Productos (Mes)</span>
          </div>
          <div style="height:250px; padding:1rem; display:flex; justify-content:center; position:relative;">
            <Doughnut :data="topProductsChartData" :options="doughnutOptions" v-if="topProductsChartData" />
            <div v-else style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted);">Sin datos de productos</div>
          </div>
        </div>

        <!-- Revenue Projections -->
        <div class="card" v-if="tenantStore.tieneModulo('ventas')">
          <div class="card-header">
            <span class="card-title">Proyección de Ingresos (Mensual)</span>
          </div>
          <div style="padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
              <span style="color:var(--text-muted)">Ingresos Actuales:</span>
              <strong>{{ simbolo }}{{ formatNum(biData.projections?.current_revenue) }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
              <span style="color:var(--text-muted)">Promedio Diario:</span>
              <strong>{{ simbolo }}{{ formatNum(biData.projections?.avg_daily) }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem; padding-top:1rem; border-top:1px solid var(--border);">
              <span style="color:var(--text-muted)">Proyección Fin de Mes:</span>
              <strong style="color:var(--color-exito); font-size:1.2rem;">{{ simbolo }}{{ formatNum(biData.projections?.projected_revenue) }}</strong>
            </div>
          </div>
        </div>

        <!-- Low Stock Table -->
        <div class="card" v-if="tenantStore.tieneModulo('inventario')">
          <div class="card-header">
            <span class="card-title">Alerta de Stock Bajo</span>
            <router-link to="/inventory?bajo_stock=true" style="font-size:0.8rem; font-weight:600; color:var(--color-primario); text-decoration:none;">Ver todos →</router-link>
          </div>
          <div class="table-container" style="max-height: 250px; overflow-y: auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align:right">Stock</th>
                  <th style="text-align:right">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in biData.low_stock_products" :key="p.id">
                  <td style="max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    {{ p.name }} <br><small style="color:var(--text-muted)">{{ p.code }}</small>
                  </td>
                  <td style="text-align:right; font-weight:bold; color:var(--color-peligro)">{{ p.stock }}</td>
                  <td style="text-align:right; color:var(--text-muted)">{{ p.min_stock }}</td>
                </tr>
                <tr v-if="!biData.low_stock_products || biData.low_stock_products.length === 0">
                  <td colspan="3" style="text-align:center; padding:1.5rem; color:var(--text-muted)">
                    Todos los productos tienen buen stock.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>


    </template>
    
    <!-- AI Chat Widget -->
    <AIChatWidget />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTenantStore } from '../stores/tenant'
import { useAuthStore } from '../stores/auth'
import { useParametrosStore } from '../stores/parametros'
import api from '../shared/api'
import AIChatWidget from '../shared/components/AIChatWidget.vue'

// Chart.js imports
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const tenantStore = useTenantStore()
const authStore = useAuthStore()
const parametrosStore = useParametrosStore()
const data = ref({})
const biData = ref(null)
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
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

// Charts Computed Data
const salesChartData = computed(() => {
  if (!biData.value || Object.keys(biData.value.sales_by_hour).length === 0) return null
  return {
    labels: Object.keys(biData.value.sales_by_hour),
    datasets: [{
      label: 'Ventas ($)',
      data: Object.values(biData.value.sales_by_hour),
      backgroundColor: '#3b82f6',
      borderRadius: 4
    }]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } }
}

const topProductsChartData = computed(() => {
  if (!biData.value || biData.value.top_products.length === 0) return null
  return {
    labels: biData.value.top_products.map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
    datasets: [{
      data: biData.value.top_products.map(p => p.qty),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    }]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
  }
}

onMounted(async () => {
  try {
    const [resDash, resBI] = await Promise.all([
      api.get('/reportes/dashboard/'),
      api.get('/reportes/bi-dashboard/')
    ])
    data.value = resDash.data
    biData.value = resBI.data
  } catch (e) {
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
<style>
.bi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .bi-grid {
    grid-template-columns: 2fr 1fr;
  }
}
</style>


