<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="cerrar">
    <div class="modal modal-lg" style="max-width:900px; width:95%; max-height:92vh; overflow-y:auto;">
      <button
        class="btn"
        style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;"
        @click="cerrar"
        title="Cerrar (Esc)"
      >
        ✕
      </button>

      <div style="margin-bottom:1.25rem;">
        <h3 style="margin:0 0 0.25rem 0;">🚚 Nueva Guía de Remisión (Tipo 06 SRI)</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">
          Comprobante electrónico legal para amparar el traslado de mercadería y control en carreteras (SRI / CTE).
        </p>
      </div>

      <!-- Selector opcional de Factura de Venta autorizada -->
      <div class="card" style="padding:0.75rem 1rem; margin-bottom:1.25rem; background:var(--bg-subtle, #f8fafc); border:1px solid #e2e8f0;">
        <label style="display:block; font-size:0.8rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">
          <i class="fa-solid fa-file-invoice-dollar" style="margin-right:0.25rem; color:#2563eb;"></i>
          Auto-rellenar desde Factura de Venta autorizada (Opcional)
        </label>
        <select v-model="facturaSeleccionadaId" class="input" style="width:100%; font-size:0.85rem;" @change="onFacturaChange">
          <option value="">-- Ingreso manual de destinatario y mercadería --</option>
          <option v-for="f in facturasDisponibles" :key="f.id" :value="f.id">
            Fac: {{ f.number || 'S/N' }} - {{ f.client }} (Total: ${{ f.total }})
          </option>
        </select>
      </div>

      <form @submit.prevent="guardar">
        <!-- SECCIÓN 1: DATOS DEL TRASLADO Y TRANSPORTISTA -->
        <div style="font-size:0.85rem; font-weight:700; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:0.35rem; margin-bottom:0.75rem;">
          1. Datos del Transportista y Vehículo
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; margin-bottom:1rem;">
          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">RUC / Cédula Transportista *</label>
            <input
              v-model="form.carrier_ruc"
              type="text"
              class="input"
              style="width:100%; font-family:monospace;"
              placeholder="1790011223001"
              required
            />
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Razón Social / Nombre del Transportista *</label>
            <input
              v-model="form.carrier_name"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="TRANSPORTE PESADO S.A. o Nombre Chofer"
              required
            />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Placa del Vehículo *</label>
            <input
              v-model="form.vehicle_plate"
              type="text"
              class="input"
              style="width:100%; font-family:monospace; text-transform:uppercase;"
              placeholder="PBA-1234"
              required
            />
          </div>
        </div>

        <!-- SECCIÓN 2: RUTA Y MOTIVO -->
        <div style="font-size:0.85rem; font-weight:700; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:0.35rem; margin-bottom:0.75rem;">
          2. Ruta, Motivo y Fechas de Traslado
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:0.75rem; margin-bottom:1rem;">
          <div style="grid-column: span 2;">
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Dirección de Partida *</label>
            <input
              v-model="form.starting_address"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="Av. Principal N34-123 y Secundaria, Bodega Central"
              required
            />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Motivo del Traslado *</label>
            <select v-model="form.transfer_reason" class="input" style="width:100%;" required>
              <option value="Venta">Venta</option>
              <option value="Traslado entre establecimientos">Traslado entre bodegas/sucursales</option>
              <option value="Exportación">Exportación</option>
              <option value="Importación">Importación</option>
              <option value="Devolución">Devolución</option>
              <option value="Consignación">Consignación</option>
              <option value="Transformación">Transformación / Maquila</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Ruta (Opcional)</label>
            <input
              v-model="form.route"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="Quito - Guayaquil (Vía Santo Domingo)"
            />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Fecha Emisión *</label>
            <input v-model="form.date_emission" type="date" class="input" style="width:100%;" required />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Inicio Traslado *</label>
            <input v-model="form.start_date" type="date" class="input" style="width:100%;" required />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Fin Traslado *</label>
            <input v-model="form.end_date" type="date" class="input" style="width:100%;" required />
          </div>
        </div>

        <!-- SECCIÓN 3: DESTINATARIO Y SUSTENTO -->
        <div style="font-size:0.85rem; font-weight:700; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:0.35rem; margin-bottom:0.75rem;">
          3. Destinatario y Comprobante de Sustento
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; margin-bottom:1rem;">
          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">RUC / Cédula Destinatario *</label>
            <input
              v-model="form.recipient_id"
              type="text"
              class="input"
              style="width:100%; font-family:monospace;"
              placeholder="1791234567001"
              required
            />
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Razón Social Destinatario *</label>
            <input
              v-model="form.recipient_name"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="CLIENTE DISTRIBUIDOR CIA. LTDA."
              required
            />
          </div>

          <div style="grid-column: span 3;">
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Dirección de Destino *</label>
            <input
              v-model="form.recipient_address"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="Calle Los Almendros y Av. 9 de Octubre, Bodega 4"
              required
            />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">N° Factura Sustento (Venta)</label>
            <input
              v-model="form.origin_doc_number"
              type="text"
              class="input"
              style="width:100%; font-family:monospace;"
              placeholder="001-001-000012345"
            />
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">N° Autorización SRI Factura</label>
            <input
              v-model="form.origin_doc_auth"
              type="text"
              class="input"
              style="width:100%; font-family:monospace; font-size:0.75rem;"
              placeholder="Clave de acceso de 49 dígitos"
            />
          </div>
        </div>

        <!-- SECCIÓN 4: MERCADERÍA / ÍTEMS -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <div style="font-size:0.85rem; font-weight:700; color:#1e293b;">
            4. Mercadería a Trasladar
          </div>
          <button type="button" class="btn btn-outline" style="font-size:0.75rem; padding:0.25rem 0.6rem;" @click="agregarItem">
            <i class="fa-solid fa-plus" style="margin-right:0.25rem;"></i>
            Agregar Mercadería
          </button>
        </div>

        <div class="card" style="padding:0; overflow:hidden; margin-bottom:1.5rem;">
          <table class="table" style="font-size:0.85rem;">
            <thead>
              <tr>
                <th style="width:140px;">Código</th>
                <th>Descripción de la Mercadería *</th>
                <th style="width:100px;">Cantidad *</th>
                <th style="width:50px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in form.items" :key="idx">
                <td>
                  <input
                    v-model="it.internal_code"
                    type="text"
                    class="input"
                    style="width:100%; font-family:monospace; padding:0.25rem 0.4rem;"
                    placeholder="PROD-001"
                  />
                </td>
                <td>
                  <input
                    v-model="it.description"
                    type="text"
                    class="input"
                    style="width:100%; padding:0.25rem 0.4rem;"
                    placeholder="Descripción detallada de la mercadería o bultos"
                    required
                  />
                </td>
                <td>
                  <input
                    v-model.number="it.quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    class="input"
                    style="width:100%; padding:0.25rem 0.4rem; text-align:right;"
                    required
                  />
                </td>
                <td style="text-align:center;">
                  <button
                    type="button"
                    class="btn btn-danger"
                    style="padding:0.2rem 0.4rem; font-size:0.75rem;"
                    @click="eliminarItem(idx)"
                    :disabled="form.items.length <= 1"
                    title="Eliminar ítem"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid #e2e8f0; padding-top:1rem;">
          <button type="button" class="btn btn-outline" @click="cerrar" :disabled="procesando">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="procesando">
            <i class="fa-solid fa-spinner fa-spin" v-if="procesando" style="margin-right:0.25rem;"></i>
            Guardar Guía Borrador
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import api from '@/shared/api'

