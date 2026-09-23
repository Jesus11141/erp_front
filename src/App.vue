<template>
  <!-- Modal de alertas global -->
  <AlertModal />
  <!-- Splash de carga -->
  <div v-if="tenantStore.cargando" class="splash">
    <div class="splash-inner">
      <div class="splash-logo">
        <div class="splash-icon">⚡</div>
      </div>
      <div class="splash-spinner"></div>
      <p class="splash-text">Cargando tu company...</p>
    </div>
  </div>

  <!-- Error de company -->
  <div v-else-if="!tenantStore.tenant" class="error-page">
    <div class="error-card">
      <div class="error-icon">🏢</div>
      <h2>Empresa no encontrada</h2>
      <p>Verifica que la URL sea correcta o contacta a soporte.</p>
    </div>
  </div>

  <template v-else>
    <!-- Login -->
    <LoginView v-if="!authStore.estaAutenticado" />

    <!-- SuperAdmin (layout propio, sin sidebar del ERP) -->
    <router-view v-else-if="esSuperAdminRuta" />

    <!-- App principal -->
    <div v-else class="layout" :class="{ 'layout-collapsed': isSidebarCollapsed }">
      <!-- Cabecera Móvil -->
      <header class="mobile-header">
        <button class="btn-menu-toggle" @click="isSidebarOpen = true">☰</button>
        <span class="mobile-brand-name">{{ parametrosStore.company.name || tenantStore.tenant?.name }}</span>
      </header>

      <!-- Backdrop overlay para móviles -->
      <div v-if="isSidebarOpen" class="sidebar-backdrop" @click="isSidebarOpen = false"></div>

      <!-- Sidebar -->
      <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
        <!-- Botón para cerrar el menú en móviles -->
        <button class="btn-sidebar-close" @click="isSidebarOpen = false">✕</button>

        <div class="sidebar-brand">
          <div class="brand-wrapper-content" style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;">
            <img
              v-if="parametrosStore.company.logo"
              :src="logoUrl"
              class="brand-logo"
            />
            <div v-else class="brand-icon">⚡</div>
            <div class="brand-info">
              <span class="brand-name">{{ parametrosStore.company.name || tenantStore.tenant?.name }}</span>
              <span class="brand-tag">ERP Contable</span>
            </div>
          </div>
          <button class="btn-sidebar-collapse" @click="toggleSidebarCollapse" title="Colapsar/Expandir menú">
            ⋮
          </button>
        </div>

        <nav class="sidebar-nav">
          <!-- PRINCIPAL -->
          <template v-if="authStore.tienePermiso('reportes.*') || authStore.tienePermiso('admin.*')">
            <button @click="collapsedSections.principal = !collapsedSections.principal" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Principal</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.principal, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.principal">
              <router-link to="/dashboard" class="nav-item">
                <span class="nav-icon">📊</span>
                <span class="nav-label">Dashboard</span>
              </router-link>
            </div>
          </template>

          <!-- VENTAS -->
          <template v-if="tenantStore.tieneModulo('ventas') && authStore.tieneAlgunPermiso('ventas')">
            <button @click="collapsedSections.ventas = !collapsedSections.ventas" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Ventas</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.ventas, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.ventas">
              <router-link v-if="authStore.tienePermiso('ventas.clientes')" to="/ventas/customers" class="nav-item">
                <span class="nav-icon">🤝</span>
                <span class="nav-label">Clientes</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('ventas.cotizaciones')" to="/ventas/quotations" class="nav-item">
                <span class="nav-icon">📋</span>
                <span class="nav-label">Cotizaciones</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('ventas.pedidos')" to="/ventas/orders" class="nav-item">
                <span class="nav-icon">🛒</span>
                <span class="nav-label">Pedidos</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('ventas.cuentas_cobrar')" to="/ventas/receivables" class="nav-item">
                <span class="nav-icon">💰</span>
                <span class="nav-label">Cuentas por Cobrar</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('ventas.metodos_pago')" to="/ventas/payment-methods" class="nav-item">
                <span class="nav-icon">💳</span>
                <span class="nav-label">Métodos de Pago</span>
              </router-link>
            </div>
          </template>

          <!-- FACTURACIÓN -->
          <template v-if="tenantStore.tieneModulo('facturacion') && authStore.tieneAlgunPermiso('facturacion')">
            <button @click="collapsedSections.facturacion = !collapsedSections.facturacion" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Facturación</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.facturacion, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.facturacion">
              <router-link v-if="authStore.tienePermiso('facturacion.facturas') || authStore.tienePermiso('facturacion.*')" to="/facturacion" class="nav-item">
                <span class="nav-icon">🧾</span>
                <span class="nav-label">Facturas</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('facturacion.notas_credito') || authStore.tienePermiso('facturacion.*')" to="/facturacion/notas-credito" class="nav-item">
                <span class="nav-icon">↩️</span>
                <span class="nav-label">Notas de Crédito</span>
              </router-link>
            </div>
          </template>

          <!-- FISCAL / SRI -->
          <template v-if="tenantStore.tieneModulo('accounting') && authStore.tieneAlgunPermiso('accounting')">
            <button @click="collapsedSections.accounting = !collapsedSections.accounting" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Fiscal / SRI</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.accounting, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.accounting">
              <router-link v-if="authStore.tienePermiso('accounting.inbox') || authStore.tienePermiso('accounting.*')" to="/sri/inbox" class="nav-item">
                <span class="nav-icon">📥</span>
                <span class="nav-label">Bandeja SRI</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('accounting.taxforms') || authStore.tienePermiso('accounting.*')" to="/sri/tax-forms" class="nav-item">
                <span class="nav-icon">📊</span>
                <span class="nav-label">Declaraciones</span>
              </router-link>
            </div>
          </template>

          <!-- NOTAS DE VENTA -->
          <template v-if="tenantStore.tieneModulo('notas_venta') && authStore.tieneAlgunPermiso('notas_venta')">
            <button @click="collapsedSections.notas_venta = !collapsedSections.notas_venta" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Notas de Venta</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.notas_venta, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.notas_venta">
              <router-link v-if="authStore.tienePermiso('notas_venta.ver') || authStore.tienePermiso('notas_venta.*')" to="/notas-venta" class="nav-item">
                <span class="nav-icon">📝</span>
                <span class="nav-label">Emitir / Ver Notas</span>
              </router-link>
            </div>
          </template>

          <!-- INVENTARIO / CATÁLOGO -->
          <template v-if="(tenantStore.tieneModulo('inventario') || tenantStore.tieneModulo('pos')) && authStore.tieneAlgunPermiso('inventario')">
            <button @click="collapsedSections.inventario = !collapsedSections.inventario" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Inventario / Catálogo</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.inventario, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.inventario">
              <router-link v-if="authStore.tienePermiso('inventario.productos')" to="/inventory" class="nav-item">
                <span class="nav-icon">🏭</span>
                <span class="nav-label">Productos</span>
              </router-link>

              <router-link v-if="tenantStore.tieneModulo('inventario') && authStore.tienePermiso('inventario.cotizador')" to="/inventario/cotizador" class="nav-item">
                <span class="nav-icon">💵</span>
                <span class="nav-label">Cotizador</span>
              </router-link>

              <router-link v-if="tenantStore.tieneModulo('inventario') && authStore.tienePermiso('inventario.productos')" to="/inventario/transferencias" class="nav-item">
                <span class="nav-icon">🚚</span>
                <span class="nav-label">Traspasos / Bodega</span>
              </router-link>
            </div>
          </template>

          <!-- SERVICIO TÉCNICO -->
          <template v-if="tenantStore.tieneModulo('technical_service') && authStore.tieneAlgunPermiso('technical_service')">
            <button @click="collapsedSections.technical_service = !collapsedSections.technical_service" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Servicio Técnico</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.technical_service, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.technical_service">
              <router-link v-if="authStore.tienePermiso('technical_service.orders')" to="/technical-service/orders" class="nav-item">
                <span class="nav-icon">🔧</span>
                <span class="nav-label">Órdenes de Trabajo</span>
              </router-link>
            </div>
          </template>

          <!-- RECURSOS HUMANOS -->
          <template v-if="tenantStore.tieneModulo('rrhh') && authStore.tieneAlgunPermiso('rrhh')">
            <button @click="collapsedSections.rrhh = !collapsedSections.rrhh" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Recursos Humanos</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.rrhh, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.rrhh">
              <router-link v-if="authStore.tienePermiso('rrhh.empleados')" to="/rrhh/employees" class="nav-item">
                <span class="nav-icon">👥</span>
                <span class="nav-label">Empleados</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('rrhh.nominas')" to="/rrhh/nominas" class="nav-item">
                <span class="nav-icon">💰</span>
                <span class="nav-label">Nóminas</span>
              </router-link>
            </div>
          </template>

          <!-- PUNTO DE VENTA -->
          <template v-if="tenantStore.tieneModulo('pos') && (authStore.tieneAlgunPermiso('pos') || authStore.tienePermiso('ventas.pos') || authStore.tienePermiso('ventas.*'))">
            <button @click="collapsedSections.pos = !collapsedSections.pos" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Punto de Venta</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.pos, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.pos">
              <router-link v-if="authStore.tienePermiso('ventas.pos') || authStore.tienePermiso('ventas.*') || authStore.tienePermiso('pos.*')" to="/pos" class="nav-item">
                <span class="nav-icon">🖥️</span>
                <span class="nav-label">POS</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('pos.control_local')" to="/pos/control-local" class="nav-item">
                <span class="nav-icon">🏢</span>
                <span class="nav-label">Control de Local</span>
              </router-link>
            </div>
          </template>

          <!-- CONTABILIDAD -->
          <template v-if="tenantStore.tieneModulo('contabilidad') && authStore.tieneAlgunPermiso('contabilidad')">
            <button @click="collapsedSections.contabilidad = !collapsedSections.contabilidad" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Contabilidad</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.contabilidad, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.contabilidad">
              <router-link v-if="authStore.tienePermiso('contabilidad.plan_cuentas')" to="/contabilidad/plan-cuentas" class="nav-item">
                <span class="nav-icon">📖</span>
                <span class="nav-label">Plan de Cuentas</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('contabilidad.libro_diario')" to="/contabilidad/libro-diario" class="nav-item">
                <span class="nav-icon">📓</span>
                <span class="nav-label">Libro Diario</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('contabilidad.libro_mayor')" to="/contabilidad/libro-mayor" class="nav-item">
                <span class="nav-icon">📔</span>
                <span class="nav-label">Libro Mayor</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('contabilidad.estados')" to="/contabilidad/estado-resultados" class="nav-item">
                <span class="nav-icon">📉</span>
                <span class="nav-label">Est. Resultados (P&L)</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('contabilidad.estados')" to="/contabilidad/balance-general" class="nav-item">
                <span class="nav-icon">⚖️</span>
                <span class="nav-label">Balance General</span>
              </router-link>
              <router-link v-if="tenantStore.tieneModulo('centros_costos') && authStore.tienePermiso('contabilidad.centros')" to="/contabilidad/centros-costos" class="nav-item">
                <span class="nav-icon">🏢</span>
                <span class="nav-label">Centros de Costos</span>
              </router-link>
            </div>
          </template>

          <!-- RESTAURANTES -->
          <template v-if="tenantStore.tieneModulo('restaurantes') && authStore.tieneAlgunPermiso('restaurante')">
            <button @click="collapsedSections.restaurantes = !collapsedSections.restaurantes" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Restaurantes</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.restaurantes, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.restaurantes">
              <router-link v-if="authStore.tienePermiso('restaurante.mesas')" to="/restaurante/mesas" class="nav-item">
                <span class="nav-icon">🍔</span>
                <span class="nav-label">Mapa de Mesas</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('restaurante.cocina')" to="/restaurante/cocina" class="nav-item">
                <span class="nav-icon">🔥</span>
                <span class="nav-label">KDS Cocina</span>
              </router-link>
            </div>
          </template>

          <!-- SISTEMA -->
          <button v-if="authStore.tieneAlgunPermiso('reportes') || authStore.tieneAlgunPermiso('admin') || authStore.tienePermiso('usuarios.gestion') || authStore.tienePermiso('usuarios.roles') || authStore.tienePermiso('parametros.configuracion')" @click="collapsedSections.sistema = !collapsedSections.sistema" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
            <span>Sistema</span>
            <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.sistema, 'hidden': isSidebarCollapsed}"></i>
          </button>
          <div v-if="!collapsedSections.sistema">
            <template v-if="authStore.tienePermiso('reportes.*') || authStore.tienePermiso('reportes.ver') || authStore.tienePermiso('admin.*')">
              <router-link to="/reportes" class="nav-item">
                <span class="nav-icon">📈</span>
                <span class="nav-label">Reportes</span>
              </router-link>
            </template>
            <router-link v-if="authStore.tienePermiso('parametros.configuracion') || authStore.tienePermiso('admin.*')" to="/parametros" class="nav-item">
              <span class="nav-icon">⚙️</span>
              <span class="nav-label">Configuración</span>
            </router-link>
            <router-link v-if="tenantStore.tieneModulo('usuarios') && (authStore.tienePermiso('usuarios.gestion') || authStore.tienePermiso('admin.*'))" to="/usuarios" class="nav-item">
              <span class="nav-icon">👥</span>
              <span class="nav-label">Gestión Usuarios</span>
            </router-link>
            <router-link v-if="tenantStore.tieneModulo('auditoria') && (authStore.tienePermiso('reportes.auditoria') || authStore.tienePermiso('admin.*'))" to="/auditoria" class="nav-item">
              <span class="nav-icon">🛡️</span>
              <span class="nav-label">Auditoría Inmutable</span>
            </router-link>
            <router-link v-if="tenantStore.tieneModulo('roles') && (authStore.tienePermiso('usuarios.roles') || authStore.tienePermiso('admin.*'))" to="/roles" class="nav-item">
              <span class="nav-icon">🔐</span>
              <span class="nav-label">Roles Dinámicos</span>
            </router-link>
          </div>

          <!-- CLÍNICA -->
          <template v-if="tenantStore.tieneModulo('clinica') && authStore.tieneAlgunPermiso('clinica')">
            <button @click="collapsedSections.clinica = !collapsedSections.clinica" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Gestión Médica</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.clinica, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.clinica">
              <router-link v-if="authStore.tienePermiso('clinica.pacientes')" to="/clinica/pacientes" class="nav-item">
                <span class="nav-icon">🧑‍⚕️</span>
                <span class="nav-label">Pacientes</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('clinica.citas')" to="/clinica/citas" class="nav-item">
                <span class="nav-icon">📅</span>
                <span class="nav-label">Citas Médicas</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('clinica.medicos')" to="/clinica/medicos" class="nav-item">
                <span class="nav-icon">🩺</span>
                <span class="nav-label">Médicos</span>
              </router-link>
              <router-link v-if="authStore.tienePermiso('clinica.examenes')" to="/clinica/examenes" class="nav-item">
                <span class="nav-icon">🔬</span>
                <span class="nav-label">Exámenes</span>
              </router-link>
            </div>
          </template>

          <!-- SUPERADMIN -->
          <template v-if="authStore.esSuperAdmin">
            <button @click="collapsedSections.admin = !collapsedSections.admin" class="nav-section-label w-full text-left flex justify-between items-center cursor-pointer hover:text-white transition-colors bg-transparent border-none">
              <span>Administración</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 opacity-60" :class="{'rotate-180': collapsedSections.admin, 'hidden': isSidebarCollapsed}"></i>
            </button>
            <div v-if="!collapsedSections.admin">
              <router-link to="/superadmin" class="nav-item nav-item-admin">
                <span class="nav-icon">⚡</span>
                <span class="nav-label">Super Admin</span>
              </router-link>
            </div>
          </template>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ iniciales }}</div>
            <div class="user-details">
              <span class="user-name">{{ authStore.usuario?.name }}</span>
              <span class="user-role">{{ authStore.displayRole }}</span>
            </div>
          </div>
          <button @click="authStore.logout()" class="btn-logout" title="Cerrar sesión">
            <span>↩</span>
          </button>
        </div>
      </aside>

      <!-- Contenido principal -->
      <main class="main-content" :style="$route.path.startsWith('/pos') ? 'padding: 0;' : ''">
        <router-view />
      </main>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useTenantStore } from './stores/tenant'
