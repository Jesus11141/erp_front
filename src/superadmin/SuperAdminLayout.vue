<template>
  <div class="sa-layout">
    <aside class="sa-sidebar">
      <div class="sa-sidebar-header">
        <span class="sa-logo">⚡ SuperAdmin</span>
      </div>
      <nav class="sa-nav">
        <router-link to="/superadmin" class="sa-nav-item" exact>📊 Dashboard</router-link>
        <router-link to="/superadmin/empresas" class="sa-nav-item">🏢 Empresas</router-link>
        <router-link to="/superadmin/nueva-company" class="sa-nav-item">➕ Nueva Empresa</router-link>
        <router-link to="/superadmin/planes" class="sa-nav-item">💎 Planes</router-link>
      </nav>
      <div class="sa-sidebar-footer">
        <button @click="salir" class="btn-logout">← Salir</button>
      </div>
    </aside>
    <main class="sa-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
function salir() {
  router.push('/dashboard')
}
</script>

<style scoped>
.sa-layout { display: flex; height: 100vh; overflow: hidden; }
.sa-sidebar {
  width: 220px; background: #1a1a2e; display: flex;
  flex-direction: column; flex-shrink: 0;
}
.sa-sidebar-header {
  padding: 1.5rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);
}
.sa-logo { color: #e94560; font-size: 1.1rem; font-weight: 800; }
.sa-nav { flex: 1; padding: 1rem 0; }
.sa-nav-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1.25rem; color: rgba(255,255,255,0.7);
  text-decoration: none; font-size: 0.875rem; transition: all 0.2s;
}
.sa-nav-item:hover, .sa-nav-item.router-link-active {
  background: rgba(233,69,96,0.15); color: #e94560;
}
.sa-sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); }
.btn-logout {
  background: transparent; border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.6); padding: 0.4rem 0.75rem;
  border-radius: 6px; cursor: pointer; font-size: 0.8rem; width: 100%;
}
.sa-main { flex: 1; overflow-y: auto; padding: 2rem; background: #f5f6fa; }
</style>
