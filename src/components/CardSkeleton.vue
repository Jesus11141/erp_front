<template>
  <div class="grid gap-4 animate-pulse select-none" :class="gridClass">
    <div 
      v-for="c in count" 
      :key="c" 
      class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
      <!-- Icono simulado -->
      <div class="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
      <!-- Texto simulado -->
      <div class="space-y-2 flex-1">
        <div class="h-3 bg-slate-200 rounded w-1/2"></div>
        <div class="h-6 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: {
    type: Number,
    default: 3
  },
  cols: {
    type: Number,
    default: 3
  }
})

const gridClass = computed(() => {
  if (props.cols === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (props.cols === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  if (props.cols === 6) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
  return 'grid-cols-1 sm:grid-cols-3'
})
</script>
