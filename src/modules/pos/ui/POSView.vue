
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
                    <span class="text-[10px] text-slate-600 tracking-wider uppercase font-semibold">
                        <span v-if="trabajadorAsignado">
                            {{ trabajadorAsignado.name }} • 
                            {{ sucursales.find(s => s.id === (cajaAbierta?.register?.branch_id || cajaAbierta?.branch_id || trabajadorAsignado.sucursal_id))?.name || 'Sucursal Principal' }}
                            <span v-if="cajaAbierta"> • {{ cajaAbierta.register?.name }}</span>
                        </span>
                        <span v-else>
                            Seleccione Trabajador
                        </span>
                    </span>
                </div>
            </div>
            

        </div>

        <div class="flex items-center space-x-3">
            <button v-if="cajaAbierta && esCajero" @click="mostrarMovimientosCaja = true" class="bg-slate-100 hover:bg-slate-700 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-money-bill-transfer text-emerald-500"></i>
                <span>Movimientos</span>
            </button>
            <button v-if="cajaAbierta && esCajero" @click="mostrarCerrarCaja = true" class="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-lock"></i>
                <span>Cerrar Caja</span>
            </button>
            <button v-else-if="trabajadorAsignado" @click="cerrarSesionVendedor" class="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-power-off"></i>
                <span>Cerrar Sesión</span>
            </button>
            <button v-if="!trabajadorAsignado" @click="mostrarAbrirCaja = true" class="bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-user-lock"></i>
                <span>Asignar Trabajador</span>
            </button>

            <button v-if="cajaAbierta && esCajero" @click="abrirLista('pendientes')" class="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-file-invoice"></i>
                <span>Pre-Facturas 📝</span>
            </button>
            <button @click="abrirLista('cotizaciones')" class="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-file-contract"></i>
                <span>Cotizaciones 📄</span>
            </button>

            <button @click="abrirHistorial" class="bg-slate-100 hover:bg-slate-700 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm active:scale-95">
                <i class="fa-solid fa-receipt text-blue-400"></i>
                <span>Historial</span>
            </button>
            <div class="h-6 w-px bg-slate-100 hidden sm:block"></div>
            <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                <i class="fa-solid fa-user-circle text-brand-600 text-lg"></i>
                <span class="font-medium text-slate-800 capitalize">{{ authStore.displayRole || 'Usuario' }} {{ authStore.usuario?.name || authStore.usuario?.username || '' }}</span>
            </div>
        </div>
    </header>

    <main class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <!-- LOCK SCREEN PARA TRABAJADOR NO ASIGNADO -->
        <template v-if="!trabajadorAsignado">
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 z-10 w-full h-full absolute inset-0">
             <div class="text-6xl mb-4">🔒</div>
             <h3 class="text-2xl font-bold mb-2">POS Bloqueado</h3>
             <p class="text-slate-500 mb-6 max-w-sm">Para realizar ventas, buscar productos o usar la interfaz, necesitas iniciar sesión como trabajador autorizado.</p>
             <button @click="mostrarAbrirCaja = true" class="bg-brand-500 hover:bg-brand-600 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg shadow-brand-500/30 transition-all flex items-center space-x-2">
                 <i class="fa-solid fa-user-lock"></i>
                 <span>ASIGNAR TRABAJADOR</span>
             </button>
          </div>
        </template>
        
        <!-- LEFT COLUMN: PRODUCTS -->
        <section class="flex-1 flex flex-col bg-white border-r border-slate-200/80 min-w-0">
            
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
                        autocomplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        spellcheck="false"
                        name="pos_product_search_unique"
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
                    <!-- Pestaña destacada de Mesas/Salón (Solo si el tenant tiene activo restaurantes) -->
                    <button 
                        v-if="tenantStore.tieneModulo('restaurantes')"
                        @click="activarModoRestaurante"
                        :class="[
                            modoRestauranteActivo
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-2 ring-amber-400' 
                                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 font-bold',
                            'px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5'
                        ]"
                    >
                        <i class="fa-solid fa-chair text-[12px] text-amber-700"></i>
                        <span>Mesas / Salón</span>
                        <span v-if="mesasOcupadasCount > 0" class="ml-1 px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-black animate-pulse">
                            {{ mesasOcupadasCount }}
                        </span>
                    </button>

                    <button 
                        v-for="cat in categoriasPOS" 
                        :key="cat.id"
                        @click="seleccionarCategoriaPOS(cat.id)"
                        :class="[
                            (!modoRestauranteActivo && selectedCategory === cat.id)
                                ? 'bg-brand-500 text-slate-950 font-bold shadow-md shadow-brand-500/20' 
                                : 'bg-slate-50 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200',
                            'px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all'
                        ]"
                    >
                        <i v-if="cat.id === 'todos'" class="mr-1 text-[11px] fa-solid fa-border-all"></i>
                        {{ cat.name }}
                    </button>
                </div>
            </div>

            <!-- VISTA DE RESTAURANTE: SALÓN & MESAS / MENÚ DE PLATOS -->
            <div v-if="tenantStore.tieneModulo('restaurantes') && modoRestauranteActivo" class="flex-1 overflow-y-auto p-4 bg-slate-100/60 flex flex-col">
                <!-- Barra de control del salón: Zonas y Selector Mesas/Platos -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
                        <button 
                            v-for="zona in zonasRestaurante" 
                            :key="zona.id"
                            @click="zonaSeleccionadaId = zona.id"
                            :class="[
                                zonaSeleccionadaId === zona.id 
                                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium',
                                'px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all'
                            ]"
                        >
                            {{ zona.nombre }}
                            <span class="text-[10px] opacity-75 ml-1">({{ zona.mesas ? zona.mesas.length : 0 }})</span>
                        </button>
                        <span v-if="zonasRestaurante.length === 0" class="text-xs text-slate-400 italic">No hay zonas configuradas</span>
                    </div>

                    <div class="flex items-center gap-2">
                        <!-- Switch Mesas vs Menú -->
                        <div class="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
                            <button 
                                @click="subVistaRestaurante = 'mesas'"
                                :class="[
                                    subVistaRestaurante === 'mesas' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium',
                                    'px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5'
                                ]"
                            >
                                <i class="fa-solid fa-chair text-[11px]"></i> Mesas
                            </button>
                            <button 
                                @click="subVistaRestaurante = 'platos'"
                                :class="[
                                    subVistaRestaurante === 'platos' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium',
                                    'px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5'
                                ]"
                            >
                                <i class="fa-solid fa-utensils text-[11px]"></i> Menú / Platos
                            </button>
                        </div>

                        <button 
                            @click="cargarDatosRestaurante" 
                            class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl text-xs transition-colors" 
                            title="Actualizar mesas"
                        >
                            <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': cargandoRestaurante }"></i>
                        </button>
                    </div>
                </div>

                <!-- SUB-VISTA 1: GRID DE MESAS -->
                <div v-if="subVistaRestaurante === 'mesas'" class="flex-1">
                    <div v-if="mesasZonaActual.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                        <div 
                            v-for="mesa in mesasZonaActual" 
                            :key="mesa.id"
                            @click="seleccionarMesaEnPOS(mesa)"
                            :class="[
                                mesaSeleccionada?.id === mesa.id ? 'ring-4 ring-brand-500 scale-[1.02]' : '',
                                mesa.estado === 'libre' 
                                    ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50' 
                                    : 'bg-amber-50/80 border-amber-300 hover:border-amber-500 hover:bg-amber-50 shadow-amber-500/10',
                                'border-2 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all shadow-sm select-none relative group min-h-[130px]'
                            ]"
                        >
                            <div class="flex items-start justify-between">
                                <span class="text-2xl">
                                    <i :class="mesa.estado === 'libre' ? 'fa-solid fa-chair text-emerald-600' : 'fa-solid fa-couch text-amber-600'"></i>
                                </span>
                                <span 
                                    :class="mesa.estado === 'libre' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 font-black animate-pulse'"
                                    class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                                >
                                    {{ mesa.estado === 'libre' ? 'Libre' : 'Ocupada' }}
                                </span>
                            </div>

                            <div class="my-1.5">
                                <h4 class="font-black text-slate-800 text-sm leading-tight">{{ mesa.nombre }}</h4>
                                <span class="text-[11px] text-slate-500 font-medium">{{ mesa.asientos }} Pax</span>
                            </div>

                            <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <template v-if="mesa.estado === 'libre'">
                                    <span class="text-[10px] text-emerald-700 font-medium">Disponible</span>
                                    <i class="fa-solid fa-plus text-[10px] text-emerald-600 group-hover:translate-x-0.5 transition-transform"></i>
                                </template>
                                <template v-else>
                                    <span class="text-[10px] text-amber-800 font-bold">Cargar comanda</span>
                                    <i class="fa-solid fa-arrow-right text-[10px] text-amber-700 group-hover:translate-x-0.5 transition-transform"></i>
                                </template>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="zonasRestaurante.length === 0" class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200">
                        <div class="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-3">
                            <i class="fa-solid fa-utensils"></i>
                        </div>
                        <h3 class="font-bold text-slate-800 text-sm">No hay zonas ni mesas configuradas</h3>
                        <p class="text-xs text-slate-500 mt-1 max-w-sm">Configura tu salón en "Configuración > Restaurantes" para gestionar mesas desde el POS.</p>
                    </div>

                    <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200">
                        <p class="text-xs text-slate-500">Esta zona no tiene mesas asociadas actualmente.</p>
                    </div>
                </div>

                <!-- SUB-VISTA 2: MENÚ DE PLATOS -->
                <div v-else-if="subVistaRestaurante === 'platos'" class="flex-1 flex flex-col">
                    <div class="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
                        <button 
                            @click="categoriaPlatoSeleccionada = 'Todas'"
                            :class="[
                                categoriaPlatoSeleccionada === 'Todas' ? 'bg-slate-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
                                'px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all'
                            ]"
                        >
                            ⭐ Todas
                        </button>
                        <button 
                            v-for="cat in categoriasPlatosRestaurante" 
                            :key="cat"
                            @click="categoriaPlatoSeleccionada = cat"
                            :class="[
                                categoriaPlatoSeleccionada === cat ? 'bg-slate-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
                                'px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all'
                            ]"
                        >
                            {{ cat }}
                        </button>
                    </div>

                    <div v-if="platosFiltradosRestaurante.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        <div 
                            v-for="plato in platosFiltradosRestaurante" 
                            :key="plato.id"
                            @click="agregarPlatoAlCarrito(plato)"
                            class="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-amber-300 transition-all select-none group"
                        >
                            <div>
                                <div class="flex items-center justify-between mb-1.5">
                                    <span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md uppercase">
                                        {{ plato.categoria || 'General' }}
                                    </span>
                                    <i class="fa-solid fa-plus-circle text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                </div>
                                <h5 class="font-bold text-slate-800 text-xs line-clamp-2 leading-tight">{{ plato.nombre }}</h5>
                            </div>
                            <div class="mt-3 flex items-center justify-between">
                                <span class="text-xs font-black text-slate-900 font-mono">${{ Number(plato.precio).toFixed(2) }}</span>
                                <span class="text-[10px] text-slate-400 font-medium">Agregar</span>
                            </div>
                        </div>
                    </div>
                    <div v-else class="flex-1 flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 text-center">
                        <p class="text-xs text-slate-500">No hay platos en esta categoría.</p>
                    </div>
                </div>
            </div>

            <!-- PRODUCT GRID NORMAL (RETAIL) -->
            <div v-else class="flex-1 overflow-y-auto p-4 bg-slate-100/50">
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
        <section class="w-full md:w-[420px] bg-slate-50 flex flex-col h-full border-t md:border-t-0 md:border-l border-slate-200 shrink-0">
            
            <!-- Banner de Mesa Seleccionada (Restaurante) -->
            <div v-if="mesaSeleccionada" class="p-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div class="flex items-center gap-2.5 overflow-hidden">
                    <div class="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                        <i class="fa-solid fa-chair"></i>
                    </div>
                    <div class="truncate">
                        <div class="text-xs font-black text-slate-900 truncate uppercase flex items-center gap-1.5">
                            <span>{{ mesaSeleccionada.nombre }}</span>
                            <span 
                                class="text-[9px] font-bold px-1.5 py-0.2 rounded" 
                                :class="mesaSeleccionada.estado === 'libre' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                            >
                                {{ mesaSeleccionada.estado === 'libre' ? 'Libre' : 'Ocupada' }}
                            </span>
                        </div>
                        <div class="text-[10px] text-slate-500 font-mono truncate">
                            {{ mesaSeleccionada.asientos }} Pax • {{ pedidoMesaId ? 'Comanda #' + pedidoMesaId : 'Nueva orden de mesa' }}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button 
                        @click="desvincularMesa" 
                        class="text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 px-2 py-1 rounded-lg border border-slate-200 transition-colors" 
                        title="Desvincular mesa de esta venta"
                    >
                        <i class="fa-solid fa-xmark mr-0.5"></i> Quitar
                    </button>
                </div>
            </div>

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

                <div v-if="clienteForm.name" class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1.5 shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-2.5 overflow-hidden">
                            <div class="bg-brand-100 text-brand-700 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-user text-sm"></i>
                            </div>
                            <div class="truncate">
                                <div class="text-[11px] font-bold text-slate-800 truncate uppercase" :title="clienteForm.name">{{ clienteForm.name }}</div>
                                <div class="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                                    <i class="fa-regular fa-id-card"></i> {{ clienteForm.identification || 'N/A' }}
                                </div>
                            </div>
                        </div>
                        <button v-if="clienteForm.identification !== '9999999999999'" @click="mostrarModalCliente = true" class="text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 p-1.5 rounded-lg transition-colors border border-brand-100 shrink-0" title="Editar datos del cliente">
                            <i class="fa-solid fa-pen text-[10px]"></i>
                        </button>
                    </div>
                    <div v-if="clienteForm.email && clienteForm.email !== 'S/D'" class="text-[10px] text-slate-500 truncate ml-10 flex items-center gap-1.5">
                        <i class="fa-regular fa-envelope"></i> {{ clienteForm.email }}
                    </div>
                </div>
                
                <div v-else class="space-y-2 relative">
                    <div class="flex gap-2">
                        <input 
                            v-model="busquedaCliente" 
                            @input="buscarClientes"
                            type="text"
                            autocomplete="new-password"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            spellcheck="false"
                            name="pos_client_search_unique"
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
                          <div v-if="!sugerenciasCliente.length" @mousedown.prevent="mostrarModalCliente = true; prepararNuevoCliente()" class="p-2.5 text-xs text-brand-700 font-bold cursor-pointer hover:bg-brand-50 bg-brand-50/50 border border-brand-100 rounded-md mx-1 my-1 flex items-center gap-2 transition-colors">
                             <i class="fa-solid fa-user-plus text-brand-500"></i>
                             <span>No se encontró. Clic aquí para registrar <strong>"{{ busquedaCliente }}"</strong></span>
                          </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- Ventas en espera Bar -->
            <div v-if="carritosEnEspera.length > 0" class="px-3 py-2 bg-amber-50 border-b border-amber-100 flex gap-2 overflow-x-auto">
                <button v-for="(v, idx) in carritosEnEspera" :key="v.id" @click="recuperarVenta(idx)" class="whitespace-nowrap bg-white border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm hover:bg-amber-100 transition-colors">
                    <i class="fa-solid fa-clock-rotate-left mr-1"></i> Venta {{ v.time }} (${{ v.total }})
                </button>
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
                        <input v-model.number="item.quantity" @focus="$event.target.select()" @change="item.quantity = Math.max(1, parseInt(item.quantity) || 1)" type="text" inputmode="numeric" pattern="[0-9]*" class="w-10 bg-transparent text-center text-xs font-bold font-mono text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 rounded transition-all" />
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
                <div class="space-y-1 text-xs font-medium text-slate-600 border-b border-slate-200/80 pb-2 relative group">
                    <div class="flex justify-between items-center">
                        <span>Subtotal Bruto:</span>
                        <span class="font-mono text-slate-800">${{ subtotalBruto }}</span>
                    </div>
                    <div class="flex justify-between items-center group/discount">
                        <span class="flex items-center gap-1 cursor-pointer text-brand-600 hover:text-brand-800 transition-colors" @click="mostrarDescuentoGlobal = !mostrarDescuentoGlobal">
                            <i class="fa-solid fa-tag"></i> Descuento
                            <span v-if="descuentoGlobal > 0" class="text-[9px] bg-brand-100 text-brand-700 px-1 rounded">{{ tipoDescuentoGlobal === '%' ? descuentoGlobal + '%' : '$' + descuentoGlobal }}</span>
                        </span>
                        <span class="font-mono text-rose-500 font-bold">-${{ valorDescuentoGlobal.toFixed(2) }}</span>
                    </div>
                    
                    <!-- Panel Descuento Global -->
                    <div v-if="mostrarDescuentoGlobal" class="bg-slate-50 p-2 rounded-lg border border-slate-200 flex gap-2 items-center mb-1 animate-fade-in-up">
                        <select v-model="tipoDescuentoGlobal" class="bg-white border border-slate-300 rounded text-[10px] p-1 font-bold outline-none">
                            <option value="%">% Porcentaje</option>
                            <option value="$">$ Valor Fijo</option>
                        </select>
                        <input v-model.number="descuentoGlobal" type="number" min="0" step="0.01" class="flex-1 w-20 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono outline-none" placeholder="0">
                        <button @click="mostrarDescuentoGlobal = false" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-check"></i></button>
                    </div>

                    <div class="flex justify-between items-center">
                        <span>Subtotal Neto:</span>
                        <span class="font-mono text-slate-800">${{ subtotal }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span>Monto IVA ({{ parametrosStore.obtener('ventas', 'iva', '15') }}%):</span>
                        <span class="font-mono text-emerald-500 font-bold">${{ tax }}</span>
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

                <!-- Botón de Envío a Cocina si hay mesa seleccionada -->
                <div v-if="tenantStore.tieneModulo('restaurantes') && mesaSeleccionada" class="pt-1">
                    <button 
                        @click="enviarComandaDesdePOS"
                        :disabled="carrito.length === 0 || enviandoComanda"
                        class="w-full rounded-xl text-xs font-bold py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    >
                        <i class="fa-solid fa-bell-concierge" :class="{ 'fa-bounce': enviandoComanda }"></i>
                        <span>{{ enviandoComanda ? 'ENVIANDO A COCINA...' : 'ENVIAR A COCINA / ACTUALIZAR MESA' }}</span>
                    </button>
                </div>

                <div class="flex gap-2">
                    <button class="w-1/2 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center space-x-2 px-4 py-3"
                        :class="(cajaAbierta && esCajero) ? 'bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-400 hover:to-emerald-500 disabled:opacity-40' : 'bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-300 hover:to-indigo-400 disabled:opacity-40 text-white'"
                        :disabled="carrito.length === 0 || procesando"
                        @click="(cajaAbierta && esCajero) ? openPaymentModal() : guardarPreFactura(true)">
                        <i class="fa-solid" :class="(cajaAbierta && esCajero) ? 'fa-cash-register' : 'fa-save'"></i>
                        <span>{{ (cajaAbierta && esCajero) ? 'COBRAR [F4]' : (procesando ? 'GUARDANDO...' : 'GUARDAR PRE-FACTURA') }}</span>
                    </button>
                    <button class="w-1/2 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 disabled:opacity-40 text-white"
                        :disabled="carrito.length === 0 || procesando"
                        @click="guardarPreFactura(false)">
                        <i class="fa-solid fa-file-pdf"></i>
                        <span>GUARDAR COTIZACIÓN</span>
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

                <div v-if="tenantFeatures['pos_notas_venta'] && String(parametrosStore.obtener('pos', 'enable_notas_venta', 'false')) === 'true'" class="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                    <label class="text-xs font-bold text-slate-700 block">Tipo de Documento</label>
                    <select v-model="tipoDocumento" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500">
                        <option value="01">Factura</option>
                        <option value="02">Nota de Venta</option>
                    </select>
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

    <!-- COMPONENTIZADOS -->
    <ReceiptModal 
      :show="showReceiptModal" 
      :lastSaleData="lastSaleData"
      @close="showReceiptModal = false"
      @print="printReceipt"
    />

    <PendingOrdersModal 
      :show="mostrarOrdenesPendientes"
      :tipoLista="tipoLista"
      :cargandoOrdenes="cargandoOrdenes"
      :ordenesPendientesList="ordenesPendientesList"
      @close="mostrarOrdenesPendientes = false"
      @cargar="cargarOrdenPendiente"
      @eliminar="eliminarPreFactura"
    />
    
    <!-- OTROS MODALES EXISTENTES -->
    <div v-if="mostrarAbrirCaja" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in-up">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-user-lock text-brand-500"></i> Asignar Trabajador</h3>
          <button v-if="canCloseModal" @click="mostrarAbrirCaja = false" class="text-slate-400 hover:text-slate-600 transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div class="space-y-4">
            <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Trabajador Asignado</label>
            <select v-model="formCaja.cajero_id" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none">
              <option value="null" disabled>Selecciona un trabajador</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }} - {{ e.position }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">PIN Secreto</label>
            <input v-model="formCaja.pin_caja" type="password" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" placeholder="****" />
          </div>

              <div class="pt-3 border-t border-slate-200 mt-3" v-show="esCajero && !tieneCajaAbierta">
                <h4 class="text-[10px] font-bold text-slate-500 uppercase mb-3">Configuración de Caja</h4>
                <div class="space-y-4">
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
                </div>
              </div>
          </div>
          
          <div v-if="tieneCajaAbierta" class="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
            <p class="font-semibold mb-1"><i class="fa-solid fa-circle-info mr-1"></i> Tienes un turno abierto</p>
            <p class="text-blue-700">Has seleccionado un cajero que ya cuenta con una caja abierta. Ingresa tu PIN para continuar con tu turno.</p>
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100" v-show="esCajero && !tieneCajaAbierta">
                    <div class="flex justify-between items-center mb-1">
                       <label class="block text-xs font-semibold text-slate-700">Saldo inicial en efectivo ($)</label>
                       <label class="flex items-center space-x-1.5 text-xs text-slate-500 cursor-pointer">
                          <input type="checkbox" v-model="usarDesgloseFondo" class="rounded border-slate-300 text-brand-500 focus:ring-brand-500">
                          <span>Desglose</span>
                       </label>
                    </div>
                    
                    <div v-if="!usarDesgloseFondo">
                       <input v-model.number="formCaja.saldo_inicial" type="number" min="0" step="0.01" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none" placeholder="0.00" />
                    </div>
                    <div v-else class="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2 grid grid-cols-2 gap-4">
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
                  </div>
        </div>
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button v-if="canCloseModal" @click="mostrarAbrirCaja = false" class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          <button v-else @click="router.push('/')" class="px-4 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"><i class="fa-solid fa-arrow-left mr-1"></i> Salir del POS</button>
          <button @click="abrirCaja" class="px-4 py-2 text-xs font-bold text-slate-950 bg-brand-400 hover:bg-brand-500 rounded-lg shadow-md shadow-brand-500/20 transition-colors flex items-center gap-1.5"><i class="fa-solid fa-check"></i> {{ tieneCajaAbierta ? 'Continuar Turno' : 'Iniciar Turno' }}</button>
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
        <!-- Customer Modal -->
        <CustomerModal 
            v-if="mostrarModalCliente"
            :form="clienteForm" 
            :updateCustomer="updateCustomer" 
            @update:form="clienteForm = $event" 
            @update:updateCustomer="updateCustomer = $event" 
            @close="mostrarModalCliente = false" 
        />
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import ReceiptModal from './components/ReceiptModal.vue'
import PendingOrdersModal from './components/PendingOrdersModal.vue'
import CustomerModal from './components/CustomerModal.vue'

const router = useRouter()
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
const carritosEnEspera = ref([])
const mostrarOrdenesPendientes = ref(false)
const tipoLista = ref('pendientes')
const ordenPendienteId = ref(null)
const cargandoOrdenes = ref(false)
const ordenesPendientesList = ref([])
function pausarVenta() {
    if (carrito.value.length === 0) return;
    carritosEnEspera.value.push({
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        clienteForm: JSON.parse(JSON.stringify(clienteForm.value || {})),
        busquedaCliente: busquedaCliente.value,
        carrito: JSON.parse(JSON.stringify(carrito.value)),
        total: total.value
    });
    carrito.value = [];
    clienteForm.value = { name: 'CONSUMIDOR FINAL', identification: '9999999999999', tipo_id: '07', email: '', address: 'S/D' };
    busquedaCliente.value = '';
    showAlert({ type: 'success', title: 'Pausada', message: 'Venta en espera' });
}

function recuperarVenta(index) {
    const v = carritosEnEspera.value[index];
    carrito.value = v.carrito;
    clienteForm.value = v.clienteForm;
    busquedaCliente.value = v.busquedaCliente;
    carritosEnEspera.value.splice(index, 1);
}

let barcodeBuffer = ''
let barcodeTimeout = null

const handleGlobalKeypress = async (e) => {
  if (mostrarAbrirCaja.value || mostrarCerrarCaja.value || showModernPaymentModal.value || showReceiptModal.value || mostrarMovimientosCaja.value || mostrarHistorialModal.value) return;

  const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
  if (isInput && e.target.type !== 'radio' && e.target.type !== 'checkbox') {
    if (e.target !== inputBusqueda.value) return; 
  }

  if (e.key === 'Enter') {
    if (barcodeBuffer.length > 3) {
      let code = barcodeBuffer;
      let calcQty = 1;
      
      if (tenantFeatures.value['pos_scale_barcodes'] && code.length === 13 && code.startsWith('20')) {
          const itemCode = code.substring(2, 7);
          const weightStr = code.substring(7, 12);
          code = itemCode;
          calcQty = parseInt(weightStr, 10) / 1000.0;
      }
      
      barcodeBuffer = '';
      try {
        const { data } = await api.get(`/inventario/products/?q=${code}`);
        if (data && data.length > 0) {
            const exactMatch = data.find(p => p.code === code || p.codigo === code) || data[0];
            const existente = carrito.value.find(i => i.product_id === exactMatch.id);
            if (existente) {
              existente.quantity += calcQty;
            } else {
              carrito.value.push({
                product_id: exactMatch.id,
                code: exactMatch.code || exactMatch.codigo || '-',
                description: exactMatch.name || exactMatch.nombre || '-',
                quantity: calcQty,
                unit_price: parseFloat(exactMatch.sale_price || exactMatch.precio_venta || 0),
                discount: 0,
                tarifa_iva: String(exactMatch.vat_rate || exactMatch.tarifa_iva || parametrosStore.obtener('ventas', 'iva', '15'))
              });
            }
            showAlert({type: 'success', title: 'Escaneado', message: exactMatch.name || exactMatch.description || exactMatch.nombre});
            busqueda.value = ''; 
        } else {
            showAlert({type: 'error', title: 'Error', message: 'No encontrado: ' + code});
        }
      } catch (err) {}
    }
    return;
  }
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    barcodeBuffer += e.key;
    clearTimeout(barcodeTimeout);
    barcodeTimeout = setTimeout(() => { barcodeBuffer = ''; }, 100);
  }
}

