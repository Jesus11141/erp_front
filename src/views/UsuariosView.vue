<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-header">
          <div>
          <h1 class="page-title" style="margin:0;">👥 Gestión de Usuarios</h1>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-top:0.25rem;">
            Administra las accounts de tus trabajadores, asigna sus roles y gestiona sus accesos.
          </p>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" @click="abrirCrearModal">
        ➕ Nuevo Usuario
      </button>
    </div>

    <!-- BÚSQUEDA Y FILTROS -->
    <div class="card" style="margin-bottom:1.5rem; padding:1rem;">
      <div style="display:flex; gap:1rem; align-items:center;">
        <div style="flex:1; position:relative;">
          <input
            v-model="busqueda"
            type="text"
            class="input"
            placeholder="🔍 Buscar por name o correo electrónico..."
            style="padding-left:2.5rem;"
          />
        </div>
        <select v-model="filtroRol" class="input" style="max-width:180px;">
          <option value="">Todos los roles</option>
          <option v-for="r in rolesDisponibles" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <select v-model="filtroEstado" class="input" style="max-width:180px;">
          <option value="">Todos los estados</option>
          <option value="is_active">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>
    </div>

    <!-- SPINNER MIENTRAS CARGA -->
    <div v-if="cargando" style="text-align:center; padding:3rem; color:var(--text-muted);">
      <div style="font-size:2rem; margin-bottom:0.5rem; animation: spin 1s linear infinite;">⏳</div>
      Cargando usuarios...
    </div>

    <!-- LISTADO DE USUARIOS -->
    <div v-else class="card" style="overflow-x:auto;">
      <table class="table" style="width:100%; border-collapse:collapse; text-align:left;">
        <thead>
          <tr style="border-bottom:2px solid var(--border);">
            <th style="padding:1rem;">Nombre</th>
            <th style="padding:1rem;">Correo Electrónico</th>
            <th style="padding:1rem;">Rol</th>
            <th style="padding:1rem;">Estado</th>
            <th style="padding:1rem; text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuariosFiltrados" :key="u.id" style="border-bottom:1px solid var(--border); transition:background 0.2s;" @mouseover="$event.currentTarget.style.background='rgba(0,0,0,0.01)'" @mouseleave="$event.currentTarget.style.background=''">
            <td style="padding:1rem; font-weight:600;">{{ u.name }}</td>
            <td style="padding:1rem; color:var(--text-muted);">{{ u.email }}</td>
            <td style="padding:1rem;">
              <span class="badge badge-primary">
                {{ getRolName(u.custom_role_id) || 'Rol Personalizado' }}
              </span>
            </td>
            <td style="padding:1rem;">
              <span v-if="u.is_active" class="badge badge-success">Activo</span>
              <span v-else class="badge badge-danger">Inactivo</span>
            </td>
            <td style="padding:1rem; text-align:right;">
              <div style="display:inline-flex; gap:0.5rem; justify-content:flex-end;">
                <button class="btn btn-sm btn-outline" @click="abrirEditarModal(u)" title="Editar usuario">
                  ⚙️ Editar
                </button>
                <button class="btn btn-sm btn-outline" @click="abrirPasswordModal(u)" title="Cambiar contraseña">
                  🔑 Contraseña
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!usuariosFiltrados.length">
            <td colspan="5" style="text-align:center; padding:3rem; color:var(--text-muted);">
              No se encontraron usuarios registrados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL: CREAR USUARIO -->
    <div v-if="mostrarCrearModal" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1.25rem;">➕ Registrar Nuevo Usuario</h3>
        <form @submit.prevent="crearUsuario">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input v-model="formCrear.name" type="text" class="input" placeholder="Ej: Juan Pérez" required />
          </div>
          <div class="form-group">
            <label>Correo Electrónico *</label>
            <input v-model="formCrear.email" type="email" class="input" placeholder="Ej: juan.perez@company.com" required />
          </div>
          <div class="form-group">
            <label>Contraseña Inicial *</label>
            <input v-model="formCrear.password" type="password" class="input" placeholder="Mínimo 6 caracteres" autocomplete="new-password" required />
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Rol Base (Opcional)</label>
            <select v-model="formCrear.custom_role_id" class="input">
              <option :value="null">-- Ninguno (Permisos manuales) --</option>
              <option v-for="rol in rolesDisponibles" :key="rol.id" :value="rol.id">
                {{ rol.name }}
              </option>
            </select>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              Asignar un rol base aplicará automáticamente sus permisos.
            </p>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Accesos Permitidos *</label>
            <PermissionsSelector v-model="formCrear.permissions" :modulos="modulosContratados" />
          </div>
          <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.5rem;">
            <button type="button" class="btn btn-outline" @click="mostrarCrearModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Crear Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: EDITAR USUARIO -->
    <div v-if="mostrarEditarModal" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1.25rem;">⚙️ Editar Usuario</h3>
        <form @submit.prevent="guardarEdicion">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input v-model="formEditar.name" type="text" class="input" required />
          </div>
          <div class="form-group">
            <label>Correo Electrónico *</label>
            <input v-model="formEditar.email" type="email" class="input" required />
          </div>
          <div class="form-group">
            <label>Cambiar Contraseña (Dejar en blanco para conservar la actual)</label>
            <input v-model="formEditar.password" type="password" class="input" placeholder="Nueva contraseña (mínimo 6 caracteres)" autocomplete="new-password" />
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Rol Base (Opcional)</label>
            <select v-model="formEditar.custom_role_id" class="input">
              <option :value="null">-- Ninguno (Permisos manuales) --</option>
              <option v-for="rol in rolesDisponibles" :key="rol.id" :value="rol.id">
                {{ rol.name }}
              </option>
            </select>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              Asignar un rol base aplicará automáticamente sus permisos.
            </p>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Accesos Permitidos *</label>
            <PermissionsSelector v-model="formEditar.permissions" :modulos="modulosContratados" />
          </div>
          <div class="form-group" style="margin-top:1rem;">
            <label class="toggle" style="display:inline-flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="checkbox" v-model="formEditar.is_active" />
              <span class="toggle-slider"></span>
              <span style="font-weight:600;">Cuenta de usuario activa</span>
            </label>
            <p style="color:var(--text-muted); font-size:0.8rem; margin-top:0.25rem; margin-left:2.5rem;">
              Si se desactiva, el usuario no podrá iniciar sesión en el sistema.
            </p>
          </div>
          <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.5rem;">
            <button type="button" class="btn btn-outline" @click="mostrarEditarModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CAMBIAR CONTRASEÑA -->
    <div v-if="mostrarPasswordModal" class="modal-overlay">
      <div class="modal">
        <h3 style="margin-bottom:1.25rem;">🔑 Restablecer Contraseña</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          Establece una nueva contraseña de acceso para <strong>{{ usuarioSeleccionado?.name }}</strong>.
        </p>
        <form @submit.prevent="cambiarPassword">
          <div class="form-group">
            <label>Nueva Contraseña *</label>
            <input v-model="nuevaPassword" type="password" class="input" placeholder="Mínimo 6 caracteres" autocomplete="new-password" required />
          </div>
          <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.5rem;">
            <button type="button" class="btn btn-outline" @click="mostrarPasswordModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="guardando">
              {{ guardando ? 'Actualizando...' : 'Restablecer Contraseña' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../shared/api'
import { useAlert } from '../composables/useAlert'
import { useAuthStore } from '../stores/auth'
import { useTenantStore } from '../stores/tenant'
import PermissionsSelector from '../components/PermissionsSelector.vue'

const { showAlert } = useAlert()
const authStore = useAuthStore()
const tenantStore = useTenantStore()

const usuarios = ref([])
const modulosContratados = computed(() => {
  return tenantStore.tenant?.modules || []
})

const rolesDisponibles = ref([])
const cargando = ref(false)
const guardando = ref(false)

const busqueda = ref('')
const filtroRol = ref('')
const filtroEstado = ref('')

const mostrarCrearModal = ref(false)
const mostrarEditarModal = ref(false)
const mostrarPasswordModal = ref(false)

const usuarioSeleccionado = ref(null)
const nuevaPassword = ref('')

const formCrear = ref({ name: '', email: '', password: '', role: 'custom', custom_role_id: null, permissions: [] })
const formEditar = ref({ id: null, name: '', email: '', password: '', is_active: true, role: 'custom', custom_role_id: null, permissions: [] })

const usuariosFiltrados = computed(() => {
  return usuarios.value.filter(u => {
    const matchBusqueda = u.name.toLowerCase().includes(busqueda.value.toLowerCase()) ||
                          u.email.toLowerCase().includes(busqueda.value.toLowerCase())
    const matchRol = !filtroRol.value || u.custom_role_id === filtroRol.value
    const matchEstado = !filtroEstado.value ||
                        (filtroEstado.value === 'is_active' && u.is_active) ||
                        (filtroEstado.value === 'inactivo' && !u.is_active)
    return matchBusqueda && matchRol && matchEstado
  })
})

async function cargarUsuarios() {
  if (authStore.rol !== 'admin' && authStore.rol !== 'superadmin' && !authStore.usuario?.permissions?.includes('*') && !authStore.usuario?.permissions?.includes('admin.*')) {
    return
  }
  cargando.value = true
  try {
    const [resUsuarios, resRoles] = await Promise.all([
      api.get('/auth/usuarios/'),
      api.get('/auth/roles/')
    ])
    usuarios.value = resUsuarios.data
    rolesDisponibles.value = resRoles.data
  } catch (e) {
    showAlert({
      type: 'error',
      title: 'Error de carga',
      message: 'No se pudieron obtener los datos del sistema.'
    })
  } finally {
    cargando.value = false
  }
}

function getRolName(custom_role_id) {
  const role = rolesDisponibles.value.find(r => r.id === custom_role_id)
  return role ? role.name : ''
}

function abrirCrearModal() {
  formCrear.value = { name: '', email: '', password: '', role: 'custom', custom_role_id: null, permissions: [] }
  mostrarCrearModal.value = true
}

async function crearUsuario() {
  if (formCrear.value.password.length < 6) {
    showAlert({ type: 'warning', title: 'Seguridad', message: 'La contraseña debe tener al menos 6 caracteres.' })
    return
  }
  guardando.value = true
  try {
    await api.post('/auth/usuarios/', formCrear.value)
    showAlert({ type: 'success', title: 'Usuario creado', message: `El usuario ${formCrear.value.name} ha sido registrado.` })
    mostrarCrearModal.value = false
    await cargarUsuarios()
  } catch (e) {
    showAlert({
      type: 'error',
      title: 'Error al registrar',
      message: e.response?.data?.error || 'No se pudo registrar el usuario. Verifique el correo electrónico.'
    })
  } finally {
    guardando.value = false
  }
}

function abrirEditarModal(usuario) {
  formEditar.value = { ...usuario, custom_role_id: usuario.custom_role_id || null, password: '', permissions: usuario.permissions || [] }
  mostrarEditarModal.value = true
}

async function guardarEdicion() {
  if (formEditar.value.password && formEditar.value.password.length < 6) {
    showAlert({ type: 'warning', title: 'Seguridad', message: 'La contraseña debe tener al menos 6 caracteres.' })
    return
  }
  guardando.value = true
  try {
    const payload = {
      name: formEditar.value.name,
      email: formEditar.value.email,
      is_active: formEditar.value.is_active,
      custom_role_id: formEditar.value.custom_role_id,
      permissions: formEditar.value.permissions
    }
    if (formEditar.value.password) {
      payload.password = formEditar.value.password
    }
    await api.put(`/auth/usuarios/${formEditar.value.id}/`, payload)
    showAlert({ type: 'success', title: 'Cambios guardados', message: 'La account ha sido actualizada correctamente.' })
    mostrarEditarModal.value = false
    await cargarUsuarios()
  } catch (e) {
    showAlert({
      type: 'error',
      title: 'Error al guardar',
      message: e.response?.data?.error || 'No se pudieron actualizar los datos del usuario.'
    })
  } finally {
    guardando.value = false
  }
}

function abrirPasswordModal(usuario) {
  usuarioSeleccionado.value = usuario
  nuevaPassword.value = ''
  mostrarPasswordModal.value = true
}

async function cambiarPassword() {
  if (nuevaPassword.value.length < 6) {
    showAlert({ type: 'warning', title: 'Seguridad', message: 'La contraseña debe tener al menos 6 caracteres.' })
    return
  }
  guardando.value = true
  try {
    await api.put(`/auth/usuarios/${usuarioSeleccionado.value.id}/`, {
      password: nuevaPassword.value
    })
    showAlert({ type: 'success', title: 'Contraseña actualizada', message: 'La contraseña ha sido restablecida con éxito.' })
    mostrarPasswordModal.value = false
  } catch (e) {
    showAlert({
      type: 'error',
      title: 'Error',
      message: 'No se pudo actualizar la contraseña.'
    })
  } finally {
    guardando.value = false
  }
}

function getRolLabel(rol) {
  const map = {
    superadmin: 'Super Admin',
    admin: 'Administrador',
    vendedor: 'Vendedor / Cajero',
    contador: 'Contador',
    almacenista: 'Almacenista',
    rrhh: 'Recursos Humanos'
  }
  return map[rol] || rol
}

function getBadgeClass(rol) {
  const map = {
    superadmin: 'badge-danger',
    admin: 'badge-primary',
    vendedor: 'badge-success',
    contador: 'badge-warning',
    almacenista: 'badge-info',
    rrhh: 'badge-warning'
  }
  return map[rol] || 'badge-outline'
}

onMounted(() => {
  cargarUsuarios()
})
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
<style scoped>
.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}
.checkbox-container input {
  cursor: pointer;
}
</style>
