<template>
  <div>
    <div class="page-header">
      <div>
      <h1 class="page-title">Parametrización</h1>
      <p style="color:var(--text-muted); margin-bottom:1.5rem; font-size:0.9rem;">
        Configura el comportamiento del sistema para tu company. Los cambios aplican de inmediato.
      </p>
      </div>
    </div>

    <div v-if="cargando" class="spinner" style="margin:2rem auto;"></div>

    <template v-else>
      <!-- Tabs por módulo -->
      <div class="tabs">
        <button
          v-for="modulo in modulosDisponibles"
          :key="modulo.clave"
          :class="['tab', moduloActivo === modulo.clave ? 'tab-is_active' : '']"
          @click="moduloActivo = modulo.clave"
        >
          {{ modulo.icono }} {{ modulo.label }}
        </button>
      </div>

      <!-- Parámetros del módulo is_active -->
      <div v-if="moduloActivo !== 'perfil'" class="card" style="margin-top:1rem;">
        <div class="params-grid">
          <div
            v-for="(info, clave) in parametrosModulo"
            :key="clave"
            class="param-item"
          >
            <label class="param-label">{{ info.label }}</label>

            <!-- Boolean → toggle switch -->
            <div v-if="info.type === 'boolean'" class="toggle-wrap">
              <label class="toggle">
                <input
                  type="checkbox"
                  :checked="info.value === 'true' || info.value === true"
                  @change="cambiarValor(clave, $event.target.checked ? 'true' : 'false')"
                />
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">
                {{ (info.value === 'true' || info.value === true) ? 'Activado' : 'Desactivado' }}
              </span>
            </div>

            <!-- Opciones → select -->
            <select
              v-else-if="info.type === 'options'"
              class="input"
              :value="info.value"
              @change="cambiarValor(clave, $event.target.value)"
            >
              <option v-for="op in info.options" :key="op" :value="op">{{ op }}</option>
            </select>

            <!-- Imagen → uploader de logo -->
            <div v-else-if="info.type === 'image'" class="logo-uploader">
              <img
                v-if="logoPreview || info.value"
                :src="logoPreview || getLogoUrl(info.value)"
                class="logo-preview"
              />
              <div v-else class="logo-placeholder">Sin logo</div>
              <label class="btn btn-outline" style="cursor:pointer; font-size:0.8rem;">
                📁 Seleccionar imagen
                <input
                  type="file"
                  accept="image/*"
                  style="display:none"
                  @change="seleccionarLogo"
                />
              </label>
              <button
                v-if="logoArchivo"
                class="btn btn-primary"
                style="font-size:0.8rem"
                @click="subirLogo"
                :disabled="subiendoLogo"
              >
                {{ subiendoLogo ? 'Subiendo...' : '⬆ Subir logo' }}
              </button>
              <span v-if="logoOk" style="color:var(--color-exito); font-size:0.8rem;">✓ Logo actualizado</span>
            </div>

            <!-- Archivo genérico → uploader de firma -->
            <div v-else-if="info.type === 'file'" style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-start;">
              <!-- Si hay un archivo recién seleccionado pero NO subido -->
              <div v-if="firmaArchivo" style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem; border:1px solid var(--color-primario); border-radius:4px; color:var(--color-primario); background:#f0f9ff; width:100%; max-width:400px; justify-content:space-between;">
                <div style="display:flex; flex-direction:column;">
                  <span style="font-weight:600; font-size:0.85rem;">📁 Archivo seleccionado:</span>
                  <span style="font-size:0.85rem;">{{ firmaArchivo.name }}</span>
                  <span style="font-size:0.75rem; opacity:0.8;">No olvides guardar cambios</span>
                </div>
              </div>
              
              <!-- Si no hay archivo nuevo, pero sí hay en base de datos -->
              <div v-else-if="info.value" style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem; border:1px solid var(--color-exito); border-radius:4px; color:var(--color-exito); background:#f0fdf4; width:100%; max-width:400px; justify-content:space-between;">
                <div style="display:flex; flex-direction:column;">
                  <span style="font-weight:600; font-size:0.85rem;">✓ Archivo cargado:</span>
                  <span style="font-family:monospace; font-size:0.8rem; word-break:break-all;">{{ info.value.split('/').pop() }}</span>
                </div>
                <button
                  type="button"
                  class="btn btn-outline"
                  style="color:#e74c3c; border-color:#e74c3c; font-size:0.75rem; padding:0.25rem 0.5rem; margin-left:1rem; flex-shrink:0;"
                  @click="cambiarValor(clave, '')"
                >
                  🗑 Eliminar
                </button>
              </div>
              
              <!-- Si no hay nada -->
              <div v-else style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem; border:1px solid #ccc; border-radius:4px; color:#666; background:#f9f9f9; width:100%; max-width:400px;">
                <span style="font-size:0.85rem;">❌ Sin archivo</span>
              </div>
              
              <div style="display:flex; gap:0.5rem; margin-top:0.25rem;">
                <label class="btn btn-outline" style="cursor:pointer; font-size:0.8rem;">
                  📁 {{ info.value ? 'Reemplazar .p12' : 'Seleccionar .p12' }}
                  <input
                    type="file"
                    accept=".p12"
                    style="display:none"
                    @change="seleccionarFirma"
                  />
                </label>
                
                <button
                  v-if="firmaArchivo"
                  class="btn btn-primary"
                  style="font-size:0.8rem"
                  @click="subirFirma"
                  :disabled="subiendoFirma"
                >
                  {{ subiendoFirma ? 'Subiendo...' : '⬆ Subir ahora' }}
                </button>
              </div>
              <span v-if="firmaOk" style="color:var(--color-exito); font-size:0.8rem;">✓ Archivo subido con éxito</span>
            </div>

            <!-- Lista de items (separados por coma en backend, presentados como chips) -->
            <div v-else-if="info.type === 'list'" style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="display: flex; gap: 0.5rem;">
                <input
                  type="text"
                  class="input"
                  style="flex: 1;"
                  placeholder="Agregar nuevo ítem..."
                  @keydown.enter.prevent="agregarItemLista(clave, $event.target)"
                />
                <button 
                  type="button" 
                  class="btn btn-primary" 
                  style="padding: 0 0.75rem; font-weight: bold; font-size: 1.25rem;"
                  @click="agregarItemLista(clave, $event.target.previousElementSibling)"
                >
                  +
                </button>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; max-height: 150px; overflow-y: auto; padding: 0.5rem; background: #f8fafc; border-radius: 8px; border: 1px solid var(--border);">
                <div 
                  v-for="(item, idx) in obtenerItemsLista(info.value)" 
                  :key="idx"
                  style="background: white; border: 1px solid var(--border); border-radius: 16px; padding: 0.25rem 0.75rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
                >
                  <span>{{ item }}</span>
                  <span 
                    @click="removerItemLista(clave, info.value, idx)" 
                    style="color: red; cursor: pointer; font-weight: bold; font-size: 1rem;"
                  >×</span>
                </div>
                <div v-if="!info.value" style="color: var(--text-muted); font-size: 0.8rem;">
                  No hay elementos.
                </div>
              </div>
            </div>

            <!-- Número -->
            <input
              v-else-if="info.type === 'number'"
              type="number"
              class="input"
              :value="info.value"
              @change="cambiarValor(clave, $event.target.value)"
            />

            <!-- Contraseña -->
            <div v-else-if="info.type === 'password'" style="display:flex; gap:0.5rem; align-items:center;">
              <input
                type="password"
                class="input"
                :value="info.value"
                @input="e => cambiarValor(clave, e.target.value)"
                style="flex: 1;"
              />
              <button 
                v-if="clave === 'signature_password'"
                type="button" 
                class="btn btn-outline" 
                @click="validarFirma(info.value)"
                :disabled="validandoFirma"
                style="padding:0.4rem 0.75rem; font-size:0.8rem;"
              >
                {{ validandoFirma ? 'Validando...' : 'Validar' }}
              </button>
            </div>

            <!-- Texto -->
            <input
              v-else
              type="text"
              class="input"
              :value="info.value"
              @change="cambiarValor(clave, $event.target.value)"
            />

            <span class="param-default">Default: {{ info.default }}</span>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; margin-top:1.5rem; gap:0.75rem; align-items:center;">
          <span v-if="guardado" style="color:#27ae60; font-size:0.875rem;">✓ Guardado</span>
          <button class="btn btn-outline" @click="restaurarDefaults">Restaurar defaults</button>
          <button class="btn btn-primary" @click="guardar" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>

      <!-- Perfil del usuario is_active -->
      <div v-else class="card" style="margin-top:1rem; max-width:500px;">
        <h3 style="margin-bottom:1.5rem;">👤 Mi Cuenta de Usuario / Perfil</h3>
        
        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="font-weight:700; display:block; margin-bottom:0.4rem;">Nombre Completo *</label>
          <input v-model="formPerfil.name" type="text" class="input" required />
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="font-weight:700; display:block; margin-bottom:0.4rem;">Correo Electrónico *</label>
          <input v-model="formPerfil.email" type="email" class="input" required />
        </div>

        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label style="font-weight:700; display:block; margin-bottom:0.4rem;">Cambiar Contraseña (Dejar en blanco para conservar la actual)</label>
          <input v-model="formPerfil.password" type="password" class="input" placeholder="Nueva contraseña (mínimo 6 caracteres)" autocomplete="new-password" />
        </div>

        <div style="display:flex; justify-content:flex-end; margin-top:1.5rem;">
          <button class="btn btn-primary" @click="guardarPerfil" :disabled="guardandoPerfil">
            {{ guardandoPerfil ? 'Guardando...' : 'Guardar Perfil' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../../shared/api'
import { useAuthStore } from '../../../stores/auth'
import { useTenantStore } from '../../../stores/tenant'
import { useParametrosStore } from '../../../stores/parametros'
import { useAlert } from '../../../composables/useAlert'

const { showAlert } = useAlert()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const parametrosStore = useParametrosStore()

const parametros = ref({})
const cambios = ref({})
const cargando = ref(true)
const guardando = ref(false)
const guardado = ref(false)
const moduloActivo = ref('general')
const logoArchivo = ref(null)
const logoPreview = ref('')
const subiendoLogo = ref(false)
const validandoFirma = ref(false)
const logoOk = ref(false)

const firmaArchivo = ref(null)
const subiendoFirma = ref(false)
const firmaOk = ref(false)

const guardandoPerfil = ref(false)
const formPerfil = ref({ name: '', email: '', password: '' })

const modulosDisponibles = computed(() => {
  const lista = [
    { clave: 'general',     label: 'General',      icono: '⚙️' },
    { clave: 'perfil',      label: 'Mi Perfil / Contraseña', icono: '👤' },
  ]
  if (tenantStore.tieneModulo('ventas')) lista.push({ clave: 'ventas', label: 'Ventas', icono: '🤝' })
  if (tenantStore.tieneModulo('facturacion')) lista.push({ clave: 'facturacion', label: 'Facturación', icono: '🧾' })
  if (tenantStore.tieneModulo('pos')) lista.push({ clave: 'pos', label: 'POS', icono: '🖥️' })
  if (tenantStore.tieneModulo('inventario')) lista.push({ clave: 'inventario', label: 'Inventario', icono: '🏭' })
  if (tenantStore.tieneModulo('rrhh')) lista.push({ clave: 'rrhh', label: 'RRHH', icono: '👥' })
  if (tenantStore.tieneModulo('contabilidad')) lista.push({ clave: 'contabilidad', label: 'Contabilidad', icono: '📒' })
  if (tenantStore.tieneModulo('clinica')) lista.push({ clave: 'clinica', label: 'Clínica', icono: '🏥' })
  if (tenantStore.tieneModulo('technical_service')) lista.push({ clave: 'technical_service', label: 'Servicio Técnico', icono: '🔧' })
  return lista
})

const parametrosModulo = computed(() => {
  const modulo = parametros.value[moduloActivo.value] || {}
  const cambiosModulo = cambios.value[moduloActivo.value] || {}
  const result = {}
  for (const [clave, info] of Object.entries(modulo)) {
    result[clave] = {
      ...info,
      value: cambiosModulo[clave] !== undefined ? cambiosModulo[clave] : info.value,
    }
  }
  return result
})

async function seleccionarLogo(e) {
  const file = e.target.files[0]
  if (!file) return
  logoArchivo.value = file
  logoPreview.value = URL.createObjectURL(file)
  logoOk.value = false
  guardado.value = false
}

async function subirLogo() {
  if (!logoArchivo.value) return
  subiendoLogo.value = true
  logoOk.value = false
  try {
    const formData = new FormData()
    formData.append('logo', logoArchivo.value)
    await api.post('/tenant/logo/', formData)
    // Recargar stores para que el logo aparezca en sidebar y login
    await Promise.all([tenantStore.cargar(), parametrosStore.cargar()])
    // Usar los datos recién cargados en el store en lugar de hacer otra petición GET
    parametros.value = JSON.parse(JSON.stringify(parametrosStore.todos))
    // Actualizar preview con el valor ya guardado
    logoPreview.value = ''
    logoArchivo.value = null
    logoOk.value = true
    setTimeout(() => logoOk.value = false, 3000)
  } catch (e) {
    showAlert({ type: 'error', title: 'Error', message: e.response?.data?.error || 'Error al subir el logo' })
    throw e
  } finally {
    subiendoLogo.value = false
  }
}

async function seleccionarFirma(e) {
  const file = e.target.files[0]
  if (!file) return
  firmaArchivo.value = file
  firmaOk.value = false
  guardado.value = false
}

async function subirFirma() {
  if (!firmaArchivo.value) return
  subiendoFirma.value = true
  firmaOk.value = false
  try {
    const formData = new FormData()
    formData.append('signature', firmaArchivo.value)
    await api.post('/parametros/upload-signature/', formData)
    await parametrosStore.cargar()
    parametros.value = JSON.parse(JSON.stringify(parametrosStore.todos))
    firmaArchivo.value = null
    firmaOk.value = true
    setTimeout(() => firmaOk.value = false, 3000)
  } catch (e) {
    showAlert({ type: 'error', title: 'Error', message: e.response?.data?.error || 'Error al subir la firma electrónica' })
    throw e
  } finally {
    subiendoFirma.value = false
  }
}

async function validarFirma(password) {
  if (!password) {
    showAlert({ type: 'warning', title: 'Falta contraseña', message: 'Ingresa una contraseña para validar' })
    return
  }
  validandoFirma.value = true
  try {
    const formData = new FormData()
    formData.append('password', password)
    if (firmaArchivo.value) {
      formData.append('signature', firmaArchivo.value)
    }
    const { data } = await api.post('/parametros/validate-signature/', formData)
    showAlert({ type: 'success', title: 'Éxito', message: data.message })
  } catch (e) {
    showAlert({ type: 'error', title: 'Error', message: e.response?.data?.error || 'Error al validar la firma' })
  } finally {
    validandoFirma.value = false
  }
}

function cambiarValor(clave, valor) {
  if (!cambios.value[moduloActivo.value]) {
    cambios.value[moduloActivo.value] = {}
  }
  cambios.value[moduloActivo.value][clave] = valor
  guardado.value = false
}

const obtenerItemsLista = (valor) => {
  if (!valor) return []
  return valor.split(',').map(s => s.trim()).filter(s => s)
}

const agregarItemLista = (clave, inputElement) => {
  if (!inputElement || !inputElement.value.trim()) return
  const item = inputElement.value.trim()
  const currentVal = cambios.value[moduloActivo.value]?.[clave] !== undefined 
      ? cambios.value[moduloActivo.value][clave] 
      : parametros.value[moduloActivo.value]?.[clave]?.value
  
  const list = obtenerItemsLista(currentVal)
  if (!list.includes(item)) {
    list.push(item)
    cambiarValor(clave, list.join(', '))
  }
  inputElement.value = ''
}

const removerItemLista = (clave, valorActual, idx) => {
  const list = obtenerItemsLista(valorActual)
  list.splice(idx, 1)
  cambiarValor(clave, list.join(', '))
}

function restaurarDefaults() {
  const modulo = parametros.value[moduloActivo.value] || {}
  cambios.value[moduloActivo.value] = {}
  for (const [clave, info] of Object.entries(modulo)) {
    cambios.value[moduloActivo.value][clave] = info.default
  }
}

async function guardar() {
  guardando.value = true
  guardado.value = false
  try {
    if (logoArchivo.value) {
      await subirLogo()
    }
    if (firmaArchivo.value) {
      await subirFirma()
    }

    const payload = cambios.value[moduloActivo.value] || {}
    await api.post(`/parametros/${moduloActivo.value}/`, payload)
    // Actualizar valores locales
    for (const [clave, valor] of Object.entries(payload)) {
      if (parametros.value[moduloActivo.value]?.[clave]) {
        parametros.value[moduloActivo.value][clave].value = valor
      }
    }
    cambios.value[moduloActivo.value] = {}
    guardado.value = true
    setTimeout(() => guardado.value = false, 3000)
  } catch (e) {
    showAlert({ type: 'error', title: 'Error', message: e.response?.data?.error || 'Error al guardar' })
  } finally {
    guardando.value = false
  }
}

async function guardarPerfil() {
  if (!formPerfil.value.name || !formPerfil.value.email) {
    showAlert({ type: 'warning', title: 'Campos incompletos', message: 'El name y correo electrónico son obligatorios.' })
    return
  }
  if (formPerfil.value.password && formPerfil.value.password.length < 6) {
    showAlert({ type: 'warning', title: 'Contraseña muy corta', message: 'La contraseña debe tener al menos 6 caracteres.' })
    return
  }

  guardandoPerfil.value = true
  try {
    const payload = {
      name: formPerfil.value.name.trim(),
      email: formPerfil.value.email.trim()
    }
    if (formPerfil.value.password) {
      payload.password = formPerfil.value.password
    }
    const { data } = await api.put(`/auth/usuarios/${authStore.usuario.id}/`, payload)

    // Actualizar local storage y pinia store
    authStore.usuario = {
      ...authStore.usuario,
      name: data.name,
      email: data.email
    }
    localStorage.setItem('usuario', JSON.stringify(authStore.usuario))

    formPerfil.value.password = ''
    showAlert({ type: 'success', title: 'Perfil actualizado', message: 'Los cambios se han guardado correctamente.' })
  } catch (e) {
    showAlert({ type: 'error', title: 'Error', message: e.response?.data?.error || 'Error al guardar los cambios de perfil' })
  } finally {
    guardandoPerfil.value = false
  }
}

function getLogoUrl(valor) {
  if (!valor) return ''
  if (valor.startsWith('http://') || valor.startsWith('https://')) return valor
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '')
  return base + valor
}

onMounted(async () => {
  formPerfil.value = {
    name: authStore.usuario?.name || '',
    email: authStore.usuario?.email || '',
    password: ''
  }
  try {
    // Forzamos que el store cargue y usamos esos datos
    await parametrosStore.cargar()
    parametros.value = JSON.parse(JSON.stringify(parametrosStore.todos))
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.tab {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
}
.tab:hover { border-color: var(--color-primario); }
.tab-is_active {
  border-color: var(--color-primario);
  background: var(--color-primario);
  color: white;
  font-weight: 600;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.param-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
}
.param-default {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Toggle switch */
.toggle-wrap { display: flex; align-items: center; gap: 0.75rem; }
.toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; cursor: pointer; inset: 0;
  background: #ccc; border-radius: 24px; transition: 0.3s;
}
.toggle-slider:before {
  content: ''; position: absolute;
  width: 18px; height: 18px; left: 3px; bottom: 3px;
  background: white; border-radius: 50%; transition: 0.3s;
}
.toggle input:checked + .toggle-slider { background: var(--color-primario); }
.toggle input:checked + .toggle-slider:before { transform: translateX(20px); }
.toggle-label { font-size: 0.875rem; color: var(--text-muted); }

.logo-uploader {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.logo-preview {
  height: 52px;
  max-width: 160px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--border);
  padding: 4px;
  background: white;
}
.logo-placeholder {
  height: 52px;
  width: 100px;
  border: 2px dashed var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>