// Historial del Turno Actual
const mostrarHistorialModal = ref(false)
const ventasTurno = ref([])
const cargandoHistorial = ref(false)
const tenantFeatures = ref({})

const productosFiltrados = computed(() => {
    if (selectedCategory.value === 'todos') {
        return productosEnEspera.value
    }
    return productosEnEspera.value.filter(p => p.category === selectedCategory.value)
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
    const branchId = cajaAbierta.value?.register?.branch_id || cajaAbierta.value?.branch_id || trabajadorAsignado.value?.sucursal_id || authStore.sucursal_id;
    if (!branchId || !p.branch_stocks || p.branch_stocks.length === 0) {
        return parseFloat(p.current_stock || 0)
    }
    const bs = p.branch_stocks.find(b => b.branch_id === branchId)
    return bs ? parseFloat(bs.quantity) : 0
}
const categoriasPOS = computed(() => {
  const param = parametrosStore.obtener('inventario', 'categorias_productos', 'General, Alimentos, Bebidas, Electrónica, Ropa')
  let cats = []
  if (Array.isArray(param)) cats = param
  else cats = String(param).split(',').map(s => s.trim()).filter(s => s)
  return [{ id: 'todos', name: 'Todos' }, ...cats.map(c => ({ id: c, name: c }))]
})
const selectedCategory = ref('todos')

// ==========================================
// Integración Salón y Mesas de Restaurante
// ==========================================
const modoRestauranteActivo = ref(false)
const subVistaRestaurante = ref('mesas')
const zonasRestaurante = ref([])
const zonaSeleccionadaId = ref(null)
const mesaSeleccionada = ref(null)
const pedidoMesaId = ref(null)
const platosRestaurante = ref([])
const categoriaPlatoSeleccionada = ref('Todas')
const cargandoRestaurante = ref(false)
const enviandoComanda = ref(false)

const zonaActualRestaurante = computed(() => {
    return zonasRestaurante.value.find(z => z.id === zonaSeleccionadaId.value)
})

const mesasZonaActual = computed(() => {
    return zonaActualRestaurante.value ? (zonaActualRestaurante.value.mesas || []) : []
})

const mesasOcupadasCount = computed(() => {
    let count = 0
    for (const z of zonasRestaurante.value) {
        for (const m of (z.mesas || [])) {
            if (m.estado === 'ocupada') count++
        }
    }
    return count
})

const categoriasPlatosRestaurante = computed(() => {
    const cats = new Set()
    for (const p of platosRestaurante.value) {
        if (p.categoria && p.categoria.trim()) {
            cats.add(p.categoria.trim())
        }
    }
    return Array.from(cats)
})

const platosFiltradosRestaurante = computed(() => {
    if (categoriaPlatoSeleccionada.value === 'Todas') {
        return platosRestaurante.value
    }
    return platosRestaurante.value.filter(p => (p.categoria?.trim() || 'General') === categoriaPlatoSeleccionada.value)
})

const cargarDatosRestaurante = async () => {
    if (!tenantStore.tieneModulo('restaurantes')) return
    cargandoRestaurante.value = true
    try {
        const [resZonas, resPlatos] = await Promise.all([
            api.get('restaurantes/zonas/'),
            api.get('restaurantes/platos/')
        ])
        zonasRestaurante.value = resZonas.data || []
        if (zonasRestaurante.value.length > 0 && !zonaSeleccionadaId.value) {
            zonaSeleccionadaId.value = zonasRestaurante.value[0].id
        }
        platosRestaurante.value = resPlatos.data || []
    } catch (e) {
        console.error('Error cargando datos de restaurante:', e)
    } finally {
        cargandoRestaurante.value = false
    }
}

const activarModoRestaurante = () => {
    modoRestauranteActivo.value = true
    if (zonasRestaurante.value.length === 0) {
        cargarDatosRestaurante()
    }
}

const seleccionarCategoriaPOS = (catId) => {
    modoRestauranteActivo.value = false
    selectedCategory.value = catId
}

const cargarComandaMesa = async (mesa) => {
    mesaSeleccionada.value = mesa
    try {
        const { data } = await api.get(`restaurantes/pedidos/?mesa_id=${mesa.id}`)
        if (data && data.length > 0) {
            const pedido = data[0]
            pedidoMesaId.value = pedido.id
            const ivaVal = String(parametrosStore.obtener('ventas', 'iva', '15'))
            carrito.value = (pedido.lineas || []).map(l => ({
                product_id: /^\d+$/.test(String(l.item_id)) ? parseInt(l.item_id) : 0,
                item_ref: String(l.item_id),
                code: 'REST-' + (l.item_id || l.id),
                description: l.item_nombre,
                quantity: l.cantidad,
                unit_price: parseFloat(l.precio_unitario),
                discount: 0,
                tarifa_iva: ivaVal,
                es_restaurante: true,
                linea_id: l.id,
                estado_cocina: l.estado_cocina
            }))
            showAlert({ type: 'info', title: 'Mesa Seleccionada', message: `Comanda de ${mesa.nombre} cargada (${carrito.value.length} productos).` })
        } else {
            pedidoMesaId.value = null
            showAlert({ type: 'info', title: 'Mesa Libre', message: `${mesa.nombre} seleccionada para nueva orden.` })
        }
    } catch (e) {
        console.error('Error cargando pedido de mesa:', e)
    }
}

const seleccionarMesaEnPOS = async (mesa) => {
    if (mesa.estado === 'ocupada') {
        await cargarComandaMesa(mesa)
    } else {
        mesaSeleccionada.value = mesa
        pedidoMesaId.value = null
        showAlert({ 
            type: 'info', 
            title: 'Mesa Libre', 
            message: `${mesa.nombre} seleccionada. Agrega platos o productos al carrito y envíalos a cocina o cóbralos.` 
        })
    }
}

const agregarPlatoAlCarrito = (plato) => {
    const platoDesc = plato.nombre
    const existente = carrito.value.find(i => i.es_restaurante && i.item_ref === String(plato.id))
    if (existente) {
        existente.quantity++
    } else {
        const ivaVal = String(parametrosStore.obtener('ventas', 'iva', '15'))
        carrito.value.push({
            product_id: 0,
            item_ref: String(plato.id),
            code: 'PLATO-' + plato.id,
            description: plato.nombre,
            quantity: 1,
            unit_price: parseFloat(plato.precio || 0),
            discount: 0,
            tarifa_iva: ivaVal,
            es_restaurante: true,
            notas: ''
        })
    }
    showAlert({ type: 'success', title: 'Agregado', message: `${plato.nombre} agregado al pedido.` })
}

const enviarComandaDesdePOS = async () => {
    if (!mesaSeleccionada.value) return
    if (carrito.value.length === 0) {
        showAlert({ type: 'warning', title: 'Atención', message: 'El carrito está vacío. Agrega productos o platos para enviar a cocina.' })
        return
    }
    
    // Si ya existe comanda, solo enviar las nuevas líneas que aún no tengan linea_id
    let lineasAEnviar = carrito.value
    if (pedidoMesaId.value) {
        lineasAEnviar = carrito.value.filter(item => !item.linea_id)
        if (lineasAEnviar.length === 0) {
            showAlert({ type: 'info', title: 'Comanda al día', message: 'Todos los ítems de esta mesa ya fueron enviados a cocina.' })
            return
        }
    }

    enviandoComanda.value = true
    try {
        const payloadLineas = lineasAEnviar.map(item => ({
            item_id: String(item.item_ref || item.product_id || ''),
            item_nombre: item.description || item.name,
            cantidad: parseInt(item.quantity) || 1,
            precio_unitario: parseFloat(item.unit_price || item.price || 0),
            notas: item.notas || ''
        }))
        const res = await api.post('restaurantes/pedidos/', {
            mesa_id: mesaSeleccionada.value.id,
            lineas: payloadLineas
        })
        showAlert({ type: 'success', title: 'Comanda Enviada', message: `Pedido de ${mesaSeleccionada.value.nombre} enviado a cocina exitosamente.` })
        await cargarDatosRestaurante()
        await cargarComandaMesa(mesaSeleccionada.value)
    } catch (e) {
        console.error('Error enviando comanda desde POS:', e)
        showAlert({ type: 'error', title: 'Error', message: e.response?.data?.error || 'No se pudo enviar la comanda a cocina.' })
    } finally {
        enviandoComanda.value = false
    }
}

const desvincularMesa = () => {
    mesaSeleccionada.value = null
    pedidoMesaId.value = null
    showAlert({ type: 'info', title: 'Mesa desvinculada', message: 'Se ha desvinculado la mesa del carrito actual.' })
}

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

const printReceipt = async (paperWidth = '80mm') => {
    const width = typeof paperWidth === 'string' ? paperWidth : '80mm';
    try {
        if ('serial' in navigator) {
            const ports = await navigator.serial.getPorts();
            if (ports.length > 0) {
                const port = ports[0];
                await port.open({ baudRate: 9600 });
                const writer = port.writable.getWriter();
                const tenantName = tenantStore.currentTenant?.name || 'MI NEGOCIO';
                const ticketNumber = ticketVenta.value?.invoice_number || ticketVenta.value?.id || 'N/A';
                const sep = width === '58mm' ? '--------------------------------' : '------------------------------------------------';
                const text = `
${sep}
${tenantName}
${sep}
Ticket: ${ticketNumber}
Total: $${ticketVenta.value?.total || '0.00'}
${sep}
Gracias por su compra
\n\n\n\n`;
                const encoder = new TextEncoder();
                await writer.write(encoder.encode(text));
                await writer.write(new Uint8Array([0x1D, 0x56, 0x00])); 
                writer.releaseLock();
                await port.close();
                return;
            }
        }
    } catch (e) {
        console.warn("Fallo impresión Serial:", e);
    }
}

const procesarCobroWrapper = async () => {
   const cartBackup = JSON.parse(JSON.stringify(carrito.value))
   const clientBackup = JSON.parse(JSON.stringify(clienteForm.value))
   const saleTotal = total.value
   const saleTax = tax.value
   const saleSubtotal = subtotal.value
   const docType = tipoDocumento.value
   
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
       const saleInfo = {
           id: ticketVenta.value?.id || Date.now().toString().slice(-6),
           invoice_number: ticketVenta.value?.invoice_number || ticketVenta.value?.factura_numero || null,
           access_key: ticketVenta.value?.access_key || null,
           document_type: docType,
           items: cartBackup.map(i => ({
             description: i.description,
             quantity: i.quantity,
             unit_price: i.unit_price || i.price,
             total: i.subtotal || subtotalItem(i)
           })),
           total: saleTotal,
           tax: saleTax,
           subtotal: saleSubtotal,
           cambio: cambio.value || '0.00',
           client: clientBackup
       }
       lastSaleData.value = saleInfo
       ticketVenta.value = saleInfo
       showReceiptModal.value = true
   }
}

