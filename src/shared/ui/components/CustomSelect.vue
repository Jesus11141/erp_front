<template>
  <div class="custom-select-container" ref="containerRef">
    <div 
      class="custom-select-trigger" 
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
    >
      <span class="custom-select-label" :class="{ 'placeholder': !selectedOption }">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <span class="custom-select-arrow">▼</span>
    </div>

    <div v-if="isOpen" class="custom-select-dropdown">
      <div class="custom-select-search">
        <input 
          ref="searchInput"
          type="text" 
          v-model="searchQuery"
          placeholder="Buscar..."
          @click.stop
        />
      </div>
      <ul class="custom-select-list">
        <li 
          v-for="opt in filteredOptions" 
          :key="opt.value"
          class="custom-select-item"
          :class="{ 'is-selected': opt.value === modelValue }"
          @click="selectOption(opt)"
        >
          {{ opt.label }}
        </li>
        <li v-if="filteredOptions.length === 0" class="custom-select-empty">
          No hay resultados
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: null
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Seleccionar...'
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref(null)
const searchInput = ref(null)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(opt => opt.label.toLowerCase().includes(q))
})

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    await nextTick()
    if (searchInput.value) searchInput.value.focus()
  }
}

const selectOption = (opt) => {
  emit('update:modelValue', opt.value)
  isOpen.value = false
}

const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.custom-select-container {
  position: relative;
  width: 100%;
  font-family: inherit;
}

.custom-select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background-color: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.custom-select-trigger:hover {
  border-color: #94a3b8;
}

.custom-select-trigger.is-open {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.custom-select-label {
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-select-label.placeholder {
  color: #94a3b8;
}

.custom-select-arrow {
  color: #64748b;
  font-size: 0.7rem;
  transition: transform 0.2s;
}

.custom-select-trigger.is-open .custom-select-arrow {
  transform: rotate(180deg);
}

.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 50;
  overflow: hidden;
}

.custom-select-search {
  padding: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.custom-select-search input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
}

.custom-select-search input:focus {
  border-color: #3b82f6;
}

.custom-select-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
}

.custom-select-item {
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #334155;
  transition: background 0.15s;
}

.custom-select-item:hover {
  background-color: #f8fafc;
}

.custom-select-item.is-selected {
  background-color: #eff6ff;
  color: #1d4ed8;
  font-weight: 500;
}

.custom-select-empty {
  padding: 1rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}
</style>