import { useAuthStore } from './stores/auth'
import { useParametrosStore } from './stores/parametros'
import { useRoute } from 'vue-router'
import LoginView from './views/LoginView.vue'
import AlertModal from './components/AlertModal.vue'

const tenantStore = useTenantStore()
const authStore = useAuthStore()
const parametrosStore = useParametrosStore()
const route = useRoute()

const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')
const collapsedSections = reactive(JSON.parse(localStorage.getItem('collapsedSections')) || {
  principal: false,
  ventas: true,
  facturacion: true,
  accounting: true,
  notas_venta: true,
  inventario: true,
  rrhh: true,
  pos: true,
  clinica: true,
  sistema: true,
  admin: true,
  technical_service: true,
  contabilidad: true,
  restaurantes: true
})

watch(collapsedSections, (newVal) => {
  localStorage.setItem('collapsedSections', JSON.stringify(newVal))
})

function toggleSidebarCollapse() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  localStorage.setItem('sidebar_collapsed', isSidebarCollapsed.value ? 'true' : 'false')
}


// Auto-close sidebar on mobile when changing pages
watch(() => route.path, () => {
  isSidebarOpen.value = false
})

const esSuperAdminRuta = computed(() => route.path.startsWith('/superadmin'))

const logoUrl = computed(() => {
  const logo = parametrosStore.company.logo || tenantStore.tenant?.logo_url || ''
  if (!logo) return ''
  if (logo.startsWith('http://') || logo.startsWith('https://')) return logo
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '')
  return base + logo
})

