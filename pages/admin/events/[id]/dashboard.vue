<template>
  <div class="dashboard-page">
    <div class="header-action">
      <h1 class="page-title">
        Dashboard Event: {{ event?.name || "Loading..." }}
      </h1>
      <div class="header-buttons">
        <NuxtLink :to="`/admin/events/${eventId}/tickets`" class="btn-outline">Ke Daftar Pendaftar</NuxtLink>
        <NuxtLink to="/admin/events" class="btn-outline">Kembali ke Event</NuxtLink>
      </div>
    </div>

    <div v-if="pending" class="text-center py-8">Memuat data dashboard...</div>
    <div v-else-if="error" class="text-center py-8 text-red">
      Gagal memuat data dashboard.
    </div>

    <div v-else class="dashboard-content mt-4">
      <!-- Top Metrics Overview -->
      <div class="metrics-grid">
        <!-- Total Registration / Quota -->
        <div class="metric-card glass-panel">
          <div class="metric-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="metric-info">
            <h3>Total Pendaftar</h3>
            <div class="metric-value">
              {{ metrics.total }} <span v-if="event.quota" class="quota-text">/ {{ event.quota }}</span>
            </div>
            <p v-if="event.quota" class="metric-desc">
              Tersisa {{ Math.max(0, event.quota - metrics.total) }} kuota
            </p>
            <p v-else class="metric-desc">Kuota tidak terbatas</p>
          </div>
        </div>

        <!-- Approved Tickets -->
        <div class="metric-card glass-panel">
          <div class="metric-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="metric-info">
            <h3>Disetujui (Approved)</h3>
            <div class="metric-value">{{ metrics.approved }}</div>
            <p class="metric-desc">Tiket aktif dan valid</p>
          </div>
        </div>

        <!-- Pending Tickets -->
        <div class="metric-card glass-panel">
          <div class="metric-icon yellow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="metric-info">
            <h3>Menunggu Persetujuan</h3>
            <div class="metric-value">{{ metrics.pending }}</div>
            <p class="metric-desc">Butuh verifikasi admin</p>
          </div>
        </div>

        <!-- Revenue (if paid) -->
        <div v-if="event.isPaid" class="metric-card glass-panel">
          <div class="metric-icon emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="metric-info">
            <h3>Estimasi Pendapatan</h3>
            <div class="metric-value">{{ formatPrice(metrics.revenue) }}</div>
            <p class="metric-desc">Dari {{ metrics.approved }} tiket approved</p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="dashboard-grid mt-6">
        <div class="dashboard-card glass-panel chart-container">
          <h2 class="section-title">Tren Pendaftaran (7 Hari)</h2>
          <div style="position: relative; height: 260px; width: 100%;">
            <Line v-if="trendChartData" :data="trendChartData" :options="trendChartOptions" />
          </div>
        </div>

        <div class="dashboard-card glass-panel chart-container">
          <h2 class="section-title">Distribusi Status Tiket</h2>
          <div style="position: relative; height: 260px; width: 100%; display: flex; justify-content: center;">
            <Doughnut v-if="statusChartData" :data="statusChartData" :options="statusChartOptions" />
          </div>
        </div>
      </div>

      <!-- Attendance Chart Section -->
      <div class="mt-6">
        <div class="dashboard-card glass-panel chart-container">
          <h2 class="section-title">Tren Kehadiran Pendaftar (7 Hari Terakhir)</h2>
          <div style="position: relative; height: 260px; width: 100%;">
            <Line v-if="attendanceChartData" :data="attendanceChartData" :options="attendanceChartOptions" />
          </div>
        </div>
      </div>

      <div class="dashboard-grid mt-6">
        <!-- Check-in Statistics -->
        <div class="dashboard-card glass-panel">
          <h2 class="section-title">Status Kehadiran (Check-In)</h2>
          <div class="checkin-stats">
            <div class="checkin-item">
              <span class="checkin-label">Belum Hadir</span>
              <span class="checkin-value text-gray">{{ metrics.notArrived }}</span>
            </div>
            <div class="checkin-item">
              <span class="checkin-label">Sudah Masuk (Di Dalam)</span>
              <span class="checkin-value text-green">{{ metrics.checkin }}</span>
            </div>
            <div class="checkin-item">
              <span class="checkin-label">Sudah Keluar</span>
              <span class="checkin-value text-yellow">{{ metrics.checkout }}</span>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-4">
            <div class="progress-labels">
              <span>Tingkat Kehadiran</span>
              <span>{{ attendancePercentage }}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: `${attendancePercentage}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Recent Registrations -->
        <div class="dashboard-card glass-panel">
          <div class="flex-between mb-4">
            <h2 class="section-title" style="margin-bottom: 0;">Pendaftar Terbaru</h2>
            <NuxtLink :to="`/admin/events/${eventId}/tickets`" class="text-blue text-sm">Lihat Semua</NuxtLink>
          </div>
          <div v-if="!recentRegistrations.length" class="text-muted text-center py-4">Belum ada pendaftar</div>
          <div v-else class="recent-list">
            <div v-for="ticket in recentRegistrations" :key="ticket.id" class="recent-item">
              <div class="recent-info">
                <p class="recent-name">{{ ticket.registrantName }}</p>
                <p class="recent-email">{{ ticket.registrantEmail }}</p>
                <p class="recent-time">{{ new Date(ticket.createdAt).toLocaleString("id-ID") }}</p>
              </div>
              <div class="recent-status">
                <span :class="['badge', getStatusBadgeClass(ticket.status)]">
                  {{ ticket.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
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
  ArcElement,
  Filler
)

definePageMeta({ layout: "admin", middleware: "auth" });
const route = useRoute();
const eventId = route.params.id;

const {
  data: response,
  pending,
  error,
} = useFetch(`/api/event/${eventId}/dashboard`, {
  key: `admin-dashboard-${eventId}`,
  retry: 0,
});

const event = computed(() => response.value?.event || {});
const metrics = computed(() => response.value?.metrics || {
  total: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
  checkin: 0,
  checkout: 0,
  notArrived: 0,
  revenue: 0
});
const recentRegistrations = computed(() => response.value?.recentRegistrations || []);

const attendancePercentage = computed(() => {
  if (metrics.value.approved === 0) return 0;
  // Calculate attendance based on approved tickets
  const percentage = (metrics.value.checkin / metrics.value.approved) * 100;
  return percentage > 100 ? 100 : Math.round(percentage);
});

const formatPrice = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const getStatusBadgeClass = (status) => {
  if (status === "APPROVED") return "badge-green";
  if (status === "PENDING") return "badge-yellow";
  if (status === "REJECTED") return "badge-red";
  return "badge-gray";
};

// --- Charts Setup ---
const trendChartData = computed(() => {
  if (!response.value?.trend) return null;
  return {
    labels: response.value.trend.labels,
    datasets: [
      {
        label: 'Pendaftar Baru',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6',
        fill: true,
        tension: 0.4, // Smooth curve
        data: response.value.trend.data
      }
    ]
  }
});

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
};

const statusChartData = computed(() => {
  return {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
        hoverBackgroundColor: ['#16a34a', '#eab308', '#dc2626'],
        borderWidth: 0,
        data: [metrics.value.approved, metrics.value.pending, metrics.value.rejected]
      }
    ]
  }
});

const statusChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20, usePointStyle: true } }
  }
};

const attendanceChartData = computed(() => {
  if (!response.value?.trend) return null;
  return {
    labels: response.value.trend.labels,
    datasets: [
      {
        label: 'Sudah Masuk',
        borderColor: '#4ade80', // Green
        backgroundColor: '#4ade80',
        pointBackgroundColor: '#4ade80',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4ade80',
        tension: 0.4,
        fill: false,
        data: response.value.trend.masuk
      },
      {
        label: 'Sudah Keluar',
        borderColor: '#facc15', // Yellow
        backgroundColor: '#facc15',
        pointBackgroundColor: '#facc15',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#facc15',
        tension: 0.4,
        fill: false,
        data: response.value.trend.keluar
      },
      {
        label: 'Belum Hadir',
        borderColor: '#94a3b8', // Gray
        backgroundColor: '#94a3b8',
        pointBackgroundColor: '#94a3b8',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#94a3b8',
        tension: 0.4,
        fill: false,
        borderDash: [5, 5], // Dashed line for not arrived
        data: response.value.trend.belumHadir
      }
    ]
  }
});

const attendanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20, usePointStyle: true } },
    tooltip: { mode: 'index', intersect: false }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
};
</script>

<style scoped lang="scss">
.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
}

.header-buttons {
  display: flex;
  gap: 0.75rem;
}

.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.py-4 { padding: 1rem 0; }
.py-8 { padding: 2rem 0; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-red { color: #ef4444; }
.text-blue { color: #3b82f6; text-decoration: none; }
.text-blue:hover { text-decoration: underline; }
.text-sm { font-size: 0.85rem; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  border-radius: 12px;
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon svg {
  width: 28px;
  height: 28px;
}

.metric-icon.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.metric-icon.green { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.metric-icon.yellow { background: rgba(234, 179, 8, 0.15); color: #facc15; }
.metric-icon.emerald { background: rgba(16, 185, 129, 0.15); color: #10b981; }

.metric-info h3 {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.quota-text {
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 400;
}

.metric-desc {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-card {
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 0;
}

.chart-container {
  min-width: 0;
  overflow: hidden;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: #fff;
}

/* Checkin Stats */
.checkin-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--glass-border);
}

.checkin-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.checkin-label {
  font-size: 0.95rem;
  color: #cbd5e1;
}

.checkin-value {
  font-size: 1.15rem;
  font-weight: 600;
}

.text-gray { color: #94a3b8; }
.text-green { color: #4ade80; }
.text-yellow { color: #facc15; }

/* Progress Bar */
.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 99px;
  transition: width 0.5s ease;
}

/* Recent Registrations */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
}

.recent-info p { margin: 0; }
.recent-name { font-size: 0.95rem; font-weight: 600; color: #fff; margin-bottom: 0.15rem !important; }
.recent-email { font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.25rem !important; }
.recent-time { font-size: 0.75rem; color: var(--text-muted); }

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.badge-yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.badge-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.badge-gray { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
</style>
