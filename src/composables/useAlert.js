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

  /**
   * showToast(message, type)
   * Toast ligero que se cierra automáticamente tras 2.5s.
   * Compatible con la firma: useAlert().showToast('msg', 'success')
   */
  function showToast(message, type = 'success') {
    const title = type === 'error' ? 'Error'
      : type === 'warning' ? 'Atención'
      : type === 'success' ? 'Éxito'
      : 'Aviso'
    return new Promise((resolve) => {
      resolvePromise = resolve
      alertState.value = { type, title, message, autoClose: true }
      setTimeout(() => {
        closeAlert(true)
      }, 2500)
    })
  }

  function closeAlert(result = false) {
    alertState.value = null
    if (resolvePromise) {
      resolvePromise(result)
      resolvePromise = null
    }
  }

  return { alertState, showAlert, showToast, closeAlert }
}
