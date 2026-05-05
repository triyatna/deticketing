<template>
  <div>
    <div class="header-action">
      <h1 class="page-title">Detail Pendaftar</h1>
      <NuxtLink :to="`/admin/events/${eventId}/tickets`" class="btn-outline"
        >Kembali</NuxtLink
      >
    </div>

    <div class="glass-panel mt-4">
      <div v-if="pending" class="text-center py-8">
        Memuat detail pendaftar...
      </div>
      <div v-else-if="error" class="text-center py-8 text-red">
        Gagal memuat data. Pendaftar mungkin tidak ditemukan.
      </div>
      <div v-else-if="ticket" class="detail-container">
        <div class="detail-grid">
          <!-- Kolom Kiri: Info Dasar & Form Tambahan -->
          <div class="detail-col">
            <div class="section-header-flex">
              <h3 class="section-title">Informasi Pendaftar</h3>
              <button
                v-if="userRole === 'OWNER' || userRole === 'ADMIN'"
                @click="isEditingInfo = !isEditingInfo"
                class="btn-edit-toggle"
                :title="isEditingInfo ? 'Batal Edit' : 'Edit Data'"
              >
                <svg
                  v-if="!isEditingInfo"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  ></path>
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  ></path>
                </svg>
                <span v-else>&times; Batal</span>
              </button>
            </div>

            <div class="detail-group">
              <label>Nama Lengkap</label>
              <input
                v-if="isEditingInfo"
                v-model="editForm.registrantName"
                type="text"
                class="form-input small"
              />
              <p v-else>{{ ticket.registrantName }}</p>
            </div>

            <div class="detail-group">
              <label>Email</label>
              <input
                v-if="isEditingInfo"
                v-model="editForm.registrantEmail"
                type="email"
                class="form-input small"
              />
              <p v-else>{{ ticket.registrantEmail }}</p>
            </div>

            <div v-if="isEditingInfo" class="mt-2 mb-4">
              <button
                @click="handleUpdateData"
                class="btn-primary small"
                :disabled="isSaving"
              >
                {{ isSaving ? "Menyimpan..." : "Simpan Perubahan" }}
              </button>
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

            <div v-if="ticket.orderId" class="detail-group">
              <label>Order ID</label>
              <p>
                <span class="badge badge-gray">{{ ticket.orderId }}</span>
              </p>
            </div>

            <div
              v-if="siblings && siblings.length"
              class="mt-4 p-4 glass-panel"
              style="
                border: 1px dashed var(--glass-border);
                border-radius: 12px;
              "
            >
              <h4 class="text-sm font-semibold mb-2">
                Tiket Lain dalam Pesanan Ini:
              </h4>
              <div class="sibling-list">
                <NuxtLink
                  v-for="s in siblings"
                  :key="s.id"
                  :to="`/admin/events/${eventId}/ticket/${s.id}`"
                  class="sibling-item"
                >
                  <span>{{ s.registrantName }}</span>
                  <span
                    :class="['badge small', getStatusBadgeClass(s.status)]"
                    >{{ s.status }}</span
                  >
                </NuxtLink>
              </div>
            </div>

            <div v-if="parsedFormData.length" class="mt-6">
              <div class="section-header-flex">
                <h3 class="section-title">Data Tambahan Form</h3>
                <button
                  v-if="userRole === 'OWNER' || userRole === 'ADMIN'"
                  @click="isEditingForm = !isEditingForm"
                  class="btn-edit-toggle"
                >
                  <span v-if="!isEditingForm">Edit Jawaban</span>
                  <span v-else>&times; Batal</span>
                </button>
              </div>

              <div
                v-for="(item, idx) in parsedFormData"
                :key="idx"
                class="detail-group mb-3"
              >
                <label>{{ item.question }}</label>
                <div v-if="isEditingForm && item.type !== 'file'">
                  <!-- Simple text input for editing most types -->
                  <textarea
                    v-if="item.answer && String(item.answer).length > 50"
                    v-model="editForm.formData[item.id]"
                    class="form-input small"
                    rows="3"
                  ></textarea>
                  <input
                    v-else
                    v-model="editForm.formData[item.id]"
                    type="text"
                    class="form-input small"
                  />
                </div>
                <div v-else>
                  <p v-if="item.type === 'file'">
                    <a
                      :href="`/api/admin/proof/${ticket.id}?file=${item.answer.fileName}`"
                      target="_blank"
                      class="text-blue font-semibold"
                      >Unduh {{ item.answer.originalName }}</a
                    >
                  </p>
                  <p v-else style="white-space: pre-wrap">
                    {{
                      Array.isArray(item.answer)
                        ? item.answer.join(", ")
                        : item.answer
                    }}
                  </p>
                </div>
              </div>

              <div v-if="isEditingForm" class="mt-2">
                <button
                  @click="handleUpdateData"
                  class="btn-primary small"
                  :disabled="isSaving"
                >
                  {{ isSaving ? "Simpan Perubahan Form" : "Simpan Form" }}
                </button>
              </div>
            </div>
          </div>

          <!-- Kolom Kanan: Status & Bukti Pembayaran -->
          <div class="detail-col status-col">
            <h3 class="section-title">Status & QR Tiket</h3>

            <!-- QR Code Section (Only if Approved) -->
            <div
              v-if="ticket.status === 'APPROVED'"
              class="qr-section glass-panel mb-6"
            >
              <div class="qr-header">
                <span class="qr-label">QR CODE TIKET</span>
                <button 
                  v-if="isQrVisible"
                  @click="downloadQr" 
                  class="btn-icon-only" 
                  title="Unduh QR"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
              </div>

              <div class="qr-content-area">
                <div v-if="!isQrVisible" class="qr-locked">
                  <div class="lock-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <p class="lock-text">QR Code disembunyikan untuk keamanan</p>
                  <button @click="confirmShowQr" class="btn-primary small mt-2">
                    Lihat QR Ticket
                  </button>
                </div>
                <div v-else class="qr-unlocked">
                  <div class="qr-wrapper">
                    <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="qr-image" />
                    <div v-else class="qr-placeholder">Generating...</div>
                  </div>
                  <p class="qr-id">ID: {{ ticket.id }}</p>
                  <button @click="isQrVisible = false" class="btn-text-only mt-2">
                    Sembunyikan Kembali
                  </button>
                </div>
              </div>
            </div>

            <div class="status-card">
              <div class="status-row">
                <span class="status-label">Status Tiket:</span>
                <span :class="['badge', getStatusBadgeClass(ticket.status)]">
                  {{ ticket.status }}
                </span>
              </div>
              <div class="status-row">
                <span class="status-label">Kehadiran:</span>
                <span
                  v-if="ticket.status === 'APPROVED'"
                  :class="['badge', getScanBadgeClass(ticket.scanStatus)]"
                >
                  {{ ticket.scanStatus.replace("_", " ") }}
                </span>
                <span v-else class="text-muted">-</span>
              </div>
            </div>

            <div class="detail-group mt-4">
              <label>Bukti Pembayaran</label>
              <div v-if="ticket.paymentProofUrl" class="proof-container">
                <a :href="`/api/admin/proof/${ticket.id}`" target="_blank">
                  <img
                    :src="`/api/admin/proof/${ticket.id}`"
                    alt="Bukti Pembayaran"
                    class="proof-img"
                  />
                </a>
                <a
                  :href="`/api/admin/proof/${ticket.id}`"
                  target="_blank"
                  class="btn-outline small full-width mt-2"
                  >Buka Resolusi Penuh</a
                >
              </div>
              <p v-else class="text-muted">- Tidak ada bukti pembayaran -</p>
            </div>

            <div v-if="userRole !== 'PETUGAS'" class="action-box mt-6">
              <p
                v-if="ticket.status === 'PENDING'"
                class="text-sm text-muted mb-3"
              >
                Periksa bukti pembayaran sebelum menyetujui pendaftar. Jika
                disetujui, QR Code akan otomatis dikirim ke email pendaftar.
              </p>

              <div
                class="action-buttons"
                style="display: flex; flex-direction: column; gap: 0.75rem"
              >
                <!-- Tombol Approve (hanya untuk PENDING) -->
                <button
                  v-if="ticket.status === 'PENDING'"
                  @click="approveTicket(ticket.id)"
                  class="btn-primary full-width"
                  :disabled="isApproving || isUpdatingStatus"
                >
                  {{
                    isApproving
                      ? "Memproses & Mengirim Email..."
                      : "Approve & Kirim E-Ticket"
                  }}
                </button>

                <!-- Tombol Kirim Ulang (hanya untuk APPROVED) -->
                <button
                  v-if="ticket.status === 'APPROVED'"
                  @click="approveTicket(ticket.id, true)"
                  class="btn-primary full-width"
                  :disabled="isApproving || isUpdatingStatus"
                >
                  {{
                    isApproving
                      ? "Mengirim Ulang..."
                      : "Kirim Ulang E-Ticket QR Code"
                  }}
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
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";
import QRCode from "qrcode";

