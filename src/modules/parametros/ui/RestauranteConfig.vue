<template>
  <div class="restaurante-config">
    <div class="sub-tabs">
      <button 
        :class="['sub-tab', tabActiva === 'salones' ? 'active' : '']"
        @click="tabActiva = 'salones'"
      >
        🪑 Salones y Mesas
      </button>
      <button 
        :class="['sub-tab', tabActiva === 'platos' ? 'active' : '']"
        @click="tabActiva = 'platos'"
      >
        🍽️ Menú y Platos
      </button>
      <button 
        :class="['sub-tab', tabActiva === 'cobro' ? 'active' : '']"
        @click="tabActiva = 'cobro'"
      >
        ⚙️ Modalidad de Cobro
      </button>
    </div>

    <!-- TAB 1: SALONES Y MESAS -->
    <div v-if="tabActiva === 'salones'">
      <h3>Configuración de Salones y Mesas</h3>
      <p class="text-muted" style="margin-bottom: 1.5rem;">
        Gestiona las zonas físicas de tu restaurante y las mesas que pertenecen a cada una.
      </p>

      <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
        <input 
          type="text" 
          v-model="nuevaZona" 
          placeholder="Nombre de la nueva zona (ej. Terraza, Salón 2)" 
          class="input" 
          style="flex: 1; max-width: 320px;" 
          @keyup.enter="crearZona"
        />
        <button class="btn btn-primary" @click="crearZona" :disabled="!nuevaZona.trim()">➕ Agregar Zona</button>
      </div>

      <div v-if="zonas.length === 0" class="empty-state">
        No hay zonas ni salones configurados aún. Crea uno para comenzar.
      </div>

      <div v-for="zona in zonas" :key="zona.id" class="zona-card">
        <div class="zona-header">
          <h4>{{ zona.nombre }}</h4>
          <span class="badge">{{ zona.mesas?.length || 0 }} mesas</span>
        </div>
        
        <div class="mesas-list" v-if="zona.mesas && zona.mesas.length > 0">
          <div v-for="mesa in zona.mesas" :key="mesa.id" class="mesa-item">
            <span><strong>{{ mesa.nombre }}</strong> ({{ mesa.asientos }} pax)</span>
          </div>
        </div>
        <div v-else class="text-muted" style="font-size:0.85rem; margin-bottom: 1rem;">
          No hay mesas creadas en esta zona.
        </div>

        <div class="add-mesa-form">
          <input type="text" v-model="zona.nuevaMesa" placeholder="Nombre mesa (ej: Mesa 1)" class="input input-sm" @keyup.enter="crearMesa(zona)" />
          <input type="number" v-model="zona.nuevosAsientos" placeholder="Pax" class="input input-sm" style="width: 70px;" min="1" />
          <button class="btn btn-secondary btn-sm" @click="crearMesa(zona)" :disabled="!zona.nuevaMesa?.trim()">➕ Agregar Mesa</button>
        </div>
      </div>
    </div>

    <!-- TAB 2: MENÚ Y PLATOS -->
    <div v-if="tabActiva === 'platos'">
      <h3>Gestión de Menú y Platos</h3>
      <p class="text-muted" style="margin-bottom: 1.5rem;">
        Crea los platos y bebidas que estarán disponibles para tomar pedidos en las mesas.
      </p>

      <!-- Formulario para agregar plato -->
      <div class="card-form">
        <h4>Nuevo Ítem del Menú</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Categoría</label>
            <input 
              type="text" 
              v-model="nuevoPlato.categoria" 
              placeholder="Ej. Bebidas, Platos Fuertes, Postres, Entradas" 
              class="input"
              list="sugerencias-categorias"
            />
            <datalist id="sugerencias-categorias">
              <option value="Bebidas"></option>
              <option value="Platos Fuertes"></option>
              <option value="Postres"></option>
              <option value="Entradas"></option>
              <option value="Piqueos"></option>
            </datalist>
          </div>

          <div class="form-group" style="flex: 2;">
            <label>Nombre del Plato o Bebida</label>
            <input 
              type="text" 
              v-model="nuevoPlato.nombre" 
              placeholder="Ej. Coca Cola 500ml, Hamburguesa Especial..." 
              class="input"
            />
          </div>

          <div class="form-group" style="width: 120px;">
            <label>Precio ($)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              v-model="nuevoPlato.precio" 
              placeholder="0.00" 
              class="input"
            />
          </div>

          <div class="form-group" style="align-self: flex-end;">
            <button 
              class="btn btn-primary" 
              @click="crearPlato"
              :disabled="!nuevoPlato.nombre.trim() || nuevoPlato.precio <= 0"
            >
              ➕ Guardar Plato
            </button>
          </div>
        </div>
      </div>

      <!-- Filtro rápido por categorías -->
      <div class="categorias-pills" v-if="categoriasUnicas.length > 0">
        <span 
          :class="['pill', categoriaFiltro === '' ? 'active' : '']"
          @click="categoriaFiltro = ''"
        >
          Todas ({{ platos.length }})
        </span>
        <span 
          v-for="cat in categoriasUnicas" 
          :key="cat"
          :class="['pill', categoriaFiltro === cat ? 'active' : '']"
          @click="categoriaFiltro = cat"
        >
          {{ cat }}
        </span>
      </div>

      <!-- Listado de platos -->
      <div v-if="cargandoPlatos" class="text-muted" style="padding: 1rem 0;">Cargando platos...</div>
      <div v-else-if="platosFiltrados.length === 0" class="empty-state">
        No hay platos registrados en esta categoría. Agrega tu primer plato con el formulario superior.
      </div>
      <div v-else class="platos-grid">
        <div v-for="plato in platosFiltrados" :key="plato.id" class="plato-card">
          <div class="plato-info">
            <span class="plato-cat">{{ plato.categoria }}</span>
            <span class="plato-nombre">{{ plato.nombre }}</span>
            <span class="plato-precio">${{ Number(plato.precio).toFixed(2) }}</span>
          </div>
          <div class="plato-actions">
            <button
              class="btn-recipe"
              :class="{ 'has-recipe': plato.ingredients_count > 0 }"
              @click="openRecipe(plato)"
              :title="plato.ingredients_count > 0 ? `Receta con ${plato.ingredients_count} ingrediente(s)` : 'Definir receta (descuento automático de inventario)'"
            >
              🧾 {{ plato.ingredients_count > 0 ? plato.ingredients_count : 'Receta' }}
            </button>
            <button class="btn-delete" @click="eliminarPlato(plato.id)" title="Eliminar plato">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: MODALIDAD DE COBRO -->
    <div v-if="tabActiva === 'cobro'">
      <h3>Modalidad Operativa y de Cobro</h3>
      <p class="text-muted" style="margin-bottom: 2rem;">
        Define cómo opera el flujo de venta y atención en tu restaurante o negocio gastronómico.
      </p>

      <div class="modalidades-grid">
        <!-- Tarjeta Post-pago -->
        <div 
          :class="['modalidad-card', modalidadCobro === 'post_pago' ? 'active' : '']"
          @click="modalidadCobro = 'post_pago'"
        >
          <div class="modalidad-header">
            <span class="modalidad-icon">🍽️</span>
            <div class="modalidad-titles">
              <h4>Post-pago (Servicio tradicional)</h4>
              <span class="badge-modalidad">Cobro al finalizar</span>
            </div>
          </div>
          <p class="modalidad-desc">
            El cliente se sienta a la mesa, el mesero toma la orden y se envía a cocina. La cuenta se cobra y libera la mesa cuando el cliente termina de comer y pide la cuenta.
          </p>
          <div class="modalidad-footer">
            <span class="badge-recomendado">Ideal para restaurantes con meseros, cevicherías y asaderos.</span>
          </div>
        </div>

        <!-- Tarjeta Pre-pago -->
        <div 
          :class="['modalidad-card', modalidadCobro === 'pre_pago' ? 'active' : '']"
          @click="modalidadCobro = 'pre_pago'"
        >
          <div class="modalidad-header">
            <span class="modalidad-icon">⚡</span>
            <div class="modalidad-titles">
              <h4>Pre-pago (Cobro inmediato)</h4>
              <span class="badge-modalidad prepago">Fast-Food & Cafeterías</span>
            </div>
          </div>
          <p class="modalidad-desc">
            El cliente pide y paga de inmediato en el momento de la orden. La comanda viaja automáticamente a cocina ya pagada al 100% y la mesa se libera.
          </p>
          <div class="modalidad-footer">
            <span class="badge-recomendado">Ideal para cafeterías, heladerías, comida rápida y barras.</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <button 
          class="btn btn-primary" 
          @click="guardarModalidadCobro"
          :disabled="guardandoCobro"
        >
          {{ guardandoCobro ? 'Guardando...' : '💾 Guardar Configuración de Cobro' }}
        </button>
      </div>
    </div>

    <!-- MODAL: RECETA (ESCANDALLO) -->
    <div v-if="recipeDish" class="recipe-overlay" @mousedown.self="closeRecipe">
      <div class="recipe-modal">
        <div class="recipe-header">
          <div>
            <h3 style="margin:0;">🧾 Receta: {{ recipeDish.nombre }}</h3>
            <span class="text-muted">Insumos del inventario que se descuentan automáticamente por cada unidad vendida.</span>
          </div>
          <button class="btn-delete" @click="closeRecipe" title="Cerrar">✕</button>
        </div>

        <div class="recipe-search">
          <input
            type="text"
            v-model="productSearch"
            class="input"
            placeholder="🔍 Buscar insumo del inventario por nombre o código..."
          />
          <div v-if="productSearch.trim() && productSuggestions.length" class="recipe-suggestions">
            <div
              v-for="p in productSuggestions"
              :key="p.id"
              class="recipe-suggestion"
              @click="addIngredient(p)"
            >
              <span><strong>{{ p.name }}</strong> <small class="text-muted">{{ p.code }}</small></span>
              <small class="text-muted">Stock: {{ p.current_stock }} {{ p.unit }}</small>
            </div>
          </div>
          <div v-else-if="productSearch.trim()" class="text-muted" style="padding:0.5rem 0;">
            No se encontraron productos en el inventario.
          </div>
        </div>

        <div v-if="loadingRecipe" class="text-muted" style="padding:1rem 0;">Cargando receta...</div>
        <div v-else-if="recipeIngredients.length === 0" class="empty-state" style="margin:1rem 0;">
          Este plato aún no tiene receta. Busca un insumo arriba para agregarlo.
        </div>
        <table v-else class="recipe-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th style="width:130px;">Cantidad</th>
              <th style="width:90px;">Costo U.</th>
              <th style="width:90px;">Subtotal</th>
              <th style="width:40px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ing, idx) in recipeIngredients" :key="ing.product_id">
              <td>
                <strong>{{ ing.product_name }}</strong>
                <small class="text-muted" style="display:block;">Stock: {{ ing.current_stock }} {{ ing.unit }}</small>
              </td>
              <td>
                <div style="display:flex; align-items:center; gap:0.35rem;">
                  <input type="number" min="0" step="0.0001" v-model.number="ing.quantity" class="input input-sm" />
                  <small class="text-muted">{{ ing.unit }}</small>
                </div>
              </td>
              <td>${{ Number(ing.unit_cost).toFixed(2) }}</td>
              <td>${{ (Number(ing.unit_cost) * Number(ing.quantity || 0)).toFixed(2) }}</td>
              <td><button class="btn-delete" @click="removeIngredient(idx)" title="Quitar insumo">🗑️</button></td>
            </tr>
          </tbody>
        </table>

        <div class="recipe-summary">
          <div>
            <span class="text-muted">Costo de la receta</span>
            <strong>${{ recipeTotalCost.toFixed(2) }}</strong>
          </div>
          <div>
            <span class="text-muted">Precio de venta</span>
            <strong>${{ Number(recipeDish.precio).toFixed(2) }}</strong>
          </div>
          <div>
            <span class="text-muted">Margen</span>
            <strong :style="{ color: recipeMargin >= 0 ? '#28a745' : '#dc3545' }">{{ recipeMargin.toFixed(1) }}%</strong>
          </div>
        </div>

        <div class="recipe-footer">
          <button class="btn btn-secondary" @click="closeRecipe">Cancelar</button>
          <button class="btn btn-primary" @click="saveRecipe" :disabled="savingRecipe">
            {{ savingRecipe ? 'Guardando...' : '💾 Guardar Receta' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../../shared/api';
import { useAlert } from '../../../composables/useAlert';

const { showAlert, showToast } = useAlert();

const tabActiva = ref('salones');

// Salones & Mesas
const zonas = ref([]);
const nuevaZona = ref('');

// Menú & Platos
const platos = ref([]);
const cargandoPlatos = ref(false);
const categoriaFiltro = ref('');
const nuevoPlato = ref({
  categoria: 'Platos Fuertes',
  nombre: '',
  precio: ''
});

const categoriasUnicas = computed(() => {
  const cats = platos.value.map(p => p.categoria?.trim() || 'General');
  return [...new Set(cats)];
});

const platosFiltrados = computed(() => {
  if (!categoriaFiltro.value) return platos.value;
  return platos.value.filter(p => (p.categoria?.trim() || 'General') === categoriaFiltro.value);
});

// ZONAS Y MESAS METHODS
const cargarZonas = async () => {
  try {
    const { data } = await api.get('restaurantes/zonas/');
    zonas.value = data.map(z => ({ ...z, nuevaMesa: '', nuevosAsientos: 4 }));
  } catch (error) {
    console.error('Error cargando zonas:', error);
  }
};

const crearZona = async () => {
  if (!nuevaZona.value.trim()) return;
  try {
    await api.post('restaurantes/zonas/', { nombre: nuevaZona.value.trim() });
    showToast(`Zona "${nuevaZona.value.trim()}" creada con éxito`, 'success');
    nuevaZona.value = '';
    await cargarZonas();
  } catch (error) {
    showAlert({
      type: 'error',
      title: 'Error',
      message: 'No se pudo crear la zona.'
    });
  }
};

const crearMesa = async (zona) => {
  if (!zona.nuevaMesa?.trim()) return;
  try {
    await api.post('restaurantes/mesas/', {
      zona_id: zona.id,
      nombre: zona.nuevaMesa.trim(),
      asientos: parseInt(zona.nuevosAsientos) || 4
    });
    showToast(`Mesa "${zona.nuevaMesa.trim()}" agregada`, 'success');
    await cargarZonas();
  } catch (error) {
    showAlert({
      type: 'error',
      title: 'Error',
      message: 'No se pudo crear la mesa.'
    });
  }
};

// PLATOS METHODS
const cargarPlatos = async () => {
  cargandoPlatos.value = true;
  try {
    const { data } = await api.get('restaurantes/platos/');
    platos.value = data;
  } catch (error) {
    console.error('Error cargando platos:', error);
  } finally {
    cargandoPlatos.value = false;
  }
};

const crearPlato = async () => {
  if (!nuevoPlato.value.nombre.trim() || nuevoPlato.value.precio <= 0) return;
  try {
    await api.post('restaurantes/platos/', {
      categoria: nuevoPlato.value.categoria.trim() || 'General',
      nombre: nuevoPlato.value.nombre.trim(),
      precio: parseFloat(nuevoPlato.value.precio)
    });
    showToast(`Plato "${nuevoPlato.value.nombre.trim()}" guardado en el menú`, 'success');
    nuevoPlato.value.nombre = '';
    nuevoPlato.value.precio = '';
    await cargarPlatos();
  } catch (error) {
    console.error('Error al guardar plato:', error);
    showAlert({
      type: 'error',
      title: 'Error al Guardar',
      message: error.response?.data?.error || 'No se pudo guardar el plato en el menú.'
    });
  }
};

const eliminarPlato = async (id) => {
  const confirmado = await showAlert({
    type: 'confirm',
    title: '¿Eliminar plato?',
    message: '¿Estás seguro de que deseas eliminar este plato de la carta?'
  });
  if (!confirmado) return;

  try {
    await api.delete(`restaurantes/platos/${id}/`);
    showToast('Plato eliminado de la carta', 'success');
    await cargarPlatos();
  } catch (error) {
    showAlert({
      type: 'error',
      title: 'Error al eliminar',
      message: 'No se pudo eliminar el plato.'
    });
  }
};

// RECIPE (ESCANDALLO) METHODS
const recipeDish = ref(null);
const recipeIngredients = ref([]);
const loadingRecipe = ref(false);
const savingRecipe = ref(false);
const inventoryProducts = ref([]);
const productSearch = ref('');

const productSuggestions = computed(() => {
  const term = productSearch.value.trim().toLowerCase();
  if (!term) return [];
  const used = new Set(recipeIngredients.value.map(i => i.product_id));
  return inventoryProducts.value
    .filter(p => !used.has(p.id) && (
      (p.name || '').toLowerCase().includes(term) || (p.code || '').toLowerCase().includes(term)
    ))
    .slice(0, 8);
});

const recipeTotalCost = computed(() =>
  recipeIngredients.value.reduce((acc, i) => acc + Number(i.unit_cost || 0) * Number(i.quantity || 0), 0)
);

const recipeMargin = computed(() => {
  const price = Number(recipeDish.value?.precio || 0);
  if (price <= 0) return 0;
  return ((price - recipeTotalCost.value) / price) * 100;
});

const openRecipe = async (dish) => {
  recipeDish.value = dish;
  recipeIngredients.value = [];
  productSearch.value = '';
  loadingRecipe.value = true;
  try {
    const [recipeRes, productsRes] = await Promise.all([
      api.get(`restaurantes/platos/${dish.id}/recipe/`),
      inventoryProducts.value.length ? Promise.resolve({ data: inventoryProducts.value }) : api.get('/inventario/products/')
    ]);
    recipeIngredients.value = recipeRes.data.ingredients;
    inventoryProducts.value = productsRes.data;
  } catch (error) {
    console.error('Error loading recipe:', error);
    showAlert({
      type: 'error',
      title: 'Error',
      message: error.response?.data?.error || 'No se pudo cargar la receta del plato.'
    });
    recipeDish.value = null;
  } finally {
    loadingRecipe.value = false;
  }
};

const closeRecipe = () => {
  recipeDish.value = null;
  recipeIngredients.value = [];
  productSearch.value = '';
};

const addIngredient = (product) => {
  recipeIngredients.value.push({
    product_id: product.id,
    product_name: product.name,
    product_code: product.code,
    unit: product.unit,
    quantity: 1,
    unit_cost: Number(product.purchase_price || 0),
    current_stock: Number(product.current_stock || 0)
  });
  productSearch.value = '';
};

const removeIngredient = (index) => {
  recipeIngredients.value.splice(index, 1);
};

const saveRecipe = async () => {
  if (recipeIngredients.value.some(i => !(Number(i.quantity) > 0))) {
    showAlert({
      type: 'warning',
      title: 'Cantidad inválida',
      message: 'Todas las cantidades de la receta deben ser mayores a cero.'
    });
    return;
  }
  savingRecipe.value = true;
  try {
    await api.put(`restaurantes/platos/${recipeDish.value.id}/recipe/`, {
      ingredients: recipeIngredients.value.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
    });
    showToast(`Receta de "${recipeDish.value.nombre}" guardada`, 'success');
    closeRecipe();
    await cargarPlatos();
  } catch (error) {
    showAlert({
      type: 'error',
      title: 'Error al guardar',
      message: error.response?.data?.error || 'No se pudo guardar la receta.'
    });
  } finally {
    savingRecipe.value = false;
  }
};

// MODALIDAD DE COBRO METHODS
const modalidadCobro = ref('post_pago');
const guardandoCobro = ref(false);

const cargarModalidadCobro = async () => {
  try {
    const { data } = await api.get('/parametros/restaurantes/');
    if (data && data.modalidad_cobro) {
      modalidadCobro.value = data.modalidad_cobro.value || 'post_pago';
    }
  } catch (error) {
    console.error('Error cargando modalidad de cobro:', error);
  }
};

const guardarModalidadCobro = async () => {
  guardandoCobro.value = true;
  try {
    await api.post('/parametros/restaurantes/', {
      modalidad_cobro: modalidadCobro.value
    });
    showToast('Modalidad de cobro guardada correctamente', 'success');
  } catch (error) {
    console.error('Error guardando modalidad de cobro:', error);
    showAlert({
      type: 'error',
      title: 'Error',
      message: error.response?.data?.error || 'No se pudo guardar la configuración.'
    });
  } finally {
    guardandoCobro.value = false;
  }
};

onMounted(() => {
  cargarZonas();
  cargarPlatos();
  cargarModalidadCobro();
});
</script>

<style scoped>
.restaurante-config {
  padding: 0.5rem;
}
.sub-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}
.sub-tab {
  background: transparent;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s;
}
.sub-tab.active {
  background: #007bff;
  color: white;
}
.text-muted {
  color: #6c757d;
  font-size: 0.9rem;
}
.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 100%;
}
.input-sm {
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
}
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}
.btn-primary {
  background-color: #007bff;
  color: white;
}
.btn-secondary {
  background-color: #495057;
  color: white;
}
.zona-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  background: #f8f9fa;
}
.zona-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
.zona-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #212529;
}
.badge {
  background: #e2e3e5;
  color: #383d41;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}
.mesas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.mesa-item {
  background: white;
  border: 1px solid #ced4da;
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #333;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.add-mesa-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.empty-state {
  text-align: center;
  padding: 2.5rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ced4da;
  margin-bottom: 1.5rem;
}

/* Platos styles */
.card-form {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}
.card-form h4 {
  margin: 0 0 1rem 0;
  color: #333;
}
.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 150px;
}
.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
}
.categorias-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.pill {
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  background: #e9ecef;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.pill.active {
  background: #28a745;
  color: white;
  font-weight: 600;
}
.platos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
.plato-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.plato-info {
  display: flex;
  flex-direction: column;
}
.plato-cat {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: bold;
}
.plato-nombre {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
}
.plato-precio {
  font-size: 1.1rem;
  color: #28a745;
  font-weight: bold;
}
.btn-delete {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
.btn-delete:hover {
  background: #ffe3e3;
}

/* Modalidad de Cobro styles */
.modalidades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}
.modalidad-card {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.modalidad-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.1);
  transform: translateY(-2px);
}
.modalidad-card.active {
  border-color: #007bff;
  background: #f8fbff;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.15);
}
.modalidad-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.modalidad-icon {
  font-size: 2.2rem;
}
.modalidad-titles h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #212529;
}
.badge-modalidad {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  background: #e9ecef;
  color: #495057;
  border-radius: 12px;
  font-weight: 600;
}
.badge-modalidad.prepago {
  background: #e3f2fd;
  color: #0d47a1;
}
.modalidad-desc {
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}
.modalidad-footer {
  border-top: 1px dashed #e9ecef;
  padding-top: 0.75rem;
}
.badge-recomendado {
  font-size: 0.8rem;
  color: #28a745;
  font-weight: 600;
}

