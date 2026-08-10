<template>
  <div>
    <h1 class="page-title">Reportes</h1>
    <p style="color:var(--text-muted); margin-bottom:1.5rem; font-size:0.9rem;">
      Descarga reportes en PDF o Excel. Cada reporte usa los colores y datos de tu empresa.
    </p>

    <div class="reportes-grid">

      <!-- Ventas -->
      <div class="reporte-card" v-if="tenantStore.tieneModulo('ventas')">
        <div class="reporte-icono">📊</div>
        <div class="reporte-info">
          <h3>Reporte de Ventas</h3>
          <p>Pedidos, customers y totales</p>
        </div>
        <div class="reporte-acciones">
          <button class="btn-reporte excel" @click="descargarExcel('/reportes/excel/sales/', 'sales.xlsx')" :disabled="descargando">
            <span>📥</span> Excel
          </button>
        </div>
      </div>

      <!-- Clientes -->
      <div class="reporte-card" v-if="tenantStore.tieneModulo('ventas')">
        <div class="reporte-icono">🤝</div>
        <div class="reporte-info">
          <h3>Reporte de Clientes</h3>
          <p>Listado completo de customers</p>
        </div>
        <div class="reporte-acciones">
          <button class="btn-reporte excel" @click="descargarExcel('/reportes/excel/customers/', 'customers.xlsx')" :disabled="descargando">
            <span>📥</span> Excel
          </button>
        </div>
      </div>

      <!-- Inventario -->
      <div class="reporte-card" v-if="tenantStore.tieneModulo('inventario')">
        <div class="reporte-icono">🏭</div>
        <div class="reporte-info">
          <h3>Reporte de Inventario</h3>
          <p>Stock, precios y alertas</p>
        </div>
        <div class="reporte-acciones">
          <button class="btn-reporte excel" @click="descargarExcel('/reportes/excel/inventory/', 'inventory.xlsx')" :disabled="descargando">
            <span>📥</span> Excel
          </button>
        </div>
      </div>

      <!-- Nómina -->
      <div class="reporte-card" v-if="tenantStore.tieneModulo('rrhh')">
        <div class="reporte-icono">💰</div>
        <div class="reporte-info">
          <h3>Reporte de Nómina</h3>
          <p>Salarios, bonos y deducciones</p>
        </div>
        <div class="reporte-acciones">
          <button class="btn-reporte excel" @click="descargarExcel('/reportes/excel/nomina/', 'nomina.xlsx')" :disabled="descargando">
            <span>📥</span> Excel
          </button>
        </div>
      </div>

      <!-- Utilidades y Margen -->
      <div class="reporte-card" v-if="tenantStore.tieneModulo('pos')">
        <div class="reporte-icono">📈</div>
        <div class="reporte-info">
          <h3>Utilidad y Margen</h3>
          <p>Ganancias y rentabilidad POS</p>
        </div>
        <div class="reporte-acciones-vertical">
          <button class="btn-reporte excel" @click="descargarExcel('/reportes/excel/profit/', 'utilidades.xlsx')" :disabled="descargando">
            <span>📥</span> Excel
          </button>
          <button class="btn-reporte pdf" @click="verPDF('/reportes/pdf/profit/')" :disabled="descargando">
            <span>📄</span> PDF
          </button>
        </div>
      </div>

      <!-- Ranking de Productos -->
      <div class="reporte-card" v-if="tenantStore.tieneModulo('pos')">
        <div class="reporte-icono">🏆</div>
        <div class="reporte-info">
          <h3>Productos Más Vendidos</h3>
          <p>Top sales y recaudación</p>
        </div>
        <div class="reporte-acciones-vertical">
          <button class="btn-reporte excel" @click="descargarExcel('/reportes/excel/top-products/', 'top-products.xlsx')" :disabled="descargando">
            <span>📥</span> Excel
          </button>
          <button class="btn-reporte pdf" @click="verPDF('/reportes/pdf/top-products/')" :disabled="descargando">
            <span>📄</span> PDF
          </button>
        </div>
      </div>

      <!-- Cierre de Caja -->
      <div class="reporte-card" v-if="tenantStore.tieneModulo('pos')">
        <div class="reporte-icono">🧾</div>
        <div class="reporte-info">
          <h3>Cierre de Caja</h3>
          <p>Auditoría y arqueo de turnos</p>
        </div>
        <div class="reporte-acciones">
          <button class="btn-reporte excel" @click="abrirCajaCierreModal" style="background:#4A5568">
            Consultar
          </button>
        </div>
      </div>

    </div>

    <!-- Facturas individuales -->
    <div v-if="tenantStore.tieneModulo('facturacion')" style="margin-top:2rem;">
      <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:1rem;">Facturas en PDF</h2>
      <div class="card">
        <table class="table">
          <thead>
            <tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>PDF</th></tr>
          </thead>
          <tbody>
            <tr v-for="f in invoices" :key="f.id">
              <td>{{ f.number }}</td>
              <td>{{ f.client || f.customer }}</td>
              <td>{{ formatFecha(f.date) }}</td>
              <td>${{ parseFloat(f.total).toFixed(2) }}</td>
              <td><span :class="badgeEstado(f.status)">{{ traducirEstado(f.status) }}</span></td>
              <td>
                <button class="btn-reporte pdf" @click="verPDF(`/reportes/pdf/invoice/${f.id}/`)">
                  📄 PDF
                </button>
              </td>
            </tr>
            <tr v-if="!invoices.length">
              <td colspan="6" style="text-align:center; color:var(--text-muted)">Sin invoices</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cotizaciones en PDF -->
    <div v-if="tenantStore.tieneModulo('ventas')" style="margin-top:2rem;">
      <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:1rem;">Cotizaciones en PDF</h2>
      <div class="card">
        <table class="table">
          <thead>
            <tr><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>PDF</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in quotations" :key="c.id">
              <td>{{ c.customer }}</td>
              <td>{{ formatFecha(c.date) }}</td>
              <td>${{ parseFloat(c.total).toFixed(2) }}</td>
              <td><span :class="badgeEstado(c.status)">{{ traducirEstado(c.status) }}</span></td>
              <td>
                <button class="btn-reporte pdf" @click="verPDF(`/reportes/pdf/quotation/${c.id}/`)">
                  📄 PDF
                </button>
              </td>
            </tr>
            <tr v-if="!quotations.length">
              <td colspan="5" style="text-align:center; color:var(--text-muted)">Sin quotations</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL DE CONSULTA DE CIERRE DE CAJA -->
    <div v-if="mostrarModalCierre" class="modal-overlay">
      <div class="modal closing-modal" style="max-width: 650px;">
        <!-- Close Button positioned absolutely top-right -->
        <button class="close-btn" @click="mostrarModalCierre = false" title="Cerrar modal">✕</button>

        <div class="modal-header-centered" style="margin-bottom:1rem;">
          <h3>Reportes de Cierre de Caja</h3>
          <p class="modal-subtitle">Auditoría, arqueos de turnos y reportes consolidados</p>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid #E5E7EB; margin-bottom: 1.25rem;">
          <button 
            @click="activeTab = 'individual'" 
            :style="{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'individual' ? '700' : '500',
              borderBottom: activeTab === 'individual' ? '3px solid var(--color-primario)' : 'none',
              color: activeTab === 'individual' ? 'var(--color-primario)' : '#4B5563',
              cursor: 'pointer'
            }"
          >
            Arqueo Individual
          </button>
          <button 
            @click="activeTab = 'consolidado'" 
            :style="{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'consolidado' ? '700' : '500',
              borderBottom: activeTab === 'consolidado' ? '3px solid var(--color-primario)' : 'none',
              color: activeTab === 'consolidado' ? 'var(--color-primario)' : '#4B5563',
              cursor: 'pointer'
            }"
          >
            Reportes Consolidados
          </button>
        </div>
        
        <div class="modal-body" style="padding-top:0;">
          <!-- TAB 1: Individual Turn Audit -->
          <div v-if="activeTab === 'individual'">
            <label class="param-label" style="font-size:0.8rem; font-weight:700; color:#4B5563; text-transform:uppercase; margin-bottom:0.4rem; display:block;">
              Selecciona el Turno a Auditar
            </label>
            <select v-model="cierreSeleccionadoId" @change="seleccionarCierre" class="custom-select" style="margin-bottom:1.5rem; width:100%; height:38px; border-radius:8px; border:1px solid #CBD5E1; padding: 0 0.5rem;">
              <option value="">-- Elige un turno cerrado --</option>
              <option v-for="cc in cierres" :key="cc.id" :value="cc.id">
                {{ cc.register_name }} (Finalizado: {{ formatFecha(cc.closed_at) }})
              </option>
            </select>

            <!-- Detalle del closing -->
            <div v-if="cierreDetalle" class="closing-detalle-container">
              <div class="metadata-grid">
                <div class="meta-card">
                  <div class="meta-label">Cajero</div>
                  <div class="meta-value">{{ cierreDetalle.cashier_name }}</div>
                </div>
                <div class="meta-card">
                  <div class="meta-label">Transacciones</div>
                  <div class="meta-value">{{ cierreDetalle.sales_count }} sales</div>
                </div>
                <div class="meta-card" style="grid-column: span 2;">
                  <div class="meta-label">Horario del Turno</div>
                  <div class="meta-value" style="font-size:0.85rem; font-weight:600; color:#4B5563;">
                    {{ formatFecha(cierreDetalle.opened_at) }} hasta {{ formatFecha(cierreDetalle.closed_at) }}
                  </div>
                </div>
              </div>

              <table class="finance-table">
                <thead>
                  <tr>
                    <th style="text-align:left;">Concepto Financiero</th>
                    <th style="text-align:right;">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Saldo Inicial de Apertura</td>
                    <td class="text-right">${{ parseFloat(cierreDetalle.initial_balance).toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td>
                      (+) Ventas en Efectivo
                      <span v-if="cierreDetalle.closure_breakdown?.conteos?.efectivo !== undefined" style="font-size:0.75rem; color:#6B7280; font-weight:normal; margin-left:0.5rem;">
                        ({{ cierreDetalle.closure_breakdown.conteos.efectivo }} sales)
                      </span>
                    </td>
                    <td class="text-right" style="color:#2E7D32;">+${{ parseFloat(cierreDetalle.total_cash).toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td>
                      (+) Ventas con Tarjeta
                      <span v-if="cierreDetalle.closure_breakdown?.conteos?.tarjeta !== undefined" style="font-size:0.75rem; color:#6B7280; font-weight:normal; margin-left:0.5rem;">
                        ({{ cierreDetalle.closure_breakdown.conteos.tarjeta }} sales)
                      </span>
                    </td>
                    <td class="text-right" style="color:#1D76D2;">+${{ parseFloat(cierreDetalle.total_card).toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td>
                      (+) Ventas por Transferencia
                      <span v-if="cierreDetalle.closure_breakdown?.conteos?.transferencia !== undefined" style="font-size:0.75rem; color:#6B7280; font-weight:normal; margin-left:0.5rem;">
                        ({{ cierreDetalle.closure_breakdown.conteos.transferencia }} sales)
                      </span>
                    </td>
                    <td class="text-right" style="color:#7B1FA2;">+${{ parseFloat(cierreDetalle.total_transfer).toFixed(2) }}</td>
                  </tr>
                  <tr class="highlighted">
                    <td>Saldo Esperado en Caja (Inicial + Efectivo)</td>
                    <td class="text-right">${{ parseFloat(cierreDetalle.expected_balance).toFixed(2) }}</td>
                  </tr>
                  <tr class="highlighted">
                    <td>Saldo Contado Físicamente</td>
                    <td class="text-right">${{ parseFloat(cierreDetalle.counted_balance).toFixed(2) }}</td>
                  </tr>
                  <tr class="total-row">
                    <td>DIFERENCIA (ARQUEO DE CAJA)</td>
                    <td class="text-right">
                      <span :class="badgeDiferencia(parseFloat(cierreDetalle.difference))">
                        ${{ parseFloat(cierreDetalle.difference).toFixed(2) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Listado Detallado de Ventas del Turno -->
              <div v-if="cierreDetalle.closure_breakdown?.transacciones && cierreDetalle.closure_breakdown.transacciones.length > 0" style="margin-bottom:1.5rem;">
                <span class="param-label" style="font-size:0.75rem; font-weight:700; color:#4B5563; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                  Detalle de Ventas del Turno
                </span>
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #E5E7EB; border-radius: 8px;">
                  <table class="finance-table" style="margin: 0; font-size: 0.8rem;">
                    <thead>
                      <tr style="background-color: #F9FAFB; position: sticky; top: 0; z-index: 10;">
                        <th style="text-align:left; padding: 6px 12px;">Fecha/Hora</th>
                        <th style="text-align:left; padding: 6px 12px;">Cliente</th>
                        <th style="text-align:left; padding: 6px 12px;">Método</th>
                        <th style="text-align:left; padding: 6px 12px;">Comprobante</th>
                        <th style="text-align:right; padding: 6px 12px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="t in cierreDetalle.closure_breakdown.transacciones" :key="t.id">
                        <td style="padding: 6px 12px;">{{ t.fecha }}</td>
                        <td style="padding: 6px 12px; font-weight: 500;">{{ t.cliente }}</td>
                        <td style="padding: 6px 12px;">
                          <span :style="{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            color: t.metodo_pago === 'efectivo' ? '#2E7D32' : (t.metodo_pago === 'tarjeta' ? '#1D76D2' : '#7B1FA2'),
                            backgroundColor: t.metodo_pago === 'efectivo' ? '#E8F5E9' : (t.metodo_pago === 'tarjeta' ? '#E3F2FD' : '#F3E5F5')
                          }">
                            {{ t.metodo_pago }}
                          </span>
                        </td>
                        <td style="padding: 6px 12px; font-family: monospace;">{{ t.comprobante || '-' }}</td>
                        <td class="text-right" style="padding: 6px 12px; font-weight: 600;">${{ parseFloat(t.total).toFixed(2) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style="margin-bottom:1.5rem;">
                <span class="param-label" style="font-size:0.75rem; font-weight:700; color:#4B5563; text-transform:uppercase; display:block; margin-bottom:0.25rem;">Observaciones</span>
                <div class="observations-box">
                  {{ cierreDetalle.observations || 'Sin notas registradas durante este turno.' }}
                </div>
              </div>
              
              <div class="modal-footer-actions">
                <button class="btn-action excel-gradient" @click="descargarExcel(`/reportes/excel/register-closing/${cierreDetalle.id}/`, `closing-register-${cierreDetalle.id}.xlsx`)" :disabled="descargando">
                  <span>📥</span> Excel Ejecutivo
                </button>
                <button class="btn-action pdf-gradient" @click="verPDF(`/reportes/pdf/register-closing/${cierreDetalle.id}/`)" :disabled="descargando">
                  <span>📄</span> PDF Auditoría
                </button>
              </div>
            </div>
            
            <div v-else-if="cierreSeleccionadoId" style="text-align:center; padding:3rem; color:var(--text-muted);">
              <div class="spinner" style="margin:0 auto 1rem;"></div>
              Cargando auditoría de register...
            </div>
            
            <div v-else class="empty-state">
              <div class="empty-icon">📂</div>
              <h4>Arqueo de Turno</h4>
              <p>Selecciona un turno cerrado de la lista superior para visualizar la auditoría detallada y descargar reportes.</p>
            </div>
          </div>

          <!-- TAB 2: Consolidated Summary Reports -->
          <div v-else>
            <div style="background: #F8FAFC; border-radius: 12px; padding: 1.25rem; border: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 1rem;">
              
              <!-- 1. Temporalidad -->
              <div>
                <span class="param-label" style="font-size:0.75rem; font-weight:700; color:#4B5563; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                  Agrupación Temporal
                </span>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                  <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; cursor: pointer;">
                    <input type="radio" v-model="formFiltros.temporalidad" value="dia" /> Por Día
                  </label>
                  <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; cursor: pointer;">
                    <input type="radio" v-model="formFiltros.temporalidad" value="semana" /> Por Semana
                  </label>
                  <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; cursor: pointer;">
                    <input type="radio" v-model="formFiltros.temporalidad" value="quincena" /> Por Quincena
                  </label>
                  <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; cursor: pointer;">
                    <input type="radio" v-model="formFiltros.temporalidad" value="mes" /> Por Mes
                  </label>
                </div>
              </div>

              <!-- 2. Fecha Selector -->
              <div class="form-group" style="margin: 0;">
                <label class="param-label" style="font-size:0.75rem; font-weight:700; color:#4B5563; text-transform:uppercase; margin-bottom:0.25rem; display:block;">
                  Fecha de Referencia
                </label>
                <input type="date" v-model="formFiltros.date" class="input" style="height:38px;" />
              </div>

              <!-- 3. Alcance (Local o Caja) -->
              <div>
                <span class="param-label" style="font-size:0.75rem; font-weight:700; color:#4B5563; text-transform:uppercase; display:block; margin-bottom:0.5rem;">
                  Alcance
                </span>
                <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                  <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; cursor: pointer;">
                    <input type="radio" v-model="formFiltros.alcance" value="local" /> Por Local (Sucursal)
                  </label>
                  <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; cursor: pointer;">
                    <input type="radio" v-model="formFiltros.alcance" value="register" /> Por Caja Física
                  </label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem;">
                  <div class="form-group" style="margin: 0;">
                    <label class="param-label" style="font-size:0.75rem; font-weight:700; color:#4B5563; text-transform:uppercase; margin-bottom:0.25rem; display:block;">
                      Local (Sucursal)
                    </label>
                    <select v-model="formFiltros.local_id" class="custom-select" style="height:38px; width:100%; border-radius:8px; border:1px solid #CBD5E1; padding: 0 0.5rem;">
                      <option value="">-- Todos los locales --</option>
                      <option v-for="l in locales" :key="l.id" :value="l.id">{{ l.name }}</option>
                    </select>
                  </div>

                  <div v-if="formFiltros.alcance === 'register'" class="form-group" style="margin: 0;">
                    <label class="param-label" style="font-size:0.75rem; font-weight:700; color:#4B5563; text-transform:uppercase; margin-bottom:0.25rem; display:block;">
                      Caja
                    </label>
                    <select v-model="formFiltros.caja_id" class="custom-select" style="height:38px; width:100%; border-radius:8px; border:1px solid #CBD5E1; padding: 0 0.5rem;" :disabled="!formFiltros.local_id">
                      <option value="">-- Elige una register --</option>
                      <option v-for="c in cajasFiltradas" :key="c.id" :value="c.id">{{ c.name }} ({{ c.code }})</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 4. Filtro por Trabajador -->
              <div>
                <label style="display: flex; align-items: center; gap: 0.35rem; font-weight: 700; font-size: 0.75rem; color: #4B5563; text-transform: uppercase; cursor: pointer; margin-bottom: 0.5rem;">
                  <input type="checkbox" v-model="formFiltros.filtrar_trabajador" /> Filtrar por Trabajador
                </label>

                <div v-if="formFiltros.filtrar_trabajador" class="form-group" style="margin: 0; animation: fadeIn 0.2s ease;">
                  <select v-model="formFiltros.trabajador_id" class="custom-select" style="height:38px; width:100%; border-radius:8px; border:1px solid #CBD5E1; padding: 0 0.5rem;">
                    <option value="">-- Selecciona el trabajador --</option>
                    <option v-for="t in trabajadores" :key="t.id" :value="t.id">{{ t.name }} ({{ t.position }})</option>
                  </select>
                </div>
              </div>

            </div>

            <!-- Footer Actions -->
            <div class="modal-footer-actions" style="margin-top: 1.5rem;">
              <button 
                class="btn-action excel-gradient" 
                @click="descargarExcel(generarReporteResumenURL('excel'), 'resumen-cierres.xlsx')" 
                :disabled="descargando"
              >
                <span>📥</span> Generar Excel Consolidado
              </button>
              <button 
                class="btn-action pdf-gradient" 
                @click="verPDF(generarReporteResumenURL('pdf'))" 
                :disabled="descargando"
              >
                <span>📄</span> Visualizar PDF Consolidado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" style="color:#e74c3c; margin-top:1rem;">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useTenantStore } from '@/stores/tenant'
import { descargar, abrirPDF } from '@/shared/descargas'
import api from '@/shared/api'

const tenantStore = useTenantStore()
const invoices = ref([])
const quotations = ref([])
const cierres = ref([])
const descargando = ref(false)
const error = ref('')

// Estados del modal de closing de register (Inicializados antes de usarse)
const mostrarModalCierre = ref(false)
const cierreSeleccionadoId = ref('')
const cierreDetalle = ref(null)

// Estados para Reportes Avanzados
import { computed } from 'vue'
const activeTab = ref('individual')
const locales = ref([])
const cajasRegistradas = ref([])
const trabajadores = ref([])
const formFiltros = ref({
  temporalidad: 'dia',
  date: new Date().toISOString().split('T')[0],
  local_id: '',
  caja_id: '',
  filtrar_trabajador: false,
  trabajador_id: '',
  alcance: 'local'
})

const cajasFiltradas = computed(() => {
  if (!formFiltros.value.local_id) return cajasRegistradas.value
  return cajasRegistradas.value.filter(c => c.branch_id === parseInt(formFiltros.value.local_id))
})

async function cargarLocales() {
  try {
    const { data } = await api.get('/inventario/branches/')
    locales.value = data
  } catch {}
}

async function cargarCajas() {
  try {
    const { data } = await api.get('/pos/physical-cash-registers/')
    cajasRegistradas.value = data
  } catch {}
}

async function cargarTrabajadores() {
  try {
    const { data } = await api.get('/rrhh/employees/')
    trabajadores.value = data
  } catch {}
}

function generarReporteResumenURL(formato) {
  const f = formFiltros.value
  const q = new URLSearchParams()
  
  // Mapping local form states to clean backend English parameters
  const periodMap = { dia: 'day', semana: 'week', quincena: 'biweekly', mes: 'month' }
  const periodType = periodMap[f.temporalidad] || 'day'
  
  q.append('period_type', periodType)
  q.append('date', f.date)
  if (f.local_id) q.append('branch_id', f.local_id)
  if (f.alcance === 'register' && f.caja_id) q.append('register_id', f.caja_id)
  if (f.filtrar_trabajador && f.trabajador_id) q.append('employee_id', f.trabajador_id)
  
  return `/reportes/${formato}/register-closing-resumen/?${q.toString()}`
}

// Cerrar modal al presionar la tecla Escape
const handleEscapeKey = (e) => {
  if (e.key === 'Escape' && mostrarModalCierre.value) {
    mostrarModalCierre.value = false
  }
}

watch(mostrarModalCierre, (isShowing) => {
  if (isShowing) {
    window.addEventListener('keydown', handleEscapeKey)
  } else {
    window.removeEventListener('keydown', handleEscapeKey)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})


const badgeEstado = (e) => ({
  draft: 'badge badge-secondary', emitida: 'badge badge-info',
  pagada: 'badge badge-success', canceled: 'badge badge-danger',
  enviada: 'badge badge-info', aceptada: 'badge badge-success',
  authorized: 'badge badge-success', not_authorized: 'badge badge-warning'
}[e] || 'badge badge-secondary')

const traducirEstado = (e) => ({
  draft: 'Borrador', not_authorized: 'No Autorizado', authorized: 'Autorizado',
  canceled: 'Anulado', pagada: 'Pagada', enviada: 'Enviada', aceptada: 'Aceptada',
  emitida: 'Emitida'
}[e] || e)

function formatFecha(fechaStr) {
  if (!fechaStr) return ''
  try {
    const d = new Date(fechaStr)
    return d.toISOString().replace('T', ' ').substring(0, 16)
  } catch {
    return fechaStr
  }
}

function badgeDiferencia(dif) {
  if (dif === 0) return 'badge badge-success'
  if (dif < 0) return 'badge badge-danger'
  return 'badge badge-warning'
}

function abrirCajaCierreModal() {
  cierreSeleccionadoId.value = ''
  cierreDetalle.value = null
  activeTab.value = 'individual'
  mostrarModalCierre.value = true
}

function seleccionarCierre() {
  if (!cierreSeleccionadoId.value) {
    cierreDetalle.value = null
    return
  }
  const cc = cierres.value.find(item => item.id === parseInt(cierreSeleccionadoId.value))
  cierreDetalle.value = cc || null
}

async function descargarExcel(url, name) {
  descargando.value = true
  error.value = ''
  try {
    await descargar(url, name)
  } catch {
    error.value = 'Error al descargar el reporte'
  } finally {
    descargando.value = false
  }
}

async function verPDF(url) {
  error.value = ''
  try {
    await abrirPDF(url)
  } catch {
    error.value = 'Error al generar el PDF'
  }
}

onMounted(async () => {
  await tenantStore.cargar()
  
  if (tenantStore.tieneModulo('facturacion')) {
    const { data } = await api.get('/facturacion/')
    invoices.value = data.data || data
  }
  if (tenantStore.tieneModulo('ventas')) {
    const { data } = await api.get('/ventas/quotations/')
    quotations.value = data
  }
  if (tenantStore.tieneModulo('pos')) {
    try {
      const { data } = await api.get('/pos/closures/')
      cierres.value = data
      await cargarLocales()
      await cargarCajas()
      await cargarTrabajadores()
    } catch {}
  }
})
</script>

<style scoped>
.reportes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.reporte-card {
  background: white; border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 1.25rem;
  display: flex; align-items: center; gap: 1rem;
}
.reporte-icono { font-size: 2rem; }
.reporte-info { flex: 1; }
.reporte-info h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.2rem; }
.reporte-info p { font-size: 0.8rem; color: var(--text-muted); }
.reporte-acciones { display: flex; gap: 0.4rem; }
.reporte-acciones-vertical { display: flex; flex-direction: column; gap: 0.4rem; }
.btn-reporte {
  padding: 0.4rem 0.75rem; border: none; border-radius: 6px;
  cursor: pointer; font-size: 0.8rem; font-weight: 600;
  display: flex; align-items: center; gap: 0.3rem; transition: opacity 0.2s;
}
.btn-reporte:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-reporte.excel { background: #1D6F42; color: white; }
.btn-reporte.pdf   { background: #e74c3c; color: white; }
.btn-reporte:not(:disabled):hover { opacity: 0.85; }

/* ESTILOS DEL MODAL DE CIERRE DE CAJA */
.closing-modal {
  max-width: 600px;
  width: 95%;
  padding: 2rem;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  position: relative;
  border: 1px solid rgba(226, 232, 240, 0.8);
}
.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
}
.close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
  transform: rotate(90deg);
}
.modal-header-centered {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-right: 1.5rem;
}
.modal-header-centered h3 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
}
.modal-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}
.custom-select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.custom-select:focus {
  border-color: #3b82f6;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.closing-detalle-container {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.metadata-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.meta-card {
  background: #f8fafc;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.meta-label {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 0.25rem;
  letter-spacing: 0.05em;
}
.meta-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}
.finance-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.finance-table th {
  background: #f1f5f9;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: 0.03em;
}
.finance-table td {
  padding: 0.8rem 1rem;
  font-size: 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}
.finance-table tr.highlighted {
  background: #f8fafc;
  font-weight: 600;
}
.finance-table tr.total-row {
  background: #f1f5f9;
  font-weight: 800;
  border-top: 2px solid #cbd5e1;
}
.observations-box {
  font-size: 0.85rem;
  color: #475569;
  background: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  line-height: 1.4;
}
.modal-footer-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
.btn-action {
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
}
.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-action.excel-gradient {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}
.btn-action.pdf-gradient {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}
.btn-action:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.12);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  color: #64748b;
  text-align: center;
}
.empty-icon {
  font-size: 3.2rem;
  margin-bottom: 0.75rem;
  animation: floatIcon 3s ease-in-out infinite;
}
.empty-state h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.4rem 0;
}
.empty-state p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  max-width: 320px;
  line-height: 1.4;
}

/* Animaciones */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes floatIcon {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>