definePageMeta({ layout: "admin", middleware: "auth" });
const route = useRoute();
const eventId = route.params.id;
const ticketId = route.params.ticketId;

const userRole = ref("PETUGAS");
onMounted(async () => {
  try {
    const res = await $fetch("/api/auth/me");
    if (res.success) userRole.value = res.user.role;
  } catch {}
});

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
const siblings = computed(() => response.value?.siblings || []);

// QR Code Logic
const qrDataUrl = ref("");
const isQrVisible = ref(false);

const generateQr = async () => {
  if (ticket.value?.id && ticket.value?.status === "APPROVED") {
    try {
      qrDataUrl.value = await QRCode.toDataURL(ticket.value.id, {
        margin: 2,
        width: 300,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    } catch (err) {
      console.error("QR Gen Error:", err);
    }
  }
};

watch(() => ticket.value?.status, generateQr);
onMounted(generateQr);

const confirmShowQr = async () => {
  const { value: password } = await Swal.fire({
    title: "Konfirmasi Keamanan",
    text: "Masukkan password akun Anda untuk melihat QR Code pendaftar ini.",
    input: "password",
    inputPlaceholder: "Password Anda",
    inputAttributes: {
      autocapitalize: "off",
      autocorrect: "off",
    },
    showCancelButton: true,
    confirmButtonText: "Konfirmasi",
    cancelButtonText: "Batal",
    background: "#0f172a",
    color: "#f8fafc",
    confirmButtonColor: "#3b82f6",
  });

  if (!password) return;

  try {
    const res = await $fetch("/api/auth/confirm-password", {
      method: "POST",
      body: { password },
    });

    if (res.success) {
      isQrVisible.value = true;
      generateQr(); // Re-generate just in case
    }
  } catch (err) {
    Swal.fire({
      title: "Gagal",
      text: err.data?.statusMessage || "Password salah",
      icon: "error",
      background: "#0f172a",
      color: "#f8fafc",
    });
  }
};

const downloadQr = () => {
  if (!qrDataUrl.value) return;
  const link = document.createElement("a");
  link.href = qrDataUrl.value;
  link.download = `QR_${ticket.value.registrantName.replace(/\s+/g, "_")}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Edit Mode Logic
const isEditingInfo = ref(false);
const isEditingForm = ref(false);
const isSaving = ref(false);
const editForm = ref({
  registrantName: "",
  registrantEmail: "",
  formData: {},
});

watch(
  ticket,
  (val) => {
    if (val) {
      editForm.value.registrantName = val.registrantName;
      editForm.value.registrantEmail = val.registrantEmail;
      try {
        editForm.value.formData = JSON.parse(val.formData || "{}");
      } catch {
        editForm.value.formData = {};
      }
    }
  },
  { immediate: true },
);

const handleUpdateData = async () => {
  isSaving.value = true;
  try {
    const res = await $fetch("/api/ticket/update-data", {
      method: "POST",
      body: {
        ticketId: ticket.value.id,
        registrantName: editForm.value.registrantName,
        registrantEmail: editForm.value.registrantEmail,
        formData: editForm.value.formData,
      },
    });

    if (res.success) {
      Swal.fire({
        title: "Sukses!",
        text: "Data berhasil diperbarui.",
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#3b82f6",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      isEditingInfo.value = false;
      isEditingForm.value = false;
      await refresh();
    }
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: err.data?.statusMessage || "Gagal memperbarui data",
      icon: "error",
      background: "#0f172a",
      color: "#f8fafc",
    });
  } finally {
    isSaving.value = false;
  }
};

useHead(() => ({
  title: ticket.value
    ? `Detail: ${ticket.value.registrantName}`
    : "Memuat Pendaftar...",
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

    const questions = parsedFormSchema.value.filter(
      (q) => q.itemType === "question",
    );

    for (const q of questions) {
      const answer = data[q.id];
      if (answer !== undefined && answer !== null && answer !== "") {
        if (Array.isArray(answer) && answer.length === 0) continue;

        result.push({
          id: q.id,
          question: q.label,
          type: q.questionType === "file_upload" ? "file" : "text",
          answer: answer,
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
  const isMulti = ticket.value.orderId && siblings.value.length > 0;
  const pendingSiblingsCount = siblings.value.filter(
    (s) => s.status === "PENDING",
  ).length;
  const totalToApprove = 1 + (isResend ? 0 : pendingSiblingsCount);

  const confirmText = isResend
    ? "Kirim ulang E-Ticket QR Code ke pendaftar? Pastikan nomor WA/email pendaftar sudah benar."
    : isMulti && totalToApprove > 1
      ? `Approve pembayaran ini? Terdapat ${totalToApprove} tiket dalam pesanan ini yang akan disetujui dan dikirimkan secara bersamaan.`
      : "Approve pembayaran ini? Sistem akan mengirimkan E-Ticket berisi QR Code ke email pendaftar.";

  const result = await Swal.fire({
    title: "Konfirmasi",
    text: confirmText,
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
  const isCancel = newStatus === "REJECTED";
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
        text: `Tiket berhasil ${isCancel ? "dibatalkan" : "dikembalikan ke Pending"}.`,
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
.mt-4 {
  margin-top: 1rem;
}
.mt-6 {
  margin-top: 1.5rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
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
.text-sm {
  font-size: 0.875rem;
}
.text-blue {
  color: var(--primary);
  text-decoration: none;
}
.text-blue:hover {
  text-decoration: underline;
}
.font-semibold {
  font-weight: 600;
}
.full-width {
  width: 100%;
  text-align: center;
  justify-content: center;
}

.border-red {
  border-color: #ef4444;
}
.text-red {
  color: #ef4444 !important;
}
.hover-red:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

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
.badge.small {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
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

.sibling-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sibling-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 0.85rem;
  text-decoration: none;
  color: #f8fafc;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.sibling-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--glass-border);
}

.section-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 0.5rem;
}
.section-header-flex .section-title {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.btn-edit-toggle {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
}
.btn-edit-toggle:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary);
  border-color: var(--primary);
}

.qr-section {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.03);
}

.qr-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.qr-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.qr-wrapper {
  background: #fff;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}
.qr-image {
  width: 180px;
  height: 180px;
  display: block;
}
.qr-placeholder {
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  font-weight: 600;
}
.qr-id {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

.btn-icon-only {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-icon-only:hover {
  color: var(--primary);
  background: rgba(255, 255, 255, 0.05);
}

.form-input.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background: rgba(15, 23, 42, 0.6);
}

.btn-primary.small {
  padding: 0.45rem 1rem;
  font-size: 0.8rem;
}

.qr-content-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.qr-locked, .qr-unlocked {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  width: 100%;
}

.lock-icon {
  color: var(--text-muted);
  margin-bottom: 1rem;
  opacity: 0.5;
}

.lock-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  max-width: 200px;
}

.btn-text-only {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-decoration: underline;
  cursor: pointer;
  padding: 0.25rem;
}
.btn-text-only:hover {
  color: var(--primary);
}

@media (max-width: 640px) {
  .detail-container {
    padding: 1rem;
  }
  .qr-section {
    padding: 1rem;
  }
  .qr-wrapper {
    padding: 0.75rem;
  }
  .qr-image, .qr-placeholder {
    width: 160px;
    height: 160px;
  }
  .status-col {
    padding: 1rem;
  }
}
</style>
