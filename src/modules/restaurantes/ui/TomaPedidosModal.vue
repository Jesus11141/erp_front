<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Pedido - {{ mesa.nombre }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- SECCIÓN IZQUIERDA: MENÚ DE PLATOS -->
        <div class="productos-section">
          <h3>Menú de Platos</h3>
          
          <!-- Filtro de Categorías Dinámicas -->
          <div class="categorias-grid" v-if="categorias.length > 0">
            <button 
              class="cat-btn"
              :class="{ active: categoriaSeleccionada === 'Todas' }"
              @click="seleccionarCategoria('Todas')"
            >
              ⭐ Todas
            </button>
            <button 
              v-for="cat in categorias"
              :key="cat"
              class="cat-btn" 
              :class="{ active: categoriaSeleccionada === cat }"
              @click="seleccionarCategoria(cat)"
            >
              {{ obtenerIcono(cat) }} {{ cat }}
            </button>
          </div>

          <!-- Mensaje si no hay platos configurados en el ERP -->
          <div v-if="cargandoPlatos" class="empty-state">
            Cargando menú...
          </div>
          <div v-else-if="platos.length === 0" class="empty-state">
            <p><strong>No hay platos registrados en el menú.</strong></p>
            <p style="font-size: 0.85rem; color: #6c757d;">
              Dirígete a <strong>Configuración > Restaurantes > Menú y Platos</strong> para dar de alta tus productos y bebidas.
            </p>
          </div>
          
          <!-- Lista de Platos Dinámica -->
          <div class="productos-list" v-else>
            <div 
              v-for="p in productosActuales" 
              :key="p.id" 
              class="producto-card"
              @click="agregarAlPedido(p)"
            >
              <div class="p-nombre">{{ p.nombre }}</div>
              <div class="p-precio">${{ Number(p.precio).toFixed(2) }}</div>
            </div>
          </div>
        </div>
        
        <!-- SECCIÓN DERECHA: CUENTA DE LA MESA -->
        <div class="cuenta-section">
          <h3>Cuenta de la Mesa</h3>
          
          <div class="lineas-container">
            <!-- Platos ya confirmados/enviados a cocina -->
            <div v-if="pedidoActual.lineas && pedidoActual.lineas.length > 0" class="bloque-pedidos">
              <span class="subtitulo-seccion">En Cocina / Servido:</span>
              <ul class="lineas-list">
                <li v-for="(linea, index) in pedidoActual.lineas" :key="'conf-' + index" class="linea-confirmada">
                  <div class="linea-info">
                    <span class="linea-cant">{{ linea.cantidad }}x</span>
                    <span class="linea-nombre">{{ linea.item_nombre }}</span>
                    <span class="badge-cocina" :class="linea.estado_cocina">{{ obtenerTextoCocina(linea.estado_cocina) }}</span>
                  </div>
                  <span class="linea-subtotal">${{ (linea.cantidad * linea.precio_unitario).toFixed(2) }}</span>
                </li>
              </ul>
            </div>

            <!-- Nuevos platos agregados pendientes de enviar -->
            <div v-if="nuevasLineas.length > 0" class="bloque-pedidos nuevos">
              <span class="subtitulo-seccion nuevos">Por Enviar a Cocina:</span>
              <ul class="lineas-list">
                <li v-for="(linea, index) in nuevasLineas" :key="'new-' + index" class="linea-nueva">
                  <div class="linea-controles">
                    <button class="btn-qty" @click="decrementarCantidad(linea, index)">−</button>
                    <span class="linea-cant-badge">{{ linea.cantidad }}</span>
                    <button class="btn-qty" @click="incrementarCantidad(linea)">+</button>
                    <span class="linea-nombre">{{ linea.item_nombre }}</span>
                  </div>
                  <div class="linea-derecha">
                    <span class="linea-subtotal">${{ (linea.cantidad * linea.precio_unitario).toFixed(2) }}</span>
                    <button class="btn-eliminar-item" @click="eliminarNuevaLinea(index)" title="Quitar">✕</button>
                  </div>
                </li>
              </ul>
            </div>

            <div v-if="(!pedidoActual.lineas || pedidoActual.lineas.length === 0) && nuevasLineas.length === 0" class="sin-pedidos">
              <p>Mesa sin pedidos.</p>
              <span style="font-size:0.85rem; color:#888;">Haz clic en cualquier plato del menú a la izquierda para agregarlo.</span>
            </div>
          </div>
          
          <div class="total-row">
            <strong>Total:</strong>
            <strong>${{ totalCalculado.toFixed(2) }}</strong>
          </div>

          <div class="actions">
            <!-- Si es Pre-pago: Cobro directo o Envío a Cocina -->
            <template v-if="esPrePago">
              <button 
                class="btn-prepago" 
                @click="cobrarYEnviarCocina" 
                v-if="nuevasLineas.length > 0 && puedeCobrar"
              >
                💳 Cobrar ${{ totalCalculado.toFixed(2) }} y Enviar a Cocina
              </button>
              <button 
                class="btn-success" 
                @click="enviarPedido" 
                v-else-if="nuevasLineas.length > 0 && puedePedir"
              >
                🔔 Enviar a Cocina (Pendiente Cobro en Caja)
              </button>
              <div v-else-if="nuevasLineas.length > 0 && !puedeCobrar" class="badge-aviso-caja">
                🔒 Cobro reservado para el personal de caja
              </div>
            </template>

            <!-- Si es Post-pago (Tradicional): Enviar a cocina y cobrar al final -->
            <template v-else>
              <button class="btn-success" @click="enviarPedido" v-if="nuevasLineas.length > 0 && puedePedir">
                🔔 Enviar a Cocina ({{ totalItemsNuevos }} {{ totalItemsNuevos === 1 ? 'item' : 'items' }})
              </button>
              <button class="btn-danger" @click="cerrarMesa" v-if="pedidoActual.id && puedeCobrar">
                💳 Cobrar y Liberar Mesa
              </button>
              <div v-else-if="pedidoActual.id && !puedeCobrar" class="badge-aviso-caja">
                🔒 Mesa activa • Cobro gestionado por Caja
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Cobro y Facturación SRI -->
    <CobroRestauranteModal
      :show="mostrarModalCobro"
      :mesa="mesa"
      :pedido="pedidoActual"
      :nuevas-lineas="nuevasLineas"
      :es-pre-pago="esPrePago"
      @close="mostrarModalCobro = false"
      @cobrado="onCobroExitoso"
    />

    <!-- Modal de Ticket Térmico -->
    <ReceiptModal
      :show="mostrarModalTicket"
      :last-sale-data="ticketData"
      @close="cerrarTicketYTerminar"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../../shared/api';
import { useAlert } from '../../../composables/useAlert';
import { useParametrosStore } from '../../../stores/parametros';
import { useAuthStore } from '../../../stores/auth';
import CobroRestauranteModal from './CobroRestauranteModal.vue';
import ReceiptModal from '../../pos/ui/components/ReceiptModal.vue';

const { showAlert, showToast } = useAlert();
const parametrosStore = useParametrosStore();
const authStore = useAuthStore();

const puedePedir = computed(() => {
  return authStore.esSuperAdmin || 
         authStore.tienePermiso('restaurante.pedidos') || 
         authStore.tienePermiso('restaurante.*') || 
         authStore.usuario?.role === 'admin';
});

const puedeCobrar = computed(() => {
  return authStore.esSuperAdmin || 
         authStore.tienePermiso('restaurante.cobrar') || 
         authStore.tienePermiso('restaurante.*') || 
         authStore.usuario?.role === 'admin';
});

const esPrePago = computed(() => {
  return parametrosStore.obtener('restaurantes', 'modalidad_cobro', 'post_pago') === 'pre_pago';
});

const props = defineProps(['mesa']);
const emit = defineEmits(['close', 'pedidoActualizado']);

const pedidoActual = ref({ lineas: [] });
const nuevasLineas = ref([]);

const mostrarModalCobro = ref(false);
const mostrarModalTicket = ref(false);
const ticketData = ref(null);

const platos = ref([]);
const cargandoPlatos = ref(false);
const categoriaSeleccionada = ref('Todas');

const categorias = computed(() => {
  const cats = platos.value.map(p => p.categoria?.trim() || 'General');
  return [...new Set(cats)];
});

const productosActuales = computed(() => {
  if (categoriaSeleccionada.value === 'Todas') {
    return platos.value;
  }
  return platos.value.filter(p => (p.categoria?.trim() || 'General') === categoriaSeleccionada.value);
});

const totalItemsNuevos = computed(() => {
  return nuevasLineas.value.reduce((acc, curr) => acc + curr.cantidad, 0);
});

const seleccionarCategoria = (cat) => {
  categoriaSeleccionada.value = cat;
};

const obtenerIcono = (cat) => {
  const c = cat.toLowerCase();
  if (c.includes('bebida') || c.includes('trago') || c.includes('refresco')) return '🍹';
  if (c.includes('fuerte') || c.includes('plato') || c.includes('almuerzo') || c.includes('hamburguesa')) return '🍔';
  if (c.includes('sopa') || c.includes('caldo') || c.includes('repe')) return '🍲';
  if (c.includes('postre') || c.includes('dulce') || c.includes('helado')) return '🍰';
  if (c.includes('entrada') || c.includes('piqueo') || c.includes('snack')) return '🥟';
  return '🍴';
};

const obtenerTextoCocina = (estado) => {
  if (estado === 'pendiente') return '⏳ En espera';
  if (estado === 'preparando') return '🍳 Preparando';
  if (estado === 'listo') return '✅ ¡Listo!';
  if (estado === 'entregado') return '✔️ Servido';
  return estado;
};

const cargarPlatos = async () => {
  cargandoPlatos.value = true;
  try {
    const { data } = await api.get('restaurantes/platos/');
    platos.value = data;
    if (data.length > 0 && categoriaSeleccionada.value === 'Todas') {
      categoriaSeleccionada.value = 'Todas';
    }
  } catch (error) {
    console.error('Error cargando platos:', error);
  } finally {
    cargandoPlatos.value = false;
  }
};

const cargarPedido = async () => {
  try {
    const { data } = await api.get(`restaurantes/pedidos/?mesa_id=${props.mesa.id}`);
    if (data && data.length > 0) {
      pedidoActual.value = data[0];
    } else {
      pedidoActual.value = { lineas: [] };
    }
  } catch (error) {
    console.error('Error cargando pedido:', error);
  }
};

const agregarAlPedido = (producto) => {
  if (!puedePedir.value) {
    showToast('Tu usuario no tiene permisos para tomar pedidos.', 'warning');
    return;
  }
  const itemExistente = nuevasLineas.value.find(l => l.item_id === String(producto.id));
  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    nuevasLineas.value.push({
      item_id: String(producto.id),
      item_nombre: producto.nombre,
      cantidad: 1,
      precio_unitario: Number(producto.precio),
      notas: ''
    });
  }
};

