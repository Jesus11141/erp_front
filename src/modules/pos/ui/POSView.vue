
<template>
  <div class="h-full flex flex-col bg-white overflow-hidden text-slate-900 font-sans selection:bg-brand-500 selection:text-slate-900" style="min-height: 100vh;">
    
    <!-- TOP BAR / HEADER -->
    <header class="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-brand-500/20">
                    H
                </div>
                <div>
                    <h1 class="font-bold text-base leading-none text-slate-900 tracking-wide uppercase">{{ parametrosStore.company?.name || tenantStore.tenant?.name || 'MI EMPRESA' }} <span class="text-brand-500 font-extrabold">POS</span></h1>
                    <span class="text-[10px] text-slate-600 tracking-wider uppercase font-semibold">{{ authStore.user?.sucursal || 'Sucursal Principal' }} • Caja {{ authStore.user?.caja_id || '01' }}</span>
                </div>
            </div>
            
            <div class="hidden md:flex items-center space-x-2 bg-white/80 border border-slate-200 px-3 py-1 rounded-full text-xs">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-slate-700 font-medium">SRI Emisión Directa:</span>
                <span class="text-emerald-400 font-mono font-bold">Activo</span>
            </div>
        </div>

        <div class="flex items-center space-x-3">
            <button v-if="cajaAbierta" @click="mostrarMovimientosCaja = true" class="bg-slate-100 hover:bg-slate-700 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-money-bill-transfer text-emerald-500"></i>
                <span>Movimientos</span>
            </button>
            <button v-if="cajaAbierta" @click="mostrarCerrarCaja = true" class="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-lock"></i>
                <span>Cerrar Turno</span>
            </button>
            <button v-if="!cajaAbierta" @click="mostrarAbrirCaja = true" class="bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-lock-open"></i>
                <span>Abrir Turno</span>
            </button>

            <button @click="abrirHistorial" class="bg-slate-100 hover:bg-slate-700 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-receipt text-blue-400"></i>
                <span>Historial</span>
            </button>
            <div class="h-6 w-px bg-slate-100 hidden sm:block"></div>
            <div class="flex items-center space-x-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <i class="fa-solid fa-user-circle text-slate-700 text-sm"></i>
                <span class="font-medium text-slate-800">{{ authStore.user?.username || 'Usuario' }}</span>
            </div>
        </div>
    </header>

    <main class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <template v-if="!cajaAbierta">
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 z-10 w-full h-full absolute inset-0">
             <div class="text-6xl mb-4">🔒</div>
             <h3 class="text-2xl font-bold mb-2">Ventas Desactivadas</h3>
             <p class="text-slate-600 mb-6">Por favor, inicie su turno de caja para poder realizar ventas.</p>
             <button class="bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20" @click="mostrarAbrirCaja = true">
                🖥️ Iniciar Turno / Abrir Caja
             </button>
          </div>
        </template>
        
        <!-- LEFT COLUMN: PRODUCTS -->
        <section class="flex-1 flex flex-col bg-white border-r border-slate-200/80 min-w-0" :class="{'opacity-20 pointer-events-none': !cajaAbierta}">
            
            <div class="p-3 bg-slate-50/60 border-b border-slate-200/80 flex flex-col sm:flex-row gap-2.5 relative">
                <div class="relative flex-1">
                    <i class="fa-solid fa-barcode text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"></i>
                    <input 
                        ref="inputBusqueda"
                        v-model="busqueda" 
                        @keyup.enter="buscarProducto"
                        @input="onBusquedaInput"
                        @blur="handleBlurProducto"
                        @focus="busqueda.length >= 1 && (mostrarSugerenciasProducto = true)"
                        type="text" 
                        placeholder="Buscar por código de barras, nombre o SKU (Presiona Enter)... [F2]" 
                        class="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium transition-all"
                    >
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 font-mono">F2</span>
                    
                    <!-- Autocomplete Dropdown -->
                    <div v-if="mostrarSugerenciasProducto" class="absolute top-full left-0 right-0 mt-2 bg-slate-50 border border-slate-300 rounded-xl shadow-2xl shadow-black/50 z-50 max-h-[300px] overflow-y-auto">
                        <div v-if="buscandoProducto" class="p-3 text-sm text-slate-600 text-center">Buscando...</div>
                        <template v-else>
                          <div v-for="p in sugerenciasProducto" :key="p.id" @mousedown.prevent="seleccionarProductoSugerencia(p)" class="p-3 border-b border-slate-200 hover:bg-slate-100 cursor-pointer flex justify-between items-center transition-colors">
                            <div class="flex-1">
                                <div class="font-bold text-slate-800 text-sm">{{ p.code || p.codigo }} - {{ p.description || p.descripcion || p.name || p.nombre }}</div>
                                <div class="text-[10px] text-slate-500 font-medium mt-0.5">Stock disponible: {{ p.current_stock ?? p.stock ?? 0 }}</div>
                            </div>
                            <div class="font-bold text-brand-400 text-sm whitespace-nowrap ml-4">${{ p.sale_price }}</div>
                          </div>
                          <div v-if="!sugerenciasProducto.length" class="p-3 text-sm text-slate-600 text-center">
                            No se encontraron productos para "{{ busqueda }}"
                          </div>
                        </template>
                    </div>
                </div>

                <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <button 
                        v-for="cat in simulatedCategories" 
                        :key="cat.id"
                        @click="selectedCategory = cat.id"
                        :class="[
                            selectedCategory === cat.id 
                                ? 'bg-brand-500 text-slate-950 font-bold shadow-md shadow-brand-500/20' 
                                : 'bg-slate-50 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200',
                            'px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all'
                        ]"
                    >
                        <i :class="['mr-1 text-[11px]', cat.icon]"></i> {{ cat.name }}
                    </button>
                </div>
            </div>

            <!-- PRODUCT GRID -->
            <div class="flex-1 overflow-y-auto p-4 bg-slate-100/50">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" v-if="productosFiltrados.length > 0">
                    <div 
                        v-for="p in productosFiltrados" 
                        :key="p.id" 
                        @click="abrirModalProducto(p)"
                        class="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col cursor-pointer hover:shadow-md hover:border-brand-300 transition-all select-none relative group"
                    >
                        <button v-if="selectedCategory === 'todos'" @click.stop="removerDeEspera(p.id)" class="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full text-slate-400 hover:text-red-500 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                        <div class="aspect-square bg-slate-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-slate-100">
                            <img v-if="p.image" :src="getImageUrl(p.image)" class="w-full h-full object-cover">
                            <i v-else class="fa-solid fa-box text-4xl text-slate-300"></i>
                        </div>
                        <div class="flex-1 flex flex-col">
                            <div class="font-bold text-slate-800 text-[13px] line-clamp-2 leading-tight mb-1">{{ p.name || p.nombre || p.description }}</div>
                            <div class="text-[10px] text-slate-500 font-mono">{{ p.code || p.codigo }}</div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <div class="font-black text-brand-600 text-sm leading-none">${{ p.sale_price }}</div>
                                <div class="text-[10px] font-bold mt-1.5 px-1.5 py-0.5 rounded inline-block" :class="obtenerStockSucursalActual(p) > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                                    {{ obtenerStockSucursalActual(p) }} <span class="font-normal opacity-80 uppercase">{{ p.unit || 'und' }}</span>
                                </div>
                            </div>
                            <button @click.stop="agregarItem(p)" class="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 text-brand-600 hover:bg-brand-500 hover:text-white flex items-center justify-center transition-all flex-shrink-0 active:scale-95 shadow-sm">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <template v-if="selectedCategory === 'todos'">
                        <i class="fa-solid fa-barcode text-6xl mb-4 opacity-20"></i>
                        <p class="text-lg font-medium text-slate-600">Área de espera vacía</p>
                        <p class="text-sm mt-2 max-w-md mx-auto">Busca o escanea productos para colocarlos aquí. Luego selecciónalos para ver el stock en otras sucursales o agregarlos al carrito.</p>
                    </template>
                    <template v-else>
                        <i class="fa-solid fa-box-open text-5xl mb-4 opacity-20"></i>
                        <p class="text-sm font-medium">No se encontraron productos en esta categoría.</p>
                    </template>
                </div>
            </div>
        </section>

        <!-- RIGHT COLUMN: CURRENT CART -->
        <section class="w-full md:w-[420px] bg-slate-50 flex flex-col h-full border-t md:border-t-0 md:border-l border-slate-200 shrink-0" :class="{'opacity-20 pointer-events-none': !cajaAbierta}">
            
            <!-- Customer Selection Section -->
            <div class="p-3 bg-white/60 border-b border-slate-200 relative">
                <div class="flex items-center justify-between mb-2">
                    <label class="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-address-card text-brand-500"></i> Cliente (SRI Comprobante)
                    </label>
                    <button 
                        @click="toggleQuickClient"
                        class="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                    >
                        <i class="fa-solid" :class="clienteForm.name ? 'fa-pen' : 'fa-user-check'"></i>
                        {{ clienteForm.name ? (clienteForm.identification === '9999999999999' ? 'Buscar Cliente' : 'Cambiar Cliente') : 'Consumidor Final' }}
                    </button>
                </div>

                <div v-if="clienteForm.name" class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <div class="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Datos del Cliente</div>
                        <div v-if="clienteForm.identification !== '9999999999999'" class="flex items-center gap-1.5">
                            <input type="checkbox" id="updateCust" v-model="updateCustomer" class="accent-brand-500 w-3 h-3">
                            <label for="updateCust" class="text-[10px] text-brand-400 font-bold cursor-pointer">Actualizar datos</label>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <input v-model="clienteForm.identification" type="text" placeholder="Cédula/RUC" class="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500" :disabled="clienteForm.identification === '9999999999999'" title="Cédula o RUC (Obligatorio para SRI)">
                        <input v-model="clienteForm.name" type="text" placeholder="Razón Social" class="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500" :disabled="clienteForm.identification === '9999999999999'" title="Razón Social">
                        <input v-model="clienteForm.email" type="email" placeholder="Correo Electrónico" class="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500" :disabled="clienteForm.identification === '9999999999999'" title="Correo Electrónico">
                        <input v-model="clienteForm.address" type="text" placeholder="Dirección" class="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500" :disabled="clienteForm.identification === '9999999999999'" title="Dirección">
                        <select v-model="clienteForm.tipo_id" class="col-span-2 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500" :disabled="clienteForm.identification === '9999999999999'">
                            <option value="04">RUC</option>
                            <option value="05">Cédula</option>
                            <option value="06">Pasaporte</option>
                            <option value="07">Consumidor Final</option>
                            <option value="08">Identificación Exterior</option>
                        </select>
                    </div>
                </div>
                
                <div v-else class="space-y-2 relative">
                    <div class="flex gap-2">
                        <input 
                            v-model="busquedaCliente" 
                            @input="buscarClientes"
                            type="text" 
                            placeholder="Buscar RUC o Cédula o Nombre..." 
                            class="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-brand-500"
                        >
                        <button class="bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all" @click="mostrarModalCliente = true; prepararNuevoCliente()">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                    <input 
                        :value="clienteForm.name || clienteForm.razon_social || ''" 
                        type="text" 
                        disabled
                        placeholder="Nombre Completo seleccionado" 
                        class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 opacity-70"
                    >
                    
                    <!-- Customer dropdown -->
                    <div v-if="mostrarSugerencias && busquedaCliente.length >= 2" class="absolute top-[40px] left-0 right-12 mt-1 bg-slate-50 border border-slate-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                        <div v-if="buscandoCliente" class="p-2 text-xs text-slate-600">Buscando...</div>
                        <template v-else>
                          <div v-for="c in sugerenciasCliente" :key="c.id" @mousedown.prevent="seleccionarClienteModal(c)" class="p-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
                              <div class="text-xs font-bold text-slate-800">{{ c.identification || c.rfc }} - {{ c.name || c.razon_social }}</div>
                          </div>
                          <div v-if="!sugerenciasCliente.length" @mousedown="mostrarModalCliente = true; prepararNuevoCliente()" class="p-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-100">
                             No encontrado. Clic para registrar "{{ busquedaCliente }}"
                          </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- Cart Items List -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2">
                <div v-if="carrito.length === 0" class="h-full flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                    <div class="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 text-slate-600">
                        <i class="fa-solid fa-cart-shopping text-2xl"></i>
                    </div>
                    <p class="text-xs font-semibold text-slate-600">Carrito de compras vacío</p>
                    <p class="text-[11px] text-slate-600 mt-1">Busque un producto o escanee el código para empezar la venta</p>
                </div>

                <div 
                    v-for="(item, index) in carrito" 
                    :key="index"
                    class="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:border-slate-300 transition-all"
                >
                    <div class="flex-1 min-w-0">
                        <h4 class="text-xs font-bold text-slate-800 truncate">{{ item.description }}</h4>
                        <p class="text-[10px] text-slate-600 font-mono mt-0.5">
                            ${{ item.unit_price }} c/u • <span class="text-slate-600">IVA {{ item.tarifa_iva || parametrosStore.obtener('ventas', 'iva', '12') }}%</span>
                        </p>
                    </div>

                    <div class="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                        <button @click="decrementar(index)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-700 text-slate-700 text-xs font-bold flex items-center justify-center active:scale-95">-</button>
                        <span class="w-8 text-center text-xs font-bold font-mono text-slate-900">{{ item.quantity }}</span>
                        <button @click="incrementar(index)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-700 text-slate-700 text-xs font-bold flex items-center justify-center active:scale-95">+</button>
                    </div>

                    <div class="text-right pl-1">
                        <p class="text-xs font-extrabold text-slate-900 font-mono">${{ subtotalItem(item) }}</p>
                        <button @click="eliminar(index)" class="text-[10px] text-rose-500 hover:text-rose-400 transition-colors">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Cart Totals & Checkout Panel -->
            <div class="p-3 bg-white border-t border-slate-200 space-y-2.5">
                <div class="space-y-1 text-xs font-medium text-slate-600 border-b border-slate-200/80 pb-2">
                    <div class="flex justify-between">
                        <span>Subtotal:</span>
                        <span class="font-mono text-slate-800">${{ subtotal }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Monto IVA ({{ parametrosStore.obtener('ventas', 'iva', '12') }}%):</span>
                        <span class="font-mono text-emerald-400 font-bold">${{ tax }}</span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-0.5">
                    <div>
                        <span class="text-[10px] text-slate-600 uppercase tracking-widest font-bold block">Total a Pagar</span>
                        <span class="text-2xl font-black text-slate-900 font-mono tracking-tight">${{ total }}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono border border-slate-300">
                            {{ carrito.reduce((s,i) => s+Number(i.quantity), 0) }} ítems
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-4 gap-2">
                    <button 
                        @click="carrito = []; productosEnEspera = []"
                        :disabled="carrito.length === 0 && productosEnEspera.length === 0"
                        class="col-span-1 bg-slate-100 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 border border-slate-300 rounded-xl py-3 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95"
                    >
                        <i class="fa-solid fa-trash text-sm mb-0.5"></i>
                        <span class="text-[10px]">Anular</span>
                    </button>
                    <button 
                        @click="openPaymentModal"
                        :disabled="carrito.length === 0"
                        class="col-span-3 bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-400 hover:to-emerald-500 disabled:opacity-40 text-slate-950 font-black rounded-xl py-3 text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                    >
                        <i class="fa-solid fa-cash-register text-base"></i>
                        <span>COBRAR [F4]</span>
                    </button>
                </div>
            </div>
        </section>
    </main>


    <!-- MODAL DE PAGO Y SRI (Modernizado) -->
    <div v-if="showModernPaymentModal" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div class="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <h3 class="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-credit-card text-brand-500"></i> Procesar Cobro & Factura
                </h3>
                <button @click="showModernPaymentModal = false; nroComprobante = ''" class="text-slate-600 hover:text-slate-900 text-sm">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="p-4 space-y-4">
                <div class="bg-white p-3 rounded-xl border border-slate-200 text-center">
                    <span class="text-[11px] text-slate-600 font-semibold uppercase tracking-wider block">Total Cobro</span>
                    <span class="text-3xl font-black text-brand-400 font-mono">${{ total }}</span>
                </div>
                
                <div>
                    <label class="text-xs font-bold text-slate-700 block mb-1.5">Forma de Pago</label>
                    <select v-model="metodoPago" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500">
                       <option v-for="op in opcionesMetodos" :key="op.value" :value="op.value">{{ op.label }}</option>
                    </select>
                </div>
                
                <div v-if="metodoActual && !metodoActual.requires_reference" class="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                    <label class="text-xs font-bold text-slate-700 block">Efectivo Recibido</label>
                    <div class="flex gap-2">
                        <input v-model.number="montoRecibido" type="number" step="0.01" class="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-base font-mono text-slate-900 font-bold focus:outline-none focus:border-brand-500">
                        <button @click="montoRecibido = Number(total)" class="bg-slate-100 hover:bg-slate-700 text-slate-800 font-bold px-3 py-2 rounded-lg text-xs">Exacto</button>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-slate-200/80">
                        <span class="text-xs font-bold text-slate-600">Cambio / Vuelto:</span>
                        <span :class="[cambio < 0 ? 'text-rose-400' : 'text-emerald-400', 'text-lg font-black font-mono']">
                            ${{ cambio < 0 ? '0.00' : cambio }}
                        </span>
                    </div>
                </div>

                <div v-else-if="metodoActual && metodoActual.requires_reference" class="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                     <label class="text-xs font-bold text-slate-700 block">Número de Comprobante / Lote</label>
                     <input v-model="nroComprobante" type="text" placeholder="Ej: Ref #123456" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500">
                     
                     <label class="text-xs font-bold text-slate-700 block mt-2">Valor Pagado</label>
                     <input v-model.number="montoRecibido" type="number" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-brand-500">
                </div>
                
                <p v-if="errorVenta" class="text-xs font-bold text-rose-500 text-center bg-rose-500/10 py-2 rounded">{{ errorVenta }}</p>
                <div v-if="procesando" class="text-xs text-brand-400 text-center"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Facturando con SRI...</div>
            </div>
            
            <div class="p-4 bg-white border-t border-slate-200 flex justify-end gap-2">
                <button @click="showModernPaymentModal = false" class="bg-slate-100 hover:bg-slate-700 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold">Cancelar</button>
                <button @click="procesarCobroWrapper" :disabled="procesando" class="bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-slate-950 font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-paper-plane"></i> Emitir Factura
                </button>
            </div>
        </div>
    </div>

    <!-- TICKET 80mm MODAL -->
    <div v-if="showReceiptModal" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div class="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-bold text-sm text-slate-900 flex items-center gap-2"><i class="fa-solid fa-receipt text-emerald-400"></i> Ticket Venta (80mm)</h3>
              <button @click="showReceiptModal = false" class="text-slate-600 hover:text-slate-900 text-sm"><i class="fa-solid fa-xmark"></i></button>
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
                  <button @click="showReceiptModal = false" class="bg-slate-100 hover:bg-slate-700 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold">Cerrar</button>
                  <button @click="printReceipt" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                      <i class="fa-solid fa-print"></i> Imprimir
                  </button>
              </div>
          </div>
      </div>
    </div>
    
    <!-- OTROS MODALES EXISTENTES -->
    
    <!-- Modal abrir caja -->
    <div v-if="mostrarAbrirCaja" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-lock-open text-brand-500"></i> Abrir Caja</h3>
          <button @click="mostrarAbrirCaja = false" class="text-slate-400 hover:text-slate-600 transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Sucursal</label>
            <select v-model="formCaja.sucursal_id" @change="cargarCajasPorSucursal" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none">
              <option value="null" disabled>Selecciona una sucursal</option>
              <option v-for="s in sucursales" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Caja Física</label>
            <select v-model="formCaja.name" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" :disabled="!cajasRegistradas.length">
              <option value="" disabled>Selecciona una caja</option>
              <option v-for="c in cajasRegistradas" :key="c.id" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Cajero Asignado</label>
            <select v-model="formCaja.cajero_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none">
              <option value="null" disabled>Selecciona un cajero</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">PIN de Caja</label>
            <input v-model="formCaja.pin_caja" type="password" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" placeholder="****" />
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
               <label class="block text-xs font-semibold text-slate-700">Saldo inicial en efectivo ($)</label>
               <label class="flex items-center space-x-1.5 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" v-model="usarDesgloseFondo" class="rounded border-slate-300 text-brand-500 focus:ring-brand-500">
                  <span>Desglose de efectivo</span>
               </label>
            </div>
            
            <div v-if="usarDesgloseFondo" class="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2 grid grid-cols-2 gap-4">
               <div>
                  <h4 class="text-[10px] font-bold text-slate-500 mb-2 border-b border-slate-200 pb-1">BILLETES</h4>
                  <div class="space-y-1.5">
                     <div v-for="(count, bill) in breakdownCaja.billetes" :key="'bill-'+bill" class="flex items-center justify-between">
                        <span class="text-xs text-slate-600 font-mono w-10">${{bill}}</span>
                        <input type="number" min="0" v-model="breakdownCaja.billetes[bill]" class="w-16 h-7 text-xs border border-slate-200 rounded px-1 text-center bg-white" />
                     </div>
                  </div>
               </div>
               <div>
                  <h4 class="text-[10px] font-bold text-slate-500 mb-2 border-b border-slate-200 pb-1">MONEDAS</h4>
                  <div class="space-y-1.5">
                     <div v-for="(count, coin) in breakdownCaja.monedas" :key="'coin-'+coin" class="flex items-center justify-between">
                        <span class="text-xs text-slate-600 font-mono w-10">${{coin}}</span>
                        <input type="number" min="0" v-model="breakdownCaja.monedas[coin]" class="w-16 h-7 text-xs border border-slate-200 rounded px-1 text-center bg-white" />
                     </div>
                  </div>
               </div>
               <div class="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-600">Total Arqueo:</span>
                  <span class="font-mono font-bold text-brand-600">${{ totalBreakdown }}</span>
               </div>
            </div>

            <input v-else v-model="formCaja.saldo_inicial" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-mono" placeholder="0.00" />
          </div>
        </div>
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button @click="mostrarAbrirCaja = false" class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          <button @click="abrirCaja" class="px-4 py-2 text-xs font-bold text-slate-950 bg-brand-400 hover:bg-brand-500 rounded-lg shadow-md shadow-brand-500/20 transition-colors flex items-center gap-1.5"><i class="fa-solid fa-check"></i> Abrir Turno</button>
        </div>
      </div>
    </div>

    <!-- Modal cerrar caja -->
    <div v-if="mostrarCerrarCaja" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-lock text-rose-500"></i> Cerrar Caja</h3>
          <button @click="mostrarCerrarCaja = false" class="text-slate-400 hover:text-slate-600 transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        
        <div v-if="resumenCierre" class="p-5 space-y-4">
          <div class="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm mb-4 border border-emerald-100 flex items-start gap-2">
            <i class="fa-solid fa-circle-check mt-0.5"></i>
            <div>
              <p class="font-bold">Caja cerrada exitosamente</p>
              <p class="text-xs opacity-90">El resumen del turno ha sido guardado.</p>
            </div>
          </div>
          <div class="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="flex justify-between items-center"><span class="font-medium text-slate-700">Ventas en efectivo:</span> <span class="font-mono text-slate-900">${{ resumenCierre.total_efectivo }}</span></div>
            <div class="flex justify-between items-center"><span class="font-medium text-slate-700">Ventas con tarjeta:</span> <span class="font-mono text-slate-900">${{ resumenCierre.total_tarjeta }}</span></div>
            <div class="flex justify-between items-center"><span class="font-medium text-slate-700">Ventas por transferencia:</span> <span class="font-mono text-slate-900">${{ resumenCierre.total_transferencia }}</span></div>
            <div class="h-px bg-slate-200 my-2"></div>
            <div class="flex justify-between items-center font-bold text-slate-900"><span>Total ventas:</span> <span class="font-mono">${{ resumenCierre.total_general }}</span></div>
            
            <div v-if="Number(resumenCierre.total_inflows) > 0" class="flex justify-between items-center text-emerald-600"><span>Total Ingresos (+):</span> <span class="font-mono">${{ resumenCierre.total_inflows }}</span></div>
            <div v-if="Number(resumenCierre.total_outflows) > 0" class="flex justify-between items-center text-rose-600"><span>Total Egresos (-):</span> <span class="font-mono">${{ resumenCierre.total_outflows }}</span></div>

            <div class="flex justify-between items-center font-bold mt-2 pt-2 border-t border-slate-200" :class="Number(resumenCierre.diferencia) < 0 ? 'text-rose-600' : 'text-emerald-600'">
              <span>Diferencia reportada:</span> <span class="font-mono">${{ resumenCierre.diferencia }}</span>
            </div>
          </div>
          <button @click="mostrarCerrarCaja = false; resumenCierre = null" class="w-full py-2.5 mt-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cerrar</button>
        </div>

        <div v-else class="p-5 space-y-4">
          <div class="bg-amber-50 text-amber-700 p-3 rounded-lg text-xs mb-4 border border-amber-100">
            <i class="fa-solid fa-circle-info mr-1"></i> Ingresa el dinero físico total que tienes en la caja (incluyendo el saldo inicial) para el cuadre automático.
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
               <label class="block text-xs font-semibold text-slate-700">Dinero contado en caja (Efectivo Físico)</label>
               <label class="flex items-center space-x-1.5 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" v-model="usarDesgloseCierre" class="rounded border-slate-300 text-rose-500 focus:ring-rose-500">
                  <span>Desglose de efectivo</span>
               </label>
            </div>
            
            <div v-if="usarDesgloseCierre" class="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2 grid grid-cols-2 gap-4">
               <div>
                  <h4 class="text-[10px] font-bold text-slate-500 mb-2 border-b border-slate-200 pb-1">BILLETES</h4>
                  <div class="space-y-1.5">
                     <div v-for="(count, bill) in breakdownCaja.billetes" :key="'billc-'+bill" class="flex items-center justify-between">
                        <span class="text-xs text-slate-600 font-mono w-10">${{bill}}</span>
                        <input type="number" min="0" v-model="breakdownCaja.billetes[bill]" class="w-16 h-7 text-xs border border-slate-200 rounded px-1 text-center bg-white" />
                     </div>
                  </div>
               </div>
               <div>
                  <h4 class="text-[10px] font-bold text-slate-500 mb-2 border-b border-slate-200 pb-1">MONEDAS</h4>
                  <div class="space-y-1.5">
                     <div v-for="(count, coin) in breakdownCaja.monedas" :key="'coinc-'+coin" class="flex items-center justify-between">
                        <span class="text-xs text-slate-600 font-mono w-10">${{coin}}</span>
                        <input type="number" min="0" v-model="breakdownCaja.monedas[coin]" class="w-16 h-7 text-xs border border-slate-200 rounded px-1 text-center bg-white" />
                     </div>
                  </div>
               </div>
               <div class="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-600">Total Arqueo:</span>
                  <span class="font-mono font-bold text-rose-600">${{ totalBreakdown }}</span>
               </div>
            </div>

            <input v-else v-model="formCierre.saldo_final" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-3 text-lg font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none font-mono text-center" placeholder="0.00" />
          </div>
          
          <div class="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-4">
            <button @click="mostrarCerrarCaja = false" class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
            <button @click="cerrarCaja" class="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-md shadow-rose-500/20 transition-colors flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> Finalizar Turno</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal Movimientos de Caja -->
    <div v-if="mostrarMovimientosCaja" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-money-bill-transfer text-brand-500"></i> Registrar Movimiento</h3>
          <button @click="mostrarMovimientosCaja = false" class="text-slate-400 hover:text-slate-600 transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-5 space-y-4">
          <div class="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs mb-4 border border-blue-100">
            <i class="fa-solid fa-circle-info mr-1"></i> Registre entradas o salidas de dinero de la caja (ej: pagos de servicios, reposición de cambio).
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
            <div class="flex gap-2">
               <button @click="formMovimiento.tipo = 'inflow'" :class="formMovimiento.tipo === 'inflow' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'" class="flex-1 py-2 rounded-lg font-bold text-sm transition-colors border border-transparent">
                  Ingreso (+)
               </button>
               <button @click="formMovimiento.tipo = 'outflow'" :class="formMovimiento.tipo === 'outflow' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'" class="flex-1 py-2 rounded-lg font-bold text-sm transition-colors border border-transparent">
                  Egreso (-)
               </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Monto ($)</label>
            <input v-model="formMovimiento.monto" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-3 text-lg font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-mono text-center" placeholder="0.00" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Motivo / Descripción</label>
            <input v-model="formMovimiento.motivo" type="text" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" placeholder="Ej: Pago de agua" />
          </div>
          <div class="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-4">
            <button @click="mostrarMovimientosCaja = false" class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
            <button @click="registrarMovimiento" class="px-4 py-2 text-xs font-bold text-slate-950 bg-brand-400 hover:bg-brand-500 rounded-lg shadow-md shadow-brand-500/20 transition-colors flex items-center gap-1.5"><i class="fa-solid fa-save"></i> Guardar Movimiento</button>
          </div>
        </div>
      </div>
    </div>
    <!-- PRODUCT DETAIL MODAL -->
    <div v-if="mostrarDetalleProducto" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        <!-- Header -->
        <div class="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center relative">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                <img v-if="productoSeleccionado.image" :src="getImageUrl(productoSeleccionado.image)" class="w-full h-full object-cover">
                <i v-else class="fa-solid fa-box text-slate-300"></i>
             </div>
             <div>
               <h3 class="font-black text-slate-800 text-lg leading-tight line-clamp-1 pr-4">{{ productoSeleccionado.name || productoSeleccionado.nombre || productoSeleccionado.description }}</h3>
               <p class="text-xs text-slate-500 font-mono">{{ productoSeleccionado.code || productoSeleccionado.codigo }}</p>
             </div>
          </div>
          <button @click="mostrarDetalleProducto = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm border border-slate-200 transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Body -->
        <div class="p-5">
          <div class="flex justify-between items-end mb-6">
            <div>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Precio Unitario</p>
              <p class="text-3xl font-black text-brand-600">${{ productoSeleccionado.sale_price }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Stock Global</p>
              <p class="text-lg font-bold text-slate-800">{{ productoSeleccionado.current_stock || 0 }} <span class="text-xs text-slate-500">{{ productoSeleccionado.unit || 'und' }}</span></p>
            </div>
          </div>

          <!-- Stock por Sucursal -->
          <div class="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div class="px-3 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-store text-brand-500"></i> Disponibilidad por Sucursal
            </div>
            <div class="divide-y divide-slate-100 max-h-40 overflow-y-auto">
              <div v-for="bs in (productoSeleccionado.branch_stocks || [])" :key="bs.branch_id" 
                   class="px-4 py-2.5 flex justify-between items-center hover:bg-slate-50/50 transition-colors"
                   :class="{'bg-brand-50/30': (cajaAbierta?.register?.branch_id || cajaAbierta?.branch_id) === bs.branch_id}">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="parseFloat(bs.quantity) > 0 ? 'bg-green-500' : 'bg-red-500'"></div>
                  <span class="text-sm font-medium" :class="(cajaAbierta?.register?.branch_id || cajaAbierta?.branch_id) === bs.branch_id ? 'text-brand-700' : 'text-slate-700'">
                    {{ bs.branch_name }}
                    <span v-if="(cajaAbierta?.register?.branch_id || cajaAbierta?.branch_id) === bs.branch_id" class="text-[9px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded ml-1 font-bold">ACTUAL</span>
                  </span>
                </div>
                <span class="text-sm font-bold" :class="parseFloat(bs.quantity) > 0 ? 'text-slate-800' : 'text-slate-400'">{{ bs.quantity }}</span>
              </div>
              <div v-if="!(productoSeleccionado.branch_stocks?.length)" class="px-4 py-4 text-center text-xs text-slate-500">
                No hay desglose por sucursales.
              </div>
            </div>
          </div>

          <button @click="agregarItem(productoSeleccionado); mostrarDetalleProducto = false" class="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center justify-center gap-2 text-sm">
            <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Historial de Ventas Turno Actual -->
  <div v-if="mostrarHistorialModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="mostrarHistorialModal = false"></div>
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <div class="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-brand-500"></i>
            Historial de Ventas (Turno Actual)
          </h2>
          <p class="text-sm text-slate-500 mt-1">Ventas realizadas en la caja abierta actualmente</p>
        </div>
        <button @click="mostrarHistorialModal = false" class="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        <div v-if="cargandoHistorial" class="flex flex-col items-center justify-center py-12 text-slate-400">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-4 text-brand-500"></i>
          <p>Cargando historial...</p>
        </div>
        
        <div v-else-if="ventasTurno.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">
            <i class="fa-solid fa-receipt"></i>
          </div>
          <p class="text-lg font-medium text-slate-600">No hay ventas en este turno</p>
          <p class="text-sm">Realiza ventas en el POS para que aparezcan aquí.</p>
        </div>

        <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 font-semibold">ID Transacción</th>
                <th class="px-4 py-3 font-semibold">Hora</th>
                <th class="px-4 py-3 font-semibold">Monto Total</th>
                <th class="px-4 py-3 font-semibold">Método Pago</th>
                <th class="px-4 py-3 font-semibold">Estado</th>
                <th class="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr v-for="venta in ventasTurno" :key="venta.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-mono font-medium">#{{ venta.id }}</td>
                <td class="px-4 py-3">{{ formatearHora(venta.created_at) }}</td>
                <td class="px-4 py-3 font-bold text-slate-900">${{ parseFloat(venta.total).toFixed(2) }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                        :class="venta.payment_method === 'cash' || venta.payment_method === 'efectivo' ? 'bg-emerald-50 text-emerald-700' : (venta.payment_method === 'card' || venta.payment_method === 'tarjeta' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700')">
                    <i class="mr-1.5 fa-solid" 
                       :class="venta.payment_method === 'cash' || venta.payment_method === 'efectivo' ? 'fa-money-bill' : (venta.payment_method === 'card' || venta.payment_method === 'tarjeta' ? 'fa-credit-card' : 'fa-money-bill-transfer')"></i>
                    {{ traducirMetodoPago(venta.payment_method) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                        :class="venta.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
                    <i class="mr-1.5 fa-solid" :class="venta.status === 'completed' ? 'fa-check' : 'fa-xmark'"></i>
                    {{ venta.status === 'completed' ? 'Completado' : 'Cancelado' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button @click="imprimirTicketPasado(venta)" class="text-brand-600 hover:text-brand-800 hover:bg-brand-50 p-1.5 rounded-lg transition-colors" title="Reimprimir Ticket">
                    <i class="fa-solid fa-print"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
        <button @click="mostrarHistorialModal = false" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'
import { useParametrosStore } from '@/stores/parametros'
import { useAlert } from '@/composables/useAlert'
import api from '../../../shared/api'

const authStore = useAuthStore()
const parametrosStore = useParametrosStore()
const tenantStore = useTenantStore()
const { showAlert } = useAlert()

const products = ref([])
const carrito = ref([])
const busqueda = ref('')
const mostrarDetalleProducto = ref(false)
const productoSeleccionado = ref(null)
const productosEnEspera = ref([])

// Historial del Turno Actual
const mostrarHistorialModal = ref(false)
const ventasTurno = ref([])
const cargandoHistorial = ref(false)

const productosFiltrados = computed(() => {
    if (selectedCategory.value === 'todos') {
        return productosEnEspera.value
    }
    
    let result = products.value
    if (selectedCategory.value !== 'todos') {
        result = result.filter(p => p.category_id === selectedCategory.value)
    }
    return result
})

function getImageUrl(url) {
    if (!url) return ''
    return url.startsWith('http') ? url : api.defaults.baseURL.replace('/api', '') + url
}

function abrirModalProducto(p) {
    productoSeleccionado.value = p
    mostrarDetalleProducto.value = true
}

function removerDeEspera(id) {
    productosEnEspera.value = productosEnEspera.value.filter(p => p.id !== id)
}

function obtenerStockSucursalActual(p) {
    const branchId = cajaAbierta.value?.register?.branch_id || cajaAbierta.value?.branch_id;
    if (!branchId || !p.branch_stocks || p.branch_stocks.length === 0) {
        return parseFloat(p.current_stock || 0)
    }
    const bs = p.branch_stocks.find(b => b.branch_id === branchId)
    return bs ? parseFloat(bs.quantity) : 0
}
const simulatedCategories = ref([
    { id: 'todos', name: 'Todos', icon: 'fa-solid fa-border-all' },
    { id: 'repuestos', name: 'Repuestos', icon: 'fa-solid fa-gears' },
    { id: 'ferreteria', name: 'Ferretería', icon: 'fa-solid fa-hammer' },
    { id: 'minimarket', name: 'Minimarket / Alimentos', icon: 'fa-solid fa-basket-shopping' },
])
const selectedCategory = ref('todos')

const showModernPaymentModal = ref(false)
const openPaymentModal = () => {
    console.log('Ticket HTML generado, listo para imprimir')
    if (carrito.value.length > 0) {
        showModernPaymentModal.value = true;
    } else {
        alert('El carrito está vacío');
    }
}
const showReceiptModal = ref(false)
const lastSaleData = ref(null)

const toggleQuickClient = () => {
    if (clienteForm.value.name) {
       clienteForm.value = {}
       busquedaCliente.value = ''
    } else {
       clienteForm.value = {
          id: 1, 
          name: 'CONSUMIDOR FINAL',
          identification: '9999999999999',
          address: 'S/D',
          tipo_id: '07'
       }
    }
}

const printReceipt = () => { window.print() }

const procesarCobroWrapper = async () => {
   const cartBackup = JSON.parse(JSON.stringify(carrito.value))
   const clientBackup = JSON.parse(JSON.stringify(clienteForm.value))
   const saleTotal = total.value
   const saleTax = tax.value
   const saleSubtotal = subtotal.value
   
   let success = false
   try {
       await cobrar() 
       if (carrito.value.length === 0 && !errorVenta.value) {
          success = true
       }
   } catch(e) {
      console.error(e)
   }
   
   if (success) {
       showModernPaymentModal.value = false
       lastSaleData.value = {
           id: ticketVenta.value?.id || Date.now().toString().slice(-6),
           items: cartBackup,
           total: saleTotal,
           tax: saleTax,
           subtotal: saleSubtotal,
           client: clientBackup
       }
       showReceiptModal.value = true
   }
}

const sugerenciasProducto = ref([])
const mostrarSugerenciasProducto = ref(false)
const buscandoProducto = ref(false)
let debounceTimeoutProducto = null

function onBusquedaInput() {
  if (busqueda.value.length < 1) {
    mostrarSugerenciasProducto.value = false
    sugerenciasProducto.value = []
    return
  }
  clearTimeout(debounceTimeoutProducto)
  debounceTimeoutProducto = setTimeout(async () => {
    buscandoProducto.value = true
    mostrarSugerenciasProducto.value = true
    try {
      const { data } = await api.get(`/inventario/products/?q=${busqueda.value}`)
      sugerenciasProducto.value = data
    } catch (e) {
      console.error('Error buscando', e)
    } finally {
      buscandoProducto.value = false
    }
  }, 300)
}

function handleBlurProducto() {
  setTimeout(() => mostrarSugerenciasProducto.value = false, 200)
}

function seleccionarProductoSugerencia(prod) {
  if (!productosEnEspera.value.find(p => p.id === prod.id)) {
    productosEnEspera.value.unshift(prod)
  }
  selectedCategory.value = 'todos'
  busqueda.value = ''
  mostrarSugerenciasProducto.value = false
  sugerenciasProducto.value = []
  if (inputBusqueda.value) inputBusqueda.value.focus()
}

const metodoPago = ref('efectivo')
const nroComprobante = ref('')
const montoRecibido = ref(0)
const procesando = ref(false)
const errorVenta = ref('')
const ticketVenta = ref(null)
const cajaAbierta = ref(null)
const cajasRegistradas = ref([])
const employees = ref([])
const sucursales = ref([])
const cargandoPOS = ref(false)


const mostrarAbrirCaja = ref(false)
const mostrarCerrarCaja = ref(false)
const mostrarModalCliente = ref(false)
const mostrarModalFactura = ref(false)

const mostrarPickerCaja = ref(false)
const mostrarPickerEmpleado = ref(false)
const cajaSeleccionada = ref(null)
const empleadoSeleccionado = ref(null)
const resumenCierre = ref(null)
const formCaja = ref({ name: '', saldo_inicial: 0, cajero_id: null, pin_caja: '', sucursal_id: null })
const formCierre = ref({ saldo_final: 0 })
const mostrarMovimientosCaja = ref(false)
const formMovimiento = ref({ tipo: 'outflow', monto: 0, motivo: '' })

async function registrarMovimiento() {
    if (formMovimiento.value.monto <= 0) {
        showAlert('El monto debe ser mayor a 0', 'error')
        return
    }
    if (!formMovimiento.value.motivo.trim()) {
        showAlert('Ingrese un motivo para el movimiento', 'error')
        return
    }
    try {
        await api.post(`/pos/cash-registers/${cajaAbierta.value.id}/movements/`, {
            movement_type: formMovimiento.value.tipo,
            amount: formMovimiento.value.monto,
            reason: formMovimiento.value.motivo
        })
        showAlert('Movimiento registrado con éxito', 'success')
        mostrarMovimientosCaja.value = false
        formMovimiento.value = { tipo: 'outflow', monto: 0, motivo: '' }
    } catch (e) {
        console.error(e)
        showAlert(e.response?.data?.error || 'Error al registrar movimiento', 'error')
    }
}

const mostrarPin = ref(false)
const inputBusqueda = ref(null)
const requiereFactura = ref(false)
const busquedaCliente = ref('')
const sugerenciasCliente = ref([])
const buscandoCliente = ref(false)
const mostrarSugerencias = ref(false)
const clienteForm = ref({ name: 'CONSUMIDOR FINAL', identification: '9999999999999', tipo_id: '07', email: '', address: 'S/D' })
const updateCustomer = ref(false)
const usarDesgloseFondo = ref(false)
const usarDesgloseCierre = ref(false)
const breakdownCaja = ref({
  billetes: { '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '2': 0, '1': 0 },
  monedas: { '1.00': 0, '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0 }
})

const totalBreakdown = computed(() => {
  let t = 0
  for (const [v, c] of Object.entries(breakdownCaja.value.billetes)) t += parseFloat(v) * (c || 0)
  for (const [v, c] of Object.entries(breakdownCaja.value.monedas)) t += parseFloat(v) * (c || 0)
  return t.toFixed(2)
})

const resetBreakdown = () => {
  breakdownCaja.value = {
    billetes: { '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '2': 0, '1': 0 },
    monedas: { '1.00': 0, '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0 }
  }
}

let clienteTimer = null


const metodosList = ref([])

const cargarMetodosPago = async () => {
  try {
    const { data } = await api.get('/ventas/payment-methods/')
    metodosList.value = data.filter(m => m.active !== false).map(m => ({
      name: m.id, // using ID as the value for the backend
      label: m.name,
      requires_reference: m.requires_reference
    }))
    if (metodosList.value.length > 0 && !metodoPago.value) {
      metodoPago.value = metodosList.value[0].name
    }
  } catch (error) {
    console.error('Error cargando metodos de pago:', error)
  }
}

onMounted(() => {
  cargarMetodosPago()
})


const opcionesMetodos = computed(() => metodosList.value.map(m => ({ value: m.name, label: m.label })))
const metodoActual = computed(() => metodosList.value.find(m => m.name === metodoPago.value))

watch(metodosList, (list) => {
  if (list.length > 0 && !list.find(m => m.name === metodoPago.value)) {
    metodoPago.value = list[0].name
  }
}, { immediate: true })

const subtotalItem = (item) => {
  const base = item.quantity * item.unit_price
  return (base - (base * item.discount / 100)).toFixed(2)
}

const total = computed(() =>
  carrito.value.reduce((acc, i) => acc + parseFloat(subtotalItem(i)), 0).toFixed(2)
)
const tasaIva = computed(() => parseFloat(parametrosStore.obtener('ventas', 'iva', '15')) / 100)
const subtotal = computed(() => (parseFloat(total.value) / (1 + tasaIva.value)).toFixed(2))
const tax = computed(() => (parseFloat(total.value) - parseFloat(subtotal.value)).toFixed(2))

watch([metodoPago, total], ([newMetodo, newTotal]) => {
  const mName = (metodoActual.value && metodoActual.value.label) ? metodoActual.value.label.toLowerCase() : ''
  if (mName.includes('transferencia') || mName.includes('tarjeta')) {
    montoRecibido.value = parseFloat(newTotal) || 0
  }
})

const cambio = computed(() => {
  if (!metodoActual.value || metodoActual.value.label.toLowerCase() !== 'efectivo') return 0
  return Math.max(0, parseFloat(montoRecibido.value) - parseFloat(total.value)).toFixed(2)
})

async function cargarProductos() {
  const params = busqueda.value ? { q: busqueda.value } : {}
  const { data } = await api.get('/inventario/products/', { params })
  products.value = data
}

async function buscarProducto() {
  if (!busqueda.value) return
  try {
    const { data } = await api.get(`/inventario/products/?q=${busqueda.value}`)
    if (data.length > 0) {
      const exactMatch = data.find(p => p.code === busqueda.value || p.codigo === busqueda.value)
      const producto = exactMatch || data[0]
      if (!productosEnEspera.value.find(p => p.id === producto.id)) {
        productosEnEspera.value.unshift(producto)
      }
      selectedCategory.value = 'todos'
      busqueda.value = ''
      mostrarSugerenciasProducto.value = false
    } else {
      useAlert().showToast('Producto no encontrado', 'error')
    }
  } catch (e) {
    console.error(e)
  }
}

function agregarItem(producto) {
  const existente = carrito.value.find(i => i.product_id === producto.id)
  if (existente) {
    existente.quantity++
  } else {
    carrito.value.push({
      product_id: producto.id,
      code: producto.code || producto.codigo || '-',
      description: producto.name || producto.nombre || '-',
      quantity: 1,
      unit_price: parseFloat(producto.sale_price || producto.precio_venta || 0),
      discount: 0,
      tarifa_iva: String(producto.vat_rate || producto.tarifa_iva || parametrosStore.obtener('ventas', 'iva', '15'))
    })
  }
  busqueda.value = ''
  inputBusqueda.value?.focus()
}

function incrementar(idx) { carrito.value[idx].quantity++ }
function decrementar(idx) {
  if (carrito.value[idx].quantity > 1) carrito.value[idx].quantity--
  else eliminar(idx)
}
function eliminar(idx) { 
  const item = carrito.value[idx]
  if (item) {
    removerDeEspera(item.product_id)
  }
  carrito.value.splice(idx, 1) 
}

function abrirModalCliente() {
  busquedaCliente.value = ''
  sugerenciasCliente.value = []
  mostrarSugerencias.value = false
  mostrarModalCliente.value = true
}

function establecerConsumidorFinalModal() {
  clienteForm.value = { name: 'CONSUMIDOR FINAL', identification: '9999999999999', tipo_id: '07', email: '', address: 'S/D' }
  busquedaCliente.value = ''
  sugerenciasCliente.value = []
  mostrarSugerencias.value = false
}

function seleccionarClienteModal(c) {
  const id = c.rfc || ''
  clienteForm.value = {
    id: c.id,
    name: c.name,
    identification: id,
    tipo_id: id.length === 13 ? '04' : id.length === 10 ? '05' : '07',
    email: c.email || '',
    address: c.address || 'S/D'
  }
  busquedaCliente.value = c.name
  sugerenciasCliente.value = []
  mostrarSugerencias.value = false
}

function buscarClientes() {
  clearTimeout(clienteTimer)
  sugerenciasCliente.value = []
  if (busquedaCliente.value.length < 2) { buscandoCliente.value = false; return }
  buscandoCliente.value = true
  mostrarSugerencias.value = true
  clienteTimer = setTimeout(async () => {
    try {
      const { data } = await api.get(`/ventas/customers/?q=${busquedaCliente.value}`)
      sugerenciasCliente.value = data.slice(0, 6)
    } catch { sugerenciasCliente.value = [] }
    finally { buscandoCliente.value = false }
  }, 300)
}

function prepararNuevoCliente() {
  clienteForm.value = {
    name: busquedaCliente.value,
    identification: '',
    tipo_id: '05',
    email: '',
    address: 'S/D'
  }
  sugerenciasCliente.value = []
  buscandoCliente.value = false
  mostrarSugerencias.value = false
}

function guardarClienteModal() {
  mostrarModalCliente.value = false
}

async function abrirCaja() {
  if (usarDesgloseFondo.value) {
    formCaja.value.saldo_inicial = parseFloat(totalBreakdown.value)
  }
  if (!formCaja.value.name) {
    await showAlert({ type: 'warning', title: 'Caja no seleccionada', message: 'Debes seleccionar una caja física antes de iniciar el turno.' })
    return
  }
  if (!formCaja.value.cajero_id) {
    await showAlert({ type: 'warning', title: 'Cajero no asignado', message: 'Selecciona un empleado responsable antes de continuar.' })
    return
  }
  if (!formCaja.value.pin_caja) {
    await showAlert({ type: 'warning', title: 'PIN Requerido', message: 'Debes ingresar el PIN de la caja para iniciar el turno.' })
    return
  }
  try {
    const { data } = await api.post('/pos/cash-registers/', formCaja.value)
    cajaAbierta.value = data
    mostrarAbrirCaja.value = false
    formCaja.value = { name: '', saldo_inicial: 0, cajero_id: null, pin_caja: '', sucursal_id: null }
    mostrarPin.value = false
    await cargarProductos()
  } catch (e) {
    await showAlert({ type: 'error', title: 'Error al abrir caja', message: e.response?.data?.error || 'Ocurrió un error inesperado al intentar abrir la caja.' })
  }
}

async function cargarCajasPorSucursal() {
  if (!formCaja.value.sucursal_id) return
  cajasRegistradas.value = []
  formCaja.value.name = ''
  try {
    const { data: cReg } = await api.get(`/pos/physical-cash-registers/?sucursal_id=${formCaja.value.sucursal_id}`)
    cajasRegistradas.value = cReg
  } catch {}
}

async function cerrarCaja() {
  if (usarDesgloseCierre.value) {
    formCierre.value.saldo_final = parseFloat(totalBreakdown.value)
  }
  try {
    const { data } = await api.post(`/pos/cash-registers/${cajaAbierta.value.id}/close/`, formCierre.value)
    resumenCierre.value = data
    if (data.register.status === 'closed') {
      cajaAbierta.value = null
      products.value = []
      mostrarCerrarCaja.value = false
    }
  } catch (e) {
    await showAlert({ type: 'error', title: 'Error al cerrar caja', message: e.response?.data?.error || 'Ocurrió un error inesperado al intentar cerrar la caja.' })
  }
}

async function cobrar() {
  errorVenta.value = ''
  procesando.value = true
  try {
    const montoFinal = (metodoActual.value && !metodoActual.value.requires_reference)
      ? (parseFloat(montoRecibido.value) || parseFloat(total.value))
      : parseFloat(total.value)
      
    // Determine payment form based on method name roughly
    let paymentForm = '01' // Cash by default
    const mName = (metodoActual.value && metodoActual.value.label) ? metodoActual.value.label.toLowerCase() : ''
    if (mName.includes('tarjeta') && mName.includes('credito')) paymentForm = '19'
    else if (mName.includes('tarjeta') && mName.includes('debito')) paymentForm = '16'
    else if (mName.includes('transferencia')) paymentForm = '20'

    const payload = {
      items: carrito.value.map(i => {
        const tIva = parseFloat(i.tarifa_iva || parametrosStore.obtener('ventas', 'iva', '15')) / 100
        return {
          ...i,
          unit_price: i.unit_price / (1 + tIva),
          codigo_principal: i.code || '',
          tarifa_iva: i.tarifa_iva || parametrosStore.obtener('ventas', 'iva', '15')
        }
      }),
      payment_method: metodoPago.value,
      amount_received: montoFinal,
      update_customer: updateCustomer.value,
      reference_number: (metodoActual.value && metodoActual.value.requires_reference) ? nroComprobante.value : null,
      customer: {
        customer_id: clienteForm.value.id || null,
        name: clienteForm.value.name || 'CONSUMIDOR FINAL',
        identifier: clienteForm.value.identification || '9999999999999',
        id_type: clienteForm.value.tipo_id || '07',
        email: clienteForm.value.email || '',
        address: clienteForm.value.address || 'S/D',
        payment_form: paymentForm,
        payment_term: 0,
        payment_time: 'dias'
      }
    }
    const { data } = await api.post(`/pos/cash-registers/${cajaAbierta.value.id}/sales/`, payload)
    ticketVenta.value = {
      id: data.id,
      total: data.total,
      cambio: data.change,
      factura_numero: data.invoice_number || null,
      items: carrito.value.map(i => ({
        description: i.description,
        quantity: i.quantity,
        subtotal: subtotalItem(i),
      })),
    }
    carrito.value = []
    productosEnEspera.value = []
    nroComprobante.value = ''
    montoRecibido.value = 0
    requiereFactura.value = false
    requiereFactura.value = false
    clienteForm.value = { name: 'CONSUMIDOR FINAL', identification: '9999999999999', tipo_id: '07', email: '' }
    busquedaCliente.value = ''
  } catch (e) {
    errorVenta.value = e.response?.data?.error || 'Error al procesar sale'
  } finally {
    procesando.value = false
  }
}

async function procesarVentaFactura(modalPayload) {
  errorVenta.value = ''
  procesando.value = true
  try {
    const montoFinal = (metodoActual.value && !metodoActual.value.requires_reference)
      ? (parseFloat(montoRecibido.value) || parseFloat(total.value))
      : parseFloat(total.value)

    const payload = {
      items: modalPayload.itemsValidos,
      payment_method: metodoPago.value,
      amount_received: montoFinal,
      reference_number: (metodoActual.value && metodoActual.value.requires_reference) ? nroComprobante.value : null,
      customer: {
        name: modalPayload.form.customer,
        identifier: modalPayload.form.cliente_identificacion,
        id_type: modalPayload.form.cliente_tipo_id,
        email: modalPayload.form.cliente_email,
        payment_form: modalPayload.form.forma_pago,
        address: modalPayload.form.cliente_direccion
      }
    }

    const { data } = await api.post(`/pos/cash-registers/${cajaAbierta.value.id}/sales/`, payload)
    
    ticketVenta.value = {
      id: data.id,
      total: data.total,
      cambio: data.change,
      factura_numero: data.invoice_number || null,
      items: payload.items.map(i => {
        const factor = 1 + (parseFloat(i.vat_rate || '15') / 100)
        const unitIncIva = i.unit_price * factor
        return {
          description: i.description,
          quantity: i.quantity,
          subtotal: i.quantity * unitIncIva - (i.quantity * unitIncIva * ((i.discount||0)/100))
        }
      }),
    }
    carrito.value = []
    productosEnEspera.value = []
    nroComprobante.value = ''
    montoRecibido.value = 0
    requiereFactura.value = false
    mostrarModalFactura.value = false
    clienteForm.value = { name: 'CONSUMIDOR FINAL', identification: '9999999999999', tipo_id: '07', email: '' }
    busquedaCliente.value = ''
  } catch (e) {
    errorVenta.value = e.response?.data?.error || 'Error al procesar venta y factura'
  } finally {
    procesando.value = false
  }
}

const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape') {
    if (mostrarAbrirCaja.value) mostrarAbrirCaja.value = false
    if (mostrarCerrarCaja.value) mostrarCerrarCaja.value = false
    if (showModernPaymentModal.value) showModernPaymentModal.value = false
    if (showReceiptModal.value) showReceiptModal.value = false
    if (ticketVenta.value) ticketVenta.value = null
  }
  
  // Si no hay modales abiertos, procesar atajos de POS
  if (!mostrarAbrirCaja.value && !mostrarCerrarCaja.value && !showModernPaymentModal.value && !showReceiptModal.value && !ticketVenta.value) {
    if (e.key === 'F4') {
      e.preventDefault()
      if (cajaAbierta.value) openPaymentModal()
    }
    if (e.key === 'F2') {
      e.preventDefault()
      inputBusqueda.value?.focus()
    }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown)
  cargandoPOS.value = true
  try {
    const { data } = await api.get('/pos/cash-registers/')
    cajaAbierta.value = data.find(c => c.status === 'open') || null
  } catch {}

  if (cajaAbierta.value) {
    await cargarProductos()
  }

  try {
    const { data: bData } = await api.get('/inventario/branches/')
    sucursales.value = bData
  } catch {}

  try {
    const { data: empData } = await api.get('/rrhh/employees/')
    employees.value = empData
  } catch {}

  

  cargandoPOS.value = false
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
// ==========================================
// Historial de Ventas Turno Actual
// ==========================================
const abrirHistorial = async () => {
  if (!cajaAbierta.value) {
    showAlert('Error', 'Debe abrir un turno de caja primero', 'error');
    return;
  }
  mostrarHistorialModal.value = true;
  cargandoHistorial.value = true;
  try {
    const { data } = await api.get(`/pos/cash-registers/${cajaAbierta.value.id}/sales/`);
    ventasTurno.value = data;
  } catch (error) {
    console.error("Error al cargar historial del turno:", error);
    showAlert('Error', 'No se pudo cargar el historial de ventas', 'error');
  } finally {
    cargandoHistorial.value = false;
  }
}

const formatearHora = (fechaIso) => {
  if (!fechaIso) return '';
  const date = new Date(fechaIso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const traducirMetodoPago = (metodo) => {
  const m = String(metodo).toLowerCase();
  if (m === 'cash') return 'Efectivo';
  if (m === 'card') return 'Tarjeta';
  if (m === 'transfer') return 'Transferencia';
  return metodo.charAt(0).toUpperCase() + metodo.slice(1);
}

const imprimirTicketPasado = (venta) => {
  ticketVenta.value = {
    id: venta.id,
    total: venta.total,
    cambio: venta.change || '0.00',
    factura_numero: venta.invoice_number || null,
    items: venta.items.map(i => ({
      description: i.description,
      quantity: i.quantity,
      subtotal: i.subtotal,
    }))
  };
  mostrarHistorialModal.value = false;
  showReceiptModal.value = true;
}

</script>

<style>
/* Omit the local custom scrollbars to use Tailwind natively, but we can add some printing styles */
@media print {
    body * {
        visibility: hidden;
    }
    #printable-ticket, #printable-ticket * {
        visibility: visible;
    }
    #printable-ticket {
        position: absolute;
        left: 0;
        top: 0;
        width: 80mm !important;
        margin: 0 !important;
        padding: 10px !important;
        background: white !important;
        color: black !important;
        font-family: monospace !important;
        font-size: 11px !important;
    }
}
</style>
