<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-hand-holding-dollar text-brand-500"></i> Cuentas por Pagar (CXP)
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Seguimiento de deudas a proveedores, vencimientos de crédito y registro inmutable de abonos.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
          @click="fetchCuentas">
          <i class="fa-solid fa-rotate text-xs"></i> Actualizar
        </button>
      </div>
    </div>

    <!-- KPIs / Tarjetas Resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deuda Pendiente Total</span>
          <p class="text-2xl font-bold text-rose-600 mt-1 font-mono">${{ totalSaldoPendiente }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-sack-dollar"></i>
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuentas Vencidas</span>
          <p class="text-2xl font-bold text-amber-600 mt-1 font-mono">{{ totalVencidas }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Con Saldo Parcial</span>
          <p class="text-2xl font-bold text-blue-600 mt-1 font-mono">{{ totalParciales }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-receipt"></i>
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Liquidadas / Pagadas</span>
          <p class="text-2xl font-bold text-emerald-600 mt-1 font-mono">{{ totalPagadas }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-circle-check"></i>
        </div>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
        <button 
          v-for="f in filtrosEstado" 
          :key="f.key" 
          @click="filtroEstado = f.key" 
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap"
          :class="filtroEstado === f.key ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
          {{ f.label }}
          <span class="ml-1 text-[11px] opacity-75">({{ contarPorEstado(f.key) }})</span>
        </button>
      </div>

      <div class="relative w-full md:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="busqueda" 
          class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
          placeholder="Buscar por proveedor, N° factura..." 
        />
      </div>
    </div>

    <!-- Tabla Cuentas por Pagar -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div v-if="cargando" class="p-0">
        <TableSkeleton :rows="6" :has-avatar="false" :has-badge="true" :has-actions="true" />
      </div>

      <div v-else-if="cuentasFiltradas.length === 0" class="p-16 text-center text-slate-400">
        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <i class="fa-solid fa-check-double text-2xl text-slate-300"></i>
        </div>
        <h3 class="text-base font-bold text-slate-700">No hay cuentas por pagar pendientes</h3>
        <p class="text-sm text-slate-500 mt-1">Todas las facturas a crédito están al día o no hay registros.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th class="p-4">Proveedor</th>
              <th class="p-4 w-36">N° Factura</th>
              <th class="p-4 w-32">Vencimiento</th>
              <th class="p-4 w-28 text-right">Total</th>
              <th class="p-4 w-32 text-right">Saldo Pendiente</th>
              <th class="p-4 w-28 text-center">Estado</th>
              <th class="p-4 w-36 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr v-for="c in cuentasFiltradas" :key="c.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="p-4 font-semibold text-slate-800">
                <div class="truncate max-w-xs" :title="c.supplier_name">
                  {{ c.supplier_name }}
                </div>
              </td>
              <td class="p-4 font-mono font-bold text-slate-900 text-xs">
                {{ c.invoice_number }}
              </td>
              <td class="p-4 font-mono text-xs">
                <span :class="esVencida(c.due_date, c.balance_due) ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-600'">
                  <i v-if="esVencida(c.due_date, c.balance_due)" class="fa-solid fa-circle-exclamation text-[10px]"></i>
                  {{ c.due_date || 'Sin fecha' }}
                </span>
              </td>
              <td class="p-4 text-right font-mono text-slate-600">
                ${{ parseFloat(c.total_amount).toFixed(2) }}
              </td>
              <td class="p-4 text-right font-mono font-bold" :class="Number(c.balance_due) > 0 ? 'text-rose-600' : 'text-slate-400'">
                ${{ parseFloat(c.balance_due).toFixed(2) }}
              </td>
              <td class="p-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border" :class="badgeEstado(c.status)">
                  {{ labelEstado(c.status) }}
                </span>
              </td>
              <td class="p-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <!-- Botón Registrar Abono -->
                  <button 
                    v-if="Number(c.balance_due) > 0"
                    @click="abrirModalAbono(c)" 
                    class="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all flex items-center gap-1 shadow-sm"
                    title="Abonar a esta cuenta">
                    <i class="fa-solid fa-plus text-[10px]"></i> Abonar
                  </button>

                  <!-- Historial de Abonos -->
                  <button 
                    @click="abrirHistorial(c)" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors" 
                    title="Ver historial de abonos y pagos">
                    <i class="fa-solid fa-history text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Registrar Abono -->
    <div v-if="mostrarModalAbono && cuentaSeleccionada" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="mostrarModalAbono = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm border border-emerald-100">
              <i class="fa-solid fa-hand-holding-dollar"></i>
            </div>
            Registrar Abono a Proveedor
          </h3>
          <button @click="mostrarModalAbono = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="guardarAbono" class="p-6 space-y-4">
          <!-- Detalle de la Deuda -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div class="flex justify-between text-slate-600">
              <span>Proveedor:</span>
              <strong class="text-slate-800">{{ cuentaSeleccionada.supplier_name }}</strong>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Factura N°:</span>
              <strong class="text-slate-800 font-mono">{{ cuentaSeleccionada.invoice_number }}</strong>
            </div>
            <div class="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Saldo Pendiente:</span>
              <strong class="text-rose-600 font-mono text-sm">${{ parseFloat(cuentaSeleccionada.balance_due).toFixed(2) }}</strong>
            </div>
          </div>

          <!-- Monto -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Monto a Abonar ($) *</label>
              <button 
                type="button" 
                @click="abonoForm.amount = cuentaSeleccionada.balance_due" 
                class="text-[11px] text-brand-600 hover:text-brand-700 font-bold underline">
                Pagar Saldo Total
              </button>
            </div>
            <input 
              v-model.number="abonoForm.amount" 
              type="number" 
              step="0.01" 
              min="0.01" 
              :max="cuentaSeleccionada.balance_due" 
              required 
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
            />
          </div>

          <!-- Fecha de Pago y Método -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Fecha Pago *</label>
              <input v-model="abonoForm.payment_date" type="date" required class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Método *</label>
              <select v-model="abonoForm.payment_method" required class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <!-- Referencia -->
          <div>
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">N° Comprobante / Referencia</label>
            <input v-model="abonoForm.reference" type="text" placeholder="Ej: Transf #982348" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
          </div>

          <!-- Notas -->
          <div>
            <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Notas u Observaciones</label>
            <textarea v-model="abonoForm.notes" rows="2" placeholder="Detalle adicional del pago..." class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"></textarea>
          </div>

          <!-- Botones -->
          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" @click="mostrarModalAbono = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all">
              Cancelar
            </button>
            <button type="submit" :disabled="guardandoAbono" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
              <i v-if="guardandoAbono" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ guardandoAbono ? 'Guardando...' : 'Confirmar Abono' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Historial de Abonos -->
    <div v-if="mostrarModalHistorial && cuentaSeleccionada" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="mostrarModalHistorial = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-history text-brand-500"></i> Historial de Abonos Realizados
            </h3>
            <span class="text-xs text-slate-500">Factura {{ cuentaSeleccionada.invoice_number }} - {{ cuentaSeleccionada.supplier_name }}</span>
          </div>
          <button @click="mostrarModalHistorial = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div v-if="cargandoAbonos" class="py-10 text-center text-slate-400">
            <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
            <p class="text-xs">Cargando abonos...</p>
          </div>

          <div v-else-if="abonosLista.length === 0" class="py-8 text-center text-slate-400">
            <i class="fa-solid fa-file-invoice-dollar text-2xl text-slate-300 mb-2"></i>
            <p class="text-xs font-semibold">No se han registrado abonos aún para esta cuenta.</p>
          </div>

          <div v-else class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th class="p-3">Fecha</th>
                  <th class="p-3 text-right">Monto</th>
                  <th class="p-3">Método</th>
                  <th class="p-3">Referencia</th>
                  <th class="p-3">Notas</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="ab in abonosLista" :key="ab.id" class="hover:bg-slate-50/50">
                  <td class="p-3 font-mono font-medium text-slate-700">{{ ab.payment_date }}</td>
                  <td class="p-3 text-right font-mono font-bold text-emerald-600">${{ parseFloat(ab.amount).toFixed(2) }}</td>
                  <td class="p-3 capitalize">{{ ab.payment_method }}</td>
                  <td class="p-3 text-slate-600 font-mono">{{ ab.reference || '---' }}</td>
                  <td class="p-3 text-slate-500">{{ ab.notes || '---' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Resumen de Saldos -->
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
            <div>
              <span class="text-slate-500">Monto Total Factura: </span>
              <strong class="font-mono text-slate-800">${{ parseFloat(cuentaSeleccionada.total_amount).toFixed(2) }}</strong>
            </div>
            <div>
              <span class="text-slate-500">Saldo Pendiente: </span>
              <strong class="font-mono text-rose-600 text-sm">${{ parseFloat(cuentaSeleccionada.balance_due).toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button @click="mostrarModalHistorial = false" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-all">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/shared/api'
import { useToast } from 'vue-toastification'
import TableSkeleton from '@/components/TableSkeleton.vue'

const toast = useToast()

const cuentas = ref([])
const cargando = ref(true)
const busqueda = ref('')
const filtroEstado = ref('todas')

const mostrarModalAbono = ref(false)
const mostrarModalHistorial = ref(false)
const cuentaSeleccionada = ref(null)
const abonosLista = ref([])
const cargandoAbonos = ref(false)
const guardandoAbono = ref(false)

const filtrosEstado = [
  { key: 'todas', label: 'Todas' },
  { key: 'PENDING', label: '⏳ Pendientes' },
  { key: 'PARTIAL', label: '📊 Parciales' },
  { key: 'PAID', label: '✓ Pagadas' },
]

const abonoForm = ref({
  amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'transferencia',
  reference: '',
  notes: ''
})

const cuentasFiltradas = computed(() => {
  return cuentas.value.filter(c => {
    if (filtroEstado.value !== 'todas' && c.status !== filtroEstado.value) return false

    if (busqueda.value.trim()) {
      const q = busqueda.value.toLowerCase()
      const matchSupp = c.supplier_name?.toLowerCase().includes(q)
      const matchInv = c.invoice_number?.toLowerCase().includes(q)
      return matchSupp || matchInv
    }
    return true
  })
})

const contarPorEstado = (key) => {
  if (key === 'todas') return cuentas.value.length
  return cuentas.value.filter(c => c.status === key).length
}

const totalSaldoPendiente = computed(() => {
  const sum = cuentas.value.reduce((acc, c) => acc + (Number(c.balance_due) || 0), 0)
  return sum.toFixed(2)
})

const totalVencidas = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return cuentas.value.filter(c => Number(c.balance_due) > 0 && c.due_date && c.due_date < today).length
})

const totalParciales = computed(() => {
  return cuentas.value.filter(c => c.status === 'PARTIAL').length
})

const totalPagadas = computed(() => {
  return cuentas.value.filter(c => c.status === 'PAID').length
})

const esVencida = (dueDate, balanceDue) => {
  if (!dueDate || Number(balanceDue) <= 0) return false
  const today = new Date().toISOString().split('T')[0]
  return dueDate < today
}

const badgeEstado = (st) => {
  const m = {
    'PENDING': 'bg-amber-50 text-amber-700 border-amber-200',
    'PARTIAL': 'bg-blue-50 text-blue-700 border-blue-200',
    'PAID': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return m[st] || 'bg-slate-50 text-slate-600 border-slate-200'
}

const labelEstado = (st) => {
  const m = {
    'PENDING': 'Pendiente',
    'PARTIAL': 'Abono Parcial',
    'PAID': 'Pagada',
  }
  return m[st] || st
}

const fetchCuentas = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/compras/cuentas-pagar/')
    cuentas.value = data
  } catch (error) {
    console.error('Error cargando cuentas por pagar:', error)
    toast.error('Error al cargar cuentas por pagar')
  } finally {
    cargando.value = false
  }
}

const abrirModalAbono = (cuenta) => {
  cuentaSeleccionada.value = cuenta
  abonoForm.value = {
    amount: Number(cuenta.balance_due) || 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transferencia',
    reference: '',
    notes: ''
  }
  mostrarModalAbono.value = true
}

const abrirHistorial = async (cuenta) => {
  cuentaSeleccionada.value = cuenta
  mostrarModalHistorial.value = true
  cargandoAbonos.value = true
  try {
    const { data } = await api.get(`/compras/cuentas-pagar/${cuenta.id}/abonos/`)
    abonosLista.value = data
  } catch (error) {
    console.error('Error cargando historial de abonos:', error)
    toast.error('Error al cargar historial de abonos')
  } finally {
    cargandoAbonos.value = false
  }
}

const guardarAbono = async () => {
  if (abonoForm.value.amount <= 0) {
    toast.warning('El monto del abono debe ser mayor a 0')
    return
  }
  if (abonoForm.value.amount > Number(cuentaSeleccionada.value.balance_due)) {
    toast.warning('El monto no puede superar el saldo pendiente')
    return
  }

  guardandoAbono.value = true
  try {
    await api.post(`/compras/cuentas-pagar/${cuentaSeleccionada.value.id}/abonos/`, abonoForm.value)
    toast.success('Abono registrado exitosamente')
    mostrarModalAbono.value = false
    await fetchCuentas()
  } catch (error) {
    console.error('Error registrando abono:', error)
    toast.error(error.response?.data?.error || 'Error al registrar abono')
  } finally {
    guardandoAbono.value = false
  }
}

onMounted(() => {
  fetchCuentas()
})
</script>
