<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="cerrar">
    <div class="modal" style="max-width: 680px; width: 95%; max-height: 90vh; overflow-y: auto; padding: 1.75rem; border-radius: 1rem;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid" :class="icon || 'fa-file-excel'" style="color: #10b981;"></i>
            {{ title || 'Importación Masiva desde Excel' }}
          </h2>
          <p style="font-size: 0.85rem; color: #64748b; margin: 0.25rem 0 0 0;">
            {{ description || 'Cargue información masiva utilizando la plantilla estandarizada en formato .xlsx o .csv' }}
          </p>
        </div>
        <button 
          @click="cerrar"
          style="background: transparent; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer; padding: 0.25rem; border-radius: 0.375rem; line-height: 1;"
          title="Cerrar (Esc)">
          ✕
        </button>
      </div>

      <!-- ESTADO NORMAL: Formulario de Subida -->
      <div v-if="!resultado">
        <!-- Paso 1: Descargar Plantilla -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; display: block; margin-bottom: 0.2rem;">
                Paso 1: Formato Requerido
              </span>
              <p style="font-size: 0.85rem; color: #334155; margin: 0;">
                Descargue la plantilla oficial con cabeceras y ejemplos prellenados.
              </p>
            </div>
            <button 
              type="button"
              class="btn" 
              style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 0.825rem; font-weight: 600; padding: 0.45rem 0.85rem; display: flex; align-items: center; gap: 0.4rem; border-radius: 0.5rem;"
              @click="descargarPlantilla"
              :disabled="descargando">
              <i v-if="descargando" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-download"></i>
              <span>{{ descargando ? 'Generando...' : 'Descargar Plantilla .xlsx' }}</span>
            </button>
          </div>
        </div>

        <!-- Paso 2: Zona de Carga de Archivo -->
        <div style="margin-bottom: 1.25rem;">
          <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; display: block; margin-bottom: 0.4rem;">
            Paso 2: Seleccionar Archivo
          </span>

          <div 
            @dragover.prevent="arrastrando = true"
            @dragleave.prevent="arrastrando = false"
            @drop.prevent="onDrop"
            :style="{
              border: arrastrando ? '2px dashed #10b981' : '2px dashed #cbd5e1',
              background: arrastrando ? '#f0fdf4' : '#fafafa',
              borderRadius: '0.75rem',
              padding: '1.75rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }"
            @click="abrirSelectorArchivo">
            <input 
              ref="fileInput" 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              style="display: none;" 
              @change="onFileChange" 
            />
            
            <div v-if="!archivoSeleccionado">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2.25rem; color: #94a3b8; margin-bottom: 0.5rem; display: block;"></i>
              <p style="font-size: 0.9rem; font-weight: 600; color: #334155; margin: 0 0 0.25rem 0;">
                Haga clic para seleccionar o arrastre el archivo aquí
              </p>
              <span style="font-size: 0.75rem; color: #94a3b8;">Formatos compatibles: Microsoft Excel (.xlsx, .xls) o CSV</span>
            </div>

            <div v-else style="display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
              <i class="fa-solid fa-file-excel" style="font-size: 2rem; color: #10b981;"></i>
              <div style="text-align: left;">
                <p style="font-size: 0.9rem; font-weight: 600; color: #1e293b; margin: 0;">{{ archivoSeleccionado.name }}</p>
                <span style="font-size: 0.75rem; color: #64748b;">{{ formatearTamano(archivoSeleccionado.size) }}</span>
              </div>
              <button 
                type="button"
                @click.stop="archivoSeleccionado = null"
                style="background: #fee2e2; color: #ef4444; border: none; width: 26px; height: 26px; border-radius: 50%; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 0.5rem;"
                title="Quitar archivo">
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Opciones de Importación -->
        <div style="margin-bottom: 1.5rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem;">
          <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.85rem; color: #334155; user-select: none;">
            <input type="checkbox" v-model="upsertMode" style="width: 1rem; height: 1rem; accent-color: #10b981; cursor: pointer;" />
            <span>
              <strong>Actualizar datos si el registro ya existe</strong> (Modo Upsert)
              <span style="display: block; font-size: 0.75rem; color: #64748b; font-weight: normal;">
                Si se desmarca, se omitirán las filas cuyo código o identificación ya esté registrado.
              </span>
            </span>
          </label>
        </div>

        <!-- Footer / Acciones -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; padding-top: 1.25rem;">
          <button type="button" class="btn btn-outline" @click="cerrar" :disabled="procesando">
            Cancelar
          </button>
          <button 
            type="button"
            class="btn" 
            style="background: #10b981; color: white; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.25rem; border-radius: 0.5rem;"
            @click="ejecutarImportacion"
            :disabled="!archivoSeleccionado || procesando">
            <i v-if="procesando" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-upload"></i>
            <span>{{ procesando ? 'Procesando archivo...' : 'Iniciar Importación' }}</span>
          </button>
        </div>
      </div>

      <!-- ESTADO RESULTADO: Resumen y Detalle de Errores -->
      <div v-else>
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="width: 54px; height: 54px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 1.75rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem auto;">
            <i class="fa-solid fa-check"></i>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem 0;">
            Importación Completada
          </h3>
          <p style="font-size: 0.85rem; color: #64748b; margin: 0;">
            El procesamiento del archivo finalizó con el siguiente balance:
          </p>
        </div>

        <!-- Métricas Resumen -->
        <div style="display: grid; grid-cols: 3; gap: 0.75rem; margin-bottom: 1.25rem; grid-template-columns: repeat(3, 1fr);">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.6rem; padding: 0.75rem; text-align: center;">
            <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Total Filas</span>
            <div style="font-size: 1.35rem; font-weight: 700; color: #1e293b;">{{ resultado.total || 0 }}</div>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.6rem; padding: 0.75rem; text-align: center;">
            <span style="font-size: 0.75rem; color: #047857; text-transform: uppercase; font-weight: 600;">Creados</span>
            <div style="font-size: 1.35rem; font-weight: 700; color: #059669;">{{ resultado.created || 0 }}</div>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.6rem; padding: 0.75rem; text-align: center;">
            <span style="font-size: 0.75rem; color: #1d4ed8; text-transform: uppercase; font-weight: 600;">Actualizados</span>
            <div style="font-size: 1.35rem; font-weight: 700; color: #2563eb;">{{ resultado.updated || 0 }}</div>
          </div>
        </div>

        <!-- Tabla de Errores / Filas Omitidas si existen -->
        <div v-if="resultado.errors && resultado.errors.length" style="margin-bottom: 1.25rem;">
          <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 0.6rem; padding: 0.75rem; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; color: #be123c; font-size: 0.85rem; font-weight: 600;">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>{{ resultado.errors.length }} fila(s) no pudieron procesarse:</span>
            </div>
          </div>

          <div style="max-height: 180px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
            <table class="table" style="font-size: 0.8rem; margin: 0;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="width: 70px;">Fila</th>
                  <th style="width: 140px;">Identificador</th>
                  <th>Motivo del Error</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(err, i) in resultado.errors" :key="i">
                  <td style="font-weight: 600; color: #64748b;">Fila {{ err.row }}</td>
                  <td style="font-family: monospace;">{{ err.identifier }}</td>
                  <td style="color: #dc2626;">{{ err.error }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer Resultado -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; padding-top: 1.25rem;">
          <button 
            type="button"
            class="btn" 
            style="background: #10b981; color: white; font-weight: 600; padding: 0.5rem 1.5rem; border-radius: 0.5rem;"
            @click="finalizar">
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/shared/api'

const props = defineProps({
  show: { type: Boolean, default: false },
  entity: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: 'fa-file-excel' }
})

