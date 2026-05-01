<template>
  <div class="admin-layout">
    <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="isMobileMenuOpen = false"></div>

    <aside :class="['sidebar', { open: isMobileMenuOpen }]">
      <div class="sidebar-header">
        <p class="brand-kicker">Ticketing Suite</p>
        <img
          v-if="appLogoUrl"
          :src="appLogoUrl"
          :alt="appName"
          class="brand-logo"
        />
        <h2 v-else class="brand-title gradient-text">{{ appName }}</h2>
        <p class="brand-subtitle">Panel Operasional</p>
      </div>

      <nav class="sidebar-nav" @click="isMobileMenuOpen = false">
        <NuxtLink to="/admin/dashboard" class="nav-item">
          <span class="nav-icon">DB</span>
          <span>Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/admin/events" class="nav-item">
          <span class="nav-icon">EV</span>
          <span>Kelola Event</span>
        </NuxtLink>
        <NuxtLink to="/admin/scanner" class="nav-item">
          <span class="nav-icon">QR</span>
          <span>Scanner QR</span>
        </NuxtLink>
        <div class="nav-divider"></div>
        <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/settings" class="nav-item">
          <span class="nav-icon">ST</span>
          <span>Pengaturan</span>
        </NuxtLink>
        <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/staff" class="nav-item">
          <span class="nav-icon">SF</span>
          <span>Manajemen Staff</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="btn-outline w-full">Logout</button>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="isMobileMenuOpen = true" aria-label="Buka menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div>
            <p class="topbar-kicker">Admin Workspace</p>
            <h3 class="topbar-title">Halo, {{ user?.name || 'Admin' }}</h3>
          </div>
        </div>
      </header>

      <div class="page-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { appName, appLogoUrl } = useBranding()
const user = ref(null)
const isMobileMenuOpen = ref(false)

onMounted(async () => {
  try {
    const res = await $fetch('/api/auth/me')
    if (res.success) {
      user.value = res.user
    }
  } catch (e) {
    // handled by middleware
  }
})

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
  }
)

const logout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  router.push('/admin/login')
}
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow-x: hidden;
}

.mobile-overlay {
  display: none;
}

.sidebar {
  width: 284px;
  background: linear-gradient(180deg, rgba(12, 24, 46, 0.92), rgba(9, 17, 33, 0.96));
  border-right: 1px solid var(--line-soft);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: transform 0.25s ease;
}

.sidebar-header {
  padding: 1.8rem 1.35rem 1.2rem;
  border-bottom: 1px solid var(--line-soft);
}

.brand-kicker {
  color: var(--text-muted);
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.brand-title {
  font-size: 1.58rem;
  line-height: 1.2;
  margin: 0.15rem 0;
}

.brand-logo {
  max-width: 160px;
  max-height: 42px;
  object-fit: contain;
  margin: 0.15rem 0;
}

.brand-subtitle {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.sidebar-nav {
  flex: 1;
  padding: 1.15rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.72rem;
  padding: 0.7rem 0.8rem;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: 10px;
  transition: 0.18s ease;
  border: 1px solid transparent;
}

.nav-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 9px;
  background: rgba(18, 36, 66, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #bcd3ef;
}

.nav-item:hover,
.nav-item.router-link-active {
  background: rgba(15, 31, 57, 0.9);
  border-color: var(--line-soft);
  color: #edf4ff;
}

.nav-item.router-link-active {
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: inset 0 0 0 1px rgba(20, 184, 166, 0.35);
}

.nav-divider {
  border-top: 1px solid var(--line-soft);
  margin: 1rem 0;
}

.sidebar-footer {
  padding: 1rem 0.9rem 1.25rem;
  border-top: 1px solid var(--line-soft);
}

.main-content {
  flex: 1;
  margin-left: 284px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  min-width: 0;
}

.topbar {
  border-bottom: 1px solid var(--line-soft);
  background: rgba(8, 17, 32, 0.75);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  padding: 0.9rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 9;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 4px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: rgba(10, 20, 37, 0.9);
  padding: 9px;
  cursor: pointer;
}

.mobile-menu-btn span {
  display: block;
  height: 2px;
  width: 100%;
  background: #b7cbe7;
  border-radius: 2px;
}

.topbar-kicker {
  color: var(--text-muted);
  font-size: 0.74rem;
}

.topbar-title {
  font-size: 1.12rem;
  font-weight: 700;
}

.page-container {
  padding: 1.4rem;
  flex: 1;
  max-width: 100%;
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(5, 10, 20, 0.68);
    backdrop-filter: blur(3px);
    z-index: 999;
  }

  .main-content {
    margin-left: 0;
  }

  .topbar {
    padding: 0.75rem 0.9rem;
  }

  .mobile-menu-btn {
    display: inline-flex;
  }

  .page-container {
    padding: 0.9rem;
  }
}
</style>