async function guardarPreFactura(isPreInvoice = true) {
  if (carrito.value.length === 0) return
  procesando.value = true
  
  try {
    const tIva = parseFloat(parametrosStore.obtener('ventas', 'iva', '15')) / 100
    const paymentForm = (metodoPago.value === 'efectivo' || !metodoPago.value) ? '01' : '20'
    const finalCustomerId = (clienteForm.value.id === 1 && clienteForm.value.identification !== '9999999999999') ? null : (clienteForm.value.id || null);
    
    const payload = {
      customer_id: finalCustomerId, 
      customer: {
        customer_id: finalCustomerId,
        name: clienteForm.value.name || 'CONSUMIDOR FINAL',
        identifier: clienteForm.value.identification || '9999999999999',
        id_type: clienteForm.value.tipo_id || '07',
        email: clienteForm.value.email || '',
        address: clienteForm.value.address || 'S/D',
        payment_form: paymentForm,
        payment_term: 0,
        payment_time: 'dias'
      },
      notes: isPreInvoice ? "Pre-Factura desde POS" : "Cotización desde POS",
      is_preinvoice: isPreInvoice,
      seller_id: trabajadorAsignado.value ? trabajadorAsignado.value.id : null,
      branch_id: authStore.sucursal_id || trabajadorAsignado.value?.sucursal_id || null,
      vat: parseFloat(parametrosStore.obtener('ventas', 'iva', '15')),
      items: carrito.value.map(i => ({
        product_id: i.product_id,
        description: i.description || i.name,
        quantity: i.quantity,
        unit_price: i.unit_price / (1 + tIva),
        discount: i.discount || 0
      }))
    }
    await api.post('/ventas/quotations/', payload)
    useAlert().showToast(isPreInvoice ? 'Pre-Factura guardada' : 'Cotización guardada', 'success')
    limpiarDespuesDeVenta()
  } catch (e) {
    useAlert().showToast(e.response?.data?.error || 'Error al guardar', 'error')
  } finally {
    procesando.value = false
  }
}