const iniciales = computed(() => {
  const name = authStore.usuario?.name || ''
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})

onMounted(async () => {
  await tenantStore.cargar()
  if (authStore.estaAutenticado) await parametrosStore.cargar()
})
</script>

<style>
/* ── Variables ─────────────────────────────────────────────── */
:root {
  /* Paleta Principal */
  --color-primario:        #2563EB; /* Azul */
  --color-primario-dark:   #1D4ED8; /* Azul intenso (hover) */
  --color-primario-light:  #F1F5F9; /* Fondo secundario / Hover suave */
  --color-acento:          #14B8A6; /* Turquesa */
  --color-navy:            #0F172A; /* Principal oscuro */
  
  /* Estados (Éxito, Alerta, Peligro, Info) */
  --color-exito:           #22C55E;
  --color-exito-light:     #DCFCE7;
  --color-alerta:          #F59E0B;
  --color-alerta-light:    #FEF3C7;
  --color-peligro:         #EF4444;
  --color-peligro-light:   #FEE2E2;
  --color-info:            #8B5CF6;
  --color-info-light:      #DBEAFE;
  
  /* Estructura y Textos */
  --sidebar-width:         260px;
  --bg:                    #F8FAFC; /* Fondo general */
  --card-bg:               #FFFFFF; /* Fondo tarjetas */
  --text:                  #0F172A; /* Texto principal */
  --text-muted:            #64748B; /* Texto secundario */
  --text-light:            #CBD5E1; /* Texto para fondos oscuros */
  --border:                #E2E8F0; /* Bordes */
  
  /* UI Global (Sombras, bordes, transiciones) */
  --radius:                12px;
  --radius-sm:             8px;
  --shadow:                0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:             0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:             0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04);
  --transition:            all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ── Splash ────────────────────────────────────────────────── */
