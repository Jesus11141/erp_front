<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Pedido - {{ mesa.nombre }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="productos-section">
          <h3>Categorías Rápidas</h3>
          <div class="categorias-grid">
            <button class="cat-btn" @click="cargarProductos('Bebidas')">🍹 Bebidas</button>
            <button class="cat-btn" @click="cargarProductos('Platos Fuertes')">🍔 Platos Fuertes</button>
            <button class="cat-btn" @click="cargarProductos('Postres')">🍰 Postres</button>
          </div>
          
          <div class="productos-list">
            <div 
              v-for="p in productosActuales" 
              :key="p.id" 
              class="producto-card"
              @click="agregarAlPedido(p)"
            >
              {{ p.nombre }} - ${{ p.precio }}
            </div>
          </div>
        </div>
        
        <div class="cuenta-section">
          <h3>Cuenta de la Mesa</h3>
          <ul class="lineas-list">
            <li v-for="(linea, index) in pedidoActual.lineas" :key="index">
              <span>{{ linea.cantidad }}x {{ linea.item_nombre }}</span>
              <span>${{ (linea.cantidad * linea.precio_unitario).toFixed(2) }}</span>
            </li>
          </ul>
          <div class="total-row">
            <strong>Total:</strong>
            <strong>${{ totalCalculado.toFixed(2) }}</strong>
          </div>
          <div class="actions">
            <button class="btn-success" @click="enviarPedido" v-if="nuevasLineas.length > 0">Enviar a Cocina</button>
            <button class="btn-danger" @click="cerrarMesa" v-if="pedidoActual.id">Cobrar y Liberar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps(['mesa']);
const emit = defineEmits(['close', 'pedidoActualizado']);

const pedidoActual = ref({ lineas: [] });
const nuevasLineas = ref([]);

const productosBase = [
  { id: 1, categoria: 'Bebidas', nombre: 'Coca Cola', precio: 2.00 },
  { id: 2, categoria: 'Bebidas', nombre: 'Cerveza', precio: 3.50 },
  { id: 3, categoria: 'Platos Fuertes', nombre: 'Hamburguesa', precio: 8.00 },
  { id: 4, categoria: 'Platos Fuertes', nombre: 'Pizza', precio: 12.00 },
  { id: 5, categoria: 'Postres', nombre: 'Helado', precio: 4.00 },
];
const productosActuales = ref([]);

const cargarProductos = (categoria) => {
  productosActuales.value = productosBase.filter(p => p.categoria === categoria);
};

const cargarPedido = async () => {
  try {
    const { data } = await axios.get(`/api/restaurantes/pedidos/?mesa_id=${props.mesa.id}`);
    if (data.length > 0) {
      pedidoActual.value = data[0];
    }
  } catch (error) {
    console.error(error);
  }
};

const agregarAlPedido = (producto) => {
  const linea = {
    item_id: producto.id,
    item_nombre: producto.nombre,
    cantidad: 1,
    precio_unitario: producto.precio,
  };
  nuevasLineas.value.push(linea);
  pedidoActual.value.lineas.push(linea);
};

const totalCalculado = computed(() => {
  return pedidoActual.value.lineas.reduce((acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0);
});

const enviarPedido = async () => {
  try {
    await axios.post('/api/restaurantes/pedidos/', {
      mesa_id: props.mesa.id,
      lineas: nuevasLineas.value
    });
    nuevasLineas.value = [];
    emit('pedidoActualizado');
    cargarPedido();
  } catch (error) {
    console.error(error);
  }
};

const cerrarMesa = async () => {
  if (!pedidoActual.value.id) return;
  try {
    await axios.post(`/api/restaurantes/pedidos/${pedidoActual.value.id}/cerrar/`);
    emit('pedidoActualizado');
    emit('close');
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  cargarPedido();
  cargarProductos('Bebidas');
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
  width: 800px;
  max-width: 90vw;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 1rem 2rem;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #dee2e6;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}
.modal-body {
  display: flex;
  padding: 2rem;
  gap: 2rem;
  height: 500px;
}
.productos-section {
  flex: 2;
  border-right: 1px solid #eee;
  padding-right: 1rem;
}
.cuenta-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.categorias-grid {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.cat-btn {
  padding: 0.5rem;
  background: #e9ecef;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}
.productos-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.producto-card {
  padding: 1rem;
  background: var(--primary-color, #007bff);
  color: white;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
}
.lineas-list {
  list-style: none;
  padding: 0;
  flex: 1;
  overflow-y: auto;
}
.lineas-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #ccc;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}
.actions {
  display: flex;
  gap: 1rem;
  flex-direction: column;
}
.btn-success {
  background: #28a745; color: white; padding: 1rem; border: none; border-radius: 4px; cursor: pointer;
}
.btn-danger {
  background: #dc3545; color: white; padding: 1rem; border: none; border-radius: 4px; cursor: pointer;
}
</style>
