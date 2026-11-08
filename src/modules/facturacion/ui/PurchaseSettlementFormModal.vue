<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="cerrar">
    <div class="modal modal-lg" style="max-width:880px; width:95%; max-height:92vh; overflow-y:auto;">
      <button
        class="btn"
        style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;"
        @click="cerrar"
        title="Cerrar (Esc)"
      >
        ✕
      </button>

      <div style="margin-bottom:1.25rem;">
        <h3 style="margin:0 0 0.25rem 0;">🧾 Nueva Liquidación de Compra y Servicios (Tipo 03 SRI)</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">
          Comprobante electrónico emitido por la empresa para deducir compras a personas naturales sin RUC (Art. 43 RALRTI).
        </p>
      </div>

      <!-- Alerta Legal SRI de Uso Obligatorio -->
      <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:0.75rem 1rem; border-radius:4px; margin-bottom:1.25rem; font-size:0.8rem; color:#1e40af;">
        <i class="fa-solid fa-circle-info" style="margin-right:0.35rem;"></i>
        <strong>Normativa SRI Ecuador:</strong> Las Liquidaciones de Compra únicamente proceden cuando el proveedor o prestador del servicio es una <strong>persona natural que no posee RUC</strong> (cédula o pasaporte). Si la persona tiene RUC, está obligada a emitir una factura.
      </div>

      <form @submit.prevent="guardar">
        <!-- SECCIÓN 1: DATOS DEL PROVEEDOR -->
        <div style="font-size:0.85rem; font-weight:700; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:0.35rem; margin-bottom:0.75rem;">
          1. Datos del Proveedor (Sin RUC)
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; margin-bottom:1rem;">
          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">
              Cédula / Pasaporte *
            </label>
            <input
              v-model="form.supplier_identification"
              type="text"
              class="input"
              style="width:100%; font-family:monospace;"
              placeholder="1712345678 (10 dígitos)"
              @input="onCedulaInput"
              required
            />
            <span v-if="errorCedula" style="font-size:0.75rem; color:#ef4444; display:block; margin-top:0.25rem;">
              {{ errorCedula }}
            </span>
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">
              Nombre Completo / Razón Social *
            </label>
            <input
              v-model="form.supplier"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="JUAN PEREZ (Artesano / Productor Agrícola / Jornalero)"
              required
            />
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">
              Dirección del Proveedor
            </label>
            <input
              v-model="form.supplier_address"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="Parroquia Rural, Sector La Primavera"
            />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">
              Correo Electrónico (para RIDE)
            </label>
            <input
              v-model="form.supplier_email"
              type="email"
              class="input"
              style="width:100%;"
              placeholder="proveedor@correo.com"
            />
          </div>
        </div>

        <!-- SECCIÓN 2: DATOS DEL COMPROBANTE -->
        <div style="font-size:0.85rem; font-weight:700; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:0.35rem; margin-bottom:0.75rem;">
          2. Emisión y Forma de Pago
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; margin-bottom:1rem;">
          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Fecha de Emisión *</label>
            <input v-model="form.date" type="date" class="input" style="width:100%;" required />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Forma de Pago SRI *</label>
            <select v-model="form.payment_method" class="input" style="width:100%;" required>
              <option value="01">01 - Sin utilización del sistema financiero (Efectivo)</option>
              <option value="20">20 - Otros con utilización del sistema financiero (Transferencia/Cheque)</option>
              <option value="16">16 - Tarjeta de débito</option>
              <option value="19">19 - Tarjeta de crédito</option>
            </select>
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Observaciones / Notas</label>
            <input
              v-model="form.notes"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="Compra de productos agrícolas en pie de finca"
            />
          </div>
        </div>

        <!-- SECCIÓN 3: BIENES Y SERVICIOS -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <div style="font-size:0.85rem; font-weight:700; color:#1e293b;">
            3. Bienes Adquiridos o Servicios Prestados
          </div>
          <button type="button" class="btn btn-outline" style="font-size:0.75rem; padding:0.25rem 0.6rem;" @click="agregarItem">
            <i class="fa-solid fa-plus" style="margin-right:0.25rem;"></i>
            Agregar Ítem
          </button>
        </div>

        <div class="card" style="padding:0; overflow:hidden; margin-bottom:1rem;">
          <table class="table" style="font-size:0.85rem;">
            <thead>
              <tr>
                <th style="width:100px;">Código</th>
                <th>Descripción *</th>
                <th style="width:75px;">Cant. *</th>
                <th style="width:95px;">P. Unit. *</th>
                <th style="width:80px;">Tarifa IVA</th>
                <th style="width:85px;">Desc.</th>
                <th style="width:90px; text-align:right;">Subtotal</th>
                <th style="width:40px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in form.items" :key="idx">
                <td>
                  <input
                    v-model="it.product_code"
                    type="text"
                    class="input"
                    style="width:100%; font-family:monospace; padding:0.25rem 0.4rem;"
                    placeholder="COD-01"
                  />
                </td>
                <td>
                  <input
                    v-model="it.description"
                    type="text"
                    class="input"
                    style="width:100%; padding:0.25rem 0.4rem;"
                    placeholder="Descripción del bien o servicio"
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
                <td>
                  <input
                    v-model.number="it.unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    class="input"
                    style="width:100%; padding:0.25rem 0.4rem; text-align:right;"
                    required
                  />
                </td>
                <td>
                  <select v-model="it.vat_rate" class="input" style="width:100%; padding:0.25rem 0.2rem; font-size:0.8rem;">
                    <option value="15">15%</option>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                  </select>
                </td>
                <td>
                  <input
                    v-model.number="it.discount"
                    type="number"
                    step="0.01"
                    min="0"
                    class="input"
                    style="width:100%; padding:0.25rem 0.4rem; text-align:right;"
                  />
                </td>
                <td style="text-align:right; font-weight:600; font-family:monospace;">
                  ${{ formatMoney(calcularSubtotalItem(it)) }}
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

        <!-- Resumen de Totales -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
          <div style="width:280px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:0.75rem; font-size:0.85rem; display:flex; flex-direction:column; gap:0.35rem;">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748b;">Subtotal 0%:</span>
              <span style="font-family:monospace;">${{ formatMoney(totales.subtotal0) }}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748b;">Subtotal IVA:</span>
              <span style="font-family:monospace;">${{ formatMoney(totales.subtotalIva) }}</span>
            </div>
            <div v-if="totales.descuento > 0" style="display:flex; justify-content:space-between; color:#ef4444;">
              <span>Descuento:</span>
              <span style="font-family:monospace;">-${{ formatMoney(totales.descuento) }}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748b;">IVA Total:</span>
              <span style="font-family:monospace;">${{ formatMoney(totales.iva) }}</span>
            </div>
            <div style="border-top:2px solid #cbd5e1; padding-top:0.35rem; margin-top:0.25rem; display:flex; justify-content:space-between; font-weight:bold; font-size:1rem; color:#0f172a;">
              <span>Total a Liquidar:</span>
              <span style="font-family:monospace;">${{ formatMoney(totales.total) }}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid #e2e8f0; padding-top:1rem;">
          <button type="button" class="btn btn-outline" @click="cerrar" :disabled="procesando">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="procesando || !!errorCedula">
            <i class="fa-solid fa-spinner fa-spin" v-if="procesando" style="margin-right:0.25rem;"></i>
            Guardar Liquidación Borrador
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'

