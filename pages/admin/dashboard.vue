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
        <p class="stat-label">Pendaftaran Hari Ini</p>
        <p class="stat-value text-blue">{{ formatNumber(summary.todayRegistrations) }}</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Event Akan Hadir</p>
        <p class="stat-value text-green">{{ formatNumber(summary.upcomingCount) }}</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Scan Hari Ini</p>
        <p class="stat-value">{{ formatNumber(summary.todayScans) }}</p>
      </article>
      <article class="glass-panel stat-card">
        <p class="stat-label">Check-In / Out Hari Ini</p>
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
    </div>

    <div class="content-grid">
      <section class="glass-panel content-card chart-card">
        <div class="section-head">
          <h3>Tren Pendaftaran</h3>
          <div class="range-selector">
            <select v-model="selectedRange" class="range-select">
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="1y">1 Tahun Terakhir</option>
            </select>
          </div>
        </div>
        <div class="chart-box">
          <ClientOnly>
            <Line v-if="trendChartData" :data="trendChartData" :options="trendChartOptions" />
            <template #fallback>
              <div class="chart-loading">Memuat chart...</div>
            </template>
          </ClientOnly>
        </div>
      </section>

      <section class="glass-panel content-card chart-card">
        <div class="section-head">
          <h3>Tren Pelaksanaan Event</h3>
          <div class="range-selector">
            <select v-model="selectedEventRange" class="range-select">
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="1y">1 Tahun Terakhir</option>
            </select>
          </div>
        </div>
        <div class="chart-box">
          <ClientOnly>
            <Line v-if="eventTrendChartData" :data="eventTrendChartData" :options="eventTrendChartOptions" />
            <template #fallback>
              <div class="chart-loading">Memuat chart...</div>
            </template>
          </ClientOnly>
        </div>
      </section>

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
              <ClientOnly>
                <p class="item-meta">{{ ticket.event?.name || "-" }} • {{ formatDateTime(ticket.createdAt) }}</p>
              </ClientOnly>
            </div>
            <div class="item-right">
              <span :class="['badge', ticket.status === 'APPROVED' ? 'badge-green' : ticket.status === 'REJECTED' ? 'badge-red' : 'badge-yellow']">
                {{ ticket.status }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="glass-panel content-card full-width">
        <div class="section-head">
          <h3>Log Scan Terbaru</h3>
          <ClientOnly>
            <span class="updated-at">Update: {{ generatedAtLabel }}</span>
          </ClientOnly>
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
                <td>
                  <ClientOnly>
                    {{ formatDateTime(scan.scannedAt) }}
                    <template #fallback>-</template>
                  </ClientOnly>
                </td>
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
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
)

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const selectedRange = ref('7d')
const selectedEventRange = ref('7d')

const { data: response, pending, error } = useFetch(() => `/api/admin/dashboard?range=${selectedRange.value}&eventRange=${selectedEventRange.value}`, {
  key: 'admin-dashboard-overview',
  watch: [selectedRange, selectedEventRange],
  retry: 0,
  timeout: 7000,
})

useHead({
  title: "Dashboard Operasional",
});

const summary = computed(() => response.value?.summary || {
  totalEvents: 0,
  totalRegistrations: 0,
  totalApproved: 0,
  totalPending: 0,
  totalRejected: 0,
  todayRegistrations: 0,
  todayScans: 0,
  todayCheckIns: 0,
  todayCheckOuts: 0,
  upcomingCount: 0
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

const getChartColors = (index) => {
  const colors = [
    { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
  ]
  return colors[index % colors.length]
};

const trendChartData = computed(() => {
  if (!response.value?.trend?.eventDatasets) return null;
  
  return {
    labels: response.value.trend.labels,
    datasets: response.value.trend.eventDatasets.map((ds, idx) => {
      const color = getChartColors(idx)
      return {
        label: ds.name,
        backgroundColor: color.bg,
        borderColor: color.border,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        fill: true,
        tension: 0.4,
        data: ds.data
      }
    })
  }
});

const trendChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { 
      display: true,
      position: 'top',
      align: 'end',
      labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true, boxWidth: 6, padding: 15 }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      padding: 10,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#fff',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
}));

const eventTrendChartData = computed(() => {
  if (!response.value?.eventTrend) return null;
  return {
    labels: response.value.eventTrend.labels,
    datasets: [
      {
        label: 'Jumlah Event',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderColor: '#22c55e',
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
        fill: true,
        tension: 0.4,
        data: response.value.eventTrend.data
      }
    ]
  }
});

const eventTrendChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        afterLabel: (context) => {
          const index = context.dataIndex;
          const names = response.value?.eventTrend?.names?.[index];
          if (names && names.length > 0) {
            return ['', 'Event:', ...names.map(n => `• ${n}`)];
          }
          return '';
        }
      }
    }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
}));

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

.text-blue { color: #3b82f6; }
.text-green { color: #22c55e; }

.range-select {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--line-soft);
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
  transition: 0.2s;
}

.range-select:hover {
  border-color: #3b82f6;
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
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
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
  overflow-y: auto;
  max-height: 400px;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
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

.badge-red {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-box {
  flex: 1;
  min-height: 240px;
  position: relative;
  width: 100%;
}

.doughnut-box {
  display: flex;
  justify-content: center;
}

.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

@media (max-width: 900px) {
  .stats-grid,
  .quick-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
