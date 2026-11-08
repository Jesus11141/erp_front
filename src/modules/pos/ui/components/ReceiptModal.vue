<template>
  <div v-if="show" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-fade-in">
        
        <!-- Header -->
        <div class="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-receipt text-brand-500 text-base"></i>
                <h3 class="font-bold text-sm text-slate-900">Ticket Térmico</h3>
            </div>

            <!-- Selector de formato 58mm / 80mm -->
            <div class="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
                <button 
                  type="button"
                  @click="selectedWidth = '58mm'"
                  :class="selectedWidth === '58mm' ? 'bg-white text-brand-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'"
                  class="px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1">
                  <span>58mm</span>
                  <span class="text-[10px] opacity-70">(Mini)</span>
                </button>
                <button 
                  type="button"
                  @click="selectedWidth = '80mm'"
                  :class="selectedWidth === '80mm' ? 'bg-white text-brand-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'"
                  class="px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1">
                  <span>80mm</span>
                  <span class="text-[10px] opacity-70">(POS)</span>
                </button>
            </div>

            <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg transition-colors">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <!-- Preview Body -->
        <div class="p-4 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-start">
            <div 
              id="printable-ticket" 
              :class="[
                selectedWidth === '58mm' ? 'w-[216px] text-[10px] p-2.5' : 'w-[290px] text-[11px] p-4',
                'bg-white text-slate-950 rounded-lg shadow-md font-mono leading-tight space-y-2 select-text transition-all duration-200 border border-slate-200'
              ]">
                
                <!-- Encabezado Empresa -->
                <div class="text-center space-y-0.5">
                    <h2 class="font-black text-sm uppercase tracking-tight">{{ nombreEmpresa }}</h2>
                    <p v-if="nombreComercial && nombreComercial !== nombreEmpresa" class="text-[9px] uppercase font-bold text-slate-700">
                      {{ nombreComercial }}
                    </p>
                    <p class="text-[10px] font-bold">RUC: {{ rucEmisor }}</p>
                    <p v-if="dirMatriz" class="text-[8.5px] text-slate-600 leading-tight">
                      {{ dirMatriz }}
                    </p>
                    <p v-if="obligadoContabilidad" class="text-[8.5px] text-slate-600">
                      OBLIGADO A LLEVAR CONTABILIDAD: {{ obligadoContabilidad }}
                    </p>
                    <p v-if="contribuyenteRegimen" class="text-[8px] font-semibold text-slate-700">
                      {{ contribuyenteRegimen }}
                    </p>

                    <!-- Tipo y Número de Documento -->
                    <div class="border-t border-b border-dashed border-slate-400 py-1.5 my-1.5">
                        <p class="font-extrabold text-[11px] tracking-wide">{{ tipoComprobanteTitulo }}</p>
                        <p class="font-bold text-[10.5px]">{{ numeroDocumento }}</p>
                    </div>
                </div>

                <!-- Datos Cliente y Fecha -->
                <div class="text-[9.5px] space-y-0.5 border-b border-dashed border-slate-400 pb-1.5">
                    <p class="flex justify-between">
                      <span class="text-slate-600">FECHA:</span> 
                      <span class="font-semibold">{{ fechaHoraComprobante }}</span>
                    </p>
                    <p class="truncate">
                      <span class="text-slate-600">CLIENTE:</span> 
                      <strong class="uppercase">{{ nombreCliente }}</strong>
                    </p>
                    <p>
                      <span class="text-slate-600">RUC/CI:</span> 
                      <span class="font-mono font-semibold">{{ identificacionCliente }}</span>
                    </p>
                    <p v-if="direccionCliente && direccionCliente !== 'S/D'" class="truncate text-[8.5px]">
                      <span class="text-slate-600">DIR:</span> {{ direccionCliente }}
                    </p>
                    <p v-if="metodoPagoTexto">
                      <span class="text-slate-600">FORMA PAGO:</span> {{ metodoPagoTexto }}
                    </p>
                </div>

                <!-- Detalle de Productos -->
                <div class="border-b border-dashed border-slate-400 pb-1.5">
                    <div class="grid grid-cols-12 font-bold mb-1 border-b border-slate-300 pb-0.5 text-[9px]">
                        <span class="col-span-2">CANT</span>
                        <span class="col-span-6">DESCRIP</span>
                        <span class="col-span-4 text-right">TOTAL</span>
                    </div>
                    <div v-for="(item, idx) in listaItems" :key="idx" class="grid grid-cols-12 mb-1 items-start text-[9.5px] leading-tight">
                        <span class="col-span-2 font-bold">{{ item.quantity }}</span>
                        <div class="col-span-6 pr-1">
                          <span class="block font-medium truncate">{{ item.description }}</span>
                          <span v-if="item.unit_price" class="block text-[8px] text-slate-500">@ ${{ formatMonto(item.unit_price) }}</span>
                        </div>
                        <span class="col-span-4 text-right font-bold">${{ formatMonto(item.total) }}</span>
                    </div>
                </div>

                <!-- Totales -->
                <div class="space-y-0.5 text-right text-[10px] pt-1">
                    <div class="flex justify-between text-slate-700">
                      <span>SUBTOTAL:</span>
                      <span class="font-bold">${{ formatMonto(subtotalComprobante) }}</span>
                    </div>
                    <div class="flex justify-between text-slate-700">
                      <span>IVA ({{ tasaIvaTexto }}%):</span>
                      <span class="font-bold">${{ formatMonto(ivaComprobante) }}</span>
                    </div>
                    <div class="flex justify-between text-xs pt-1 border-t border-slate-950 font-black text-slate-950">
                      <span>TOTAL:</span>
                      <span>${{ formatMonto(totalComprobante) }}</span>
                    </div>
                    <div v-if="cambioComprobante !== null && parseFloat(cambioComprobante) > 0" class="flex justify-between text-[9px] text-slate-600 pt-0.5">
                      <span>CAMBIO:</span>
                      <span class="font-semibold">${{ formatMonto(cambioComprobante) }}</span>
                    </div>
                </div>

                <!-- SRI: Clave de Acceso y Código QR -->
                <div v-if="claveAcceso" class="border-t border-dashed border-slate-400 pt-2 text-center space-y-1">
                    <p class="text-[8.5px] font-bold text-slate-800 tracking-wider uppercase">CLAVE DE ACCESO / AUTORIZACIÓN</p>
                    <p class="text-[8px] font-mono leading-none break-all select-all bg-slate-50 p-1 rounded border border-slate-200">
                      {{ claveAcceso }}
                    </p>
                    <div v-if="qrDataUrl" class="flex flex-col items-center justify-center pt-1">
                      <img :src="qrDataUrl" alt="QR SRI" class="w-24 h-24 object-contain mx-auto" />
                      <span class="text-[7.5px] text-slate-500 mt-0.5">Consulte su comprobante en el portal SRI</span>
                    </div>
                </div>

                <!-- Pie de Ticket -->
                <div class="text-center pt-2 border-t border-dashed border-slate-300 text-[8.5px] font-bold text-slate-700 space-y-0.5">
                    <p>¡Gracias por su compra!</p>
                    <p class="text-[7.5px] font-normal text-slate-500">Documento emitido conforme a normativas vigentes</p>
                </div>

            </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span class="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                <i class="fa-solid fa-circle-check"></i>
                <span>{{ claveAcceso ? 'SRI Electrónico' : 'Listo para imprimir' }}</span>
            </span>
            <div class="flex gap-2">
                <button 
                  type="button"
                  @click="$emit('close')" 
                  class="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm">
                  Cerrar
                </button>
                <button 
                  type="button"
                  @click="handlePrint" 
                  class="bg-brand-500 hover:bg-brand-400 active:scale-95 text-slate-950 font-extrabold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm">
                  <i class="fa-solid fa-print"></i> 
                  <span>Imprimir ({{ selectedWidth }})</span>
                </button>
            </div>
        </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useParametrosStore } from '@/stores/parametros'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  lastSaleData: {
    type: Object,
    default: null
  },
  defaultWidth: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'print'])

