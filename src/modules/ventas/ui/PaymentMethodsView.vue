<template>
  <div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 class="page-title" style="margin:0">Métodos de Pago</h1>
      <button class="btn btn-primary" @click="abrirCrear">+ Nuevo Método</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Activo</th>
            <th>Requiere Referencia (Banco, Cheque)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in metodos" :key="m.id">
            <td>{{ m.name }}</td>
            <td>
              <span :style="{ color: m.active ? '#2ecc71' : '#e74c3c' }">
                {{ m.active ? 'Sí' : 'No' }}
              </span>
            </td>
            <td>{{ m.requires_reference ? 'Sí' : 'No' }}</td>
            <td>
              <div style="display:flex; gap:0.25rem;">
                <button class="btn btn-sm btn-outline" @click="abrirEditar(m)">⚙️ Editar</button>
                <button class="btn btn-sm btn-outline" style="color:#e74c3c; border-color:#e74c3c;" @click="eliminar(m)">🗑️ Eliminar</button>
              </div>
            </td>
          </tr>
          <tr v-if="!metodos.length">
            <td colspan="4" style="text-align:center; color:var(--text-muted)">Sin métodos de pago configurados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarForm" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1rem">{{ modoEditar ? 'Editar Método de Pago' : 'Nuevo Método de Pago' }}</h3>
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div class="form-group">
            <label>Nombre del Método * (Ej: Transferencia Banco Pichincha)</label>
            <input v-model="form.name" class="input" placeholder="Nombre..." />
          </div>
          <div style="display:flex; gap:1rem;">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="checkbox" v-model="form.active" /> Activo
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;" title="Pedir número de comprobante al momento de pagar">
              <input type="checkbox" v-model="form.requires_reference" /> Requiere Referencia
            </label>
          </div>
        </div>
        <p v-if="error" style="color:#e74c3c; font-size:0.85rem; margin-top:0.5rem">{{ error }}</p>
        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.5rem">
          <button class="btn btn-outline" @click="mostrarForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardar">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PaymentMethod } from '../domain/PaymentMethod';
import { ApiPaymentMethodRepository } from '../infrastructure/ApiPaymentMethodRepository';

const repo = new ApiPaymentMethodRepository();
const metodos = ref<PaymentMethod[]>([]);
const mostrarForm = ref(false);
const modoEditar = ref(false);
const error = ref('');

const form = ref<PaymentMethod>({
  name: '',
  active: true,
  requires_reference: false
});

async function cargar() {
  try {
    metodos.value = await repo.findAll(true);
  } catch (e: any) {
    console.error(e);
  }
}

function abrirCrear() {
  form.value = { name: '', active: true, requires_reference: false };
  error.value = '';
  modoEditar.value = false;
  mostrarForm.value = true;
}

function abrirEditar(m: PaymentMethod) {
  form.value = { ...m };
  error.value = '';
  modoEditar.value = true;
  mostrarForm.value = true;
}

async function guardar() {
  if (!form.value.name) {
    error.value = 'El nombre es requerido';
    return;
  }
  error.value = '';
  try {
    if (modoEditar.value && form.value.id) {
      await repo.update(form.value.id, form.value);
    } else {
      await repo.save(form.value);
    }
    mostrarForm.value = false;
    await cargar();
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Error al guardar';
  }
}

async function eliminar(m: PaymentMethod) {
  if (confirm(`¿Eliminar el método de pago "${m.name}"?`)) {
    try {
      await repo.delete(m.id!);
      await cargar();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar');
    }
  }
}

onMounted(cargar);
</script>
