<template>
  <div class="landing-page">
    <nav class="navbar">
      <div class="container nav-shell">
        <NuxtLink to="/" class="brand" aria-label="Beranda">
          <img v-if="appLogoUrl" :src="appLogoUrl" :alt="appName" class="landing-logo" />
          <span v-else class="gradient-text brand-name">{{ appName }}</span>
        </NuxtLink>
        <div class="nav-actions">
          <NuxtLink to="/admin/login" class="btn-outline">Login Admin</NuxtLink>
        </div>
      </div>
    </nav>

    <section class="hero container">
      <div class="hero-copy">
        <p class="kicker">Ticketing Platform</p>
        <h1 class="hero-title">
          Event operation yang cepat, rapi, dan
          <span class="gradient-text">siap skala</span>.
        </h1>
        <p class="hero-subtitle">
          {{ appTagline }}. Kelola registrasi, distribusi QR ticket, dan proses check-in/out
          dalam satu dashboard profesional.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/admin/events/create" class="btn-primary">Buat Event</NuxtLink>
          <NuxtLink to="/admin/scanner" class="btn-outline">Buka Scanner</NuxtLink>
        </div>
      </div>

      <div class="hero-visual glass-panel">
        <div class="visual-head">
          <span class="chip">Live Scanner</span>
          <span class="chip muted">Secure Session</span>
        </div>
        <div class="stat-grid">
          <article class="stat-card">
            <p class="stat-label">Verifikasi</p>
            <p class="stat-value">2.4s</p>
            <p class="stat-note">rata-rata waktu scan</p>
          </article>
          <article class="stat-card">
            <p class="stat-label">Akurasi</p>
            <p class="stat-value">99.9%</p>
            <p class="stat-note">deduplikasi QR check-in</p>
          </article>
          <article class="stat-card">
            <p class="stat-label">Sinkronisasi</p>
            <p class="stat-value">Realtime</p>
            <p class="stat-note">status masuk dan keluar</p>
          </article>
          <article class="stat-card">
            <p class="stat-label">Mode</p>
            <p class="stat-value">Web + Mobile</p>
            <p class="stat-note">siap operasional lapangan</p>
          </article>
        </div>
      </div>
    </section>

    <section class="features container">
      <div class="section-head">
        <p class="kicker">Core Features</p>
        <h2>Dibangun untuk standar operasional event modern</h2>
      </div>
      <div class="features-grid">
        <article class="glass-panel feature-card">
          <span class="feature-icon">FM</span>
          <h3>Form Dinamis</h3>
          <p>Susun field registrasi sesuai kebutuhan masing-masing event tanpa coding manual.</p>
        </article>
        <article class="glass-panel feature-card">
          <span class="feature-icon">SC</span>
          <h3>Secure Check-in</h3>
          <p>Validasi anti-duplikasi dengan alur konfirmasi masuk/keluar yang jelas dan cepat.</p>
        </article>
        <article class="glass-panel feature-card">
          <span class="feature-icon">BR</span>
          <h3>Brand Ready</h3>
          <p>Semua identitas aplikasi mengikuti setting branding agar tampilan tetap konsisten.</p>
        </article>
      </div>
    </section>

    <section class="flow container">
      <div class="flow-shell glass-panel">
        <div class="flow-head">
          <p class="kicker">Workflow</p>
          <h2>Alur operasional yang sederhana untuk tim lapangan</h2>
        </div>
        <div class="flow-grid">
          <article class="flow-step">
            <span class="flow-index">01</span>
            <h3>Setup Event</h3>
            <p>Buat event, atur kuota, dan form registrasi dalam satu panel.</p>
          </article>
          <article class="flow-step">
            <span class="flow-index">02</span>
            <h3>Distribusi Ticket</h3>
            <p>Peserta menerima QR ticket melalui alur registrasi dan email otomatis.</p>
          </article>
          <article class="flow-step">
            <span class="flow-index">03</span>
            <h3>Scan On-Site</h3>
            <p>Tim scan QR secara realtime dengan status kehadiran yang langsung ter-update.</p>
          </article>
        </div>
      </div>
    </section>

    <footer class="landing-footer">
      <div class="container footer-shell">
        <div class="footer-top">
          <NuxtLink to="/" class="brand">
            <img
              v-if="appLogoUrl"
              :src="appLogoUrl"
              :alt="appName"
              class="landing-logo"
            />
            <span v-else class="gradient-text brand-name">{{ appName }}</span>
          </NuxtLink>
          <p class="footer-tagline">{{ appTagline }}</p>
        </div>
        <div class="footer-bottom">
          <p>Copyright &copy; 2026 TY Studio DEV. Allright reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const { appName, appTagline, appLogoUrl } = useBranding();
