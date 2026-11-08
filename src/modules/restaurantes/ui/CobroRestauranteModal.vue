<template>
  <div v-if="show" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto border border-slate-100 animate-scale-up">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-500/30">
            🧾
          </div>
          <div>
            <h3 class="font-bold text-base leading-tight">Cobro y Facturación</h3>
            <p class="text-xs text-slate-300">
              Mesa: <strong class="text-amber-400">{{ mesa?.nombre || 'General' }}</strong>
              <span v-if="esPrePago" class="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/40">Pre-pago</span>
            </p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700">
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
        
        <!-- Total Banner -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Total a Pagar</span>
            <span class="text-2xl font-black text-amber-900">${{ totalAPagar.toFixed(2) }}</span>
          </div>
          <div class="text-right text-xs text-amber-700">
            <div>Subtotal: <strong>${{ subtotalSinIva.toFixed(2) }}</strong></div>
            <div>IVA ({{ ivaPorcentaje }}%): <strong>${{ valorIva.toFixed(2) }}</strong></div>
          </div>
        </div>

        <!-- Tipo Comprobante / Cliente Selector -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Comprobante / Cliente</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              type="button"
              @click="setTipoCliente('final')" 
              :class="tipoCliente === 'final' ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'"
              class="py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border transition-all"
            >
              <span>👤</span> Consumidor Final
            </button>
            <button 
              type="button"
              @click="setTipoCliente('datos')" 
              :class="tipoCliente === 'datos' ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'"
              class="py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border transition-all"
            >
              <span>📄</span> Con Datos (Factura)
            </button>
          </div>
        </div>

        <!-- Formulario Datos de Facturación (si tipoCliente === 'datos') -->
        <div v-if="tipoCliente === 'datos'" class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-fade-in">
          
          <!-- Búsqueda rápida de cliente -->
          <div class="relative">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Buscar Cliente Existente</label>
            <div class="relative">
              <input 
                v-model="busquedaCliente" 
                @input="buscarClientes"
                type="text" 
                placeholder="Escribe RUC, cédula o nombre..."
                class="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
              <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
              <span v-if="buscandoCliente" class="absolute right-2.5 top-2 text-xs text-amber-600 animate-spin">⏳</span>
            </div>

            <!-- Sugerencias Dropdown -->
            <div v-if="sugerenciasCliente.length > 0" class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
              <div 
                v-for="s in sugerenciasCliente" 
                :key="s.id"
                @click="seleccionarCliente(s)"
                class="p-2.5 hover:bg-amber-50 cursor-pointer border-b border-slate-100 text-xs flex justify-between items-center transition-colors"
              >
                <div>
                  <div class="font-bold text-slate-800">{{ s.name }}</div>
                  <div class="text-[10px] text-slate-500">RUC/CI: {{ s.rfc }}</div>
                </div>
                <span class="text-amber-600 text-[10px] font-semibold">Seleccionar</span>
              </div>
            </div>
          </div>

          <!-- Campos Cliente -->
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo Identificación *</label>
              <select v-model="cliente.tipo_id" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500">
                <option value="05">Cédula (10 dígitos)</option>
                <option value="04">RUC (13 dígitos)</option>
                <option value="06">Pasaporte</option>
                <option value="08">Identificación Exterior</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cédula / RUC *</label>
              <input v-model="cliente.identificacion" type="text" placeholder="Ej: 1723456789001" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-mono" />
            </div>

            <div class="col-span-2">
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Razón Social / Nombre Completo *</label>
              <input v-model="cliente.nombre" type="text" placeholder="Nombre o Razón Social del cliente" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500" />
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correo Electrónico (SRI)</label>
              <input v-model="cliente.email" type="email" placeholder="cliente@correo.com" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dirección</label>
              <input v-model="cliente.direccion" type="text" placeholder="Dirección del cliente" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500" />
            </div>
          </div>
        </div>

        <!-- Forma de Pago -->
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Forma de Pago</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button 
              type="button" 
              @click="metodoPago = '01'"
              :class="metodoPago === '01' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
              class="p-2 border rounded-xl text-center text-xs flex flex-col items-center gap-1 transition-all"
            >
              <span class="text-base">💵</span> Efectivo
            </button>
            <button 
              type="button" 
              @click="metodoPago = '16'"
              :class="metodoPago === '16' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
              class="p-2 border rounded-xl text-center text-xs flex flex-col items-center gap-1 transition-all"
            >
              <span class="text-base">💳</span> T. Débito
            </button>
            <button 
              type="button" 
              @click="metodoPago = '19'"
              :class="metodoPago === '19' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
              class="p-2 border rounded-xl text-center text-xs flex flex-col items-center gap-1 transition-all"
            >
              <span class="text-base">💳</span> T. Crédito
            </button>
            <button 
              type="button" 
              @click="metodoPago = '20'"
              :class="metodoPago === '20' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
              class="p-2 border rounded-xl text-center text-xs flex flex-col items-center gap-1 transition-all"
            >
              <span class="text-base">🏦</span> Transf.
            </button>
          </div>
        </div>

        <!-- Efectivo: Monto recibido y cambio -->
        <div v-if="metodoPago === '01'" class="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-800">Efectivo Recibido:</span>
            <div class="flex items-center gap-1 w-32">
              <span class="text-emerald-700 font-bold text-sm">$</span>
              <input 
                v-model.number="montoRecibido" 
                type="number" 
                step="0.01" 
                min="0"
                class="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 text-right"
              />
            </div>
          </div>

          <!-- Botones rápidos de monto -->
          <div class="flex gap-1.5 flex-wrap">
            <button 
              type="button" 
              @click="montoRecibido = Number(totalAPagar.toFixed(2))"
              class="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold border border-emerald-300 transition-colors"
            >
              Exacto (${{ totalAPagar.toFixed(2) }})
            </button>
            <button 
              v-for="b in botonesBilletes" 
              :key="b"
              type="button" 
              @click="montoRecibido = b"
              class="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold border border-emerald-300 transition-colors"
            >
              ${{ b }}
            </button>
          </div>

          <!-- Cambio calculado -->
          <div class="flex items-center justify-between border-t border-emerald-200 pt-2">
            <span class="text-xs font-bold text-emerald-900 uppercase">Cambio / Vuelto:</span>
            <span class="text-lg font-black" :class="cambioCalculado < 0 ? 'text-rose-600' : 'text-emerald-700'">
              ${{ cambioCalculado >= 0 ? cambioCalculado.toFixed(2) : '0.00 (Faltante)' }}
            </span>
          </div>
        </div>

        <!-- Emisión al SRI -->
        <div class="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <input 
            type="checkbox" 
            id="emitirSriCheck" 
            v-model="emitirSri" 
            class="accent-amber-500 w-4 h-4 rounded cursor-pointer"
          />
          <label for="emitirSriCheck" class="text-xs text-slate-700 font-medium cursor-pointer">
            Emitir y firmar comprobante electrónico al SRI automáticamente
          </label>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="bg-slate-50 px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
        <button 
          type="button" 
          @click="$emit('close')" 
          :disabled="procesando"
          class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="button" 
          @click="confirmarCobro" 
          :disabled="procesando || (metodoPago === '01' && cambioCalculado < 0)"
          class="px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="procesando" class="animate-spin">⏳</span>
          <span v-else>💳</span>
          {{ procesando ? 'Procesando y Facturando...' : `Confirmar y Facturar ($${totalAPagar.toFixed(2)})` }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '../../../shared/api';
import { useAlert } from '../../../composables/useAlert';
import { useParametrosStore } from '../../../stores/parametros';

const props = defineProps({
  show: { type: Boolean, default: false },
  mesa: { type: Object, default: () => ({}) },
  pedido: { type: Object, default: () => ({ lineas: [] }) },
  nuevasLineas: { type: Array, default: () => [] },
  esPrePago: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'cobrado']);

const { showAlert, showToast } = useAlert();
const parametrosStore = useParametrosStore();

const procesando = ref(false);
const tipoCliente = ref('final'); // 'final' o 'datos'
const metodoPago = ref('01'); // '01': Efectivo, '16': Débito, '19': Crédito, '20': Transf.
const emitirSri = ref(true);

const montoRecibido = ref(0);

const cliente = ref({
  nombre: 'CONSUMIDOR FINAL',
  identificacion: '9999999999999',
  tipo_id: '07',
  email: '',
  direccion: 'S/D'
});

const busquedaCliente = ref('');
const sugerenciasCliente = ref([]);
const buscandoCliente = ref(false);
let busquedaTimer = null;

const ivaPorcentaje = computed(() => {
  const p = parametrosStore.obtener('ventas', 'iva', '15');
  return parseFloat(p) || 15;
});

// Todas las líneas a cobrar
const todasLasLineas = computed(() => {
  const lineasActuales = (props.pedido?.lineas || []).map(l => ({
    item_id: String(l.item_id || l.id),
    item_nombre: l.item_nombre,
    cantidad: l.cantidad,
    precio_unitario: Number(l.precio_unitario)
  }));
  const lineasNuevas = (props.nuevasLineas || []).map(l => ({
    item_id: String(l.item_id),
    item_nombre: l.item_nombre,
    cantidad: l.cantidad,
    precio_unitario: Number(l.precio_unitario)
  }));
  return [...lineasActuales, ...lineasNuevas];
});

const totalAPagar = computed(() => {
  return todasLasLineas.value.reduce((acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0);
});

const subtotalSinIva = computed(() => {
  const factor = 1 + (ivaPorcentaje.value / 100);
  return totalAPagar.value / factor;
});

const valorIva = computed(() => {
  return totalAPagar.value - subtotalSinIva.value;
});

const cambioCalculado = computed(() => {
  return (montoRecibido.value || 0) - totalAPagar.value;
});

const botonesBilletes = computed(() => {
  const t = totalAPagar.value;
  const list = [10, 20, 50, 100];
  return list.filter(b => b >= t).slice(0, 3);
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    montoRecibido.value = Number(totalAPagar.value.toFixed(2));
    tipoCliente.value = 'final';
    setTipoCliente('final');
    metodoPago.value = '01';
    emitirSri.value = true;
    busquedaCliente.value = '';
    sugerenciasCliente.value = [];
  }
});

function setTipoCliente(tipo) {
  tipoCliente.value = tipo;
  if (tipo === 'final') {
    cliente.value = {
      nombre: 'CONSUMIDOR FINAL',
      identificacion: '9999999999999',
      tipo_id: '07',
      email: '',
      direccion: 'S/D'
    };
  } else {
    cliente.value = {
      nombre: '',
      identificacion: '',
      tipo_id: '05',
      email: '',
      direccion: ''
    };
  }
}

function buscarClientes() {
  clearTimeout(busquedaTimer);
  sugerenciasCliente.value = [];
  if (busquedaCliente.value.length < 2) {
    buscandoCliente.value = false;
    return;
  }
  buscandoCliente.value = true;
  busquedaTimer = setTimeout(async () => {
    try {
      const { data } = await api.get(`/ventas/customers/?q=${busquedaCliente.value}`);
      sugerenciasCliente.value = (data || []).slice(0, 5);
    } catch {
      sugerenciasCliente.value = [];
    } finally {
      buscandoCliente.value = false;
    }
  }, 300);
}

function seleccionarCliente(c) {
  const rfc = c.rfc || '';
  let tid = '05';
  if (rfc.length === 13) tid = '04';
  else if (rfc.length === 10) tid = '05';
  else tid = '06';

  cliente.value = {
    nombre: c.name,
    identificacion: rfc,
    tipo_id: tid,
    email: c.email || '',
    direccion: c.address || 'S/D'
  };
  sugerenciasCliente.value = [];
  busquedaCliente.value = `${c.name} (${rfc})`;
}

async function confirmarCobro() {
  if (totalAPagar.value <= 0) {
    showAlert({ type: 'warning', title: 'Atención', message: 'No hay platos o consumos para cobrar.' });
    return;
  }

  if (tipoCliente.value === 'datos') {
    if (!cliente.value.nombre?.trim()) {
      showAlert({ type: 'warning', title: 'Dato requerido', message: 'Ingresa el nombre o razón social del cliente.' });
      return;
    }
    if (!cliente.value.identificacion?.trim()) {
      showAlert({ type: 'warning', title: 'Dato requerido', message: 'Ingresa el RUC o cédula del cliente.' });
      return;
    }
  }

  if (metodoPago.value === '01' && cambioCalculado.value < 0) {
    showAlert({ type: 'warning', title: 'Monto insuficiente', message: 'El efectivo recibido es menor al total a pagar.' });
    return;
  }

  procesando.value = true;
  try {
    let orderId = props.pedido?.id;

    // 1. Si no hay pedido abierto aún (ej: Pre-pago con nuevas líneas), crearlo primero
    if (!orderId && props.nuevasLineas?.length > 0) {
      const { data: nuevoPedido } = await api.post('restaurantes/pedidos/', {
        mesa_id: props.mesa.id,
        lineas: props.nuevasLineas
      });
      orderId = nuevoPedido.id;
    } else if (orderId && props.nuevasLineas?.length > 0) {
      // Si ya hay pedido y hay nuevas líneas añadidas, guardarlas antes de cobrar
      await api.post('restaurantes/pedidos/', {
        mesa_id: props.mesa.id,
        lineas: props.nuevasLineas
      });
    }

    if (!orderId) {
      throw new Error('No se pudo identificar el pedido a facturar.');
    }

    // 2. Ejecutar cobro y facturación en el backend
    const payload = {
      mesa_id: props.mesa.id,
      facturar: true,
      cliente: cliente.value,
      metodo_pago: metodoPago.value,
      emitir_sri: emitirSri.value
    };

    const { data } = await api.post(`restaurantes/pedidos/${orderId}/cerrar/`, payload);

    showToast(`¡Cobro registrado y factura emitida con éxito!`, 'success');
    
    // Preparar objeto para impresión de ticket térmico
    const facturaData = data.factura || {};
    const ticketData = {
      id: facturaData.id || orderId,
      invoice_number: facturaData.numero || null,
      numero: facturaData.numero || null,
      access_key: facturaData.clave_acceso || null,
      clave_acceso: facturaData.clave_acceso || null,
      customer_name: cliente.value.nombre,
      customer_identifier: cliente.value.identificacion,
      customer_address: cliente.value.direccion,
      payment_method: metodoPago.value,
      subtotal: facturaData.subtotal || subtotalSinIva.value,
      vat_amount: facturaData.iva || valorIva.value,
      total: facturaData.total || totalAPagar.value,
      change: cambioCalculado.value > 0 ? cambioCalculado.value : 0,
      items: todasLasLineas.value.map(l => ({
        description: l.item_nombre,
        quantity: l.cantidad,
        unit_price: l.precio_unitario,
        total: l.cantidad * l.precio_unitario
      })),
      mesa_nombre: props.mesa?.nombre,
      sri_status: facturaData.sri_status,
      sri_message: facturaData.sri_message
    };

    emit('cobrado', { data, ticketData });
    emit('close');
  } catch (error) {
    console.error('Error al cobrar restaurante:', error);
    showAlert({
      type: 'error',
      title: 'Error de Facturación',
      message: error.response?.data?.error || error.message || 'Ocurrió un error al procesar el cobro.'
    });
  } finally {
    procesando.value = false;
  }
}
</script>

<style scoped>
.animate-scale-up {
  animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
