<template>
  <div>
    <div class="hero glass-panel">
      <div>
        <p class="kicker">Overview</p>
        <h1 class="page-title">Dashboard Operasional Ticketing</h1>
        <p class="subtitle">Pantau aktivitas event dan akses modul penting secara cepat dari satu layar.</p>
      </div>
      <NuxtLink to="/admin/events/create" class="btn-primary">Buat Event Baru</NuxtLink>
    </div>

    <div class="stats-grid">
      <article class="glass-panel stat-card">
        <p class="stat-label">Total Event</p>
        <p class="stat-value">--</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Total Pendaftar</p>
        <p class="stat-value">--</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Kehadiran Hari Ini</p>
        <p class="stat-value">--</p>
      </article>
    </div>

    <div class="quick-grid">
      <NuxtLink class="glass-panel quick-card" to="/admin/events">
        <h3>Kelola Event</h3>
        <p>Buat, ubah, dan monitor konfigurasi event beserta pendaftarnya.</p>
      </NuxtLink>
      <NuxtLink class="glass-panel quick-card" to="/admin/scanner">
        <h3>Scanner Kehadiran</h3>
        <p>Gunakan QR scanner untuk proses check-in/check-out peserta.</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})
</script>

<style scoped lang="scss">
.hero {
  padding: 1.1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
}

.kicker {
  color: var(--text-muted);
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-title {
  margin-top: 0.2rem;
  font-size: clamp(1.2rem, 2.4vw, 1.7rem);
}

.subtitle {
  margin-top: 0.35rem;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.stats-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.stat-card {
  padding: 0.95rem;
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.stat-value {
  margin-top: 0.35rem;
  font-size: clamp(1.3rem, 2.6vw, 1.8rem);
  font-weight: 800;
}

.quick-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.quick-card {
  padding: 1rem;
  text-decoration: none;
  border: 1px solid var(--line-soft);
  transition: 0.18s ease;
}

.quick-card h3 {
  font-size: 1rem;
}

.quick-card p {
  margin-top: 0.45rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.quick-card:hover {
  border-color: var(--line-strong);
}

@media (max-width: 900px) {
  .stats-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
