<template>
  <div class="flex flex-col items-center justify-center p-8 sm:p-14 text-center select-none animate-in fade-in duration-200">
    <!-- Icon Container con animación suave de hover y sombra elegante -->
    <div 
      class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mb-5 transition-transform duration-300 hover:scale-105 border border-slate-100 shadow-sm"
      :class="iconBg || 'bg-slate-50/80'">
      <i 
        :class="[icon || 'fa-solid fa-folder-open', iconColor || 'text-slate-300']" 
        class="text-3xl sm:text-4xl"></i>
    </div>

    <!-- Título y Descripción -->
    <h3 class="text-lg sm:text-xl font-bold text-slate-800 tracking-tight mb-1.5">
      {{ title || 'No se encontraron registros' }}
    </h3>
    <p v-if="description" class="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6 font-normal">
      {{ description }}
    </p>

    <!-- Botones de Acción -->
    <div v-if="actionText || secondaryActionText || $slots.default" class="flex flex-wrap items-center justify-center gap-3">
      <!-- Botón Primario -->
      <button 
        v-if="actionText"
        type="button"
        @click="$emit('action')"
        class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2">
        <i v-if="actionIcon" :class="actionIcon" class="text-xs"></i>
        <span>{{ actionText }}</span>
      </button>

      <!-- Botón Secundario (Opcional, ej: importar o limpiar filtros) -->
      <button 
        v-if="secondaryActionText"
        type="button"
        @click="$emit('secondaryAction')"
        class="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2">
        <i v-if="secondaryActionIcon" :class="secondaryActionIcon" class="text-xs text-slate-500"></i>
        <span>{{ secondaryActionText }}</span>
      </button>

      <!-- Slot para acciones personalizadas -->
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'fa-solid fa-folder-open'
  },
  iconColor: {
    type: String,
    default: 'text-slate-300'
  },
  iconBg: {
    type: String,
    default: 'bg-slate-50'
  },
  title: {
    type: String,
    default: 'No se encontraron registros'
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  actionIcon: {
    type: String,
    default: ''
  },
  secondaryActionText: {
    type: String,
    default: ''
  },
  secondaryActionIcon: {
    type: String,
    default: ''
  }
})

defineEmits(['action', 'secondaryAction'])
</script>
