<template>
  <div class="modal-overlay">
    <div class="modal" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
      <h3 style="margin-bottom:1.5rem">Nueva Orden de Trabajo</h3>

      <!-- Alerta de Caja Personalizada -->
      <div v-if="errorCaja" style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px; display: flex; gap: 1rem; align-items: flex-start;">
        <span style="font-size: 1.5rem; color: #EF4444;">⚠️</span>
        <div>
          <h4 style="color: #991B1B; margin-top: 0; margin-bottom: 0.5rem; font-size: 1rem;">Acción Bloqueada: Caja Cerrada</h4>
          <p style="color: #B91C1C; margin: 0; font-size: 0.9rem;">
            No puedes registrar órdenes de trabajo porque no has iniciado tu turno de caja. 
            Por favor, dirígete al módulo POS y <strong>Abre tu Caja</strong> para poder descontar repuestos físicos y recibir dinero por abonos.
          </p>
        </div>
      </div>

      <form @submit.prevent="guardarOrden">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          
          <div class="form-group" style="position: relative;">
            <label>Cliente *</label>
            
            <!-- "Select" button -->
            <div 
              class="input" 
              style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #fff;"
            >
              <div @click="toggleDropdown" style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                <span v-if="form.customer_name" style="font-weight: 500;">{{ form.customer_name }}</span>
                <span v-else style="color: var(--text-muted)">Seleccione un cliente...</span>
                <span style="font-size: 0.8rem; color: #888; margin-right: 0.5rem;">▼</span>
              </div>
              <span v-if="form.customer_name" @click="form.customer_name=''; form.customer_id=''" style="color: red; font-size: 1rem; padding: 0 0.5rem; cursor: pointer;">×</span>
            </div>

            <!-- Dropdown -->
            <div 
              v-if="dropdownAbierto" 
              class="card" 
              style="position: absolute; z-index: 100; width: 100%; padding: 0.5rem; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
            >
              <!-- Search Input inside dropdown -->
              <input 
                type="text" 
                class="input" 
                placeholder="Buscar por Nombre, RFC/Cédula o Email..." 
                v-model="busquedaCliente"
                ref="searchInput"
                style="margin-bottom: 0.5rem;"
                @blur="ocultarSugerenciasConRetraso"
              />
              
              <div style="max-height: 200px; overflow-y: auto;">
                <div 
                  v-for="c in clientesFiltrados" 
                  :key="c.id" 
                  @click="seleccionarCliente(c)"
                  style="padding: 0.5rem; cursor: pointer; border-bottom: 1px solid var(--border-color);"
                  onmouseover="this.style.backgroundColor='#f1f5f9'"
                  onmouseout="this.style.backgroundColor=''"
                >
                  <div style="font-weight: bold">{{ c.name }}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted)">
                    <span v-if="c.rfc">Identificación: {{ c.rfc }}</span>
                    <span v-if="c.email"> | ✉ {{ c.email }}</span>
                  </div>
                </div>
                <div v-if="clientesFiltrados.length === 0" style="padding: 0.5rem; text-align: center; color: var(--text-muted);">
                  No se encontraron clientes.
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Tipo de Dispositivo *</label>
            <select v-model="form.device_type" class="input" required>
              <option value="" disabled selected>-- Seleccione Tipo --</option>
              <option v-for="t in tiposDispositivos" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Modelo del Dispositivo *</label>
            <input v-model="form.device_model" type="text" class="input" placeholder="Ej. Samsung S24, iPhone 13" required />
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>IMEI o Nro. Serie *</label>
            <input v-model="form.device_identifier" type="text" class="input" placeholder="IMEI / S.N" required />
          </div>
          <div class="form-group">
            <label>Abono Inicial ($)</label>
            <input v-model.number="form.advance_payment" type="number" step="0.01" class="input" placeholder="0.00" />
          </div>
        </div>

        <div class="form-group">
          <label>Falla Reportada *</label>
          <textarea v-model="form.reported_fault" class="input" style="height: 80px" placeholder="¿Qué le sucede al dispositivo?" required></textarea>
        </div>

        <div class="form-group">
          <label>Condiciones Físicas</label>
          <textarea v-model="form.physical_conditions" class="input" style="height: 60px" placeholder="Rayones, pantalla trizada, falta de tornillos..."></textarea>
        </div>
        
        <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
          <h4 style="margin-bottom: 1rem;">Servicios y Repuestos</h4>
          
          <div style="display:flex; gap: 0.5rem; margin-bottom: 1rem;">
            <select v-model="itemNuevo.product_id" class="input" style="flex: 1;" @change="onProductoChange">
              <option value="">-- Mano de Obra Libre --</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.name }} (Stock: {{ p.stock }})</option>
            </select>
            
            <input v-model="itemNuevo.description" type="text" class="input" style="flex: 1;" placeholder="Descripción / Detalle" />
            <input v-model.number="itemNuevo.quantity" type="number" class="input" style="width: 80px;" placeholder="Cant." />
            <input v-model.number="itemNuevo.unit_price" type="number" step="0.01" class="input" style="width: 100px;" placeholder="Precio" />
            
            <button type="button" class="btn btn-primary" @click="agregarItem">➕</button>
          </div>
          
          <table class="table" v-if="form.items.length > 0">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:right">Cant.</th>
                <th style="text-align:right">P.U</th>
                <th style="text-align:right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in form.items" :key="idx">
                <td>{{ item.description }}</td>
                <td style="text-align:right">{{ item.quantity }}</td>
                <td style="text-align:right">${{ Number(item.unit_price).toFixed(2) }}</td>
                <td style="text-align:right">${{ (Number(item.quantity) * Number(item.unit_price)).toFixed(2) }}</td>
                <td style="text-align:right">
                  <button type="button" @click="form.items.splice(idx, 1)" class="btn btn-outline" style="color:red; border-color:transparent; padding: 2px 8px">❌</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:2rem">
          <button type="button" class="btn btn-outline" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Crear Orden' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../../shared/api'
