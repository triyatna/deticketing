<template>
  <div>
    <div class="header-action">
      <h1 class="page-title">
        Pendaftar Event: {{ event?.name || "Loading..." }}
      </h1>
      <NuxtLink to="/admin/events" class="btn-outline">Kembali</NuxtLink>
    </div>

    <div class="glass-panel mt-4">
      <div class="realtime-bar">
        <div class="realtime-status">
          <span class="dot-live"></span>
        </div>
        <ClientOnly>
          <p class="realtime-time">Update terakhir: {{ lastRefreshLabel }}</p>
        </ClientOnly>
      </div>

      <div v-if="pending" class="text-center py-8">Loading pendaftar...</div>
      <div v-else-if="error" class="text-center py-8 text-red">
        Gagal memuat data.
      </div>

      <div v-else-if="tickets && tickets.length">
        <div style="margin-bottom: 1.5rem; display: flex; justify-content: flex-end;">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Cari nama atau email..." 
            class="form-input" 
            style="max-width: 300px;" 
          />
        </div>
        <div v-if="!filteredTickets.length" class="text-center py-8 text-muted">
          Tidak ada pendaftar yang cocok dengan pencarian Anda.
        </div>
      </div>
      <div v-else class="text-center py-8 text-muted">
        Belum ada pendaftar untuk event ini.
      </div>

      <div v-if="filteredTickets.length > 0" class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>Email</th>
              <th>Waktu Daftar</th>
              <th>Bukti Bayar</th>
              <th>Status Approval</th>
              <th>Status Hadir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in filteredTickets" :key="ticket.id">
              <td>{{ ticket.registrantName }}</td>
              <td>{{ ticket.registrantEmail }}</td>
              <td>
                <ClientOnly>
                  {{ new Date(ticket.createdAt).toLocaleString("id-ID") }}
                  <template #fallback>-</template>
                </ClientOnly>
              </td>
              <td>
                <a
                  v-if="ticket.paymentProofUrl"
                  :href="`/api/admin/proof/${ticket.id}`"
                  target="_blank"
                  class="text-blue"
                  >Lihat Bukti</a
                >
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span
                  :class="[
                    'badge',
                    getStatusBadgeClass(ticket.status)
                  ]"
                >
                  {{ ticket.status }}
                </span>
              </td>
              <td>
                <span v-if="ticket.status === 'APPROVED'" :class="['badge', getScanBadgeClass(ticket.scanStatus)]">
                  {{ ticket.scanStatus.replace("_", " ") }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="action-cell">
                <NuxtLink
                  :to="`/admin/events/${eventId}/ticket/${ticket.id}`"
                  class="btn-outline small"
                >
                  Detail
                </NuxtLink>
              </td>

            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";

definePageMeta({ layout: "admin", middleware: "auth" });
const route = useRoute();
const eventId = route.params.id;

// We fetch the event and its tickets
const {
  data: response,
  pending,
  error,
  refresh,
} = useFetch(`/api/event/${eventId}/tickets`, {
  key: `admin-event-tickets-${eventId}`,
  retry: 0,
  timeout: 7000,
});
const event = computed(() => response.value?.event);
const tickets = computed(() => response.value?.tickets || []);

const searchQuery = ref('');
const filteredTickets = computed(() => {
  if (!searchQuery.value.trim()) return tickets.value;
  const q = searchQuery.value.toLowerCase();
  return tickets.value.filter(t => 
    (t.registrantName && t.registrantName.toLowerCase().includes(q)) || 
    (t.registrantEmail && t.registrantEmail.toLowerCase().includes(q))
  );
});

const userRole = ref('PETUGAS')
onMounted(async () => {
  try {
    const res = await $fetch('/api/auth/me')
    if (res.success) userRole.value = res.user.role
  } catch {}
})


useHead(() => ({
  title: event.value ? `Pendaftar: ${event.value.name}` : "Memuat Pendaftar...",
}));

const approvingId = ref(null);
const lastRefreshAt = ref(new Date());
const realtimeTimer = ref(null);
const isRealtimeRefreshing = ref(false);
const realtimeErrorStreak = ref(0);
const realtimeIntervalMs = ref(5000);
const BASE_REALTIME_INTERVAL_MS = 5000;
const MAX_REALTIME_INTERVAL_MS = 20000;

const lastRefreshLabel = computed(() => {
  const date = lastRefreshAt.value;
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("id-ID");
});

const scheduleNextRefresh = (overrideDelay = null) => {
  if (realtimeTimer.value) {
    clearTimeout(realtimeTimer.value);
    realtimeTimer.value = null;
  }

  const delay = Number(
    overrideDelay || realtimeIntervalMs.value || BASE_REALTIME_INTERVAL_MS,
  );
  realtimeTimer.value = setTimeout(() => {
    refreshRealtime(true);
  }, delay);
};

const refreshRealtime = async (fromTimer = false) => {
  if (isRealtimeRefreshing.value) return;
  if (approvingId.value) return;
  if (typeof document !== "undefined" && document.hidden) {
    if (fromTimer) scheduleNextRefresh(MAX_REALTIME_INTERVAL_MS);
    return;
  }

  isRealtimeRefreshing.value = true;
  try {
    await refresh();
    lastRefreshAt.value = new Date();
    realtimeErrorStreak.value = 0;
    realtimeIntervalMs.value = BASE_REALTIME_INTERVAL_MS;
  } catch {
    realtimeErrorStreak.value += 1;
    realtimeIntervalMs.value = Math.min(
      MAX_REALTIME_INTERVAL_MS,
      BASE_REALTIME_INTERVAL_MS * Math.max(1, realtimeErrorStreak.value),
    );
  } finally {
    isRealtimeRefreshing.value = false;
    if (fromTimer) {
      scheduleNextRefresh();
    }
  }
};

const handleWindowFocus = async () => {
  await refreshRealtime();
  scheduleNextRefresh(BASE_REALTIME_INTERVAL_MS);
};

const handleVisibilityChange = async () => {
  if (document.hidden) {
    scheduleNextRefresh(MAX_REALTIME_INTERVAL_MS);
    return;
  }
  await refreshRealtime();
  scheduleNextRefresh(BASE_REALTIME_INTERVAL_MS);
};

const getStatusBadgeClass = (status) => {
  if (status === "APPROVED") return "badge-green";
  if (status === "REJECTED") return "badge-red";
  return "badge-yellow";
};

const getScanBadgeClass = (status) => {
  if (status === "MASUK") return "badge-green";
  if (status === "KELUAR") return "badge-yellow";
  return "badge-gray";
};

onMounted(() => {
  lastRefreshAt.value = new Date();
  scheduleNextRefresh(BASE_REALTIME_INTERVAL_MS);

  window.addEventListener("focus", handleWindowFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  if (realtimeTimer.value) {
    clearTimeout(realtimeTimer.value);
    realtimeTimer.value = null;
  }
  window.removeEventListener("focus", handleWindowFocus);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<style scoped lang="scss">
.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-size: 1.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.text-center {
  text-align: center;
}
.py-8 {
  padding: 2rem 0;
}
.text-muted {
  color: var(--text-muted);
}
.text-red {
  color: #ef4444;
}
.text-blue {
  color: var(--primary);
  text-decoration: none;
}
.text-blue:hover {
  text-decoration: underline;
}

.realtime-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--glass-border);
  padding: 0.75rem 0.95rem;
}

.realtime-status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #9ee8b2;
  font-size: 0.82rem;
  font-weight: 600;
}

.dot-live {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
}

.realtime-time {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--glass-border);
}
.data-table th {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.875rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
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
  color: #94a3b8;
}
.badge-red {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-primary.small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.action-cell {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.mr-2 {
  margin-right: 0.5rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}
.pb-2 {
  padding-bottom: 0.5rem;
}
.border-b {
  border-bottom: 1px solid var(--glass-border);
}
.text-lg {
  font-size: 1.125rem;
}
.font-semibold {
  font-weight: 600;
}
</style>
