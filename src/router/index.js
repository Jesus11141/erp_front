import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import accountingRoutes from '../modules/accounting/router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard',           component: () => import('../views/DashboardView.vue') },
  { path: '/facturacion',         component: () => import('../modules/facturacion/ui/FacturasView.vue') },
  { path: '/facturacion/notas-credito', component: () => import('../modules/facturacion/ui/NotasCreditoView.vue') },
  { path: '/ventas/customers',     component: () => import('../modules/ventas/ui/ClientesView.vue') },
  { path: '/ventas/quotations', component: () => import('../modules/ventas/ui/CotizacionesView.vue') },
  { path: '/ventas/orders',      component: () => import('../modules/ventas/ui/PedidosView.vue') },
  { path: '/notas-venta',        component: () => import('../modules/ventas/ui/NotasVentaView.vue') },
  { path: '/ventas/payment-methods', component: () => import('../modules/ventas/ui/PaymentMethodsView.vue') },
  { path: '/ventas/receivables', component: () => import('../modules/ventas/ui/CuentasCobrarView.vue') },
  { path: '/inventory',          component: () => import('../modules/inventario/ui/ProductosView.vue') },

  { path: '/inventario/cotizador',component: () => import('../modules/inventario/ui/CotizadorView.vue') },
  { path: '/inventario/transferencias',component: () => import('../modules/inventario/ui/TransferenciasView.vue') },
  { path: '/rrhh/employees',      component: () => import('../modules/rrhh/ui/EmpleadosView.vue') },
  { path: '/rrhh/nominas',        component: () => import('../modules/rrhh/ui/NominasView.vue') },
  { path: '/pos',                 component: () => import('../modules/pos/ui/POSView.vue') },
  { path: '/pos/control-local',   component: () => import('../modules/pos/ui/ControlLocalView.vue') },
  { path: '/parametros',          component: () => import('../modules/parametros/ui/ParametrosView.vue') },
  { path: '/clinica/patients',    component: () => import('../modules/clinica/ui/PacientesView.vue') },
  { path: '/clinica/doctors',      component: () => import('../modules/clinica/ui/MedicosView.vue') },
  { path: '/clinica/appointments',        component: () => import('../modules/clinica/ui/CitasView.vue') },
  { path: '/clinica/examenes',     component: () => import('../modules/clinica/ui/ExamenesView.vue') },
  { path: '/reportes',             component: () => import('../views/reportes/ReportesView.vue') },
  { path: '/auditoria',            component: () => import('../views/reportes/AuditoriaView.vue') },
  { path: '/usuarios',             component: () => import('../views/UsuariosView.vue') },
  { path: '/roles',                component: () => import('../views/reportes/RolesView.vue') },
  { path: '/contabilidad/plan-cuentas', component: () => import('../modules/contabilidad/ui/PlanCuentasView.vue') },
  { path: '/contabilidad/libro-diario', component: () => import('../modules/contabilidad/ui/LibroDiarioView.vue') },
  { path: '/contabilidad/libro-mayor', component: () => import('../modules/contabilidad/ui/LibroMayorView.vue') },
  { path: '/contabilidad/estado-resultados', component: () => import('../modules/contabilidad/ui/EstadoResultadosView.vue') },
  { path: '/contabilidad/balance-general', component: () => import('../modules/contabilidad/ui/BalanceGeneralView.vue') },
  { path: '/contabilidad/centros-costos', component: () => import('../modules/contabilidad/ui/CentrosCostosView.vue') },
  { path: '/restaurante/mesas', component: () => import('../modules/restaurantes/ui/MapaMesasView.vue') },
  { path: '/restaurante/cocina', component: () => import('../modules/restaurantes/ui/PantallaCocinaView.vue') },
  { path: '/technical-service/orders', component: () => import('../modules/technical_service/ui/WorkOrdersView.vue') },
  ...accountingRoutes,

  // SUPERADMIN ROUTES
  {
    path: '/superadmin',
    component: () => import('../superadmin/SuperAdminLayout.vue'),
    children: [
      { path: '',          component: () => import('../superadmin/views/DashboardSAView.vue') },
      { path: 'empresas',  component: () => import('../superadmin/views/EmpresasView.vue') },
      { path: 'nueva-company', component: () => import('../superadmin/views/NuevaEmpresaView.vue') },
      { path: 'planes',    component: () => import('../superadmin/views/PlansView.vue') },
      { path: 'nuevo-plan', component: () => import('../superadmin/views/NewPlanView.vue') },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path !== '/login' && !auth.estaAutenticado) return '/login'

  // Restricciones para el rol vendedor y cajero
  if (auth.estaAutenticado && (auth.rol === 'vendedor' || auth.rol === 'cajero')) {
    const rutasPermitidas = ['/pos']
    if (!rutasPermitidas.includes(to.path) && to.path !== '/login') {
      return '/pos'
    }
  }
})

export default router