.splash {
  display: flex; align-items: center; justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, var(--color-primario) 0%, var(--color-acento) 100%);
}
.splash-inner { text-align: center; color: white; }
.splash-icon { font-size: 3rem; margin-bottom: 1rem; }
.splash-spinner {
  width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 1rem;
}
.splash-text { font-size: 0.9rem; opacity: 0.85; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Error page ────────────────────────────────────────────── */
.error-page {
  display: flex; align-items: center; justify-content: center;
  height: 100vh; background: var(--bg);
}
.error-card {
  text-align: center; background: white; padding: 3rem;
  border-radius: var(--radius); box-shadow: var(--shadow-lg);
}
.error-icon { font-size: 3rem; margin-bottom: 1rem; }
.error-card h2 { font-size: 1.4rem; margin-bottom: 0.5rem; }
.error-card p { color: var(--text-muted); }

/* ── Layout ────────────────────────────────────────────────── */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  --sidebar-current-width: var(--sidebar-width);
}

.layout.layout-collapsed {
  --sidebar-current-width: 68px;
}

/* ── Sidebar ───────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-current-width);
  background: var(--text);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-sidebar-collapse {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.btn-sidebar-collapse:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

/* Reglas cuando el sidebar está colapsado */
.layout-collapsed .brand-info,
.layout-collapsed .nav-label,
.layout-collapsed .nav-section-label,
.layout-collapsed .user-details {
  display: none;
}

