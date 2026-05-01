<template>
  <div class="landing-page">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="container nav-content">
        <div class="logo">
          <img
            v-if="appLogoUrl"
            :src="appLogoUrl"
            :alt="appName"
            class="landing-logo"
          />
          <span v-else class="gradient-text font-bold">{{ appName }}</span>
        </div>
        <div class="nav-links">
          <NuxtLink to="/admin" class="btn-outline">Login Admin</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero container">
      <div class="hero-content">
        <div class="badge">Sistem Ticketing Masa Depan</div>
        <h1 class="hero-title">
          Kelola Event Anda dengan <br />
          <span class="gradient-text">Aman & Elegan</span>
        </h1>
        <p class="hero-subtitle">
          {{ appTagline }}. Platform ticketing profesional dengan Form Generator Dinamis,
          QR Code Anti-Duplikasi, dan perlindungan Race-Condition tingkat lanjut.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/admin/events/create" class="btn-primary">Buat Event Sekarang</NuxtLink>
          <NuxtLink to="/admin/scanner" class="btn-outline ml-3">Coba Scanner</NuxtLink>
        </div>
      </div>
      
      <div class="hero-image-wrapper">
        <div class="glow-sphere"></div>
        <div class="glass-panel mockup-panel">
          <div class="mockup-header">
            <div class="dot red"></div>
            <div class="dot yellow"></div>
            <div class="dot green"></div>
          </div>
          <div class="mockup-body">
            <div class="qr-placeholder">
              <div class="scan-line"></div>
            </div>
            <div class="status-badge valid">Status: MASUK</div>
            <p class="mockup-text">Race Condition Protected</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features container">
      <div class="section-header">
        <h2>Fitur <span class="gradient-text">Unggulan</span></h2>
        <p>Dirancang khusus untuk keamanan dan fleksibilitas maksimum.</p>
      </div>

      <div class="features-grid">
        <div class="glass-panel feature-card">
          <div class="icon-wrapper">🚀</div>
          <h3>Form Dinamis</h3>
          <p>Generator form cerdas layaknya Google Form. Sesuaikan field registrasi sesuai kebutuhan tiap event.</p>
        </div>
        <div class="glass-panel feature-card">
          <div class="icon-wrapper">🛡️</div>
          <h3>Atomic Security</h3>
          <p>Bebas dari bug Spam Scan. Teknologi Atomic Transaction mencegah manipulasi check-in bersamaan.</p>
        </div>
        <div class="glass-panel feature-card">
          <div class="icon-wrapper">📱</div>
          <h3>Smart Scanner</h3>
          <p>Toggle cerdas untuk deteksi Masuk/Keluar. Konfirmasi ganda untuk akurasi data kehadiran.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const { appName, appTagline, appLogoUrl } = useBranding();
</script>

<style scoped lang="scss">
.landing-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Navbar */
.navbar {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--glass-border);
  background: rgba(2, 6, 23, 0.8);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo span {
  font-size: 1.5rem;
}

.landing-logo {
  max-height: 42px;
  max-width: 170px;
  object-fit: contain;
}

/* Hero Section */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6rem 2rem;
  gap: 4rem;
}

.hero-content {
  flex: 1;
}

.badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 9999px;
  font-size: 0.875rem;
  color: var(--primary);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 3.5rem;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  font-weight: 800;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--text-muted);
  margin-bottom: 2.5rem;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

/* Mockup */
.hero-image-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.glow-sphere {
  position: absolute;
  width: 300px;
  height: 300px;
  background: var(--primary);
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
}

.mockup-panel {
  width: 320px;
  position: relative;
  z-index: 10;
  background: rgba(15, 23, 42, 0.8);
  transform: rotate(-5deg);
}

.mockup-header {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.red { background: #ef4444; }
.yellow { background: #eab308; }
.green { background: #22c55e; }

.mockup-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-placeholder {
  width: 150px;
  height: 150px;
  background: white;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  padding: 10px;
  background-image: 
    linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000),
    linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  opacity: 0.8;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--primary);
  box-shadow: 0 0 10px var(--primary);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.875rem;
}

.status-badge.valid {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid #22c55e;
}

.mockup-text {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Features Section */
.features {
  padding: 5rem 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.section-header p {
  color: var(--text-muted);
  font-size: 1.125rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.icon-wrapper {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.feature-card h3 {
  font-size: 1.25rem;
}

.feature-card p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    text-align: center;
    padding: 4rem 2rem;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .mockup-panel {
    transform: none;
    margin-top: 2rem;
  }
}
</style>
