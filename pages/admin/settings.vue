<template>
  <div class="settings-shell">
    <div class="header-action">
      <div>
        <h1 class="page-title">Pengaturan Sistem</h1>
        <p class="subtitle">
          Atur email, keamanan, dan preferensi operasional panel.
        </p>
      </div>
      <button
        type="button"
        class="btn-primary"
        :disabled="isSaving"
        @click="saveSettings"
      >
        {{ isSaving ? "Menyimpan..." : "Simpan Semua Pengaturan" }}
      </button>
    </div>

    <div class="cards-grid">
      <section class="glass-panel setting-card card-scanner">
        <div class="card-head">
          <h3>Operasional Scanner</h3>
          <p>Preferensi default untuk fitur scan kehadiran.</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Voice Announcement</label>
            <select v-model="settings.SCANNER_VOICE_ENABLED" class="form-input">
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          <div class="form-group">
            <label>Beep Sound</label>
            <select v-model="settings.SCANNER_SOUND_ENABLED" class="form-input">
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          <div class="form-group">
            <label>Durasi Cooldown Scan (ms)</label>
            <input
              v-model="settings.SCANNER_COOLDOWN_MS"
              type="number"
              class="form-input"
              placeholder="Contoh: 800"
            />
          </div>

          <div class="form-group">
            <label>Bahasa Voice</label>
            <input
              v-model="settings.SCANNER_VOICE_LANG"
              type="text"
              class="form-input"
              placeholder="id-ID"
            />
          </div>
        </div>
      </section>

      <section class="glass-panel setting-card card-app-secret">
        <div class="card-head">
          <h3>App Secret</h3>
          <p>Kunci utama untuk JWT dan enkripsi data sensitif.</p>
        </div>

        <div class="form-grid app-secret-grid">
          <div class="form-group">
            <label>App Secret (Dikelola Server)</label>
            <div class="inline-actions secret-actions">
              <button
                type="button"
                class="btn-outline small-btn"
                :disabled="settings.APP_SECRET_CONFIGURED !== 'true'"
                @click="copyAppSecret"
              >
                Copy Secret
              </button>
            </div>
            <p class="field-hint">
              Secret dibuat otomatis oleh server saat kosong, disimpan
              terenkripsi, dan tidak bisa diedit manual.
            </p>
            <p class="field-hint">
              Anda hanya bisa menyalin secret aktif bila sudah terkonfigurasi.
            </p>
            <p class="field-hint secret-status">
              Status:
              <strong>
                {{
                  settings.APP_SECRET_CONFIGURED === "true"
                    ? "Sudah dikonfigurasi"
                    : "Belum dikonfigurasi"
                }}
              </strong>
            </p>
          </div>
        </div>
      </section>

      <section class="glass-panel setting-card card-update">
        <div class="card-head">
          <h3>Pembaruan Sistem</h3>
        </div>

        <div class="update-content">
          <div class="update-action-box">
            <div class="update-info">
              <div class="i-heroicons-cloud-arrow-down-solid icon-main"></div>
              <div
                v-if="isUpdating"
                class="status-indicator"
                :class="{ 'is-loading': isUpdating }"
              >
                <span class="dot"></span>
                Sinkronisasi sedang berjalan...
              </div>
            </div>

            <button
              type="button"
              class="btn-update-action"
              :class="{ 'is-busy': isUpdating }"
              :disabled="isUpdating"
              @click="runUpdate"
            >
              <template v-if="isUpdating">
                <span class="spinner"></span>
                Memproses...
              </template>
              <template v-else> Jalankan Update </template>
            </button>
          </div>
        </div>
      </section>

      <section class="glass-panel setting-card card-security">
        <div class="card-head">
          <h3>Keamanan Akun (Ganti Password)</h3>
          <p>Perbarui password akun Anda secara berkala demi keamanan.</p>
        </div>

        <form @submit.prevent="changePassword" class="form-grid">
          <div class="form-group">
            <label>Password Lama</label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              class="form-input"
              required
              placeholder="••••••••"
            />
          </div>

          <div class="form-group">
            <label>Password Baru</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="form-input"
              required
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div class="form-group mt-auto">
            <button
              type="submit"
              class="btn-warning w-full"
              :disabled="isChangingPass"
            >
              {{ isChangingPass ? "Memproses..." : "Perbarui Password" }}
            </button>
          </div>
        </form>
      </section>

      <section class="glass-panel setting-card card-smtp">
        <div class="card-head">
          <h3>Konfigurasi Email (SMTP)</h3>
          <p>Digunakan untuk pengiriman tiket QR dan notifikasi peserta.</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>SMTP Host</label>
            <input
              v-model="settings.SMTP_HOST"
              type="text"
              class="form-input"
              placeholder="smtp.gmail.com"
            />
          </div>

          <div class="form-group">
            <label>SMTP Port</label>
            <input
              v-model="settings.SMTP_PORT"
              type="number"
              class="form-input"
              placeholder="587 atau 465"
            />
          </div>

          <div class="form-group">
            <label>SMTP Username / Email</label>
            <input
              v-model="settings.SMTP_USER"
              type="text"
              class="form-input"
              placeholder="email@anda.com"
            />
          </div>

          <div class="form-group">
            <label>SMTP Password / App Password</label>
            <input
              v-model="settings.SMTP_PASS"
              type="password"
              class="form-input"
              placeholder="••••••••"
            />
          </div>

          <div class="form-group">
            <label>Nama Pengirim</label>
            <input
              v-model="settings.SMTP_FROM_NAME"
              type="text"
              class="form-input"
              placeholder="Contoh: Panitia Event"
            />
          </div>

          <div class="form-group">
            <label>Email Pengirim</label>
            <input
              v-model="settings.SMTP_FROM_EMAIL"
              type="email"
              class="form-input"
              placeholder="Contoh: no-reply@event.com"
            />
          </div>
        </div>

        <div class="test-row">
          <input
            v-model="testEmail"
            type="email"
            class="form-input"
            placeholder="Masukkan email penerima tes..."
          />
          <button
            type="button"
            class="btn-warning"
            :disabled="isTesting"
            @click="testSmtp"
          >
            {{ isTesting ? "Menguji..." : "Test Koneksi SMTP" }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";

definePageMeta({ layout: "admin", middleware: "auth" });

const settings = ref({
  APP_SECRET_CONFIGURED: "false",
  SMTP_HOST: "",
  SMTP_PORT: "",
  SMTP_USER: "",
  SMTP_PASS: "",
  SMTP_FROM_NAME: "",
  SMTP_FROM_EMAIL: "",
  SCANNER_VOICE_ENABLED: "true",
  SCANNER_SOUND_ENABLED: "true",
  SCANNER_COOLDOWN_MS: "800",
  SCANNER_VOICE_LANG: "id-ID",
});

const testEmail = ref("");
const isSaving = ref(false);
const isTesting = ref(false);
const isUpdating = ref(false);
const isChangingPass = ref(false);
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
});

