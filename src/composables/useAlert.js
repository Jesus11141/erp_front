import { ref } from 'vue'

const alertState = ref(null)
let resolvePromise = null

/**
 * showAlert({ type, title, message })
 * type: 'warning' | 'error' | 'success' | 'confirm'
 * Retorna Promise<boolean> — true si el usuario confirmó (para type confirm)
 */
export function useAlert() {
  function showAlert({ type = 'warning', title, message }) {
    return new Promise((resolve) => {
      resolvePromise = resolve
      alertState.value = { type, title, message }
    })
  }

  function closeAlert(result = false) {
    alertState.value = null
    if (resolvePromise) {
      resolvePromise(result)
      resolvePromise = null
    }
  }

  return { alertState, showAlert, closeAlert }
}