.layout-collapsed .sidebar-brand {
  justify-content: center;
  padding: 1.25rem 0.5rem 1rem;
}

.layout-collapsed .brand-wrapper-content {
  justify-content: center;
}

.layout-collapsed .brand-logo,
.layout-collapsed .brand-icon {
  margin-right: 0;
}

.layout-collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem 0;
  gap: 0;
}

.layout-collapsed .nav-icon {
  font-size: 1.2rem;
  margin-right: 0;
}

.layout-collapsed .user-info {
  justify-content: center;
  padding: 0.5rem 0;
}

.layout-collapsed .user-avatar {
  margin-right: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.brand-logo { height: 36px; width: 36px; object-fit: contain; border-radius: 8px; }
.brand-icon {
  width: 36px; height: 36px; background: var(--color-primario);
  border-radius: 8px; display: flex; align-items: center;
  justify-content: center; font-size: 1.1rem; flex-shrink: 0;
}
.brand-info { display: flex; flex-direction: column; min-width: 0; }
.brand-name {
  color: white; font-size: 0.9rem; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.brand-tag { color: rgba(255,255,255,0.4); font-size: 0.7rem; }

.sidebar-nav {
  flex: 1; padding: 0.75rem 0.75rem;
  overflow-y: auto; display: flex; flex-direction: column; gap: 1px;
}
.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-track { background: transparent; }
.sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.nav-section-label {
  font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
  color: rgba(255,255,255,0.3); text-transform: uppercase;
  padding: 0.75rem 0.5rem 0.35rem; margin-top: 0.25rem;
}
.nav-section-label:first-child { margin-top: 0; }

.nav-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.75rem; color: rgba(255,255,255,0.65);
  text-decoration: none; font-size: 0.875rem; font-weight: 500;
  border-radius: var(--radius-sm); transition: var(--transition);
}
.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: white;
}
.nav-item.router-link-active {
  background: var(--color-primario);
  color: white;
  box-shadow: 0 2px 8px rgba(79,70,229,0.4);
}
.nav-icon { font-size: 1rem; width: 20px; text-align: center; flex-shrink: 0; }
.nav-label { flex: 1; }
.nav-item-admin.router-link-active { background: #F59E0B; box-shadow: 0 2px 8px rgba(245,158,11,0.4); }

.sidebar-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; gap: 0.75rem;
}
.user-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--color-primario); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
}
.user-details { flex: 1; min-width: 0; }
.user-name {
  color: white; font-size: 0.8rem; font-weight: 600;
  display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.user-role {
  color: rgba(255,255,255,0.4); font-size: 0.7rem;
  text-transform: capitalize; display: block;
}
.btn-logout {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(255,255,255,0.08); border: none;
  color: rgba(255,255,255,0.5); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; transition: var(--transition); flex-shrink: 0;
}
.btn-logout:hover { background: rgba(239,68,68,0.2); color: #EF4444; }

/* ── Main content ──────────────────────────────────────────── */
.main-content { flex: 1; overflow-y: auto; padding: 2rem; }

/* ── Componentes globales ──────────────────────────────────── */
.page-header, .header-actions {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.75rem;
  background: var(--card-bg);
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}
.page-title {
  font-size: 1.5rem; font-weight: 800;
  color: var(--text); letter-spacing: -0.02em;
}
.page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.2rem; }

.card {
  background: var(--card-bg); border-radius: var(--radius);
  box-shadow: var(--shadow); border: 1px solid var(--border);
  padding: 1.5rem;
}
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.25rem;
}
.card-title { font-size: 0.95rem; font-weight: 700; }