async function abrirLista(tipo) {
  tipoLista.value = tipo
  mostrarOrdenesPendientes.value = true
  cargandoOrdenes.value = true
  ordenesPendientesList.value = []
  try {
    const sucursal_id = authStore.sucursal_id || trabajadorAsignado.value?.sucursal_id || '';
    const endpoint = tipo === 'pendientes' ? `/pos/pending-orders/?sucursal_id=${sucursal_id}` : `/pos/pos-quotations/`
    const { data } = await api.get(endpoint)
    ordenesPendientesList.value = data
  } catch (e) {
    useAlert().showToast('Error al cargar la lista', 'error')
  } finally {
    cargandoOrdenes.value = false
  }
}

async function cargarOrdenPendiente(orden) {
  try {
    const { data } = await api.get(`/ventas/quotations/${orden.id}/`)
    const tIva = parseFloat(parametrosStore.obtener('ventas', 'iva', '15')) / 100
    
    carrito.value = data.items.map(i => ({
        product_id: i.product_id,
        code: i.code || '-',
        description: i.description || '-',
        quantity: parseFloat(i.quantity),
        unit_price: Number((parseFloat(i.unit_price) * (1 + tIva)).toFixed(2)),
        discount: parseFloat(i.discount || 0),
        tarifa_iva: String(parametrosStore.obtener('ventas', 'iva', '15'))
    }))
    
    clienteForm.value = {
      id: data.customer_id,
      name: data.customer_name,
      identification: data.customer_rfc || '9999999999999',
      tipo_id: '05',
      email: data.customer_email || '',
      address: data.customer_address || 'S/D'
    }
    
    ordenPendienteId.value = orden.id
    mostrarOrdenesPendientes.value = false
    useAlert().showToast('Pre-Factura cargada al carrito', 'success')
  } catch(e) {
    useAlert().showToast('No se pudo cargar el detalle', 'error')
  }
}

