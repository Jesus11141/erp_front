<template>
  <div class="modulo-container">
    <div class="header-actions">
      <h2>Roles y Permisos Dinámicos</h2>
      <button class="btn btn-primary" @click="abrirCrearModal">
        ➕ Crear Nuevo Rol
      </button>
    </div>

    <div class="card" style="padding: 1.5rem;">
      <div v-if="loading" style="text-align:center;">
        Cargando roles...
      </div>
      <div v-else-if="roles.length === 0" style="text-align:center; color: var(--text-muted);">
        No has creado roles personalizados. Empieza creando uno.
      </div>
      <div v-else class="table-container">
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border);">Nombre del Rol</th>
              <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border);">Permisos Asignados</th>
              <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid var(--border);">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rol in roles" :key="rol.id" style="border-bottom: 1px solid var(--border);">
              <td style="padding: 0.75rem; font-weight: bold; width: 25%;">
                {{ rol.name }}
              </td>
              <td style="padding: 0.75rem;">
                <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                  <span v-for="p in rol.permissions" :key="p" class="badge">
                    {{ p }}
                  </span>
                </div>
              </td>
              <td style="padding: 0.75rem; text-align: right; width: 15%;">
                <button class="btn btn-sm btn-outline" @click="abrirEditarModal(rol)">⚙️ Editar</button>
                <button class="btn btn-sm btn-outline" @click="eliminarRol(rol)" style="color: #e74c3c; border-color: #e74c3c; margin-left: 0.5rem;">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom: 1.5rem;">{{ form.id ? 'Editar Rol' : 'Crear Rol Personalizado' }}</h3>
        
        <div class="form-group">
          <label>Nombre del Rol</label>
          <input v-model="form.name" type="text" class="input" placeholder="Ej: Cajero Fin de Semana" />
        </div>

        <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Asignar Permisos</h4>
        <!-- Lista de Permisos Dinámicos -->
        <div style="grid-column: 1 / -1; background: var(--bg-secundario); padding: 1rem; border-radius: 8px;">
          <PermissionsSelector v-model="form.permissions" :modulos="tenantStore.modulos" />
        </div>
        <div style="display:flex; justify-content:flex-end; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-outline" @click="mostrarModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarRol">Guardar Rol</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/shared/api'
import { useToast } from 'vue-toastification'
import PermissionsSelector from '@/components/PermissionsSelector.vue'
import { useTenantStore } from '@/stores/tenant'

const toast = useToast()
const tenantStore = useTenantStore()
const roles = ref([])
const loading = ref(true)

const mostrarModal = ref(false)
const form = ref({ id: null, name: '', permissions: [] })

const fetchRoles = async () => {
  try {
    const { data } = await api.get('/auth/roles/')
    roles.value = data
  } catch (error) {
    console.error('Error fetching roles', error)
  } finally {
    loading.value = false
  }
}

const abrirCrearModal = () => {
  form.value = { id: null, name: '', permissions: [] }
  mostrarModal.value = true
}

const abrirEditarModal = (rol) => {
  form.value = { id: rol.id, name: rol.name, permissions: [...rol.permissions] }
  mostrarModal.value = true
}

const guardarRol = async () => {
  if (!form.value.name) {
    toast.error('El nombre del rol es obligatorio')
    return
  }
  
  try {
    if (form.value.id) {
      await api.put(`/auth/roles/${form.value.id}/`, form.value)
      toast.success('Rol actualizado con éxito')
    } else {
      await api.post('/auth/roles/', form.value)
      toast.success('Rol creado con éxito')
    }
    mostrarModal.value = false
    fetchRoles()
  } catch (error) {
    console.error('Error saving role', error)
    toast.error('Error al guardar el rol')
  }
}

const eliminarRol = async (rol) => {
  if (confirm(`¿Estás seguro de eliminar el rol "${rol.name}"? Los usuarios que lo tengan asignado perderán los accesos.`)) {
    try {
      await api.delete(`/auth/roles/${rol.id}/`)
      toast.success('Rol eliminado')
      fetchRoles()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Error al eliminar el rol')
    }
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.badge {
  background: rgba(52, 152, 219, 0.1);
  color: #2980b9;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-family: monospace;
}
.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}
.checkbox-container input {
  cursor: pointer;
}
</style>