/* Botones */
.btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1.25rem; border-radius: var(--radius-sm);
  border: none; cursor: pointer; font-size: 0.875rem;
  font-weight: 600; transition: var(--transition); white-space: nowrap;
}
.btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn:active { transform: translateY(0); }
.btn-primary { background: var(--color-primario); color: white; }
.btn-primary:hover { background: var(--color-primario-dark); }
.btn-success { background: var(--color-exito); color: white; }
.btn-danger  { background: var(--color-peligro); color: white; }
.btn-warning { background: var(--color-alerta); color: white; }
.btn-outline {
  background: transparent; border: 1.5px solid var(--border);
  color: var(--text);
}
.btn-outline:hover { border-color: var(--color-primario); color: var(--color-primario); background: var(--color-primario-light); }
.btn-ghost { background: transparent; color: var(--text-muted); }
.btn-ghost:hover { background: var(--bg); color: var(--text); }
.btn-sm { padding: 0.3rem 0.75rem; font-size: 0.8rem; }
.btn-icon { padding: 0.5rem; width: 36px; height: 36px; justify-content: center; }

/* Tabla */
.table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.table th {
  text-align: left; padding: 0.75rem 1rem;
  color: var(--text-muted); font-weight: 600; font-size: 0.75rem;
  text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 2px solid var(--border); background: transparent;
}
.table td {
  padding: 0.875rem 1rem; border-bottom: 1px solid var(--border);
  color: var(--text);
}
.table tbody tr { transition: var(--transition); }
.table tbody tr:hover td { background: var(--bg); }
.table tbody tr:last-child td { border-bottom: none; }

