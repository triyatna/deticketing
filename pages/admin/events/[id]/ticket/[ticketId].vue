<template>
  <div>
    <div class="header-action">
      <h1 class="page-title">
        Detail Pendaftar
      </h1>
      <NuxtLink :to="`/admin/events/${eventId}/tickets`" class="btn-outline">Kembali</NuxtLink>
    </div>

    <div class="glass-panel mt-4">
      <div v-if="pending" class="text-center py-8">Memuat detail pendaftar...</div>
      <div v-else-if="error" class="text-center py-8 text-red">
        Gagal memuat data. Pendaftar mungkin tidak ditemukan.
      </div>
      <div v-else-if="ticket" class="detail-container">
        <div class="detail-grid">
          <!-- Kolom Kiri: Info Dasar & Form Tambahan -->
          <div class="detail-col">
            <h3 class="section-title">Informasi Pendaftar</h3>
            
            <div class="detail-group">
              <label>Nama Lengkap</label>
              <p>{{ ticket.registrantName }}</p>
            </div>
            
            <div class="detail-group">
              <label>Email</label>
              <p>{{ ticket.registrantEmail }}</p>
            </div>
            
            <div class="detail-group">
              <label>Waktu Daftar</label>
              <ClientOnly>
                <p>{{ new Date(ticket.createdAt).toLocaleString("id-ID") }}</p>
                <template #fallback>
                  <p class="text-muted">Loading...</p>
                </template>
              </ClientOnly>
            </div>

            <div v-if="parsedFormData.length" class="mt-6">
              <h3 class="section-title">Data Tambahan Form</h3>
              <div v-for="(item, idx) in parsedFormData" :key="idx" class="detail-group mb-3">
                <label>{{ item.question }}</label>
                <p v-if="item.type === 'file'">
                   <a :href="`/api/admin/proof/${ticket.id}?file=${item.answer.fileName}`" target="_blank" class="text-blue font-semibold">Unduh {{ item.answer.originalName }}</a>
                </p>
                <p v-else style="white-space: pre-wrap;">{{ Array.isArray(item.answer) ? item.answer.join(', ') : item.answer }}</p>
              </div>
            </div>
          </div>

          <!-- Kolom Kanan: Status & Bukti Pembayaran -->
          <div class="detail-col status-col">
            <h3 class="section-title">Status & Pembayaran</h3>

            <div class="status-card">
              <div class="status-row">
                <span class="status-label">Status Tiket:</span>
                <span :class="['badge', getStatusBadgeClass(ticket.status)]">
                  {{ ticket.status }}
                </span>
              </div>
              <div class="status-row">
                <span class="status-label">Kehadiran:</span>
                <span v-if="ticket.status === 'APPROVED'" :class="['badge', getScanBadgeClass(ticket.scanStatus)]">
                  {{ ticket.scanStatus.replace("_", " ") }}
                </span>
                <span v-else class="text-muted">-</span>
              </div>
            </div>

            <div class="detail-group mt-4">
              <label>Bukti Pembayaran</label>
              <div v-if="ticket.paymentProofUrl" class="proof-container">
                <a :href="`/api/admin/proof/${ticket.id}`" target="_blank">
                  <img :src="`/api/admin/proof/${ticket.id}`" alt="Bukti Pembayaran" class="proof-img" />
                </a>
                <a :href="`/api/admin/proof/${ticket.id}`" target="_blank" class="btn-outline small full-width mt-2">Buka Resolusi Penuh</a>
              </div>
              <p v-else class="text-muted">- Tidak ada bukti pembayaran -</p>
            </div>

            <div v-if="userRole !== 'PETUGAS'" class="action-box mt-6">
              <p v-if="ticket.status === 'PENDING'" class="text-sm text-muted mb-3">Periksa bukti pembayaran sebelum menyetujui pendaftar. Jika disetujui, QR Code akan otomatis dikirim ke email pendaftar.</p>
              
              <div class="action-buttons" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <!-- Tombol Approve (hanya untuk PENDING) -->
                <button
                  v-if="ticket.status === 'PENDING'"
                  @click="approveTicket(ticket.id)"
                  class="btn-primary full-width"
                  :disabled="isApproving || isUpdatingStatus"
                >
                  {{ isApproving ? "Memproses & Mengirim Email..." : "Approve & Kirim E-Ticket" }}
                </button>

                <!-- Tombol Kirim Ulang (hanya untuk APPROVED) -->
                <button
                  v-if="ticket.status === 'APPROVED'"
                  @click="approveTicket(ticket.id, true)"
                  class="btn-primary full-width"
                  :disabled="isApproving || isUpdatingStatus"
                >
                  {{ isApproving ? "Mengirim Ulang..." : "Kirim Ulang E-Ticket QR Code" }}
                </button>
                
                <!-- Tombol Tolak/Batal (hanya untuk PENDING) -->
                <button
                  v-if="ticket.status === 'PENDING'"
                  @click="updateTicketStatus(ticket.id, 'REJECTED')"
                  class="btn-outline full-width border-red text-red hover-red"
                  :disabled="isApproving || isUpdatingStatus"
                >
                  Tolak Pendaftaran
                </button>
                
                <!-- Tombol Cabut Batal (hanya untuk REJECTED) -->
                <button
                  v-if="ticket.status === 'REJECTED'"
                  @click="updateTicketStatus(ticket.id, 'PENDING')"
                  class="btn-outline full-width"
                  :disabled="isApproving || isUpdatingStatus"
                >
                  Cabut Penolakan (Jadikan Pending)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";

