<template>
  <div>
    <div class="hero glass-panel">
      <div>
        <p class="kicker">Overview</p>
        <h1 class="page-title">Dashboard Operasional Ticketing</h1>
        <p class="subtitle">
          Pantau aktivitas event, pendaftaran, dan kehadiran peserta secara real-time dari satu layar.
        </p>
      </div>
      <div class="hero-actions">
        <NuxtLink to="/admin/events/create" class="btn-primary">Buat Event Baru</NuxtLink>
        <NuxtLink to="/admin/scanner" class="btn-outline">Buka Scanner</NuxtLink>
      </div>
    </div>

    <div v-if="pending" class="glass-panel state-box">Memuat ringkasan dashboard...</div>
    <div v-else-if="error" class="glass-panel state-box error">Gagal memuat data dashboard.</div>

    <template v-else>
    <div class="stats-grid">
      <article class="glass-panel stat-card">
        <p class="stat-label">Total Event</p>
        <p class="stat-value">{{ formatNumber(summary.totalEvents) }}</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Total Pendaftar</p>
        <p class="stat-value">{{ formatNumber(summary.totalRegistrations) }}</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Scan Hari Ini</p>
        <p class="stat-value">{{ formatNumber(summary.todayScans) }}</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Pendaftaran Hari Ini</p>
        <p class="stat-value">{{ formatNumber(summary.todayRegistrations) }}</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Approved / Pending</p>
        <p class="stat-value">{{ formatNumber(summary.totalApproved) }} / {{ formatNumber(summary.totalPending) }}</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Masuk / Keluar Hari Ini</p>
        <p class="stat-value">{{ formatNumber(summary.todayCheckIns) }} / {{ formatNumber(summary.todayCheckOuts) }}</p>
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
      <NuxtLink class="glass-panel quick-card" to="/admin/events" >
        <h3>Data Pendaftar</h3>
        <p>Review data registrasi, approval tiket, dan bukti pembayaran peserta.</p>
      </NuxtLink>
      <NuxtLink
        v-if="userRole === 'ADMIN'"
        class="glass-panel quick-card"
        to="/admin/settings"
      >
        <h3>Pengaturan Sistem</h3>
        <p>Kelola branding, SMTP, secret aplikasi, dan pengaturan operasional.</p>
      </NuxtLink>
    </div>

    <div class="content-grid">
      <section class="glass-panel content-card">
        <div class="section-head">
          <h3>Event Terbaru</h3>
          <NuxtLink to="/admin/events" class="link-inline">Lihat Semua</NuxtLink>
        </div>
        <div v-if="!recentEvents.length" class="empty-box">Belum ada event.</div>
        <div v-else class="list-wrap">
          <div v-for="eventItem in recentEvents" :key="eventItem.id" class="list-item">
            <div>
              <p class="item-title">{{ eventItem.name }}</p>
              <p class="item-meta">
                /form/{{ eventItem.slug }} •
                {{ eventItem.quota ? `Kuota ${eventItem.quota}` : "Kuota tak terbatas" }}
              </p>
            </div>
            <div class="item-right">
              <span class="badge badge-gray">{{ eventItem.totalTickets }} pendaftar</span>
            </div>
          </div>
        </div>
      </section>

      <section class="glass-panel content-card">
        <div class="section-head">
          <h3>Pendaftaran Terbaru</h3>
        </div>
        <div v-if="!recentRegistrations.length" class="empty-box">Belum ada pendaftaran.</div>
        <div v-else class="list-wrap">
          <div v-for="ticket in recentRegistrations" :key="ticket.id" class="list-item">
            <div>
              <p class="item-title">{{ ticket.registrantName }}</p>
              <p class="item-meta">{{ ticket.event?.name || "-" }} • {{ formatDateTime(ticket.createdAt) }}</p>
            </div>
            <div class="item-right">
              <span :class="['badge', ticket.status === 'APPROVED' ? 'badge-green' : 'badge-yellow']">
                {{ ticket.status }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="glass-panel content-card full-width">
        <div class="section-head">
          <h3>Log Scan Terbaru</h3>
          <span class="updated-at">Update: {{ generatedAtLabel }}</span>
        </div>
        <div v-if="!recentScans.length" class="empty-box">Belum ada aktivitas scan.</div>
        <div v-else class="scan-table-wrap">
          <table class="scan-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Peserta</th>
                <th>Event</th>
                <th>Aksi</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="scan in recentScans" :key="scan.id">
                <td>{{ formatDateTime(scan.scannedAt) }}</td>
                <td>{{ scan.ticket?.registrantName || "-" }}</td>
                <td>{{ scan.ticket?.event?.name || "-" }}</td>
                <td>
                  <span :class="['badge', scan.action === 'MASUK' ? 'badge-green' : 'badge-yellow']">
                    {{ scan.action }}
                  </span>
                </td>
                <td>{{ scan.scannedBy || "Panitia" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { data: response, pending, error } = useFetch('/api/admin/dashboard', {
  key: 'admin-dashboard-overview',
  retry: 0,
  timeout: 7000,
})

const summary = computed(() => response.value?.summary || {
  totalEvents: 0,
  totalRegistrations: 0,
  totalApproved: 0,
  totalPending: 0,
  todayRegistrations: 0,
  todayScans: 0,
  todayCheckIns: 0,
  todayCheckOuts: 0,
})

const recentEvents = computed(() => response.value?.recentEvents || [])
const recentRegistrations = computed(() => response.value?.recentRegistrations || [])
const recentScans = computed(() => response.value?.recentScans || [])
const userRole = computed(() => String(response.value?.user?.role || 'PANITIA'))
const generatedAtLabel = computed(() => {
  const raw = response.value?.generatedAt
  if (!raw) return '-'
  return new Date(raw).toLocaleString('id-ID')
})

const formatNumber = (value) => {
  const num = Number(value || 0)
  return new Intl.NumberFormat('id-ID').format(Number.isFinite(num) ? num : 0)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}
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

.hero-actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.state-box {
  margin-top: 1rem;
  padding: 1rem;
  color: var(--text-muted);
}

.state-box.error {
  color: #ffd3dc;
  border: 1px solid rgba(251, 113, 133, 0.34);
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

.content-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.content-card {
  padding: 0.95rem;
  min-width: 0;
}

.full-width {
  grid-column: 1 / -1;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.75rem;
}

.section-head h3 {
  font-size: 1rem;
}

.link-inline {
  color: #7ddcff;
  text-decoration: none;
  font-size: 0.84rem;
}

.link-inline:hover {
  text-decoration: underline;
}

.updated-at {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.empty-box {
  border: 1px dashed var(--line-soft);
  border-radius: 10px;
  padding: 0.9rem;
  color: var(--text-muted);
  font-size: 0.87rem;
}

.list-wrap {
  display: grid;
  gap: 0.55rem;
}

.list-item {
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.68rem 0.74rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.item-title {
  font-weight: 700;
  font-size: 0.93rem;
}

.item-meta {
  margin-top: 0.22rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.item-right {
  flex-shrink: 0;
}

.badge {
  padding: 0.25rem 0.52rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
}

.badge-green {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.badge-yellow {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

.badge-gray {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}

.scan-table-wrap {
  overflow-x: auto;
}

.scan-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.scan-table th,
.scan-table td {
  border-bottom: 1px solid var(--line-soft);
  padding: 0.6rem 0.45rem;
  text-align: left;
  font-size: 0.84rem;
}

.scan-table th {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

@media (max-width: 900px) {
  .stats-grid,
  .quick-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
