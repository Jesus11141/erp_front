<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-header">
          <div>
          <h1 class="page-title" style="margin:0">🧮 Cotizador de Precios y Volumen</h1>
          <p style="color:var(--text-muted); font-size:0.875rem; margin-top:0.25rem;">
            Calcula y simula precios por quantity aplicando escalas de discount automáticamente.
          </p>
          </div>
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 380px; gap: 1.5rem;">
      
      <!-- Panel Izquierdo: Selección y Configuración de Escalas -->
      <div style="display:flex; flex-direction:column; gap: 1.25rem;">
        
        <!-- Buscador de Producto -->
        <div class="card">
          <label style="font-weight:600; font-size:0.9rem; margin-bottom:0.5rem; display:block;">
            Seleccionar Producto
          </label>
          <div style="position:relative;">
            <input
              v-model="busqueda"
              class="input"
              style="font-size:1rem; padding:0.75rem 1rem;"
              placeholder="🔍 Buscar por name o código..."
              @input="buscarProductos"
              @focus="mostrarDropdown = true"
            />

            <!-- Dropdown de Sugerencias -->
            <div v-if="mostrarDropdown && resultadosBusqueda.length" class="dropdown-cotizador">
              <div
                v-for="p in resultadosBusqueda"
                :key="p.id"
                class="dropdown-item"
                @mousedown="seleccionarProducto(p)"
              >
                <div>
                  <strong>[{{ p.code }}] {{ p.name }}</strong>
                  <div style="font-size:0.78rem; color:var(--text-muted);">
                    Precio Base: {{ parametrosStore.company.simbolo }}{{ parseFloat(p.sale_price).toFixed(2) }}
                  </div>
                </div>
                <span class="stock-badge" :class="parseFloat(p.current_stock) <= 0 ? 'sin-stock' : ''">
                  Stock: {{ p.current_stock }} {{ p.unit || 'pza' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ficha del Producto Seleccionado -->
        <div v-if="productoSeleccionado" class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.8rem; color:var(--text-muted);">CÓDIGO: {{ productoSeleccionado.code }}</span>
              <h2 style="margin:0.2rem 0; font-size:1.2rem; font-weight:700;">{{ productoSeleccionado.name }}</h2>
              <span class="badge badge-info">Stock Físico: {{ productoSeleccionado.current_stock }} {{ productoSeleccionado.unit }}</span>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.8rem; color:var(--text-muted);">PVP Normal Base</div>
              <div style="font-size:1.3rem; font-weight:700; color:var(--text);">
                {{ parametrosStore.company.simbolo }}{{ parseFloat(productoSeleccionado.sale_price).toFixed(2) }}
              </div>
            </div>
          </div>

          <!-- Escalas Configuradas para este Producto -->
          <h3 style="font-size:0.95rem; font-weight:700; margin-top:1.25rem; margin-bottom:0.75rem;">
            📊 Escalas de Descuento por Volumen
          </h3>

          <table class="table" style="font-size:0.85rem;">
            <thead>
              <tr>
                <th>Rango de Cantidad</th>
                <th>Precio Unitario</th>
                <th>Descuento Estimado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in escalas" :key="e.id" :class="escalaEsActiva(e) ? 'fila-activa' : ''">
                <td>
                  <strong>{{ parseFloat(e.minimum_quantity) }}</strong>
                  <span v-if="e.maximum_quantity"> a <strong>{{ parseFloat(e.maximum_quantity) }}</strong> unidades</span>
                  <span v-else> o más unidades</span>
                </td>
                <td>
                  <strong style="color:var(--color-primario);">
                    {{ parametrosStore.company.simbolo }}{{ parseFloat(e.unit_price).toFixed(2) }}
                  </strong>
                </td>
                <td>
                  <span v-if="parseFloat(e.discount_percentage) > 0" style="color:#27ae60; font-weight:600;">
                    -{{ e.discount_percentage }}%
                  </span>
                  <span v-else style="color:#27ae60; font-weight:600;">
                    -{{ parametrosStore.company.simbolo }}{{ (parseFloat(productoSeleccionado.sale_price) - parseFloat(e.unit_price)).toFixed(2) }} /u
                  </span>
                </td>
                <td>
                  <span v-if="escalaEsActiva(e)" class="badge badge-success">✓ Aplicada</span>
                  <span v-else style="color:var(--text-muted);">Inactiva</span>
                </td>
              </tr>
              <tr v-if="!escalas.length">
                <td colspan="4" style="text-align:center; color:var(--text-muted); padding:1rem;">
                  Sin escalas por volumen configuradas. Se aplica price normal.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Panel Derecho: Simulación de Cotización -->
      <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; height:fit-content;">
        <div>
          <h2 style="font-size:1.1rem; font-weight:700; margin-bottom:1.25rem; display:flex; align-items:center; gap:0.5rem;">
            🧮 Simulación de Compra
          </h2>

          <!-- Selector de Cantidad -->
          <div class="form-group" style="margin-bottom:1.5rem;">
            <label style="font-weight:600; font-size:0.875rem;">Cantidad a Cotizar</label>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.35rem;">
              <button class="btn-cant" @click="cambiarCantidad(-1)">−</button>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                class="input"
                style="text-align:center; font-size:1.2rem; font-weight:700;"
                @input="recalcular"
              />
              <button class="btn-cant" @click="cambiarCantidad(1)">+</button>
            </div>
          </div>

          <!-- Resumen de Totales -->
          <div v-if="quotation" class="resumen-quotation">
            <div class="cotiz-row">
              <span>Precio Base Unitario:</span>
              <span>{{ parametrosStore.company.simbolo }}{{ quotation.base_price }}</span>
            </div>

            <div class="cotiz-row" style="color:var(--color-primario); font-weight:600;">
              <span>PVP Aplicado (por volumen):</span>
              <span>{{ parametrosStore.company.simbolo }}{{ quotation.applied_unit_price }}</span>
            </div>

            <div v-if="parseFloat(quotation.total_savings) > 0" class="cotiz-row ahorro-box">
              <span>🎉 Ahorro Total:</span>
              <span>-{{ parametrosStore.company.simbolo }}{{ quotation.total_savings }} ({{ quotation.savings_percentage }}%)</span>
            </div>

            <hr style="border:none; border-top:1px solid var(--border); margin:0.75rem 0;" />

            <div class="cotiz-row">
              <span>Subtotal:</span>
              <span>{{ parametrosStore.company.simbolo }}{{ quotation.subtotal }}</span>
            </div>

            <div class="cotiz-row">
              <span>IVA ({{ quotation.vat_rate }}%):</span>
              <span>{{ parametrosStore.company.simbolo }}{{ quotation.vat_amount }}</span>
            </div>

            <div class="cotiz-row total-big">
              <span>TOTAL ESTIMADO:</span>
              <span>{{ parametrosStore.company.simbolo }}{{ quotation.total }}</span>
            </div>
          </div>

          <div v-else style="text-align:center; color:var(--text-muted); padding:2rem;">
            Selecciona un product para calcular el total
          </div>
        </div>

        <div v-if="quotation" style="margin-top:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
          <button class="btn btn-primary" style="width:100%; font-size:1rem; padding:0.75rem;" @click="irAlPOS">
            🛒 Ir al POS con este product
          </button>
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

const router = useRouter()
const parametrosStore = useParametrosStore()

const busqueda = ref('')
const resultadosBusqueda = ref([])
const mostrarDropdown = ref(false)
const productoSeleccionado = ref(null)
const escalas = ref([])
const quantity = ref(1)
const quotation = ref(null)
let timer = null

onMounted(async () => {
  await buscarProductos()
})

async function buscarProductos() {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    try {
      const { data } = await api.get('/inventario/products/', {
        params: busqueda.value ? { q: busqueda.value } : {}
      })
      resultadosBusqueda.value = data.slice(0, 8)
    } catch {
      resultadosBusqueda.value = []
    }
  }, 200)
}

