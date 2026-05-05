<template>
  <div class="admin-layout">
    <div
      v-if="isMobileMenuOpen"
      class="mobile-overlay"
      @click="isMobileMenuOpen = false"
    ></div>

    <aside :class="['sidebar', { open: isMobileMenuOpen }]">
      <div class="sidebar-header">
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
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'router-link-active': $route.path.startsWith(item.to) }"
        >

          <span class="nav-icon" aria-hidden="true">
            <svg
              v-if="item.icon === 'dashboard'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.2" />
              <rect x="14" y="3" width="7" height="4" rx="1.2" />
              <rect x="14" y="10" width="7" height="11" rx="1.2" />
              <rect x="3" y="13" width="7" height="8" rx="1.2" />
            </svg>
            <svg
              v-else-if="item.icon === 'event'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
              <path d="M8.5 14h7M8.5 17h4.5" />
            </svg>
            <svg
              v-else-if="item.icon === 'scanner'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 7V5a2 2 0 0 1 2-2h2" />
              <path d="M19 7V5a2 2 0 0 0-2-2h-2" />
              <path d="M5 17v2a2 2 0 0 0 2 2h2" />
              <path d="M19 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M4 12h16" />
            </svg>
            <svg
              v-else-if="item.icon === 'settings'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="3.2" />
              <path
                d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1.08 1.64V21a2 2 0 0 1-4 0v-.09A1.8 1.8 0 0 0 8.84 19.4a1.8 1.8 0 0 0-1.98.36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.64-1.08H2.9a2 2 0 0 1 0-4H3a1.8 1.8 0 0 0 1.64-1.08 1.8 1.8 0 0 0-.36-1.98l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.8 1.8 0 0 0 8.84 4.6 1.8 1.8 0 0 0 9.92 3V2.9a2 2 0 1 1 4 0V3A1.8 1.8 0 0 0 15 4.6a1.8 1.8 0 0 0 1.98-.36l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.8 1.8 0 0 0 19.4 9a1.8 1.8 0 0 0 1.64 1.08h.09a2 2 0 0 1 0 4h-.09A1.8 1.8 0 0 0 19.4 15Z"
              />
            </svg>
            <svg
              v-else-if="item.icon === 'staff'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span class="nav-label">{{ item.label }}</span>
        </NuxtLink>
        <div v-if="user?.role === 'ADMIN' || user?.role === 'OWNER'" class="nav-divider"></div>

      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="btn-outline w-full logout-btn">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="mobile-menu-btn"
            @click="isMobileMenuOpen = true"
            aria-label="Buka menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div>
            <p class="topbar-kicker">Admin Workspace</p>
            <h3 class="topbar-title">Halo, {{ user?.name || "Admin" }}</h3>
          </div>
        </div>
      </header>

      <div class="page-container">
        <slot />
      </div>

      <footer class="admin-footer">
        <div class="footer-content">
          <p>Copyright &copy; 2026 TY Studio DEV. Allright reserved.</p>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const { appName, appLogoUrl } = useBranding();
const user = ref(null);
const isMobileMenuOpen = ref(false);
const navItems = computed(() => {
  const role = user.value?.role;
  const items = [];

  // Dashboard: ADMIN, OWNER
  if (role === 'ADMIN' || role === 'OWNER') {
    items.push({ to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" });
  }

  // Kelola Event & Scanner: All roles
  items.push(
    { to: "/admin/events", label: "Kelola Event", icon: "event" },
    { to: "/admin/scanner", label: "Scanner QR", icon: "scanner" }
  );

  // Staff: ADMIN, OWNER
  if (role === 'ADMIN' || role === 'OWNER') {
    items.push({ to: "/admin/staff", label: "Manajemen Staff", icon: "staff" });
  }

  // Settings: OWNER
  if (role === 'OWNER') {
    items.push({ to: "/admin/settings", label: "Pengaturan", icon: "settings" });
  }


  return items;
});


onMounted(async () => {
  try {
    const res = await $fetch("/api/auth/me");
    if (res.success) {
      user.value = res.user;
    }
  } catch (e) {
    // handled by middleware
  }
});

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
  },
);

const logout = async () => {
  await $fetch("/api/auth/logout", { method: "POST" });
  const userState = useState("auth_user");
  userState.value = null;
  router.push("/admin/login");
};
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
  background: linear-gradient(
    180deg,
    rgba(12, 24, 46, 0.92),
    rgba(9, 17, 33, 0.96)
  );
  border-right: 1px solid var(--line-soft);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  height: 100dvh; /* Use dynamic viewport height for mobile browsers */
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
  max-width: 180px;
  object-fit: contain;
  margin: 0;
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
  width: 2.05rem;
  height: 2.05rem;
  border-radius: 10px;
  background: rgba(18, 36, 66, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #c7daef;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 1.08rem;
  height: 1.08rem;
}

.nav-label {
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.2;
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

.nav-item:hover .nav-icon,
.nav-item.router-link-active .nav-icon {
  background: rgba(30, 64, 112, 0.85);
  color: #e5f2ff;
  border-color: rgba(125, 211, 252, 0.35);
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

.logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

.logout-btn svg {
  width: 1rem;
  height: 1rem;
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

.admin-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--line-soft);
  background: rgba(8, 17, 32, 0.5);
  backdrop-filter: blur(8px);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-content p {
  color: var(--text-muted);
  font-size: 0.82rem;
  letter-spacing: 0.02em;
}
</style>
