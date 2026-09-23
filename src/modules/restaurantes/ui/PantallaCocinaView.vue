<template>
  <div class="pantalla-cocina">
    <div class="header">
      <h2>KDS - Pantalla de Cocina</h2>
      <button @click="cargarComandas">🔄 Actualizar</button>
    </div>

    <div class="comandas-grid">
      <div 
        v-for="linea in lineasPendientes" 
        :key="linea.id"
        class="comanda-card"
        :class="linea.estado_cocina"
      >
        <div class="card-header">
          <strong>{{ linea.mesa_nombre }}</strong>
          <span>⏱ {{ Math.floor(linea.tiempo_espera / 60) }} min</span>
        </div>
        <div class="card-body">
          <h3>{{ linea.cantidad }}x {{ linea.item_nombre }}</h3>
          <p v-if="linea.notas"><strong>Notas:</strong> {{ linea.notas }}</p>
        </div>
        <div class="card-footer">
          <button v-if="linea.estado_cocina === 'pendiente'" @click="cambiarEstado(linea, 'preparando')">Empezar a Cocinar</button>
          <button v-if="linea.estado_cocina === 'preparando'" class="btn-listo" @click="cambiarEstado(linea, 'listo')">¡Plato Listo!</button>
          <button v-if="linea.estado_cocina === 'listo'" class="btn-entregar" @click="cambiarEstado(linea, 'entregado')">Entregado al Mesero</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const lineasPendientes = ref([]);

const cargarComandas = async () => {
  try {
    const { data } = await axios.get('/api/restaurantes/cocina/');
    lineasPendientes.value = data;
  } catch (error) {
    console.error('Error cargando cocina', error);
  }
};

const cambiarEstado = async (linea, nuevoEstado) => {
  try {
    await axios.post(`/api/restaurantes/cocina/${linea.id}/`, { estado: nuevoEstado });
    cargarComandas();
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  cargarComandas();
  setInterval(cargarComandas, 15000); // Polling cada 15 segundos
});
</script>

<style scoped>
.pantalla-cocina {
  padding: 2rem;
  background: #2c3e50;
  min-height: 100vh;
  color: white;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.header button {
  padding: 0.5rem 1rem;
  background: #34495e;
  border: 1px solid #45b7d1;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
.comandas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}
.comanda-card {
  background: white;
  color: #333;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.comanda-card.pendiente {
  border-top: 5px solid #e74c3c;
}
.comanda-card.preparando {
  border-top: 5px solid #f1c40f;
}
.comanda-card.listo {
  border-top: 5px solid #2ecc71;
}
.card-header {
  padding: 1rem;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}
.card-body {
  padding: 1.5rem 1rem;
  flex: 1;
}
.card-footer {
  padding: 1rem;
  background: #f8f9fa;
  display: flex;
}
.card-footer button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #3498db;
  color: white;
  font-weight: bold;
}
.card-footer button.btn-listo {
  background: #2ecc71;
}
.card-footer button.btn-entregar {
  background: #95a5a6;
}
</style>