const showNotice = (type, message) => {
  const isError = type === "error";
  Swal.fire({
    title: isError ? "Error" : "Sukses",
    text: message,
    icon: type === "error" ? "error" : "success",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#0f172a",
    color: "#f8fafc",
  });
};

const copyAppSecret = async () => {
  if (settings.value.APP_SECRET_CONFIGURED !== "true") {
    showNotice("error", "App secret masih kosong.");
    return;
  }

  try {
    const res = await $fetch("/api/admin/settings/app-secret");
    const value = String(res?.secret || "").trim();
    if (!value) {
      showNotice("error", "App secret belum tersedia.");
      return;
    }
    await navigator.clipboard.writeText(value);
    showNotice("success", "App secret berhasil disalin.");
  } catch {
    showNotice("error", "Gagal menyalin app secret.");
  }
};

onMounted(async () => {
  try {
    const res = await $fetch("/api/admin/settings");
    if (res.settings) {
      settings.value = { ...settings.value, ...res.settings };
    }
  } catch {
    showNotice("error", "Gagal memuat pengaturan.");
  }
});

const saveSettings = async () => {
  isSaving.value = true;
  try {
    const res = await $fetch("/api/admin/settings", {
      method: "POST",
      body: { settings: settings.value },
    });
    if (res.success) {
      settings.value.APP_SECRET_CONFIGURED = "true";
      showNotice("success", res.message || "Pengaturan berhasil disimpan.");
    }
  } catch (err) {
    showNotice(
      "error",
      err.data?.statusMessage || "Gagal menyimpan pengaturan.",
    );
  } finally {
    isSaving.value = false;
  }
};

