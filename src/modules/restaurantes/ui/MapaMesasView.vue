<template>
  <div class="mapa-mesas">
    <div class="header">
      <h2>Mapa de Mesas</h2>
      <div class="zonas-tabs">
        <button 
          v-for="zona in zonas" 
          :key="zona.id"
          :class="{ active: zona.id === selectedZonaId }"
          @click="selectedZonaId = zona.id"
        >
          {{ zona.nombre }}
        </button>
      </div>
    </div>

    <div class="mesas-grid" v-if="selectedZona">
      <div 
        v-for="mesa in selectedZona.mesas" 
        :key="mesa.id"
        class="mesa-card"
        :class="mesa.estado"
        @click="abrirPedido(mesa)"
      >
        <div class="mesa-nombre">{{ mesa.nombre }}</div>
        <div class="mesa-info">{{ mesa.asientos }} Pax</div>
        <div class="mesa-estado">{{ mesa.estado === 'libre' ? 'Libre' : 'Ocupada' }}</div>
      </div>
    </div>

    <TomaPedidosModal 
      v-if="mesaSeleccionada"
      :mesa="mesaSeleccionada"
      @close="cerrarModal"
      @pedidoActualizado="cargarZonas"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import TomaPedidosModal from './TomaPedidosModal.vue';
import axios from 'axios';

const zonas = ref([]);
const selectedZonaId = ref(null);
const mesaSeleccionada = ref(null);

const selectedZona = computed(() => {
  return zonas.value.find(z => z.id === selectedZonaId.value);
});

const cargarZonas = async () => {
  try {
    const { data } = await axios.get('/api/restaurantes/zonas/');
    zonas.value = data;
    if (data.length > 0 && !selectedZonaId.value) {
      selectedZonaId.value = data[0].id;
    }
  } catch (error) {
    console.error('Error cargando zonas', error);
  }
};

const abrirPedido = (mesa) => {
  mesaSeleccionada.value = mesa;
};

const cerrarModal = () => {
  mesaSeleccionada.value = null;
};

onMounted(() => {
  cargarZonas();
});
</script>

<style scoped>
.mapa-mesas {
  padding: 2rem;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.zonas-tabs button {
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  border: none;
  background: #eee;
  border-radius: 4px;
  cursor: pointer;
}
.zonas-tabs button.active {
  background: var(--primary-color, #007bff);
  color: white;
}
.mesas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
}
.mesa-card {
  padding: 2rem 1rem;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}
.mesa-card:hover {
  transform: translateY(-5px);
}
.mesa-card.libre {
  background-color: #d4edda;
  border: 2px solid #28a745;
  color: #155724;
}
.mesa-card.ocupada {
  background-color: #f8d7da;
  border: 2px solid #dc3545;
  color: #721c24;
}
.mesa-nombre {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}
</style>