/* Badges */
.badge {
  display: inline-flex; align-items: center;
  padding: 0.2rem 0.65rem; border-radius: 20px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.02em;
}
.badge-success   { background: #D1FAE5; color: #065F46; }
.badge-warning   { background: #FEF3C7; color: #92400E; }
.badge-danger    { background: #FEE2E2; color: #991B1B; }
.badge-info      { background: #DBEAFE; color: #1E40AF; }
.badge-secondary { background: #F1F5F9; color: #475569; }
.badge-purple    { background: #EDE9FE; color: #5B21B6; }

/* Inputs */
.input {
  width: 100%; padding: 0.55rem 0.875rem;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-size: 0.875rem; outline: none; background: white;
  color: var(--text); transition: var(--transition);
  font-family: inherit;
}
.input:focus { border-color: var(--color-primario); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
.input::placeholder { color: var(--text-light); }
.input:disabled { background: var(--bg); cursor: not-allowed; opacity: 0.7; }

.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block; margin-bottom: 0.4rem;
  font-size: 0.8rem; font-weight: 600; color: var(--text);
}
.form-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem; }
.form-error { font-size: 0.8rem; color: var(--color-peligro); margin-top: 0.3rem; }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem; margin-bottom: 1.75rem;
}
.stat-card {
  background: var(--card-bg); border-radius: var(--radius);
  box-shadow: var(--shadow); border: 1px solid var(--border);
  padding: 1.25rem 1.5rem;
  position: relative; overflow: hidden;
  transition: var(--transition);
}
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0;
  width: 4px; height: 100%;
  background: var(--color-primario);
}
.stat-card.acento::before   { background: var(--color-acento); }
.stat-card.exito::before    { background: var(--color-exito); }
.stat-card.alerta::before   { background: var(--color-alerta); }
.stat-card.peligro::before  { background: var(--color-peligro); }
.stat-card.purple::before   { background: #8B5CF6; }

.stat-icon { font-size: 1.5rem; margin-bottom: 0.75rem; }
.stat-value {
  font-size: 1.9rem; font-weight: 800;
  color: var(--color-primario); letter-spacing: -0.03em; line-height: 1;
}
.stat-card.acento  .stat-value { color: var(--color-acento); }
.stat-card.exito   .stat-value { color: var(--color-exito); }
.stat-card.alerta  .stat-value { color: var(--color-alerta); }
.stat-card.peligro .stat-value { color: var(--color-peligro); }
.stat-card.purple  .stat-value { color: #8B5CF6; }
.stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; font-weight: 500; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 1rem;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal {
  background: white; border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 2rem; width: 100%; max-width: 850px;
  max-height: 90vh; overflow-y: auto;
  animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.modal-title {
  font-size: 1.1rem; font-weight: 800;
  margin-bottom: 1.5rem; color: var(--text);
}
.modal-footer {
  display: flex; gap: 0.5rem; justify-content: flex-end;
  margin-top: 1.5rem; padding-top: 1.25rem;
  border-top: 1px solid var(--border);
}

/* Alert */
.alert {
  padding: 0.875rem 1rem; border-radius: var(--radius-sm);
  font-size: 0.875rem; display: flex; align-items: flex-start; gap: 0.75rem;
  margin-bottom: 1rem;
}
.alert-warning { background: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; }
.alert-danger  { background: #FEE2E2; border: 1px solid #FECACA; color: #991B1B; }
.alert-success { background: #D1FAE5; border: 1px solid #A7F3D0; color: #065F46; }
.alert-info    { background: #DBEAFE; border: 1px solid #BFDBFE; color: #1E40AF; }

/* Spinner */
.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primario);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: block;
}

/* Empty state */
.empty-state {
  text-align: center; padding: 3rem 1rem;
  color: var(--text-muted);
}
.empty-state-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.empty-state p { font-size: 0.875rem; }

/* Divider */
.divider { height: 1px; background: var(--border); margin: 1.25rem 0; }

/* Search bar */
.search-bar {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 1.25rem; flex-wrap: wrap;
}
.search-input { max-width: 300px; }

/* ── Estilos responsivos adicionales ── */
.mobile-header {
  display: none;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--text);
  color: white;
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  z-index: 90;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.btn-menu-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mobile-brand-name {
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-sidebar-close {
  display: none;
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  z-index: 95;
}

@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }
  .layout {
    flex-direction: column;
    padding-top: 56px; /* Deja espacio para la cabecera */
  }
  .sidebar {
    position: fixed;
    top: 0; bottom: 0; left: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-lg);
  }
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
  .btn-sidebar-close {
    display: block;
  }
  .sidebar-backdrop {
    display: block;
  }
  .main-content {
    padding: 1rem;
  }
  
  /* --- Ajustes responsivos globales para todas las pantallas --- */
  
  /* Forzar grillas de estadísticas y formularios a una sola columna */
  .stats-grid,
  [style*="display:grid"],
  [style*="display: grid"] {
    grid-template-columns: 1fr !important;
    gap: 1rem !important;
  }
  
  /* Convertir flex rows con inputs a flex column */
  [style*="display:flex"],
  [style*="display: flex"] {
    flex-wrap: wrap !important;
  }
  
  /* Tablas responsivas: agregar scroll horizontal automático a cualquier card con tablas */
  .card {
    padding: 1rem !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
  }
  .table {
    display: table !important;
    min-width: 600px; /* Asegura legibilidad y previene aplastamiento */
  }
  
  /* Rediseño de modales para celulares */
  .modal {
    padding: 1.25rem !important;
    margin: 0.5rem;
    max-height: 95vh !important;
    width: calc(100% - 1rem) !important;
  }
}
</style>