const incrementarCantidad = (linea) => {
  if (!puedePedir.value) return;
  linea.cantidad += 1;
};

const decrementarCantidad = (linea, index) => {
  if (!puedePedir.value) return;
  if (linea.cantidad > 1) {
    linea.cantidad -= 1;
  } else {
    nuevasLineas.value.splice(index, 1);
  }
};

const eliminarNuevaLinea = (index) => {
  if (!puedePedir.value) return;
  nuevasLineas.value.splice(index, 1);
};

const totalCalculado = computed(() => {
  const totalConfirmado = (pedidoActual.value.lineas || []).reduce(
    (acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0
  );
  const totalNuevas = nuevasLineas.value.reduce(
    (acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0
  );
  return totalConfirmado + totalNuevas;
});

const enviarPedido = async () => {
  if (!puedePedir.value) {
    showToast('Tu usuario no tiene permisos para enviar pedidos a cocina.', 'warning');
    return;
  }
  try {
    await api.post('restaurantes/pedidos/', {
      mesa_id: props.mesa.id,
      lineas: nuevasLineas.value
    });
    nuevasLineas.value = [];
    emit('pedidoActualizado');
    await cargarPedido();
    showToast('¡Comanda enviada a cocina con éxito!', 'success');
  } catch (error) {
    console.error('Error enviando pedido:', error);
    showAlert({
      type: 'error',
      title: 'Error de Envío',
      message: error.response?.data?.error || 'No se pudo enviar el pedido a la cocina. Verifica la conexión con el servidor.'
    });
  }
};

const cobrarYEnviarCocina = () => {
  if (!puedeCobrar.value) {
    showToast('Tu usuario no tiene permisos para cobrar o emitir facturas.', 'warning');
    return;
  }
  if (nuevasLineas.value.length === 0) return;
  mostrarModalCobro.value = true;
};

const cerrarMesa = () => {
  if (!puedeCobrar.value) {
    showToast('Tu usuario no tiene permisos para cobrar o emitir facturas.', 'warning');
    return;
  }
  if (!pedidoActual.value.id && nuevasLineas.value.length === 0) return;
  mostrarModalCobro.value = true;
};

const onCobroExitoso = (payload) => {
  nuevasLineas.value = [];
  ticketData.value = payload.ticketData;
  mostrarModalTicket.value = true;
  emit('pedidoActualizado');
};

const cerrarTicketYTerminar = () => {
  mostrarModalTicket.value = false;
  emit('close');
};

onMounted(() => {
  parametrosStore.cargar();
  cargarPlatos();
  cargarPedido();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  width: 900px;
  max-width: 94vw;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 40px rgba(0,0,0,0.25);
}
.modal-header {
  padding: 1rem 1.75rem;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #212529;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: #6c757d;
}
.modal-body {
  display: flex;
  padding: 1.5rem;
  gap: 1.75rem;
  height: 540px;
}
.productos-section {
  flex: 1.3;
  border-right: 1px solid #e9ecef;
  padding-right: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.productos-section h3, .cuenta-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.15rem;
  color: #333;
}
.cuenta-section {
  flex: 1.1;
  display: flex;
  flex-direction: column;
}
.categorias-grid {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
}
.cat-btn {
  padding: 0.4rem 0.85rem;
  background: #f1f3f5;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}
.cat-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}
.productos-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.85rem;
  overflow-y: auto;
  padding: 0.25rem;
}
.producto-card {
  padding: 1rem 0.75rem;
  background: #ffffff;
  border: 1.5px solid #007bff;
  color: #007bff;
  text-align: center;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
  user-select: none;
}
.producto-card:hover {
  background: #007bff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,123,255,0.25);
}
.p-nombre {
  font-weight: 600;
  font-size: 0.95rem;
}
.p-precio {
  font-weight: bold;
  font-size: 1.1rem;
}

/* Cuenta list styles */
.lineas-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.bloque-pedidos {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.bloque-pedidos.nuevos {
  background: #f0f7ff;
  border: 1px dashed #b8daff;
  border-radius: 8px;
  padding: 0.6rem;
}
.subtitulo-seccion {
  font-size: 0.8rem;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
}
.subtitulo-seccion.nuevos {
  color: #0056b3;
}
.lineas-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.lineas-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
}
.linea-confirmada {
  background: #f8f9fa;
}
.linea-nueva {
  background: white;
  border: 1px solid #cce5ff;
}
.linea-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.linea-controles {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.btn-qty {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}
.btn-qty:hover {
  background: #007bff;
  color: white;
}
.linea-cant-badge {
  font-weight: 800;
  font-size: 0.95rem;
  min-width: 20px;
  text-align: center;
}
.linea-cant {
  font-weight: 800;
  color: #007bff;
}
.linea-nombre {
  font-weight: 500;
  color: #212529;
}
.badge-cocina {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
}
.badge-cocina.pendiente { background: #ffeeba; color: #856404; }
.badge-cocina.preparando { background: #b8daff; color: #004085; }
.badge-cocina.listo { background: #c3e6cb; color: #155724; }
.badge-cocina.entregado { background: #e2e3e5; color: #383d41; }

.linea-derecha {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.linea-subtotal {
  font-weight: 700;
  color: #333;
}
.btn-eliminar-item {
  background: transparent;
  border: none;
  color: #dc3545;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0 0.25rem;
}
.btn-eliminar-item:hover {
  color: #bd2130;
}
.sin-pedidos {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.3rem;
  margin: 1rem 0;
  padding-top: 0.75rem;
  border-top: 2px solid #212529;
}
.actions {
  display: flex;
  gap: 0.75rem;
  flex-direction: column;
}
.btn-success {
  background: #28a745; 
  color: white; 
  padding: 0.85rem; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
}
.btn-danger {
  background: #dc3545; 
  color: white; 
  padding: 0.85rem; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
}
.btn-prepago {
  background: #007bff;
  color: white;
  padding: 0.95rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  transition: all 0.2s;
}
.btn-prepago:hover {
  background: #0056b3;
  transform: translateY(-1px);
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
  color: #6c757d;
}
.badge-aviso-caja {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: center;
  width: 100%;
  display: block;
}
</style>
