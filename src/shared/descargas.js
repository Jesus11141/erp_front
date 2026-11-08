import api from '@/shared/api'

/**
 * Descarga un archivo desde la API.
 * Uso: descargar('/reportes/excel/sales/', 'sales.xlsx')
 */
export async function descargar(url, nombreArchivo) {
  const response = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/**
 * Abre un PDF en nueva pestaña.
 * Uso: abrirPDF('/reportes/pdf/invoice/1/')
 */
export async function abrirPDF(url) {
  const newWindow = window.open('', '_blank')
  if (newWindow) {
    newWindow.document.write('<p style="font-family:sans-serif; text-align:center; margin-top:3rem; color:#64748b;">Generando y descargando PDF, por favor espere...</p>')
  }
  try {
    const response = await api.get(url, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const pdfUrl = URL.createObjectURL(blob)
    if (newWindow) {
      newWindow.location.href = pdfUrl
    }
  } catch (error) {
    if (newWindow) {
      newWindow.close()
    }
    throw error
  }
}