/* Recipe (escandallo) styles */
.plato-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.btn-recipe {
  background: #f1f3f5;
  border: 1px solid #ced4da;
  border-radius: 14px;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  color: #495057;
  white-space: nowrap;
}
.btn-recipe:hover {
  background: #e7f1ff;
  border-color: #007bff;
}
.btn-recipe.has-recipe {
  background: #e6f6ea;
  border-color: #28a745;
  color: #1e7e34;
}
.recipe-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
}
.recipe-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}
.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.recipe-search {
  position: relative;
}
.recipe-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  z-index: 5;
  max-height: 260px;
  overflow-y: auto;
}
.recipe-suggestion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
}
.recipe-suggestion:hover {
  background: #f1f8ff;
}
.recipe-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
.recipe-table th {
  text-align: left;
  font-size: 0.78rem;
  color: #6c757d;
  padding: 0.4rem 0.5rem;
  border-bottom: 2px solid #e9ecef;
}
.recipe-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #f1f3f5;
  font-size: 0.9rem;
}
.recipe-summary {
  display: flex;
  gap: 2rem;
  margin: 1.25rem 0;
  padding: 0.85rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}
.recipe-summary div {
  display: flex;
  flex-direction: column;
}
.recipe-summary strong {
  font-size: 1.1rem;
}
.recipe-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
