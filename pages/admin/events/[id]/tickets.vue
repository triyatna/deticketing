<template>
  <div>
    <div class="header-action">
      <h1 class="page-title">
        Pendaftar Event: {{ event?.name || "Loading..." }}
      </h1>
      <div class="flex gap-2">
        <!-- Export Dropdown -->
        <div class="export-dropdown-wrap" v-if="tickets.length > 0">
          <button 
            class="btn-outline flex items-center gap-2" 
            @click="isExportDropdownOpen = !isExportDropdownOpen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export
          </button>
          <div v-if="isExportDropdownOpen" class="export-menu glass-panel shadow-lg">
            <button @click="handleExport('csv')" class="export-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Export CSV (.csv)
            </button>
            <button @click="handleExport('pdf')" class="export-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15h3a2 2 0 0 0 0-4H9v4z"></path></svg>
              Export PDF (.pdf)
            </button>
          </div>
        </div>
        <NuxtLink to="/admin/events" class="btn-outline">Kembali</NuxtLink>
      </div>
    </div>

    <div class="glass-panel mt-4">

      <div v-if="pending" class="text-center py-8">Loading pendaftar...</div>
      <div v-else-if="error" class="text-center py-8 text-red">
        Gagal memuat data.
      </div>

      <div v-else-if="tickets && tickets.length">
        <div class="search-bar-wrap">
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
              <td>
                <div class="flex flex-col">
                  <span>{{ ticket.registrantName }}</span>
                  <span v-if="ticket.orderId" class="text-xs text-muted" style="font-size: 10px; margin-top: 2px;">
                    <span class="badge badge-gray small">Multi-Ticket</span>
                  </span>
                </div>
              </td>
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
import { ref, computed, onMounted, onBeforeUnmount, h } from "vue";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const isExportDropdownOpen = ref(false);

// Close dropdown on click outside
const closeDropdown = (e) => {
  if (isExportDropdownOpen.value && !e.target.closest('.export-dropdown-wrap')) {
    isExportDropdownOpen.value = false;
  }
};

const customFieldLabels = computed(() => {
  if (!event.value?.formSchema) return [];
  try {
    const schema = JSON.parse(event.value.formSchema);
    return schema
      .filter(item => item.itemType !== 'form_meta')
      .map(item => item.label || item.title || 'Field');
  } catch { return []; }
});

const isEventStarted = computed(() => {
  if (!event.value?.formSchema) return false;
  try {
    const schema = JSON.parse(event.value.formSchema);
    const meta = schema.find(item => item.itemType === 'form_meta');
    if (!meta?.eventDate) return false;
    const now = new Date();
    const evtDate = new Date(meta.eventDate);
    // Standardize to start of day for comparison if needed, 
    // but here we consider started if current time is >= event date
    return now >= evtDate;
  } catch { return false; }
});

const generateFileName = () => {
  const name = (event.value?.name || 'event').replace(/\s+/g, '_');
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `Laporan_peserta_event_${name}_${year}_${randomStr}`;
};

const handleExport = async (type) => {
  isExportDropdownOpen.value = false;
  
  if (!filteredTickets.value.length) {
    Swal.fire({
      title: 'Export Gagal',
      text: 'Tidak ada data pendaftar untuk dieksport.',
      icon: 'warning',
      background: '#0f172a',
      color: '#f8fafc'
    });
    return;
  }

  // Define column order: Name, Email, Custom Fields, Date, Approval, (optional) Attendance
  const headers = ['Nama Lengkap', 'Email', ...customFieldLabels.value, 'Waktu Daftar', 'Status Approval'];
  if (isEventStarted.value) {
    headers.push('Status Kehadiran');
  }

  const dataToExport = filteredTickets.value.map(t => {
    let parsedFormData = {};
    try {
      parsedFormData = t.formData ? JSON.parse(t.formData) : {};
    } catch { parsedFormData = {}; }

    const row = {};
    row['Nama Lengkap'] = t.registrantName;
    row['Email'] = t.registrantEmail;
    
    // Custom fields data sync
    customFieldLabels.value.forEach(label => {
      row[label] = parsedFormData[label] || '-';
    });

    row['Waktu Daftar'] = new Date(t.createdAt).toLocaleString('id-ID');
    row['Status Approval'] = t.status;
    
    if (isEventStarted.value) {
      row['Status Kehadiran'] = t.scanStatus ? t.scanStatus.replace('_', ' ') : 'BELUM HADIR';
    }

    return row;
  });

  if (type === 'csv') {
    exportCSV(headers, dataToExport);
  } else if (type === 'pdf') {
    exportPDF(headers, dataToExport);
  }
};

const exportCSV = (headers, data) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${generateFileName()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportPDF = (headers, data) => {
  const doc = new jsPDF('landscape');
  const rows = data.map(row => headers.map(h => row[h]));

  doc.setFontSize(18);
  doc.text(`Laporan Pendaftar: ${event.value.name}`, 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Diekspor pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 25 },
  });

  doc.save(`${generateFileName()}.pdf`);
};

const userRole = ref('PETUGAS')
onMounted(async () => {
  try {
    const res = await $fetch('/api/auth/me')
    if (res.success) userRole.value = res.user.role
  } catch {}
  window.addEventListener("click", closeDropdown);
})


useHead(() => ({
  title: event.value ? `Pendaftar: ${event.value.name}` : "Memuat Pendaftar...",
}));

const approvingId = ref(null);
const isRealtimeRefreshing = ref(false);

useRealtimeWs(`event:${eventId}`, async () => {
  if (isRealtimeRefreshing.value || approvingId.value) return;
  isRealtimeRefreshing.value = true;
  try {
    await refresh();
  } finally {
    isRealtimeRefreshing.value = false;
  }
});

const handleWindowFocus = async () => {
  if (isRealtimeRefreshing.value || approvingId.value) return;
  isRealtimeRefreshing.value = true;
  try {
    await refresh();
  } finally {
    isRealtimeRefreshing.value = false;
  }
};

const handleVisibilityChange = async () => {
  if (!document.hidden) await handleWindowFocus();
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
  window.addEventListener("focus", handleWindowFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  window.removeEventListener("focus", handleWindowFocus);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("click", closeDropdown);
});
</script>

<style scoped lang="scss">
.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.export-dropdown-wrap {
  position: relative;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  min-width: 180px;
  z-index: 100;
  padding: 0.5rem !important;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(12px);
}

.export-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  width: 100%;
  border: none;
  background: transparent;
  color: #f1f7ff;
  font-size: 0.85rem;
  text-align: left;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.export-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--primary);
}

.export-item svg {
  opacity: 0.7;
}

.flex { display: flex; }
.gap-2 { gap: 0.5rem; }
.items-center { align-items: center; }
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

.search-bar-wrap {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-top: 1.25rem;
  margin-bottom: 1.5rem;
  padding: 0 0.95rem;
  flex-wrap: wrap;
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
  display: inline-block;
}
.badge.small {
  font-size: 0.65rem;
  padding: 0.1rem 0.35rem;
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
