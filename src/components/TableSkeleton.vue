<template>
  <div class="w-full animate-pulse divide-y divide-slate-100 select-none">
    <div 
      v-for="r in rows" 
      :key="r" 
      class="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
      
      <!-- Columna 1: Código / Fecha / ID pequeño -->
      <div class="h-4 bg-slate-200 rounded-md w-16 sm:w-24 shrink-0"></div>

      <!-- Columna 2: Elemento principal (Nombre / Título / Avatar opcional) -->
      <div class="flex items-center gap-3 flex-1 min-w-[140px]">
        <div v-if="hasAvatar" class="w-8 h-8 rounded-lg bg-slate-200 shrink-0"></div>
        <div class="space-y-1.5 flex-1 max-w-sm">
          <div class="h-4 bg-slate-200 rounded-md w-3/4"></div>
          <div v-if="hasSubtitle" class="h-3 bg-slate-100 rounded-md w-1/2"></div>
        </div>
      </div>

      <!-- Columna 3: Badge / Etiqueta de estado -->
      <div v-if="hasBadge" class="hidden sm:block h-5 bg-slate-200/70 rounded-full w-20 shrink-0"></div>

      <!-- Columna 4: Valores numéricos o cantidades -->
      <div class="h-4 bg-slate-200 rounded-md w-16 sm:w-24 shrink-0 text-right"></div>

      <!-- Columna 5: Botones de Acción simulados -->
      <div v-if="hasActions" class="flex items-center gap-1.5 shrink-0">
        <div class="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200/60 rounded-lg"></div>
        <div class="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200/60 rounded-lg"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: {
    type: Number,
    default: 5
  },
  hasAvatar: {
    type: Boolean,
    default: false
  },
  hasSubtitle: {
    type: Boolean,
    default: true
  },
  hasBadge: {
    type: Boolean,
    default: true
  },
  hasActions: {
    type: Boolean,
    default: true
  }
})
</script>