</script>

<style scoped lang="scss">
.landing-page {
  min-height: 100vh;
  position: relative;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(10px);
  background: rgba(8, 17, 32, 0.82);
}

.nav-shell {
  min-height: 74px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.9rem;
}

.brand {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.brand-name {
  font-size: 1.35rem;
  font-weight: 800;
}

.landing-logo {
  max-width: 210px;
  max-height: 48px;
  object-fit: contain;
}

.hero {
  padding-top: clamp(3rem, 6vw, 5rem);
  padding-bottom: clamp(3rem, 6vw, 4.8rem);
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(1.2rem, 3vw, 2.5rem);
  align-items: center;
}

.kicker {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-size: 0.74rem;
  font-weight: 700;
}

.hero-title {
  margin-top: 0.7rem;
  font-size: clamp(2rem, 4.8vw, 3.6rem);
  line-height: 1.12;
}

.hero-subtitle {
  margin-top: 1rem;
  max-width: 590px;
  color: var(--text-muted);
  font-size: clamp(0.97rem, 1.8vw, 1.07rem);
}

.hero-actions {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.hero-visual {
  padding: 1rem;
}

.visual-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
}

.chip {
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  padding: 0.38rem 0.65rem;
  font-size: 0.76rem;
  background: rgba(8, 18, 34, 0.7);
}

.chip.muted {
  color: var(--text-muted);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.stat-card {
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 0.85rem;
  background: rgba(8, 18, 34, 0.62);
}

.stat-label {
  font-size: 0.76rem;
  color: var(--text-muted);
}

.stat-value {
  margin-top: 0.35rem;
  font-size: 1.12rem;
  font-weight: 800;
}

.stat-note {
  margin-top: 0.22rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.features {
  padding-bottom: clamp(2.8rem, 6vw, 4rem);
}

.section-head {
  max-width: 740px;
  margin-bottom: 1.25rem;
}

.section-head h2 {
  margin-top: 0.45rem;
  font-size: clamp(1.35rem, 3vw, 2rem);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.feature-card {
  padding: 1rem;
  border-radius: 14px;
}

.feature-icon {
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(15, 38, 62, 0.85);
  font-size: 0.76rem;
  font-weight: 700;
  color: #c2e8ff;
}

.feature-card h3 {
  margin-top: 0.75rem;
  font-size: 1.08rem;
}

.feature-card p {
  margin-top: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.flow {
  padding-bottom: clamp(2.8rem, 5vw, 4rem);
}

.flow-shell {
  padding: 1rem;
}

.flow-head h2 {
  margin-top: 0.4rem;
  font-size: clamp(1.3rem, 2.8vw, 1.75rem);
}

.flow-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.flow-step {
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 0.9rem;
  background: rgba(8, 18, 34, 0.52);
}

.flow-index {
  font-size: 0.78rem;
  color: #9fd8ff;
  font-weight: 700;
}

.flow-step h3 {
  margin-top: 0.5rem;
  font-size: 1rem;
}

.flow-step p {
  margin-top: 0.4rem;
  color: var(--text-muted);
  font-size: 0.89rem;
}

.cta {
  padding-bottom: clamp(3rem, 6vw, 4.5rem);
}

.cta-card {
  padding: 1.1rem;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.cta-card h2 {
  margin-top: 0.35rem;
  font-size: clamp(1.2rem, 2.6vw, 1.7rem);
  max-width: 700px;
}

@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .features-grid,
  .flow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .container {
    padding: 0 0.9rem;
  }

  .nav-shell {
    min-height: 66px;
  }

  .landing-logo {
    max-width: 174px;
    max-height: 42px;
  }

  .hero-actions .btn-primary,
  .hero-actions .btn-outline {
    width: 100%;
  }

  .stat-grid,
  .features-grid,
  .flow-grid {
    grid-template-columns: 1fr;
  }

  .cta-card .btn-primary {
    width: 100%;
  }
}

.landing-footer {
  margin-top: 2rem;
  border-top: 1px solid var(--line-soft);
  background: rgba(8, 17, 32, 0.45);
  padding: clamp(2rem, 5vw, 3.5rem) 0;
}

.footer-shell {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.footer-top {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.footer-tagline {
  color: var(--text-muted);
  font-size: 0.95rem;
  max-width: 450px;
}

.footer-bottom {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  text-align: center;
}

.footer-bottom p {
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>