import { useParametrosStore } from '../../../stores/parametros'

const parametrosStore = useParametrosStore()

const emit = defineEmits(['close', 'saved'])

const guardando = ref(false)
const errorCaja = ref(false)
const clientes = ref([])
const productos = ref([])

const busquedaCliente = ref('')
const dropdownAbierto = ref(false)
const searchInput = ref(null)

const toggleDropdown = () => {
  dropdownAbierto.value = !dropdownAbierto.value
  if (dropdownAbierto.value) {
    // Focus search input on open
    setTimeout(() => {
      if (searchInput.value) searchInput.value.focus()
    }, 50)
  }
}

const tiposDispositivos = computed(() => {
  const param = parametrosStore.todos.technical_service?.tipos_dispositivos?.value
  if (!param) return ['Celular', 'Computadora', 'Tablet', 'Consola']
  return param.split(',').map(s => s.trim()).filter(s => s)
})

const form = ref({
  customer_id: '',
  customer_name: '',
  device_type: '',
  device_model: '',
  device_identifier: '',
  reported_fault: '',
  physical_conditions: '',
  advance_payment: 0,
  items: []
})

const itemNuevo = ref({
  product_id: '',
  description: '',
  quantity: 1,
  unit_price: 0
})

onMounted(async () => {
  try {
    await parametrosStore.cargar()
    const resCli = await api.get('/ventas/customers/')
    clientes.value = resCli.data
    
    // Intenta cargar productos del inventario
    try {
      const resProd = await api.get('/inventory/products/')
      productos.value = resProd.data
    } catch(e) {
      console.warn('Módulo de inventario no disponible o vacío')
    }
  } catch (error) {
    console.error('Error cargando dependencias', error)
  }
})

const clientesFiltrados = computed(() => {
  if (!busquedaCliente.value) return clientes.value.slice(0, 5)
  const b = busquedaCliente.value.toLowerCase()
  return clientes.value.filter(c => 
    (c.name || '').toLowerCase().includes(b) || 
    (c.rfc || '').toLowerCase().includes(b) || 
    (c.email || '').toLowerCase().includes(b)
  ).slice(0, 10)
})

const ocultarSugerenciasConRetraso = () => {
  setTimeout(() => {
    dropdownAbierto.value = false
  }, 200)
}

const seleccionarCliente = (cli) => {
  form.value.customer_id = cli.id
  form.value.customer_name = cli.name
  busquedaCliente.value = '' // Clear search
  dropdownAbierto.value = false
}

const onProductoChange = () => {
  if (!itemNuevo.value.product_id) {
    itemNuevo.value.description = ''
    itemNuevo.value.unit_price = 0
    return
  }
  const p = productos.value.find(x => x.id === itemNuevo.value.product_id)
  if (p) {
    itemNuevo.value.description = p.name
    itemNuevo.value.unit_price = p.sale_price || p.price || 0
  }
}

const agregarItem = () => {
  if (!itemNuevo.value.description) {
    alert('Debe ingresar una descripción o detalle para agregar el item.')
    return
  }
  form.value.items.push({
    product_id: itemNuevo.value.product_id || null,
    description: itemNuevo.value.description,
    quantity: itemNuevo.value.quantity,
    unit_price: itemNuevo.value.unit_price
  })
  
  itemNuevo.value = { product_id: '', description: '', quantity: 1, unit_price: 0 }
}

const guardarOrden = async () => {
  if (!form.value.customer_id) {
    alert('Debe seleccionar un cliente de la lista.')
    return
  }
  
  guardando.value = true
  errorCaja.value = false // Reset error on new attempt
  
  try {
    await api.post('/technical-service/orders/', form.value)
    emit('saved')
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message
    if (typeof errorMsg === 'string' && errorMsg.includes('Debe abrir caja')) {
      errorCaja.value = true
      // Scroll to top to see the error banner
      const modalElement = document.querySelector('.modal')
      if (modalElement) modalElement.scrollTop = 0
    } else {
      alert('Error al guardar: ' + JSON.stringify(error.response?.data || error.message))
    }
  }
  guardando.value = false
}
</script>
