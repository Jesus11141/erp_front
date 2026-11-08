<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="cerrar">
    <div class="modal modal-lg" style="max-width:850px; width:95%; max-height:90vh; overflow-y:auto;">
      <button
        class="btn"
        style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); padding:0;"
        @click="cerrar"
        title="Cerrar (Esc)"
      >
        ✕
      </button>

      <div style="margin-bottom:1.25rem;">
        <h3 style="margin:0 0 0.25rem 0;">Nuevo Comprobante de Retención (Tipo 07)</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">
          Emite una retención en la fuente (Renta / IVA) sobre facturas de compra conforme al SRI
        </p>
      </div>

      <!-- Selector opcional de Factura de Compra del ERP -->
      <div class="card" style="padding:0.75rem 1rem; margin-bottom:1.25rem; background:var(--bg-subtle, #f8fafc); border:1px solid #e2e8f0;">
        <label style="display:block; font-size:0.8rem; font-weight:600; color:#475569; margin-bottom:0.35rem;">
          <i class="fa-solid fa-file-invoice" style="margin-right:0.25rem;"></i>
          Auto-rellenar desde Factura de Compra registrada (Opcional)
        </label>
        <select v-model="facturaCompraSeleccionada" class="input" style="width:100%; font-size:0.85rem;" @change="onCompraChange">
          <option value="">-- Ingreso manual de datos de proveedor y factura --</option>
          <option v-for="c in comprasDisponibles" :key="c.id" :value="c.id">
            Fac: {{ c.invoice_number || 'S/N' }} - {{ c.supplier_name }} (Subtotal: ${{ c.subtotal_0 + c.subtotal_iva }} | IVA: ${{ c.vat }})
          </option>
        </select>
      </div>

      <form @submit.prevent="guardar">
        <!-- Datos de Proveedor y Factura -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1rem;">
          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">RUC / Cédula Proveedor *</label>
            <input
              v-model="form.supplier_identification"
              type="text"
              class="input"
              style="width:100%; font-family:monospace;"
              placeholder="1790011223001"
              required
            />
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Razón Social Proveedor *</label>
            <input
              v-model="form.supplier"
              type="text"
              class="input"
              style="width:100%;"
              placeholder="NOMBRE O RAZÓN SOCIAL DEL PROVEEDOR"
              required
            />
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">N° Factura de Sustento *</label>
            <input
              v-model="form.origin_invoice_number"
              type="text"
              class="input"
              style="width:100%; font-family:monospace;"
              placeholder="001-001-000012345"
              required
            />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Período Fiscal (MM/AAAA) *</label>
            <input
              v-model="form.fiscal_period"
              type="text"
              class="input"
              style="width:100%; font-family:monospace;"
              placeholder="03/2026"
              required
            />
          </div>

          <div>
            <label style="display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem;">Fecha de Emisión *</label>
            <input
              v-model="form.date"
              type="date"
              class="input"
              style="width:100%;"
              required
            />
          </div>
        </div>

        <!-- Tabla de Impuestos Retenidos -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <h4 style="margin:0; font-size:0.95rem;">Impuestos Retenidos (Líneas de Retención)</h4>
          <button type="button" class="btn btn-outline" style="font-size:0.75rem; padding:0.3rem 0.6rem;" @click="agregarItem">
            + Agregar Impuesto
          </button>
        </div>

        <div class="card" style="padding:0; overflow-x:auto; margin-bottom:1.25rem;">
          <table class="table" style="font-size:0.85rem; margin:0;">
            <thead>
              <tr>
                <th style="min-width:110px;">Impuesto</th>
                <th style="min-width:240px;">Concepto / Código SRI</th>
                <th style="width:110px;">Base Imponible</th>
                <th style="width:90px;">% Retención</th>
                <th style="width:110px;">Valor Retenido</th>
                <th style="width:40px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in form.items" :key="idx">
                <td>
                  <select v-model="it.type_code" class="input" style="width:100%; padding:0.25rem;" @change="onTipoImpuestoChange(it)">
                    <option value="1">1 - Renta</option>
                    <option value="2">2 - IVA</option>
                  </select>
                </td>
                <td>
                  <select v-model="it.preset_key" class="input" style="width:100%; padding:0.25rem;" @change="aplicarPreset(it)">
                    <option v-for="p in getPresets(it.type_code)" :key="p.code" :value="p.code">
                      {{ p.code }} - {{ p.label }} ({{ p.percentage }}%)
                    </option>
                  </select>
                </td>
                <td>
                  <input
                    v-model.number="it.tax_base"
                    type="number"
                    step="0.01"
                    min="0.01"
                    class="input"
                    style="width:100%; padding:0.25rem; text-align:right;"
                    required
                  />
                </td>
                <td>
                  <input
                    v-model.number="it.percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    class="input"
                    style="width:100%; padding:0.25rem; text-align:right;"
                    required
                  />
                </td>
                <td style="text-align:right; font-weight:bold; color:#1e293b;">
                  ${{ formatMoney(calcularValorRetenido(it)) }}
                </td>
                <td style="text-align:center;">
                  <button
                    type="button"
                    class="btn btn-danger"
                    style="padding:0.2rem 0.4rem; font-size:0.75rem;"
                    :disabled="form.items.length <= 1"
                    @click="removerItem(idx)"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totales -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
          <div style="width:260px; font-size:0.85rem; display:flex; flex-direction:column; gap:0.35rem; background:#f8fafc; padding:0.75rem 1rem; rounded:8px; border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>Total Ret. Renta:</span>
              <span style="font-weight:600; color:#1e293b;">${{ formatMoney(totalRenta) }}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>Total Ret. IVA:</span>
              <span style="font-weight:600; color:#1e293b;">${{ formatMoney(totalIva) }}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.95rem; font-weight:bold; color:#0f172a; border-top:1px solid #cbd5e1; padding-top:0.35rem;">
              <span>Total Retenido:</span>
              <span style="color:#2563eb;">${{ formatMoney(granTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
          <button type="button" class="btn btn-outline" @click="cerrar">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="procesando">
            <i class="fa-solid" :class="procesando ? 'fa-spinner fa-spin' : 'fa-check'" style="margin-right:0.35rem;"></i>
            {{ procesando ? 'Guardando...' : 'Guardar Retención (Borrador)' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import api from '@/shared/api'

const props = defineProps({
  show: { type: Boolean, default: false },
  procesando: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

const comprasDisponibles = ref([])
const facturaCompraSeleccionada = ref('')

const presetsRenta = [
  { code: '303', label: 'Honorarios profesionales y consultoría', percentage: 10.00 },
  { code: '304', label: 'Servicios predomina intelecto no profesional', percentage: 8.00 },
  { code: '312', label: 'Transferencia de bienes muebles corporales', percentage: 1.75 },
  { code: '3440', label: 'Otras retenciones aplicables el 2.75%', percentage: 2.75 },
  { code: '320', label: 'Arrendamiento de bienes inmuebles', percentage: 8.00 },
  { code: '332', label: 'Pagos a RIMPE Emprendedor', percentage: 1.00 },
  { code: '343', label: 'Otras compras no sujetas a retención', percentage: 0.00 },
]

const presetsIva = [
  { code: '1', label: 'Retención 30% IVA (Bienes)', percentage: 30.00 },
  { code: '2', label: 'Retención 70% IVA (Servicios)', percentage: 70.00 },
  { code: '3', label: 'Retención 100% IVA (Honorarios profesionales)', percentage: 100.00 },
  { code: '9', label: 'Retención 10% IVA (Bienes entre agentes)', percentage: 10.00 },
  { code: '10', label: 'Retención 20% IVA (Servicios entre agentes)', percentage: 20.00 },
]

const getPresets = (type_code) => {
  return type_code === '2' ? presetsIva : presetsRenta
}

const hoy = new Date().toISOString().slice(0, 10)
const periodoHoy = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`

const form = reactive({
  supplier: '',
  supplier_identification: '',
  supplier_id_type: '04',
  origin_invoice_number: '',
  fiscal_period: periodoHoy,
  date: hoy,
  items: [
    {
      type_code: '1',
      preset_key: '312',
      withholding_code: '312',
      tax_base: 0.00,
      percentage: 1.75
    }
  ]
})

const onTipoImpuestoChange = (item) => {
  if (item.type_code === '2') {
    item.preset_key = '2'
    item.withholding_code = '2'
    item.percentage = 70.00
  } else {
    item.preset_key = '312'
    item.withholding_code = '312'
    item.percentage = 1.75
  }
}

const aplicarPreset = (item) => {
  const list = getPresets(item.type_code)
  const p = list.find(x => x.code === item.preset_key)
  if (p) {
    item.withholding_code = p.code
    item.percentage = p.percentage
  }
}

const agregarItem = () => {
  form.items.push({
    type_code: '1',
    preset_key: '312',
    withholding_code: '312',
    tax_base: 0.00,
    percentage: 1.75
  })
}

const removerItem = (idx) => {
  if (form.items.length > 1) {
    form.items.splice(idx, 1)
  }
}

const calcularValorRetenido = (item) => {
  const base = Number(item.tax_base) || 0
  const pct = Number(item.percentage) || 0
  return (base * pct) / 100
}

const totalRenta = computed(() => {
  return form.items
    .filter(i => i.type_code === '1')
    .reduce((acc, i) => acc + calcularValorRetenido(i), 0)
})

const totalIva = computed(() => {
  return form.items
    .filter(i => i.type_code === '2')
    .reduce((acc, i) => acc + calcularValorRetenido(i), 0)
})

const granTotal = computed(() => {
  return totalRenta.value + totalIva.value
})

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const cargarCompras = async () => {
  try {
    const res = await api.get('/compras/facturas/')
    comprasDisponibles.value = res.data?.data || res.data || []
  } catch (error) {
    console.error('Error al cargar facturas de compra:', error)
  }
}

const onCompraChange = () => {
  const id = facturaCompraSeleccionada.value
  if (!id) return
  const compra = comprasDisponibles.value.find(c => c.id === id)
  if (compra) {
    form.supplier = compra.supplier_name || compra.supplier?.business_name || ''
    form.supplier_identification = compra.supplier?.identification || compra.supplier_ruc || ''
    form.origin_invoice_number = compra.invoice_number || ''
    
    // Auto-ajustar bases imponibles si la compra tiene subtotal e iva
    const subtotal = (Number(compra.subtotal_0) || 0) + (Number(compra.subtotal_iva) || 0)
    const vat = Number(compra.vat) || 0

    form.items = []
    // Línea de Renta
    form.items.push({
      type_code: '1',
      preset_key: '312',
      withholding_code: '312',
      tax_base: subtotal,
      percentage: 1.75
    })

    // Si tiene IVA, agregar línea de retención de IVA
    if (vat > 0) {
      form.items.push({
        type_code: '2',
        preset_key: '2',
        withholding_code: '2',
        tax_base: vat,
        percentage: 70.00
      })
    }
  }
}

const cerrar = () => {
  emit('close')
}

const guardar = () => {
  const payload = {
    supplier: form.supplier,
    supplier_identification: form.supplier_identification,
    supplier_id_type: form.supplier_identification.length === 10 ? '05' : '04',
    origin_invoice_number: form.origin_invoice_number,
    fiscal_period: form.fiscal_period,
    date: form.date,
    items: form.items.map(it => ({
      type_code: it.type_code,
      withholding_code: it.withholding_code,
      tax_base: it.tax_base,
      percentage: it.percentage
    }))
  }
  emit('submit', payload)
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    cargarCompras()
  }
})

onMounted(() => {
  if (props.show) {
    cargarCompras()
  }
})
</script>