const props = defineProps({
  show: Boolean,
  procesando: Boolean,
})

const emit = defineEmits(['close', 'submit'])

const todayStr = new Date().toISOString().substring(0, 10)
const errorCedula = ref('')

const form = reactive({
  supplier: '',
  supplier_identification: '',
  supplier_id_type: '05',
  supplier_address: '',
  supplier_email: '',
  date: todayStr,
  payment_method: '01',
  notes: '',
  items: [
    { product_code: '', description: '', quantity: 1, unit_price: 0, discount: 0, vat_rate: '15' }
  ]
})

const onCedulaInput = () => {
  const id = form.supplier_identification.trim()
  if (id.length === 13) {
    errorCedula.value = '¡Atención SRI! Las liquidaciones de compra NO pueden emitirse a proveedores con RUC (13 dígitos). El proveedor debe facturar.'
  } else if (id.length > 0 && id.length < 10) {
    errorCedula.value = 'La cédula ecuatoriana debe tener 10 dígitos (o pasaporte).'
  } else {
    errorCedula.value = ''
  }
}

const calcularSubtotalItem = (it) => {
  const qty = Number(it.quantity) || 0
  const price = Number(it.unit_price) || 0
  const disc = Number(it.discount) || 0
  return Math.max(0, (qty * price) - disc)
}

const totales = computed(() => {
  let sub0 = 0
  let subIva = 0
  let descTotal = 0
  let ivaTotal = 0

  for (const it of form.items) {
    const sub = calcularSubtotalItem(it)
    const rate = Number(it.vat_rate) || 0
    descTotal += Number(it.discount) || 0

    if (rate === 0) {
      sub0 += sub
    } else {
      subIva += sub
      ivaTotal += (sub * (rate / 100))
    }
  }

  return {
    subtotal0: Math.round(sub0 * 100) / 100,
    subtotalIva: Math.round(subIva * 100) / 100,
    descuento: Math.round(descTotal * 100) / 100,
    iva: Math.round(ivaTotal * 100) / 100,
    total: Math.round((sub0 + subIva + ivaTotal) * 100) / 100,
  }
})

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const agregarItem = () => {
  form.items.push({
    product_code: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    vat_rate: '15'
  })
}

const eliminarItem = (index) => {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
  }
}

const resetForm = () => {
  form.supplier = ''
  form.supplier_identification = ''
  form.supplier_id_type = '05'
  form.supplier_address = ''
  form.supplier_email = ''
  form.date = todayStr
  form.payment_method = '01'
  form.notes = ''
  form.items = [{ product_code: '', description: '', quantity: 1, unit_price: 0, discount: 0, vat_rate: '15' }]
  errorCedula.value = ''
}

const cerrar = () => {
  resetForm()
  emit('close')
}

const guardar = () => {
  if (errorCedula.value) return
  emit('submit', { ...form })
}
</script>