const parametrosStore = useParametrosStore()

// Configuración de ancho
const selectedWidth = ref('80mm')

onMounted(() => {
  if (props.defaultWidth) {
    selectedWidth.value = props.defaultWidth
  } else {
    selectedWidth.value = parametrosStore.obtener('pos', 'formato_recibo', '80mm')
  }
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (!props.defaultWidth) {
      selectedWidth.value = parametrosStore.obtener('pos', 'formato_recibo', '80mm')
    }
    generarQR()
  }
})

// QR Code Data
const qrDataUrl = ref('')

const claveAcceso = computed(() => {
  return props.lastSaleData?.access_key || 
         props.lastSaleData?.clave_acceso || 
         props.lastSaleData?.authorization_number || 
         ''
})

const generarQR = async () => {
  if (!claveAcceso.value) {
    qrDataUrl.value = ''
    return
  }
  try {
    const sriUrl = `https://srienlinea.sri.gob.ec/comprobantes-electronicos-internet/publico/validadorComprobantes.jsf?clave=${claveAcceso.value}`
    qrDataUrl.value = await QRCode.toDataURL(sriUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
  } catch (err) {
    console.error('Error generando QR para ticket:', err)
    qrDataUrl.value = ''
  }
}

watch(claveAcceso, () => {
  generarQR()
})

// Datos de empresa
const nombreEmpresa = computed(() => {
  return parametrosStore.obtener('general', 'empresa_nombre', 'EMPRESA DEMO')
})

const nombreComercial = computed(() => {
  return parametrosStore.obtener('facturacion', 'nombre_comercial', '')
})

const rucEmisor = computed(() => {
  return parametrosStore.obtener('facturacion', 'ruc_emisor', '9999999999999')
})

const dirMatriz = computed(() => {
  return parametrosStore.obtener('facturacion', 'dir_matriz', '')
})

const obligadoContabilidad = computed(() => {
  return parametrosStore.obtener('facturacion', 'obligado_contabilidad', 'NO')
})

const contribuyenteRegimen = computed(() => {
  const reg = parametrosStore.obtener('facturacion', 'regimen_tributario', '')
  if (reg && reg.toUpperCase().includes('RIMPE')) return 'CONTRIBUYENTE RÉGIMEN RIMPE'
  return ''
})

// Datos de comprobante
const tipoComprobanteTitulo = computed(() => {
  const dt = props.lastSaleData?.document_type
  if (dt === '02') return 'NOTA DE VENTA'
  if (props.lastSaleData?.invoice_number || claveAcceso.value || dt === '01') return 'FACTURA ELECTRÓNICA'
  return 'COMPROBANTE DE VENTA'
})

const numeroDocumento = computed(() => {
  return props.lastSaleData?.invoice_number || 
         props.lastSaleData?.numero || 
         (props.lastSaleData?.id ? `Nro: ${props.lastSaleData.id}` : '---')
})

const fechaHoraComprobante = computed(() => {
  if (props.lastSaleData?.created_at) {
    try {
      return new Date(props.lastSaleData.created_at).toLocaleString()
    } catch {
      return props.lastSaleData.created_at
    }
  }
  return new Date().toLocaleString()
})

// Datos del Cliente
const nombreCliente = computed(() => {
  return props.lastSaleData?.client?.name || 
         props.lastSaleData?.customer_name || 
         props.lastSaleData?.customer || 
         'CONSUMIDOR FINAL'
})

const identificacionCliente = computed(() => {
  return props.lastSaleData?.client?.identification || 
         props.lastSaleData?.customer_identifier || 
         props.lastSaleData?.cliente_identificacion || 
         '9999999999999'
})

const direccionCliente = computed(() => {
  return props.lastSaleData?.client?.address || 
         props.lastSaleData?.client_address || 
         ''
})

const metodoPagoTexto = computed(() => {
  const mp = props.lastSaleData?.payment_method || props.lastSaleData?.forma_pago
  if (!mp) return ''
  const m = String(mp).toLowerCase()
  if (m === 'cash' || m === '01' || m === 'efectivo') return 'Efectivo'
  if (m === 'card' || m === '19' || m === 'tarjeta') return 'Tarjeta'
  if (m === 'transfer' || m === '20' || m === 'transferencia') return 'Transferencia'
  return mp
})

// Lista de items
const listaItems = computed(() => {
  if (!props.lastSaleData?.items) return []
  return props.lastSaleData.items.map(item => {
    const qty = Number(item.quantity || 1)
    const unitPrice = item.unit_price !== undefined ? Number(item.unit_price) : null
    let total = item.total ?? item.subtotal
    if (total === undefined && unitPrice !== null) {
      total = qty * unitPrice
    }
    return {
      description: item.description || item.name || 'Producto',
      quantity: qty,
      unit_price: unitPrice,
      total: total !== undefined ? total : 0
    }
  })
})

// Totales
const subtotalComprobante = computed(() => {
  return props.lastSaleData?.subtotal ?? 0
})

const ivaComprobante = computed(() => {
  return props.lastSaleData?.tax ?? props.lastSaleData?.vat ?? 0
})

const totalComprobante = computed(() => {
  return props.lastSaleData?.total ?? 0
})

const cambioComprobante = computed(() => {
  return props.lastSaleData?.cambio ?? props.lastSaleData?.change ?? null
})

const tasaIvaTexto = computed(() => {
  return parametrosStore.obtener('ventas', 'iva', '15')
})

const formatMonto = (valor) => {
  const num = parseFloat(valor)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

// Impresión del Ticket
const handlePrint = () => {
  emit('print', selectedWidth.value)
  
  // Impresión directa vía Iframe ajustado a la medida exacta
  const ticketElement = document.getElementById('printable-ticket')
  if (!ticketElement) {
    window.print()
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write('<!DOCTYPE html><html><head><title>Impresión de Ticket</title>')
  doc.write('<script src="https://cdn.tailwindcss.com"><\\/script>')
  doc.write(`
    <style>
      @page {
        size: ${selectedWidth.value} auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 4px;
        width: ${selectedWidth.value} !important;
        font-family: monospace;
        background: #ffffff;
      }
      @media print {
        body {
          width: ${selectedWidth.value} !important;
        }
      }
    </style>
  `)
  doc.write('</head><body>')
  doc.write(ticketElement.outerHTML)
  doc.write('</body></html>')
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 1500)
  }, 400)
}
</script>