async function eliminarPreFactura(id) {
  const confirmed = await useAlert().showAlert({ type: 'confirm', title: 'Eliminar Orden', message: '¿Estás seguro de que deseas eliminar esta orden?' })
  if (!confirmed) return
  try {
    await api.delete(`/ventas/quotations/${id}/`)
    useAlert().showToast('Orden eliminada exitosamente', 'success')
    // Recargar la lista
    const sucursal_id = authStore.sucursal_id || trabajadorAsignado.value?.sucursal_id || '';
    const endpoint = tipoLista.value === 'pendientes' ? `/pos/pending-orders/?sucursal_id=${sucursal_id}` : `/pos/pos-quotations/`
    const { data } = await api.get(endpoint)
    ordenesPendientesList.value = data
  } catch (e) {
    useAlert().showToast('Error al eliminar la orden', 'error')
  }
}

function limpiarDespuesDeVenta() {
  showModernPaymentModal.value = false
  carrito.value = []
  descuentoGlobal.value = 0
  montoRecibido.value = 0
  metodoPago.value = 'efectivo'
  nroComprobante.value = ''
  productosEnEspera.value = []
  establecerConsumidorFinalModal()
  ordenPendienteId.value = null
  mesaSeleccionada.value = null
  pedidoMesaId.value = null
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
      console.warn('Buscando en caché offline')
      const cachedStr = localStorage.getItem('pos_products_cache');
      if (cachedStr) {
         const cached = JSON.parse(cachedStr);
         const term = busqueda.value.toLowerCase();
         sugerenciasProducto.value = cached.filter(p => 
           (p.name||'').toLowerCase().includes(term) || 
           (p.description||'').toLowerCase().includes(term) || 
           (p.code||'').toLowerCase().includes(term)
         ).slice(0, 10);
      }
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
const tipoDocumento = ref('01')
const errorVenta = ref('')
const ticketVenta = ref(null)
const savedWorker = localStorage.getItem('pos_trabajador_asignado')
const trabajadorAsignado = ref(savedWorker ? JSON.parse(savedWorker) : null)

watch(trabajadorAsignado, (val) => {
    if (val) {
        localStorage.setItem('pos_trabajador_asignado', JSON.stringify(val))
    } else {
        localStorage.removeItem('pos_trabajador_asignado')
    }
}, { deep: true })
const cajaAbierta = ref(null)
const cajasRegistradas = ref([])
const employees = ref([])
const sucursales = ref([])
const cargandoPOS = ref(false)

const esCajero = computed(() => {
  if (authStore.esSuperAdmin) return true;
  let emp = null;
  if (trabajadorAsignado.value) {
    emp = trabajadorAsignado.value;
  } else if (formCaja.value.cajero_id) {
    emp = employees.value.find(e => e.id === formCaja.value.cajero_id);
  }
  if (!emp) return false;
  return emp.pos_access === 'cashier' || (emp.position && emp.position.toLowerCase().includes('cajero'));
})

const canCloseModal = computed(() => {
  if (!trabajadorAsignado.value) return false;
  // Si no hay caja abierta, obligamos a que no puedan cerrar el modal
  // a menos que sean vendedores (quienes no abren caja)
  const emp = employees.value.find(e => e.id === trabajadorAsignado.value.id);
  if (!cajaAbierta.value && emp && emp.pos_access === 'cashier') {
    return false;
  }
  // Si no hay emp (por alguna razon), bloqueamos
  if (!emp && !cajaAbierta.value) return false;
  return true;
})


const mostrarAbrirCaja = ref(false)

const tieneCajaAbierta = computed(() => {
  if (!formCaja.value.cajero_id) return false;
  return cajasAbiertasTotales.value.some(c => Number(c.user_id) === Number(formCaja.value.cajero_id));
})
const mostrarCerrarCaja = ref(false)
const mostrarModalCliente = ref(false)
const mostrarModalFactura = ref(false)

const mostrarPickerCaja = ref(false)
const mostrarPickerEmpleado = ref(false)
const cajaSeleccionada = ref(null)
const empleadoSeleccionado = ref(null)
const resumenCierre = ref(null)

const cajasAbiertasTotales = ref([])
const formCaja = ref({ name: '', saldo_inicial: 0, cajero_id: null, pin_caja: '', sucursal_id: null })
const formCierre = ref({ saldo_final: 0 })
const mostrarMovimientosCaja = ref(false)
const formMovimiento = ref({ tipo: 'outflow', monto: 0, motivo: '' })

async function registrarMovimiento() {
    if (formMovimiento.value.monto <= 0) {
        showAlert({ type: 'error', title: 'Error', message: 'El monto debe ser mayor a 0' })
        return
    }
    if (!formMovimiento.value.motivo.trim()) {
        showAlert({ type: 'error', title: 'Error', message: 'Ingrese un motivo para el movimiento' })
        return
    }
    try {
        await api.post(`/pos/cash-registers/${cajaAbierta.value.id}/movements/`, {
            movement_type: formMovimiento.value.tipo,
            amount: formMovimiento.value.monto,
            reason: formMovimiento.value.motivo
        })
        showAlert({ type: 'success', title: 'Éxito', message: 'Movimiento registrado con éxito' })
        mostrarMovimientosCaja.value = false
        formMovimiento.value = { tipo: 'outflow', monto: 0, motivo: '' }
    } catch (e) {
        console.error(e)
        showAlert({ type: 'error', title: 'Error', message: e.response?.data?.error || 'Error al registrar movimiento' })
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
    if (data && data.length > 0) {
      metodosList.value = data.filter(m => m.active !== false).map(m => ({
        name: m.id, // using ID as the value for the backend
        label: m.name,
        requires_reference: m.requires_reference,
        sri_code: m.sri_code
      }))
      if (!metodoPago.value) {
        metodoPago.value = metodosList.value[0].name
      }
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

const mostrarDescuentoGlobal = ref(false)
const descuentoGlobal = ref(0)
const tipoDescuentoGlobal = ref('%')

const subtotalItem = (item) => {
  const base = item.quantity * item.unit_price
  return (base - (base * (item.discount || 0) / 100)).toFixed(2)
}

const subtotalBruto = computed(() => {
  return carrito.value.reduce((acc, i) => acc + parseFloat(subtotalItem(i)), 0).toFixed(2);
});

const valorDescuentoGlobal = computed(() => {
  if (descuentoGlobal.value <= 0) return 0;
  if (tipoDescuentoGlobal.value === '%') {
    return parseFloat(subtotalBruto.value) * (descuentoGlobal.value / 100);
  }
  return parseFloat(descuentoGlobal.value);
});

const total = computed(() => {
  const t = parseFloat(subtotalBruto.value) - valorDescuentoGlobal.value;
  return Math.max(0, t).toFixed(2);
});

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
  try {
    const params = busqueda.value ? { q: busqueda.value } : {}
    const { data } = await api.get('/inventario/products/', { params })
    products.value = data
    if (!busqueda.value) localStorage.setItem('pos_products_cache', JSON.stringify(data));
  } catch (err) {
    if (!busqueda.value) {
      const cached = localStorage.getItem('pos_products_cache');
      if (cached) {
        products.value = JSON.parse(cached);
        showAlert({type: 'warning', title: 'Modo Offline', message: 'Se cargaron los productos desde la caché local.'});
      }
    }
  }
}

async function buscarProducto() {
  if (!busqueda.value) return
  
  let code = busqueda.value;
  let calcQty = 1;
  
  if (tenantFeatures.value['pos_scale_barcodes'] && code.length === 13 && code.startsWith('20')) {
      const itemCode = code.substring(2, 7);
      const weightStr = code.substring(7, 12);
      code = itemCode;
      calcQty = parseInt(weightStr, 10) / 1000.0;
  }
  
  try {
    const { data } = await api.get(`/inventario/products/?q=${code}`)
    if (data.length > 0) {
      const exactMatch = data.find(p => p.code === code || p.codigo === code)
      const producto = exactMatch || data[0]
      if (!productosEnEspera.value.find(p => p.id === producto.id)) {
        productosEnEspera.value.unshift(producto)
      }
      
      // Si fue escaneado como balanza y encontro algo, lo agrega directo
      if (tenantFeatures.value['pos_scale_barcodes'] && calcQty !== 1) {
          agregarItem(producto, calcQty)
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

function agregarItem(producto, customQty = 1) {
  const existente = carrito.value.find(i => i.product_id === producto.id)
  if (existente) {
    existente.quantity += customQty
  } else {
    carrito.value.push({
      product_id: producto.id,
      code: producto.code || producto.codigo || '-',
      description: producto.name || producto.nombre || '-',
      quantity: customQty,
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
  if (!formCaja.value.cajero_id) {
    await useAlert().showToast('Selecciona un empleado responsable antes de continuar.', 'warning')
    return
  }
  if (!formCaja.value.pin_caja) {
    await useAlert().showToast('Debes ingresar el PIN secreto.', 'warning')
    return
  }

  if (!tieneCajaAbierta.value && !formCaja.value.sucursal_id) {
    await useAlert().showToast('Debes seleccionar una sucursal.', 'warning')
    return
  }

  const selectedEmployee = employees.value.find(e => e.id === formCaja.value.cajero_id)

  if (!selectedEmployee || selectedEmployee.pos_access === 'none') {
    await useAlert().showToast('Este trabajador no tiene acceso al POS.', 'error')
    return
  }
  
  // SE REALIZA LA VALIDACIÓN DE CAJA FÍSICA Y SUCURSAL, Y SE ABRE TURNO EN EL BACKEND PARA TODOS LOS TRABAJADORES

  if (!esCajero.value || tieneCajaAbierta.value) {
    // Si es Vendedor o si el Cajero ya tiene una caja abierta: Verificamos PIN para ingresar
    try {
      const { data } = await api.post('/pos/verify-pin/', {
        cajero_id: formCaja.value.cajero_id,
        pin_caja: formCaja.value.pin_caja
      })
      if (esCajero.value && tieneCajaAbierta.value) {
        cajaAbierta.value = cajasAbiertasTotales.value.find(c => Number(c.user_id) === Number(formCaja.value.cajero_id))
      } else {
        const cajaDeSucursal = cajasAbiertasTotales.value.find(c => Number(c.branch_id) === Number(formCaja.value.sucursal_id))
        if (!cajaDeSucursal) {
           await useAlert().showToast('No hay una caja abierta en esta sucursal. El cajero debe abrirla primero.', 'error')
           return
        }
        cajaAbierta.value = cajaDeSucursal
        selectedEmployee.sucursal_id = formCaja.value.sucursal_id // Guardar sucursal para usarla en cotizaciones
      }
      trabajadorAsignado.value = selectedEmployee
      mostrarAbrirCaja.value = false
      formCaja.value = { name: '', saldo_inicial: 0, cajero_id: null, pin_caja: '', sucursal_id: null }
      mostrarPin.value = false
      await cargarProductos()
      useAlert().showToast(esCajero.value ? '¡Turno retomado exitosamente!' : `¡Sesión iniciada como ${selectedEmployee.name}!`, 'success')
      return
    } catch (e) {
      await useAlert().showToast(e.response?.data?.error || 'PIN incorrecto o error al verificar.', 'error')
      return
    }
  }

  // SI ES CAJERO (Y NO TIENE CAJA ABIERTA): Se realiza la validación de Caja Física y Sucursal, y se abre turno en Backend
  if (usarDesgloseFondo.value) {
    formCaja.value.saldo_inicial = parseFloat(totalBreakdown.value)
  }
  if (!formCaja.value.name) {
    await useAlert().showToast('Debes seleccionar una caja física.', 'warning')
    return
  }
  try {
    const { data } = await api.post('/pos/cash-registers/', formCaja.value)
    cajaAbierta.value = data
    trabajadorAsignado.value = selectedEmployee
    mostrarAbrirCaja.value = false
    formCaja.value = { name: '', saldo_inicial: 0, cajero_id: null, pin_caja: '', sucursal_id: null }
    mostrarPin.value = false
    await cargarProductos()
    useAlert().showToast(`¡Turno Abierto!`, 'success')
  } catch (e) {
    await useAlert().showToast(e.response?.data?.error || 'Ocurrió un error inesperado al intentar abrir la caja.', 'error')
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
      trabajadorAsignado.value = null
      products.value = []
      mostrarCerrarCaja.value = false
    }
  } catch (e) {
    await showAlert({ type: 'error', title: 'Error al cerrar caja', message: e.response?.data?.error || 'Ocurrió un error inesperado al intentar cerrar la caja.' })
  }
}

function cerrarSesionVendedor() {
  trabajadorAsignado.value = null
  limpiarDespuesDeVenta()
  useAlert().showToast('Sesión cerrada correctamente', 'success')
}

async function cobrar() {
  errorVenta.value = ''
  procesando.value = true
  try {
    const montoFinal = (metodoActual.value && !metodoActual.value.requires_reference)
      ? (parseFloat(montoRecibido.value) || parseFloat(total.value))
      : parseFloat(total.value)
      
    let paymentForm = metodoActual.value?.sri_code || '01'
    if (!metodoActual.value?.sri_code) {
      const mName = (metodoActual.value && metodoActual.value.label) ? metodoActual.value.label.toLowerCase() : ''
      if (mName.includes('tarjeta') && mName.includes('credito')) paymentForm = '19'
      else if (mName.includes('tarjeta') && mName.includes('debito')) paymentForm = '16'
      else if (mName.includes('transferencia')) paymentForm = '20'
    }

    const vDescGlobal = valorDescuentoGlobal.value;
    const vSubtotalBruto = parseFloat(subtotalBruto.value) || 1;
    
    const finalCustomerId = (clienteForm.value.id === 1 && clienteForm.value.identification !== '9999999999999') ? null : (clienteForm.value.id || null);
    
    const payload = {
      items: carrito.value.map(i => {
        const tIva = parseFloat(i.tarifa_iva || parametrosStore.obtener('ventas', 'iva', '15')) / 100
        const subI = parseFloat(subtotalItem(i))
        const pDesc = (subI / vSubtotalBruto) * vDescGlobal;
        const itemBase = i.quantity * i.unit_price;
        const finalDiscountPerc = ((i.discount || 0) + (pDesc / itemBase) * 100).toFixed(2);
        
        return {
          ...i,
          unit_price: i.unit_price / (1 + tIva),
          discount: Math.min(100, finalDiscountPerc),
          codigo_principal: i.code || '',
          tarifa_iva: i.tarifa_iva || parametrosStore.obtener('ventas', 'iva', '15')
        }
      }),
      payment_method: metodoPago.value,
      amount_received: montoFinal,
      update_customer: updateCustomer.value,
      reference_number: (metodoActual.value && metodoActual.value.requires_reference) ? nroComprobante.value : null,
      customer: {
        customer_id: finalCustomerId,
        name: clienteForm.value.name || 'CONSUMIDOR FINAL',
        identifier: clienteForm.value.identification || '9999999999999',
        id_type: clienteForm.value.tipo_id || '07',
        email: clienteForm.value.email || '',
        address: clienteForm.value.address || 'S/D',
        payment_form: paymentForm,
        payment_term: 0,
        payment_time: 'dias'
      },
      quotation_id: ordenPendienteId.value,
      seller_id: trabajadorAsignado.value ? trabajadorAsignado.value.id : null,
      document_type: tipoDocumento.value
    }
    const { data } = await api.post(`/pos/cash-registers/${cajaAbierta.value.id}/sales/`, payload)
    ticketVenta.value = {
      id: data.id,
      total: data.total,
      cambio: data.change,
      invoice_number: data.invoice_number || null,
      factura_numero: data.invoice_number || null,
      access_key: data.access_key || null,
      document_type: tipoDocumento.value,
      items: carrito.value.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price || i.price,
        subtotal: subtotalItem(i),
      })),
    }

    // Si la venta proviene de una mesa de restaurante, cerrar y liberar comanda
    if (mesaSeleccionada.value) {
      if (!pedidoMesaId.value && carrito.value.length > 0) {
        try {
          const lineas = carrito.value.map(i => ({
            item_id: String(i.item_ref || i.product_id || ''),
            item_nombre: i.description || i.name,
            cantidad: parseInt(i.quantity) || 1,
            precio_unitario: parseFloat(i.unit_price || i.price || 0),
            notas: i.notas || ''
          }))
          const resPed = await api.post('restaurantes/pedidos/', {
            mesa_id: mesaSeleccionada.value.id,
            lineas: lineas
          })
          pedidoMesaId.value = resPed.data?.id
        } catch (e) {
          console.error('Error auto-registrando pedido antes de cobrar:', e)
        }
      }
      if (pedidoMesaId.value) {
        try {
          await api.post(`/restaurantes/pedidos/${pedidoMesaId.value}/cerrar/`, {
            facturar: false,
            factura_id: data.id,
            factura_numero: data.invoice_number || null,
            clave_acceso: data.access_key || null,
            cliente_nombre: clienteForm.value.name,
            cliente_identificacion: clienteForm.value.identification,
            metodo_pago: metodoPago.value === 'efectivo' ? '01' : (metodoPago.value === 'tarjeta' ? '19' : '20')
          })
          showAlert({ type: 'success', title: 'Mesa Liberada', message: `Mesa ${mesaSeleccionada.value.nombre} cobrada y liberada.` })
        } catch (errRest) {
          console.error('Error cerrando mesa:', errRest)
        }
      }
      await cargarDatosRestaurante()
      mesaSeleccionada.value = null
      pedidoMesaId.value = null
    }

    carrito.value = []
    productosEnEspera.value = []
    nroComprobante.value = ''
    montoRecibido.value = 0
    requiereFactura.value = false
    clienteForm.value = { name: 'CONSUMIDOR FINAL', identification: '9999999999999', tipo_id: '07', email: '' }
    busquedaCliente.value = ''
  } catch (e) {
    errorVenta.value = e.response?.data?.error || e.message || 'Error al procesar sale'
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
      },
      seller_id: trabajadorAsignado.value ? trabajadorAsignado.value.id : null
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

    // Si la venta proviene de una mesa de restaurante, cerrar y liberar comanda
    if (mesaSeleccionada.value) {
      if (!pedidoMesaId.value && carrito.value.length > 0) {
        try {
          const lineas = carrito.value.map(i => ({
            item_id: String(i.item_ref || i.product_id || ''),
            item_nombre: i.description || i.name,
            cantidad: parseInt(i.quantity) || 1,
            precio_unitario: parseFloat(i.unit_price || i.price || 0),
            notas: i.notas || ''
          }))
          const resPed = await api.post('restaurantes/pedidos/', {
            mesa_id: mesaSeleccionada.value.id,
            lineas: lineas
          })
          pedidoMesaId.value = resPed.data?.id
        } catch (e) {
          console.error('Error auto-registrando pedido antes de cobrar:', e)
        }
      }
      if (pedidoMesaId.value) {
        try {
          await api.post(`/restaurantes/pedidos/${pedidoMesaId.value}/cerrar/`, {
            facturar: false,
            factura_id: data.id,
            factura_numero: data.invoice_number || null,
            clave_acceso: data.access_key || null,
            cliente_nombre: clienteForm.value.name,
            cliente_identificacion: clienteForm.value.identification,
            metodo_pago: metodoPago.value === 'efectivo' ? '01' : (metodoPago.value === 'tarjeta' ? '19' : '20')
          })
          showAlert({ type: 'success', title: 'Mesa Liberada', message: `Mesa ${mesaSeleccionada.value.nombre} cobrada y liberada.` })
        } catch (errRest) {
          console.error('Error cerrando mesa:', errRest)
        }
      }
      await cargarDatosRestaurante()
      mesaSeleccionada.value = null
      pedidoMesaId.value = null
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
    errorVenta.value = e.response?.data?.error || e.message || 'Error al procesar venta y factura'
  } finally {
    procesando.value = false
  }
}

const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape') {
    if (mostrarAbrirCaja.value && canCloseModal.value) mostrarAbrirCaja.value = false
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
      else guardarPreFactura(true)
    }
    if (e.key === 'F2') {
      e.preventDefault()
      inputBusqueda.value?.focus()
    }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('keypress', handleGlobalKeypress)
  cargandoPOS.value = true
  try {
    const { data } = await api.get('/pos/cash-registers/')
    cajasAbiertasTotales.value = data.filter(c => c.status === 'open')
    // Nota: Ya no asignamos cajaAbierta.value automáticamente aquí
    // para evitar que un usuario al refrescar asuma la caja de otro usuario.
    // Deben ingresar su PIN en "Asignar Trabajador" para retomarla.
  } catch {}
  
  try {
    const { data } = await api.get('/tenant/features/')
    tenantFeatures.value = data
  } catch {}

  await parametrosStore.cargar()

  if (trabajadorAsignado.value) {
    if (esCajero.value) {
      cajaAbierta.value = cajasAbiertasTotales.value.find(c => Number(c.user_id) === Number(trabajadorAsignado.value.id)) || null
    } else {
      cajaAbierta.value = cajasAbiertasTotales.value.find(c => Number(c.branch_id) === Number(trabajadorAsignado.value.sucursal_id)) || null
    }
  } else {
    mostrarAbrirCaja.value = true
  }
  await cargarProductos()
  
  try {
    const { data: bData } = await api.get('/inventario/branches/')
    sucursales.value = bData
  } catch {}

  try {
    const { data: empData } = await api.get('/rrhh/employees/')
    employees.value = empData
  } catch {}

  if (tenantStore.tieneModulo('restaurantes')) {
    cargarDatosRestaurante()
  }

  cargandoPOS.value = false
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('keypress', handleGlobalKeypress)
})
// ==========================================
// Historial de Ventas Turno Actual
// ==========================================
const abrirHistorial = async () => {
  if (!cajaAbierta.value) {
    showAlert({ type: 'error', title: 'Error', message: 'Debe abrir un turno de caja primero' });
    return;
  }
  mostrarHistorialModal.value = true;
  cargandoHistorial.value = true;
  try {
    const { data } = await api.get(`/pos/cash-registers/${cajaAbierta.value.id}/sales/`);
    ventasTurno.value = data;
  } catch (error) {
    console.error("Error al cargar historial del turno:", error);
    showAlert({ type: 'error', title: 'Error', message: 'No se pudo cargar el historial de ventas' });
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
  const saleInfo = {
    id: venta.id,
    invoice_number: venta.invoice_number || null,
    access_key: venta.access_key || null,
    total: venta.total,
    subtotal: venta.subtotal || venta.total,
    tax: venta.tax || '0.00',
    cambio: venta.change || '0.00',
    created_at: venta.created_at,
    payment_method: venta.payment_method,
    client: {
      name: venta.customer_name || 'CONSUMIDOR FINAL',
      identification: venta.customer_identifier || '9999999999999',
      address: venta.customer_address || ''
    },
    items: (venta.items || []).map(i => ({
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: i.subtotal || (parseFloat(i.quantity) * parseFloat(i.unit_price || 0)).toFixed(2),
    }))
  };
  ticketVenta.value = saleInfo;
  lastSaleData.value = saleInfo;
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