const props = defineProps({
  show: Boolean,
  procesando: Boolean,
})

const emit = defineEmits(['close', 'submit'])

const todayStr = new Date().toISOString().substring(0, 10)
const facturasDisponibles = ref([])
const facturaSeleccionadaId = ref('')

const form = reactive({
  carrier_ruc: '',
  carrier_name: '',
  carrier_id_type: '04',
  vehicle_plate: '',
  starting_address: '',
  route: '',
  date_emission: todayStr,
  start_date: todayStr,
  end_date: todayStr,
  transfer_reason: 'Venta',
  recipient_id: '',
  recipient_name: '',
  recipient_id_type: '04',
  recipient_address: '',
  origin_doc_type: '01',
  origin_doc_number: '',
  origin_doc_auth: '',
  origin_doc_date: null,
  items: [
    { internal_code: '', description: '', quantity: 1 }
  ]
})

const resetForm = () => {
  form.carrier_ruc = ''
  form.carrier_name = ''
  form.carrier_id_type = '04'
  form.vehicle_plate = ''
  form.starting_address = ''
  form.route = ''
  form.date_emission = todayStr
  form.start_date = todayStr
  form.end_date = todayStr
  form.transfer_reason = 'Venta'
  form.recipient_id = ''
  form.recipient_name = ''
  form.recipient_id_type = '04'
  form.recipient_address = ''
  form.origin_doc_type = '01'
  form.origin_doc_number = ''
  form.origin_doc_auth = ''
  form.origin_doc_date = null
  form.items = [{ internal_code: '', description: '', quantity: 1 }]
  facturaSeleccionadaId.value = ''
}

const cargarFacturas = async () => {
  try {
    const res = await api.get('/facturacion/?limit=50')
    const list = res.data?.data || res.data || []
    facturasDisponibles.value = list.filter(f => f.status === 'authorized' || f.status === 'sent_to_sri' || f.status === 'draft')
  } catch (e) {
    console.error('Error al cargar facturas para auto-llenado de guía:', e)
  }
}

const onFacturaChange = () => {
  if (!facturaSeleccionadaId.value) return
  const f = facturasDisponibles.value.find(x => x.id === facturaSeleccionadaId.value)
  if (!f) return

  form.recipient_name = f.client || ''
  form.recipient_id = f.client_identification || ''
  form.recipient_id_type = (f.client_identification && f.client_identification.length === 10) ? '05' : '04'
  form.origin_doc_number = f.number || ''
  form.origin_doc_auth = f.authorization_number || f.access_key || ''
  form.origin_doc_date = f.date || null
  form.transfer_reason = 'Venta'

  if (f.items && f.items.length) {
    form.items = f.items.map(it => ({
      internal_code: it.main_code || it.internal_code || '',
      description: it.description || '',
      quantity: Number(it.quantity) || 1
    }))
  }
}

const agregarItem = () => {
  form.items.push({ internal_code: '', description: '', quantity: 1 })
}

const eliminarItem = (index) => {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
  }
}

const cerrar = () => {
  resetForm()
  emit('close')
}

const guardar = () => {
  emit('submit', { ...form })
}

watch(() => props.show, (val) => {
  if (val) {
    cargarFacturas()
  }
})

onMounted(() => {
  if (props.show) {
    cargarFacturas()
  }
})
</script>
