<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-receipt text-brand-500"></i> Facturas de Compra
        </h1>
        <p class="text-slate-500 text-sm mt-1">
          Registro de compras a proveedores, control de gastos, cuentas por pagar e ingreso deliberado a stock.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          class="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 whitespace-nowrap" 
          @click="abrirNuevaFactura">
          <i class="fa-solid fa-plus"></i> Registrar Factura de Compra
        </button>
      </div>
    </div>

    <!-- KPIs / Tarjetas Resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Comprado</span>
          <p class="text-2xl font-bold text-slate-800 mt-1 font-mono">${{ totalComprado }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-cart-shopping"></i>
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Facturas Registradas</span>
          <p class="text-2xl font-bold text-slate-800 mt-1 font-mono">{{ facturas.length }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-file-invoice"></i>
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Pendiente Recibir</span>
          <p class="text-2xl font-bold text-amber-600 mt-1 font-mono">{{ totalPendientesRecepcion }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-dolly"></i>
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">A Crédito (CXP)</span>
          <p class="text-2xl font-bold text-purple-600 mt-1 font-mono">{{ totalCredito }}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
        <button 
          v-for="f in filtrosEstado" 
          :key="f.key" 
          @click="filtroRecepcion = f.key" 
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap"
          :class="filtroRecepcion === f.key ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
          {{ f.label }}
          <span class="ml-1 text-[11px] opacity-75">({{ contarPorRecepcion(f.key) }})</span>
        </button>
      </div>

      <div class="relative w-full md:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="busqueda" 
          class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" 
          placeholder="Buscar por N° factura, proveedor..." 
        />
      </div>
    </div>

    <!-- Tabla de Facturas -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div v-if="cargando" class="p-0">
        <TableSkeleton :rows="6" :has-avatar="false" :has-badge="true" :has-actions="true" />
      </div>

      <div v-else-if="facturasFiltradas.length === 0" class="p-16 text-center text-slate-400">
        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <i class="fa-solid fa-receipt text-2xl text-slate-300"></i>
        </div>
        <h3 class="text-base font-bold text-slate-700">No hay facturas de compra registradas</h3>
        <p class="text-sm text-slate-500 mt-1">Registra las facturas recibidas de tus proveedores para compras o inventario.</p>
        <button @click="abrirNuevaFactura" class="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all shadow-sm">
          + Registrar Factura
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th class="p-4 w-36">N° Factura</th>
              <th class="p-4">Proveedor</th>
              <th class="p-4 w-28">Fecha</th>
              <th class="p-4 w-28 text-center">Tipo</th>
              <th class="p-4 w-28 text-center">Condición</th>
              <th class="p-4 w-36 text-center">Recepción Stock</th>
              <th class="p-4 w-28 text-right">Total</th>
              <th class="p-4 w-32 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-slate-50">
            <tr v-for="f in facturasFiltradas" :key="f.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="p-4 font-mono font-bold text-slate-900 text-xs">
                {{ f.invoice_number }}
              </td>
              <td class="p-4 font-semibold text-slate-800">
                <div class="truncate max-w-xs" :title="f.supplier_name">
                  {{ f.supplier_name }}
                </div>
              </td>
              <td class="p-4 text-slate-600 font-mono text-xs">
                {{ f.date }}
              </td>
              <td class="p-4 text-center">
                <span 
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                  :class="f.purchase_type === 'inventario' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'">
                  <i :class="f.purchase_type === 'inventario' ? 'fa-solid fa-boxes-stacked' : 'fa-solid fa-building'"></i>
                  {{ f.purchase_type === 'inventario' ? 'Inventario' : 'Gasto' }}
                </span>
              </td>
              <td class="p-4 text-center">
                <span 
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                  :class="f.payment_condition === 'contado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'">
                  {{ f.payment_condition === 'contado' ? 'Contado' : 'Crédito' }}
                </span>
              </td>
              <td class="p-4 text-center">
                <!-- Estado Recepción Stock -->
                <div v-if="f.purchase_type === 'inventario'">
                  <span 
                    v-if="f.reception_status === 'recibida'" 
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <i class="fa-solid fa-circle-check text-[10px]"></i> En Stock
                  </span>
                  <span 
                    v-else 
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    <i class="fa-solid fa-clock text-[10px]"></i> Pendiente
                  </span>
                </div>
                <div v-else>
                  <span class="text-xs text-slate-400 font-medium">N/A (Gasto)</span>
                </div>
              </td>
              <td class="p-4 text-right font-mono font-bold text-slate-900">
                ${{ parseFloat(f.total).toFixed(2) }}
              </td>
              <td class="p-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <!-- Botón Recepcionar Mercadería (Manual y Deliberado) -->
                  <button 
                    v-if="f.purchase_type === 'inventario' && f.reception_status === 'pendiente'"
                    @click="confirmarRecepcion(f)" 
                    class="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5 shadow-sm"
                    title="Ingresar físicamente al inventario y recalcular Kardex">
                    <i class="fa-solid fa-dolly"></i> Recepcionar
                  </button>

                  <!-- Ver Detalle -->
                  <button 
                    @click="verDetalle(f)" 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors" 
                    title="Ver Detalle Completo">
                    <i class="fa-solid fa-eye text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Registrar Factura de Compra -->
    <div v-if="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="mostrarModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-sm border border-brand-100">
              <i class="fa-solid fa-receipt"></i>
            </div>
            Registrar Factura de Compra
          </h3>
          <button @click="mostrarModal = false" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="guardarFactura" class="p-6 overflow-y-auto space-y-5 flex-1">
          <!-- Banner informativo PO si viene de una orden -->
          <div v-if="form.purchase_order_id" class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center justify-between">
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-link text-blue-600"></i>
              Vinculada a la Orden de Compra N° {{ poOriginalNumero }}
            </span>
            <button type="button" @click="desvincularPO" class="text-blue-600 hover:text-blue-800 underline font-semibold">
              Desvincular
            </button>
          </div>

          <!-- Fila 1: Proveedor, Tipo Compra, N° Factura -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Proveedor *</label>
              <select v-model="form.supplier_id" required class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                <option value="" disabled>Seleccionar proveedor...</option>
                <option v-for="p in proveedores" :key="p.id" :value="p.id">{{ p.business_name }} ({{ p.identification }})</option>
              </select>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Destino de Compra *</label>
              <select v-model="form.purchase_type" required class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                <option value="inventario">📦 Inventario (Productos para Stock/Kardex)</option>
                <option value="gasto">🏢 Gasto Operativo (Servicios, insumos oficina)</option>
              </select>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">N° Factura SRI *</label>
              <input 
                v-model="form.invoice_number" 
                type="text" 
                required 
                placeholder="001-001-000000123" 
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" 
              />
            </div>
          </div>

          <!-- Fila 2: Fecha, Clave de Acceso, Condición de Pago -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Fecha Emisión *</label>
              <input v-model="form.date" type="date" required class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Clave Acceso / Autorización</label>
              <input v-model="form.access_key" type="text" placeholder="49 dígitos o N° autorización" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">Condición de Pago *</label>
              <select v-model="form.payment_condition" required class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                <option value="contado">💵 Contado (Cancelado)</option>
                <option value="credito">⏳ Crédito (Genera Cuenta por Pagar CXP)</option>
              </select>
            </div>
          </div>

          <!-- Si es Crédito: Días de Crédito y Alerta CXP -->
          <div v-if="form.payment_condition === 'credito'" class="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-2 text-purple-800 text-xs">
              <i class="fa-solid fa-clock-rotate-left text-sm text-purple-600"></i>
              <span>Esta compra creará automáticamente un registro en <strong>Cuentas por Pagar (CXP)</strong> con fecha de vencimiento.</span>
            </div>
            <div class="flex items-center gap-2 w-48">
              <label class="text-xs font-semibold text-purple-900 whitespace-nowrap">Días Crédito:</label>
              <input v-model.number="form.credit_days" type="number" min="1" max="365" class="w-20 bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-purple-900 text-center" />
            </div>
          </div>

          <!-- Aviso de Afectación de Stock -->
          <div v-if="form.purchase_type === 'inventario'" class="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <i class="fa-solid fa-shield-halved text-emerald-600 mt-0.5"></i>
            <div>
              <strong>Control de Inventario Seguro:</strong> El stock físico no se modificará al guardar esta factura. Permanecerá con estado <em>"Pendiente de Recepción"</em> hasta que tú o tu bodeguero hagan clic en <strong>Recepcionar Mercadería</strong>.
            </div>
          </div>

          <!-- Tabla de Ítems -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Ítems de la Factura</span>
              <button type="button" @click="agregarItem" class="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
                <i class="fa-solid fa-plus"></i> Agregar Fila
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th class="p-2.5 w-64">Producto / Detalle</th>
                    <th class="p-2.5 w-20 text-center">Cant.</th>
                    <th class="p-2.5 w-28 text-right">P. Unitario</th>
                    <th class="p-2.5 w-24 text-right">Descuento</th>
                    <th class="p-2.5 w-24 text-center">Tarifa IVA</th>
                    <th class="p-2.5 w-28 text-right">Subtotal</th>
                    <th class="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(it, idx) in form.items" :key="idx" class="hover:bg-slate-50/50">
                    <td class="p-2.5">
                      <div class="space-y-1">
                        <select 
                          v-if="form.purchase_type === 'inventario'"
                          v-model="it.product_id" 
                          @change="alSeleccionarProducto(it)" 
                          class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none">
                          <option :value="null">-- Seleccionar producto catálogo --</option>
                          <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku || 'Sin código' }})</option>
                        </select>
                        <input 
                          v-model="it.description" 
                          type="text" 
                          required 
                          placeholder="Descripción del producto o servicio..." 
                          class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none" 
                        />
                      </div>
                    </td>
                    <td class="p-2.5">
                      <input v-model.number="it.quantity" type="number" step="0.01" min="0.01" required class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-mono outline-none" />
                    </td>
                    <td class="p-2.5">
                      <input v-model.number="it.unit_price" type="number" step="0.0001" min="0" required class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-right font-mono outline-none" />
                    </td>
                    <td class="p-2.5">
                      <input v-model.number="it.discount" type="number" step="0.01" min="0" class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-right font-mono outline-none" />
                    </td>
                    <td class="p-2.5">
                      <select v-model="it.vat_rate" class="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-center outline-none">
                        <option value="15">15%</option>
                        <option value="5">5%</option>
                        <option value="0">0%</option>
                      </select>
                    </td>
                    <td class="p-2.5 text-right font-mono font-bold text-slate-800">
                      ${{ calcularSubtotalItem(it) }}
                    </td>
                    <td class="p-2.5 text-center">
                      <button 
                        type="button" 
                        @click="eliminarItem(idx)" 
                        :disabled="form.items.length <= 1"
                        class="text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Resumen de Totales -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            <div class="text-xs text-slate-500 space-y-1">
              <p>• Los cálculos de IVA se aplican sobre la base neta luego del descuento.</p>
              <p>• Los totales respetan el formato contable del SRI.</p>
            </div>

            <div class="w-full sm:w-72 bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-200 text-xs font-medium">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal 0%:</span>
                <span class="font-mono">${{ totalesCalculados.subtotal_0 }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Subtotal IVA:</span>
                <span class="font-mono">${{ totalesCalculados.subtotal_iva }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Descuento:</span>
                <span class="font-mono">-${{ totalesCalculados.descuento }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>IVA:</span>
                <span class="font-mono">${{ totalesCalculados.iva }}</span>
              </div>
              <div class="flex justify-between text-slate-900 font-bold text-sm pt-1.5 border-t border-slate-200">
                <span>Total Factura:</span>
                <span class="font-mono text-brand-600">${{ totalesCalculados.total }}</span>
              </div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              @click="mostrarModal = false" 
              class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all">
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="guardando" 
              class="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50">
              <i v-if="guardando" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ guardando ? 'Guardando...' : 'Registrar Factura' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Detalle Factura -->
    <div v-if="facturaDetalle" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" @click.self="facturaDetalle = null">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-file-invoice text-brand-500"></i>
              Factura N° {{ facturaDetalle.invoice_number }}
            </h3>
            <span class="text-xs text-slate-500">Proveedor: {{ facturaDetalle.supplier_name }}</span>
          </div>
          <button @click="facturaDetalle = null" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span class="text-slate-400 block font-semibold">Fecha Emisión</span>
              <span class="font-mono font-bold text-slate-700">{{ facturaDetalle.date }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">Tipo Compra</span>
              <span class="font-bold capitalize text-slate-700">{{ facturaDetalle.purchase_type }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">Condición</span>
              <span class="font-bold capitalize text-slate-700">{{ facturaDetalle.payment_condition }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">Recepción Stock</span>
              <span class="font-bold text-slate-700 capitalize">{{ facturaDetalle.reception_status }}</span>
            </div>
            <div v-if="facturaDetalle.access_key" class="col-span-2 sm:col-span-4">
              <span class="text-slate-400 block font-semibold">Clave de Acceso SRI</span>
              <span class="font-mono text-slate-600 break-all select-all">{{ facturaDetalle.access_key }}</span>
            </div>
          </div>

          <!-- Ítems -->
          <div>
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Detalle de Ítems</h4>
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th class="p-3">Descripción</th>
                    <th class="p-3 text-center w-16">Cant.</th>
                    <th class="p-3 text-right w-24">P. Unit</th>
                    <th class="p-3 text-right w-20">Desc.</th>
                    <th class="p-3 text-center w-16">IVA</th>
                    <th class="p-3 text-right w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="it in facturaDetalle.items" :key="it.id">
                    <td class="p-3 font-medium text-slate-800">{{ it.description }}</td>
                    <td class="p-3 text-center font-mono">{{ it.quantity }}</td>
                    <td class="p-3 text-right font-mono">${{ parseFloat(it.unit_price).toFixed(2) }}</td>
                    <td class="p-3 text-right font-mono">${{ parseFloat(it.discount).toFixed(2) }}</td>
                    <td class="p-3 text-center font-mono">{{ it.vat_rate }}%</td>
                    <td class="p-3 text-right font-mono font-bold text-slate-800">${{ parseFloat(it.subtotal).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Totales -->
          <div class="flex justify-end">
            <div class="w-64 space-y-1.5 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal 0%:</span>
                <span class="font-mono">${{ parseFloat(facturaDetalle.subtotal_0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Subtotal IVA:</span>
                <span class="font-mono">${{ parseFloat(facturaDetalle.subtotal_iva).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Descuento:</span>
                <span class="font-mono">-${{ parseFloat(facturaDetalle.discount).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>IVA:</span>
                <span class="font-mono">${{ parseFloat(facturaDetalle.vat).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                <span>Total:</span>
                <span class="font-mono text-brand-600">${{ parseFloat(facturaDetalle.total).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button 
            v-if="facturaDetalle.purchase_type === 'inventario' && facturaDetalle.reception_status === 'pendiente'"
            @click="confirmarRecepcion(facturaDetalle)" 
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2">
            <i class="fa-solid fa-dolly"></i> Recepcionar Mercadería Ahora
          </button>
          <div v-else></div>

          <button @click="facturaDetalle = null" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-all">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/shared/api'
import { useToast } from 'vue-toastification'
import TableSkeleton from '@/components/TableSkeleton.vue'

const route = useRoute()
const toast = useToast()

const facturas = ref([])
const proveedores = ref([])
const productos = ref([])
const cargando = ref(true)
const guardando = ref(false)
const busqueda = ref('')
const filtroRecepcion = ref('todas')
const mostrarModal = ref(false)
const facturaDetalle = ref(null)
const poOriginalNumero = ref('')

const filtrosEstado = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendientes', label: '⚠️ Pendiente Stock' },
  { key: 'recibidas', label: '✓ En Stock' },
  { key: 'gastos', label: '🏢 Gastos' },
]

const form = ref({
  supplier_id: '',
  invoice_number: '',
  access_key: '',
  date: new Date().toISOString().split('T')[0],
  purchase_type: 'inventario',
  payment_condition: 'contado',
  credit_days: 30,
  purchase_order_id: null,
  items: []
})

const facturasFiltradas = computed(() => {
  return facturas.value.filter(f => {
    // Filtro por recepción/tipo
    if (filtroRecepcion.value === 'pendientes' && (f.purchase_type !== 'inventario' || f.reception_status !== 'pendiente')) return false
    if (filtroRecepcion.value === 'recibidas' && (f.purchase_type !== 'inventario' || f.reception_status !== 'recibida')) return false
    if (filtroRecepcion.value === 'gastos' && f.purchase_type !== 'gasto') return false

    // Búsqueda
    if (busqueda.value.trim()) {
      const q = busqueda.value.toLowerCase()
      const matchNum = f.invoice_number?.toLowerCase().includes(q)
      const matchSupp = f.supplier_name?.toLowerCase().includes(q)
      const matchKey = f.access_key?.toLowerCase().includes(q)
      return matchNum || matchSupp || matchKey
    }
    return true
  })
})

const contarPorRecepcion = (key) => {
  if (key === 'todas') return facturas.value.length
  if (key === 'pendientes') return facturas.value.filter(f => f.purchase_type === 'inventario' && f.reception_status === 'pendiente').length
  if (key === 'recibidas') return facturas.value.filter(f => f.purchase_type === 'inventario' && f.reception_status === 'recibida').length
  if (key === 'gastos') return facturas.value.filter(f => f.purchase_type === 'gasto').length
  return 0
}

const totalComprado = computed(() => {
  const sum = facturas.value.reduce((acc, f) => acc + (Number(f.total) || 0), 0)
  return sum.toFixed(2)
})

const totalPendientesRecepcion = computed(() => {
  return facturas.value.filter(f => f.purchase_type === 'inventario' && f.reception_status === 'pendiente').length
})

const totalCredito = computed(() => {
  return facturas.value.filter(f => f.payment_condition === 'credito').length
})

const calcularSubtotalItem = (it) => {
  const q = Number(it.quantity) || 0
  const p = Number(it.unit_price) || 0
  const d = Number(it.discount) || 0
  return Math.max(0, (q * p) - d).toFixed(2)
}

const totalesCalculados = computed(() => {
  let subtotal_0 = 0
  let subtotal_iva = 0
  let descuento = 0
  let iva = 0

  form.value.items.forEach(it => {
    const q = Number(it.quantity) || 0
    const p = Number(it.unit_price) || 0
    const d = Number(it.discount) || 0
    const rate = Number(it.vat_rate) || 0

    const baseBruta = q * p
    const baseNeta = Math.max(0, baseBruta - d)
    descuento += d

    if (rate > 0) {
      subtotal_iva += baseNeta
      iva += baseNeta * (rate / 100)
    } else {
      subtotal_0 += baseNeta
    }
  })

  return {
    subtotal_0: subtotal_0.toFixed(2),
    subtotal_iva: subtotal_iva.toFixed(2),
    descuento: descuento.toFixed(2),
    iva: iva.toFixed(2),
    total: (subtotal_0 + subtotal_iva + iva).toFixed(2)
  }
})

const fetchFacturas = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/compras/facturas/')
    facturas.value = data
  } catch (error) {
    console.error('Error cargando facturas de compra:', error)
    toast.error('Error al cargar facturas de compra')
  } finally {
    cargando.value = false
  }
}

const fetchAuxiliares = async () => {
  try {
    const [resSupp, resProd] = await Promise.all([
      api.get('/compras/proveedores/'),
      api.get('/inventario/productos/')
    ])
    proveedores.value = resSupp.data
    productos.value = resProd.data
  } catch (err) {
    console.error('Error cargando auxiliares:', err)
  }
}

const abrirNuevaFactura = () => {
  poOriginalNumero.value = ''
  form.value = {
    supplier_id: '',
    invoice_number: '',
    access_key: '',
    date: new Date().toISOString().split('T')[0],
    purchase_type: 'inventario',
    payment_condition: 'contado',
    credit_days: 30,
    purchase_order_id: null,
    items: [
      { product_id: null, description: '', quantity: 1, unit_price: 0, discount: 0, vat_rate: '15' }
    ]
  }
  mostrarModal.value = true
}

const desvincularPO = () => {
  form.value.purchase_order_id = null
  poOriginalNumero.value = ''
}

const agregarItem = () => {
  form.value.items.push({
    product_id: null,
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    vat_rate: '15'
  })
}

const eliminarItem = (index) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

const alSeleccionarProducto = (item) => {
  if (!item.product_id) return
  const p = productos.value.find(x => x.id === item.product_id)
  if (p) {
    item.description = p.name
    item.unit_price = Number(p.purchase_price) || 0
    item.vat_rate = p.vat_rate || '15'
  }
}

const guardarFactura = async () => {
  if (!form.value.supplier_id) {
    toast.warning('Por favor selecciona un proveedor')
    return
  }
  if (!form.value.invoice_number.trim()) {
    toast.warning('Por favor ingresa el número de factura')
    return
  }
  guardando.value = true
  try {
    await api.post('/compras/facturas/', form.value)
    toast.success('Factura de compra registrada exitosamente')
    mostrarModal.value = false
    await fetchFacturas()
  } catch (error) {
    console.error('Error registrando factura:', error)
    toast.error(error.response?.data?.error || 'Error al guardar factura de compra')
  } finally {
    guardando.value = false
  }
}

const verDetalle = (f) => {
  facturaDetalle.value = f
}

const confirmarRecepcion = async (factura) => {
  const confirmacion = window.confirm(
    `¿Deseas ingresar la mercadería de la Factura ${factura.invoice_number} al inventario?\n\n` +
    `Esta acción incrementará el stock físico de los productos y recalculará el Costo Promedio Ponderado (CPP) en el Kardex.`
  )
  if (!confirmacion) return

  try {
    const { data } = await api.post(`/compras/facturas/${factura.id}/recepcionar/`)
    toast.success(data.message || 'Mercadería ingresada exitosamente al inventario')
    if (facturaDetalle.value && facturaDetalle.value.id === factura.id) {
      facturaDetalle.value.reception_status = 'recibida'
    }
    await fetchFacturas()
  } catch (error) {
    console.error('Error recepcionando mercadería:', error)
    toast.error(error.response?.data?.error || 'No se pudo recepcionar la mercadería')
  }
}

// Cargar datos al montar y verificar si viene un po_id
onMounted(async () => {
  await Promise.all([fetchFacturas(), fetchAuxiliares()])

  const poId = route.query.po_id
  if (poId) {
    try {
      const { data: po } = await api.get(`/compras/ordenes/${poId}/`)
      poOriginalNumero.value = po.number
      form.value = {
        supplier_id: po.supplier_id,
        invoice_number: '',
        access_key: '',
        date: new Date().toISOString().split('T')[0],
        purchase_type: 'inventario',
        payment_condition: 'contado',
        credit_days: 30,
        purchase_order_id: po.id,
        items: po.items.map(it => ({
          product_id: it.product_id,
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          discount: Number(it.discount) || 0,
          vat_rate: it.vat_rate || '15'
        }))
      }
      mostrarModal.value = true
      toast.info(`Cargando ítems desde Orden de Compra ${po.number}`)
    } catch (e) {
      console.error('Error pre-cargando PO:', e)
    }
  }
})
</script>