definePageMeta({ layout: "admin", middleware: "auth" });
const route = useRoute();
const eventId = route.params.id;
const ticketId = route.params.ticketId;

const userRole = ref('PETUGAS')
onMounted(async () => {
  try {
    const res = await $fetch('/api/auth/me')
    if (res.success) userRole.value = res.user.role
  } catch {}
})

const {
  data: response,
  pending,
  error,
  refresh,
} = useFetch(`/api/event/${eventId}/ticket/${ticketId}`, {
  key: `admin-ticket-detail-${ticketId}`,
  retry: 0,
});

const event = computed(() => response.value?.event);
const ticket = computed(() => response.value?.ticket);

useHead(() => ({
  title: ticket.value ? `Detail: ${ticket.value.registrantName}` : "Memuat Pendaftar...",
}));

const isApproving = ref(false);

const parsedFormSchema = computed(() => {
  try {
    return JSON.parse(event.value?.formSchema || "[]");
  } catch {
    return [];
  }
});

const parsedFormData = computed(() => {
  if (!ticket.value || !ticket.value.formData) return [];
  try {
    const data = JSON.parse(ticket.value.formData);
    const result = [];
    
    const questions = parsedFormSchema.value.filter(q => q.itemType === "question");
    
    for (const q of questions) {
      const answer = data[q.id];
      if (answer !== undefined && answer !== null && answer !== "") {
        if (Array.isArray(answer) && answer.length === 0) continue;
        
        result.push({
          question: q.label,
          type: q.questionType === "file_upload" ? "file" : "text",
          answer: answer
        });
      }
    }
    return result;
  } catch (err) {
    return [];
  }
});

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

const approveTicket = async (id, isResend = false) => {
  const result = await Swal.fire({
    title: "Konfirmasi",
    text: isResend 
      ? "Kirim ulang E-Ticket QR Code ke pendaftar? Pastikan nomor WA/email pendaftar sudah benar." 
      : "Approve pembayaran ini? Sistem akan mengirimkan E-Ticket berisi QR Code ke email pendaftar.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: isResend ? "Ya, Kirim Ulang" : "Ya, Approve",
    cancelButtonText: "Batal",
    background: "#0f172a",
    color: "#f8fafc",
    confirmButtonColor: "#3b82f6",
  });
  if (!result.isConfirmed) return;

  isApproving.value = true;
  try {
    const res = await $fetch("/api/ticket/approve", {
      method: "POST",
      body: { ticketId: id },
    });

    if (res.success) {
      Swal.fire({
        title: "Sukses!",
        text: isResend 
          ? "E-Ticket berhasil dikirim ulang!" 
          : "Berhasil! QR Code telah dikirim ke email peserta.",
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#3b82f6",
      });
      await refresh();
    }
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: err.data?.statusMessage || "Gagal menyetujui tiket",
      icon: "error",
      background: "#0f172a",
      color: "#f8fafc",
    });
  } finally {
    isApproving.value = false;
  }
};

const isUpdatingStatus = ref(false);

const updateTicketStatus = async (id, newStatus) => {
  const isCancel = newStatus === 'REJECTED';
  const actionText = isCancel ? "membatalkan (menolak)" : "mencabut pembatalan";
  
  const result = await Swal.fire({
    title: "Konfirmasi",
    text: `Apakah Anda yakin ingin ${actionText} tiket ini?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Lanjutkan",
    cancelButtonText: "Batal",
    background: "#0f172a",
    color: "#f8fafc",
    confirmButtonColor: isCancel ? "#ef4444" : "#3b82f6",
  });
  if (!result.isConfirmed) return;

  isUpdatingStatus.value = true;
  try {
    const res = await $fetch("/api/ticket/update-status", {
      method: "POST",
      body: { ticketId: id, status: newStatus },
    });

    if (res.success) {
      Swal.fire({
        title: "Sukses!",
        text: `Tiket berhasil ${isCancel ? 'dibatalkan' : 'dikembalikan ke Pending'}.`,
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#3b82f6",
      });
      await refresh();
    }
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: err.data?.statusMessage || "Gagal mengubah status",
      icon: "error",
      background: "#0f172a",
      color: "#f8fafc",
    });
  } finally {
    isUpdatingStatus.value = false;
  }
};
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
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.text-center { text-align: center; }
.py-8 { padding: 2rem 0; }
.text-muted { color: var(--text-muted); }
.text-red { color: #ef4444; }
.text-sm { font-size: 0.875rem; }
.text-blue { color: var(--primary); text-decoration: none; }
.text-blue:hover { text-decoration: underline; }
.font-semibold { font-weight: 600; }
.full-width { width: 100%; text-align: center; justify-content: center; }

.border-red { border-color: #ef4444; }
.text-red { color: #ef4444 !important; }
.hover-red:hover { background-color: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }

.detail-container {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 2.5rem;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.section-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--glass-border);
  color: #fff;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.detail-group label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.detail-group p {
  margin: 0;
  font-size: 0.95rem;
  color: #f8fafc;
  line-height: 1.5;
  word-break: break-word;
}

.status-col {
  background: rgba(8, 17, 33, 0.3);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: rgba(15, 23, 42, 0.4);
  padding: 1rem;
  border-radius: 8px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.proof-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.proof-img {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  object-fit: contain;
  background: #000;
}

.action-box {
  padding-top: 1.5rem;
  border-top: 1px solid var(--glass-border);
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.badge-yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.badge-gray { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
.badge-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
</style>
