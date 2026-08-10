<template>
  <Teleport to="body">
    <Transition name="alert-fade">
      <div v-if="alertState" class="alert-overlay" @click.self="onOverlayClick">
        <div :class="['alert-modal', alertState.type]">

          <!-- Icono animado -->
          <div class="alert-icon-wrap">
            <div class="alert-icon">
              <span v-if="alertState.type === 'warning'">⚠️</span>
              <span v-else-if="alertState.type === 'error'">✕</span>
              <span v-else-if="alertState.type === 'success'">✓</span>
              <span v-else-if="alertState.type === 'confirm'">❓</span>
            </div>
          </div>

          <!-- Contenido -->
          <div class="alert-body">
            <h4 class="alert-title">{{ alertState.title }}</h4>
            <p class="alert-message">{{ alertState.message }}</p>
          </div>

          <!-- Botones -->
          <div class="alert-actions">
            <!-- Confirm: dos botones -->
            <template v-if="alertState.type === 'confirm'">
              <button class="alert-btn cancel" @click="closeAlert(false)">
                Cancelar
              </button>
              <button class="alert-btn confirm" @click="closeAlert(true)">
                Confirmar
              </button>
            </template>

            <!-- Resto: solo Aceptar -->
            <button v-else class="alert-btn accept" :class="alertState.type" @click="closeAlert(true)">
              Aceptar
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useAlert } from '../composables/useAlert'
const { alertState, closeAlert } = useAlert()

function onOverlayClick() {
  // Solo cerrar si no es confirm (para evitar closing accidental)
  if (alertState.value?.type !== 'confirm') closeAlert(false)
}
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.alert-modal {
  background: #fff;
  border-radius: 20px;
  padding: 2rem 2rem 1.75rem;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  border-top: 5px solid transparent;
}

/* Colores por type */
.alert-modal.warning { border-top-color: #F59E0B; }
.alert-modal.error   { border-top-color: #EF4444; }
.alert-modal.success { border-top-color: #10B981; }
.alert-modal.confirm { border-top-color: #4F46E5; }

/* Icono */
.alert-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.alert-modal.warning .alert-icon-wrap { background: #FEF3C7; }
.alert-modal.error   .alert-icon-wrap { background: #FEE2E2; }
.alert-modal.success .alert-icon-wrap { background: #D1FAE5; }
.alert-modal.confirm .alert-icon-wrap { background: #EEF2FF; }

.alert-icon { font-size: 2.2rem; line-height: 1; }

/* Error tiene X con estilo propio */
.alert-modal.error .alert-icon {
  font-style: normal;
  font-weight: 900;
  font-size: 2rem;
  color: #EF4444;
  font-family: sans-serif;
}

/* Texto */
.alert-body { display: flex; flex-direction: column; gap: 0.4rem; }

.alert-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1E293B;
  margin: 0;
}

.alert-message {
  font-size: 0.9rem;
  color: #64748B;
  margin: 0;
  line-height: 1.5;
}

/* Botones */
.alert-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
}

.alert-btn {
  flex: 1;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.alert-btn.cancel {
  background: #F1F5F9;
  color: #64748B;
}
.alert-btn.cancel:hover { background: #E2E8F0; }

.alert-btn.confirm {
  background: #4F46E5;
  color: white;
}
.alert-btn.confirm:hover { background: #3730A3; }

.alert-btn.accept.warning { background: #F59E0B; color: white; }
.alert-btn.accept.warning:hover { background: #D97706; }

.alert-btn.accept.error { background: #EF4444; color: white; }
.alert-btn.accept.error:hover { background: #DC2626; }

.alert-btn.accept.success { background: #10B981; color: white; }
.alert-btn.accept.success:hover { background: #059669; }

/* Animaciones */
.alert-fade-enter-active { animation: overlayIn 0.2s ease; }
.alert-fade-leave-active { animation: overlayIn 0.15s ease reverse; }

@keyframes overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
</style>
