<template>
  <div>
    <!-- Botón flotante -->
    <button 
      @click="toggleChat" 
      class="chat-btn"
      :class="{ 'chat-btn-active': isOpen }"
    >
      <i class="fas" :class="isOpen ? 'fa-times' : 'fa-robot'"></i>
    </button>

    <!-- Ventana de Chat -->
    <div v-if="isOpen" class="chat-window">
      <div class="chat-header">
        <div class="header-info">
          <i class="pi pi-android" style="font-size: 1.5rem"></i>
          <span>Lyxa</span>
        </div>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          class="message"
          :class="msg.role === 'user' ? 'message-user' : 'message-bot'"
        >
          <div class="message-content">
            {{ msg.content }}
            
            <button 
              v-if="msg.role === 'model' && index > 0 && messages[index-1].role === 'user' && !msg.saved" 
              class="save-btn" 
              @click="saveSolution(index)"
              title="Guardar esta solución en la base de conocimientos">
              👍 Me sirvió
            </button>
            <span v-if="msg.saved" class="saved-badge">✓ Guardado</span>
          </div>
        </div>
        
        <div v-if="isLoading" class="message message-bot">
          <div class="message-content loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </div>
      
      <form @submit.prevent="sendMessage" class="chat-input-area">
        <input 
          type="text" 
          v-model="newMessage" 
          placeholder="Pregúntame algo..." 
          :disabled="isLoading"
          required
        />
        <button type="submit" :disabled="isLoading || !newMessage.trim()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import api from '../api' // Import corregido

const isOpen = ref(false)
const isLoading = ref(false)
const newMessage = ref('')
const messages = ref([])
const messagesContainer = ref(null)

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && messages.value.length === 0) {
    // Mensaje de bienvenida
    messages.value.push({
      role: 'model',
      content: '¡Hola! Soy Lyxa tu asistente con IA. Puedo ayudarte a buscar el estado de las órdenes de servicio técnico y responder tus dudas. ¿En qué te ayudo hoy?'
    })
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  const text = newMessage.value.trim()
  if (!text) return

  // Agregar mensaje del usuario
  messages.value.push({ role: 'user', content: text })
  newMessage.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const res = await api.post('/ai/chat/', {
      messages: messages.value
    })
    
    // Agregar respuesta del bot
    messages.value.push({
      role: 'model',
      content: res.data.message
    })
  } catch (error) {
    console.error("Error AI Chat:", error)
    messages.value.push({
      role: 'model',
      content: 'Lo siento, tuve un problema interno de conexión. Por favor verifica tus credenciales o inténtalo más tarde.'
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const saveSolution = async (index) => {
  if (index <= 0) return
  const question = messages.value[index-1].content
  const solution = messages.value[index].content
  
  try {
    await api.post('/ai/knowledge/', {
      question,
      solution
    })
    messages.value[index].saved = true
  } catch (error) {
    console.error("Error guardando solución:", error)
  }
}
</script>

<style scoped>
.chat-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-color, #4f46e5);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer;
  z-index: 9999;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.chat-btn:hover {
  transform: scale(1.05);
}
.chat-btn-active {
  background: #ef4444;
}

.chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 350px;
  height: 500px;
  max-height: calc(100vh - 120px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.chat-header {
  background: var(--primary-color, #4f46e5);
  color: white;
  padding: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f9fafb;
}

.message {
  max-width: 85%;
  display: flex;
  flex-direction: column;
}

.message-user {
  align-self: flex-end;
}
.message-user .message-content {
  background: var(--primary-color, #4f46e5);
  color: white;
  border-radius: 12px 12px 0 12px;
}

.message-bot {
  align-self: flex-start;
}
.message-bot .message-content {
  background: #e5e7eb;
  color: #1f2937;
  border-radius: 12px 12px 12px 0;
}

.message-content {
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  position: relative;
}

.save-btn {
  display: block;
  margin-top: 8px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: opacity 0.2s;
  opacity: 0.8;
}
.save-btn:hover {
  opacity: 1;
}
.saved-badge {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  color: #059669;
  font-weight: bold;
}

.chat-input-area {
  display: flex;
  padding: 10px;
  background: white;
  border-top: 1px solid #e5e7eb;
}
.chat-input-area input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}
.chat-input-area input:focus {
  border-color: var(--primary-color, #4f46e5);
}
.chat-input-area button {
  background: transparent;
  border: none;
  color: var(--primary-color, #4f46e5);
  font-size: 20px;
  padding: 0 10px;
  cursor: pointer;
}
.chat-input-area button:disabled {
  color: #9ca3af;
}

.loading-dots span {
  animation: dots 1.5s infinite;
  opacity: 0;
}
.loading-dots span:nth-child(2) {
  animation-delay: 0.5s;
}
.loading-dots span:nth-child(3) {
  animation-delay: 1s;
}
@keyframes dots {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