const emit = defineEmits(['close', 'success'])

const fileInput = ref(null)
const archivoSeleccionado = ref(null)
const arrastrando = ref(false)
const upsertMode = ref(true)
const procesando = ref(false)
const descargando = ref(false)
const resultado = ref(null)

const cerrar = () => {
  if (procesando.value) return
  archivoSeleccionado.value = null
  resultado.value = null
  emit('close')
}

const abrirSelectorArchivo = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const onFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) {
    archivoSeleccionado.value = files[0]
  }
}

const onDrop = (e) => {
  arrastrando.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) {
    archivoSeleccionado.value = files[0]
  }
}

const formatearTamano = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const descargarPlantilla = async () => {
  descargando.value = true
  try {
    const res = await api.get(`/importador/${props.entity}/template/`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `plantilla_${props.entity}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    alert('Error al descargar la plantilla. Verifique la conexión con el servidor.')
  } finally {
    descargando.value = false
  }
}

const ejecutarImportacion = async () => {
  if (!archivoSeleccionado.value) return
  procesando.value = true

  const formData = new FormData()
  formData.append('file', archivoSeleccionado.value)
  formData.append('mode', upsertMode.value ? 'upsert' : 'create_only')

  try {
    const res = await api.post(`/importador/${props.entity}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    resultado.value = res.data
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Error al procesar la importación'
    alert(msg)
  } finally {
    procesando.value = false
  }
}

const finalizar = () => {
  emit('success', resultado.value)
  cerrar()
}
</script>
