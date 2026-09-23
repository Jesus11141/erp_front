<template>
  <div v-if="show" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div class="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-900 flex items-center gap-2"><i class="fa-solid fa-receipt text-emerald-400"></i> Ticket Venta (80mm)</h3>
            <button @click="$emit('close')" class="text-slate-600 hover:text-slate-900 text-sm"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-4 overflow-y-auto flex-1 bg-white flex justify-center">
            <div id="printable-ticket" class="w-[280px] bg-white text-slate-950 p-4 rounded shadow-md font-mono text-[11px] leading-tight space-y-2 select-text">
                <div class="text-center space-y-0.5">
                    <h2 class="font-black text-sm uppercase">{{ parametrosStore.obtener('general', 'empresa_nombre', 'EMPRESA DEMO') }}</h2>
                    <p class="text-[10px]">RUC: {{ parametrosStore.obtener('facturacion', 'ruc_emisor', '9999999999999') }}</p>
                    <p class="font-bold border-t border-b border-dashed border-slate-400 py-1 my-1">
                        COMPROBANTE VENTA<br>
                        Nro: {{ lastSaleData?.id || '---' }}
                    </p>
                </div>
                <div class="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-1">
                    <p><strong>FECHA:</strong> {{ new Date().toLocaleString() }}</p>
                    <p><strong>CLIENTE:</strong> {{ lastSaleData?.client?.name || 'CONSUMIDOR FINAL' }}</p>
                </div>
                <div class="border-b border-dashed border-slate-400 pb-1">
                    <div class="grid grid-cols-12 font-bold mb-1 border-b border-slate-300 pb-0.5">
                        <span class="col-span-2">CANT</span>
                        <span class="col-span-6">DESCRIP</span>
                        <span class="col-span-4 text-right">TOTAL</span>
                    </div>
                    <div v-for="item in lastSaleData?.items" :key="item.id" class="grid grid-cols-12 mb-0.5">
                        <span class="col-span-2 font-bold">{{ item.quantity }}</span>
                        <span class="col-span-6 truncate">{{ item.description }}</span>
                        <span class="col-span-4 text-right font-bold">${{ item.total }}</span>
                    </div>
                </div>
                <div class="space-y-0.5 text-right font-bold text-[10px] pt-1">
                    <p>SUBTOTAL: ${{ lastSaleData?.subtotal }}</p>
                    <p>IVA: ${{ lastSaleData?.tax }}</p>
                    <p class="text-xs pt-1 border-t border-slate-950 font-black">TOTAL: ${{ lastSaleData?.total }}</p>
                </div>
                <div class="text-center pt-2 text-[9px] font-bold text-slate-700">¡Gracias por su compra!</div>
            </div>
        </div>
        <div class="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
            <span class="text-xs text-emerald-400 font-semibold flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> Autorizado</span>
            <div class="flex gap-2">
                <button @click="$emit('close')" class="bg-slate-100 hover:bg-slate-700 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold">Cerrar</button>
                <button @click="$emit('print')" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-print"></i> Imprimir
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { useParametrosStore } from '@/stores/parametros'

defineProps({
  show: {
    type: Boolean,
    required: true
  },
  lastSaleData: {
    type: Object,
    default: null
  }
})

defineEmits(['close', 'print'])

const parametrosStore = useParametrosStore()
</script>
