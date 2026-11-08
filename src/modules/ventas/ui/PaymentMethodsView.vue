<template>
  <div>
    <div class="page-header">
      <h1 class="page-title" style="margin:0">Métodos de Pago</h1>
      <button class="btn btn-primary" @click="abrirCrear">+ Nuevo Método</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código SRI (Facturación)</th>
            <th>Activo</th>
            <th>Requiere Referencia (Banco, Cheque)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in metodos" :key="m.id">
            <td><strong>{{ m.name }}</strong></td>
            <td>
              <span class="sri-badge">
                <i class="fa-solid fa-file-invoice" style="margin-right: 4px;"></i>
                {{ formatSri(m.sri_code || inferSriCode(m.name)) }}
              </span>
            </td>
            <td>
              <span :style="{ color: m.active ? '#2ecc71' : '#e74c3c', fontWeight: '600' }">
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
            <td colspan="5" style="text-align:center; color:var(--text-muted)">Sin métodos de pago configurados.</td>
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
            <input v-model="form.name" class="input" placeholder="Nombre..." @input="onNameInput" />
          </div>

          <div class="form-group">
            <label>Código SRI para Facturación Electrónica *</label>
            <select v-model="form.sri_code" class="input">
              <option value="01">01 - Sin utilización del sistema financiero (Efectivo)</option>
              <option value="20">20 - Otros con utilización del sistema financiero (Transferencia / Depósito / Cheque)</option>
              <option value="16">16 - Tarjeta de Débito</option>
              <option value="19">19 - Tarjeta de Crédito</option>
              <option value="15">15 - Compensación de deudas</option>
              <option value="17">17 - Dinero electrónico</option>
              <option value="18">18 - Tarjeta prepago</option>
              <option value="21">21 - Endoso de títulos</option>
            </select>
            <small style="color:#64748b; font-size:0.75rem; margin-top:2px; display:block;">
              Este código se utilizará al generar facturas electrónicas para el SRI.
            </small>
          </div>

          <div style="display:flex; gap:1rem;">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="checkbox" v-model="form.active" /> Activo
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;" title="Pedir número de comprobante al momento de pagar">
              <input type="checkbox" v-model="form.requires_reference" /> Requiere Referencia (Banco / Cheque)
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
const usuarioCambioSri = ref(false);

const form = ref<PaymentMethod>({
  name: '',
  active: true,
  requires_reference: false,
  sri_code: '01'
});

function inferSriCode(name: string): string {
  if (!name) return '01';
  const n = name.toLowerCase();
  if (n.includes('efectivo') || n.includes('cash')) return '01';
  if (n.includes('débito') || n.includes('debito')) return '16';
  if (n.includes('crédito') || n.includes('credito') || n.includes('tarjeta') || n.includes('card')) return '19';
  if (n.includes('transfer') || n.includes('banco') || n.includes('depósito') || n.includes('deposito') || n.includes('cheque') || n.includes('pichincha') || n.includes('guayaquil') || n.includes('produbanco') || n.includes('pacifico') || n.includes('deuna') || n.includes('de una')) return '20';
  if (n.includes('compensaci')) return '15';
  if (n.includes('dinero elect')) return '17';
  if (n.includes('prepago')) return '18';
  if (n.includes('endoso')) return '21';
  return '20';
}

function formatSri(code: string | undefined): string {
  const c = code || '01';
  const map: Record<string, string> = {
    '01': '01 - Efectivo',
    '16': '16 - Tarjeta Débito',
    '19': '19 - Tarjeta Crédito',
    '20': '20 - Transferencia / Bancos',
    '15': '15 - Compensación',
    '17': '17 - Dinero Elect.',
    '18': '18 - Prepago',
    '21': '21 - Endoso'
  };
  return map[c] || `Código ${c}`;
}

function onNameInput() {
  if (!modoEditar.value && !usuarioCambioSri.value) {
    form.value.sri_code = inferSriCode(form.value.name);
  }
}

async function cargar() {
  try {
    metodos.value = await repo.findAll(true);
  } catch (e: any) {
    console.error(e);
  }
}

function abrirCrear() {
  usuarioCambioSri.value = false;
  form.value = { name: '', active: true, requires_reference: false, sri_code: '01' };
  error.value = '';
  modoEditar.value = false;
  mostrarForm.value = true;
}

function abrirEditar(m: PaymentMethod) {
  usuarioCambioSri.value = true;
  form.value = { 
    ...m, 
    sri_code: m.sri_code || inferSriCode(m.name) 
  };
  error.value = '';
  modoEditar.value = true;
  mostrarForm.value = true;
}

async function guardar() {
  if (!form.value.name) {
    error.value = 'El nombre es requerido';
    return;
  }
  if (!form.value.sri_code) {
    form.value.sri_code = inferSriCode(form.value.name);
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

<style scoped>
.sri-badge {
  display: inline-flex;
  align-items: center;
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
