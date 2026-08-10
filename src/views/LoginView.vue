<template>
  <div class="login-page">

    <!-- Panel izquierdo: branding -->
    <div class="login-branding">
      <div class="branding-content">
        <div class="branding-logo">⚡</div>
        <h1 class="branding-title">DJH Sistemas</h1>
        <p class="branding-subtitle">ERP Contable & Empresarial Inteligente</p>
        <div class="branding-features">
          <div class="feature-item">
            <span class="feature-icon">🧾</span>
            <span>Facturación electrónica SRI</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📦</span>
            <span>Inventario en tiempo real</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🖥️</span>
            <span>Punto de sale integrado</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span>Reportes y contabilidad automatizada</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho: formulario -->
    <div class="login-form-panel">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo-placeholder">
            💼
          </div>
          <h2 class="login-company">DJH Sistemas</h2>
          <p class="login-bienvenida">ERP Contable — Iniciar Sesión</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>Correo electrónico</label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              placeholder="correo@company.com"
              autocomplete="email"
              required
            />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <div class="input-password">
              <input
                v-model="form.password"
                :type="verPassword ? 'text' : 'password'"
                class="input"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
              <button type="button" class="toggle-password" @click="verPassword = !verPassword">
                {{ verPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div v-if="error" class="alert alert-danger" style="margin-bottom:0.75rem">
            <span>⚠️</span> {{ error }}
          </div>

          <button
            type="submit"
            class="btn btn-primary login-btn"
            :disabled="cargando"
          >
            <span v-if="cargando" class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:white;display:inline-block;"></span>
            <span>{{ cargando ? 'Ingresando...' : 'Ingresar al sistema' }}</span>
          </button>
        </form>

        <p class="login-footer">
          ¿Problemas para ingresar? Contacta a tu administrador.
        </p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTenantStore } from '../stores/tenant'

const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const form = ref({ email: '', password: '' })
const error = ref('')
const cargando = ref(false)
const verPassword = ref(false)

const iniciales = computed(() => {
  const name = tenantStore.tenant?.name || 'E'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})

async function handleLogin() {
  error.value = ''
  cargando.value = true
  try {
    await authStore.login(form.value.email, form.value.password)
    if (authStore.rol === 'vendedor') {
      router.push('/pos')
    } else {
      router.push('/dashboard')
    }
  } catch {
    error.value = 'Correo o contraseña incorrectos'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

/* Panel izquierdo */
.login-branding {
  background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 3rem;
}
.branding-content { color: white; max-width: 380px; }
.branding-logo {
  font-size: 3rem; margin-bottom: 1rem;
  width: 72px; height: 72px; background: rgba(255,255,255,0.15);
  border-radius: 20px; display: flex; align-items: center;
  justify-content: center; backdrop-filter: blur(10px);
}
.branding-title {
  font-size: 2.2rem; font-weight: 900;
  letter-spacing: -0.03em; margin-bottom: 0.5rem;
}
.branding-subtitle {
  font-size: 1rem; opacity: 0.8; margin-bottom: 2.5rem; line-height: 1.5;
}
.branding-features { display: flex; flex-direction: column; gap: 1rem; }
.feature-item {
  display: flex; align-items: center; gap: 0.875rem;
  font-size: 0.9rem; opacity: 0.9;
}
.feature-icon {
  width: 36px; height: 36px; background: rgba(255,255,255,0.15);
  border-radius: 10px; display: flex; align-items: center;
  justify-content: center; font-size: 1rem; flex-shrink: 0;
}

/* Panel derecho */
.login-form-panel {
  display: flex; align-items: center; justify-content: center;
  padding: 2rem; background: #F8FAFC;
}
.login-card {
  background: white; border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 2.5rem; width: 100%; max-width: 400px;
  border: 1px solid #E2E8F0;
}
.login-header { text-align: center; margin-bottom: 2rem; }
.login-logo { height: 56px; margin-bottom: 1rem; border-radius: 12px; }
.login-logo-placeholder {
  width: 56px; height: 56px; background: #4F46E5;
  border-radius: 14px; color: white; font-size: 1.2rem;
  font-weight: 800; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 1rem;
}
.login-company { font-size: 1.2rem; font-weight: 800; color: #1E293B; }
.login-bienvenida { color: #94A3B8; font-size: 0.875rem; margin-top: 0.25rem; }

.login-form { display: flex; flex-direction: column; gap: 0.25rem; }

.input-password { position: relative; }
.input-password .input { padding-right: 2.5rem; }
.toggle-password {
  position: absolute; right: 0.75rem; top: 50%;
  transform: translateY(-50%); background: none; border: none;
  cursor: pointer; font-size: 1rem; padding: 0;
}

.login-btn {
  width: 100%; padding: 0.75rem; margin-top: 0.75rem;
  font-size: 0.95rem; justify-content: center; gap: 0.5rem;
}

.login-footer {
  text-align: center; margin-top: 1.5rem;
  font-size: 0.78rem; color: #94A3B8;
}

/* Responsive */
@media (max-width: 768px) {
  .login-page { grid-template-columns: 1fr; }
  .login-branding { display: none; }
}
</style>