const testSmtp = async () => {
  if (!testEmail.value) {
    showNotice("error", "Silakan masukkan email tujuan test.");
    return;
  }

  isTesting.value = true;
  try {
    const res = await $fetch("/api/admin/settings/test-smtp", {
      method: "POST",
      body: {
        smtpHost: settings.value.SMTP_HOST,
        smtpPort: settings.value.SMTP_PORT,
        smtpUser: settings.value.SMTP_USER,
        smtpPass: settings.value.SMTP_PASS,
        smtpFromName: settings.value.SMTP_FROM_NAME,
        smtpFromEmail: settings.value.SMTP_FROM_EMAIL,
        testEmail: testEmail.value,
      },
    });
    if (res.success) {
      showNotice("success", res.message || "Koneksi SMTP berhasil.");
    }
  } catch (err) {
    showNotice("error", err.data?.statusMessage || "Koneksi SMTP gagal.");
  } finally {
    isTesting.value = false;
  }
};

const changePassword = async () => {
  if (passwordForm.value.newPassword.length < 6) {
    showNotice("error", "Password baru minimal 6 karakter.");
    return;
  }

  isChangingPass.value = true;
  try {
    const res = await $fetch("/api/auth/change-password", {
      method: "POST",
      body: passwordForm.value,
    });
    if (res.success) {
      showNotice("success", "Password Anda berhasil diperbarui.");
      passwordForm.value = { currentPassword: "", newPassword: "" };
    }
  } catch (err) {
    showNotice("error", err.data?.statusMessage || "Gagal mengubah password.");
  } finally {
    isChangingPass.value = false;
  }
};

const runUpdate = async () => {
  const result = await Swal.fire({
    title: "Konfirmasi Update",
    text: "Sistem akan menarik kode, menginstal dependensi, dan membangun ulang aplikasi (build). Proses ini memerlukan waktu beberapa saat.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#22c55e",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Mulai Update",
    cancelButtonText: "Batal",
    background: "#0f172a",
    color: "#f8fafc",
  });

  if (!result.isConfirmed) return;

  isUpdating.value = true;
  try {
    const res = await $fetch("/api/admin/system/update", { method: "POST" });
    if (res.success) {
      await Swal.fire({
        title: "Update Berhasil",
        text:
          res.message ||
          "Kode berhasil diperbarui. Jika ada perubahan besar, Anda mungkin perlu melakukan build ulang di server.",
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
      });
    }
  } catch (err) {
    showNotice("error", err.data?.statusMessage || "Gagal melakukan update.");
  } finally {
    isUpdating.value = false;
  }
};
</script>

<style scoped lang="scss">
.settings-shell {
  max-width: 1240px;
  margin: 0 auto;
}

.header-action {
  display: flex;
  justify-content: space-between;
  align-items: start;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: clamp(1.2rem, 2vw, 1.55rem);
}

.subtitle {
  margin-top: 0.35rem;
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 680px;
}

.cards-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

.setting-card {
  padding: 1rem;
  min-width: 0;
  border-radius: 14px;
}

.card-scanner,
.card-app-secret,
.card-security,
.card-update {
  grid-column: span 6;
}

.card-smtp {
  grid-column: 1 / -1;
}

.card-head h3 {
  font-size: 1.02rem;
}

.card-head p {
  margin-top: 0.32rem;
  color: var(--text-muted);
  font-size: 0.87rem;
}

.form-grid {
  margin-top: 0.9rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.76rem;
}

.app-secret-grid {
  margin-top: 0.85rem;
}

.secret-status strong {
  color: #cfe8ff;
}

.secret-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.small-btn {
  padding: 0.42rem 0.72rem;
  font-size: 0.8rem;
}

label {
  font-size: 0.82rem;
  color: #d8e4f4;
  font-weight: 600;
}

.update-content {
  margin-top: 1.25rem;
}

.update-action-box {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.update-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #94a3b8;

  .dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
  }

  &.is-loading .dot {
    background: #f59e0b;
    animation: pulse 1.5s infinite;
  }
}

.btn-update-action {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: #475569;
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.mt-1 {
  margin-top: 0.25rem;
}
.mt-3 {
  margin-top: 0.75rem;
}

.test-row {
  margin-top: 0.9rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.65rem;
}

.test-row .btn-warning {
  min-width: 180px;
}

@media (max-width: 1200px) {
  .card-scanner,
  .card-app-secret,
  .card-security,
  .card-update,
  .card-smtp {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .header-action {
    align-items: stretch;
  }

  .header-action .btn-primary {
    width: 100%;
  }

  .test-row {
    grid-template-columns: 1fr;
  }

  .test-row .btn-warning {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .setting-card {
    padding: 0.85rem;
  }
  
  .update-action-box {
    padding: 0.85rem;
    gap: 1rem;
  }

  .notice {
    font-size: 0.88rem;
  }
}
</style>