async function seleccionarProducto(p) {
  productoSeleccionado.value = p
  busqueda.value = p.name
  mostrarDropdown.value = false
  
  // Cargar escalas
  try {
    const { data } = await api.get(`/inventory/products/${p.id}/discount-tiers/`)
    escalas.value = data
  } catch {
    escalas.value = []
  }

  await recalcular()
}

async function recalcular() {
  if (!productoSeleccionado.value || quantity.value < 1) return
  try {
    const { data } = await api.post('/inventario/quotation/', {
      product_id: productoSeleccionado.value.id,
      quantity: quantity.value
    })
    quotation.value = data
  } catch (e) {
    console.error(e)
  }
}

function cambiarCantidad(delta) {
  if (quantity.value + delta >= 1) {
    quantity.value += delta
    recalcular()
  }
}

function escalaEsActiva(e) {
  if (!quotation.value || !quotation.value.applied_rule) return false
  return quotation.value.applied_rule.id === e.id
}

function irAlPOS() {
  router.push('/pos')
}
</script>

<style scoped>
.dropdown-cotizador {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  max-height: 250px;
  overflow-y: auto;
}
.dropdown-item {
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.dropdown-item:hover {
  background: #f0f7ff;
}
.stock-badge {
  background: #e3f2fd;
  color: var(--color-primario);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.stock-badge.sin-stock {
  background: #ffebee;
  color: #c62828;
}

.btn-cant {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-cant:hover {
  border-color: var(--color-primario);
  color: var(--color-primario);
}

.resumen-quotation {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.cotiz-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}
.ahorro-box {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  margin: 0.25rem 0;
}
.total-big {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primario);
  margin-top: 0.5rem;
}

.fila-activa {
  background: #e3f2fd !important;
  font-weight: 600;
}
</style>

