<template>
  <div class="settings-shell">
    <div class="header-action">
      <div>
        <h1 class="page-title">Pengaturan Sistem</h1>
        <p class="subtitle">
          Atur branding, email, dan preferensi operasional panel.
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
      <section class="glass-panel setting-card card-branding">
        <div class="card-head">
          <h3>Branding & Identitas</h3>
          <p>
            Tampilan branding admin/public seperti logo, favicon, dan nama
            aplikasi.
          </p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Nama Aplikasi</label>
            <input
              v-model="settings.APP_NAME"
              type="text"
              class="form-input"
              placeholder="Contoh: NexTicket"
            />
            <p class="field-hint">Nama utama yang tampil pada halaman admin dan publik.</p>
          </div>

          <div class="form-group">
            <label>Tagline Aplikasi</label>
            <input
              v-model="settings.APP_TAGLINE"
              type="text"
              class="form-input"
              placeholder="Contoh: Premium Ticketing System"
            />
            <p class="field-hint">Teks pendukung singkat di halaman login/public.</p>
          </div>

          <div class="form-group">
            <label>URL Logo</label>
            <input
              v-model="settings.APP_LOGO_URL"
              type="url"
              class="form-input"
              placeholder="https://domain.com/logo.png"
            />
            <div class="inline-actions">
              <button
                type="button"
                class="btn-outline small-btn"
                :disabled="uploading.logo"
                @click="openUpload('logo')"
              >
                {{ uploading.logo ? "Uploading..." : "Upload Logo" }}
              </button>
            </div>
            <p class="field-hint">Disarankan file PNG/SVG rasio landscape.</p>
          </div>

          <div class="form-group">
            <label>URL Favicon</label>
            <input
              v-model="settings.APP_FAVICON_URL"
              type="url"
              class="form-input"
              placeholder="https://domain.com/favicon.ico"
            />
            <div class="inline-actions">
              <button
                type="button"
                class="btn-outline small-btn"
                :disabled="uploading.favicon"
                @click="openUpload('favicon')"
              >
                {{ uploading.favicon ? "Uploading..." : "Upload Favicon" }}
              </button>
            </div>
            <p class="field-hint">Gunakan 32x32 atau 64x64 agar tajam di browser.</p>
          </div>
        </div>

        <input
          ref="logoInputRef"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          class="hidden-input"
          @change="onUploadFile($event, 'logo')"
        />
        <input
          ref="faviconInputRef"
          type="file"
          accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
          class="hidden-input"
          @change="onUploadFile($event, 'favicon')"
        />

        <div class="preview-grid">
          <div class="preview-box">
            <p class="preview-title">Preview Logo</p>
            <img
              v-if="settings.APP_LOGO_URL"
              :src="settings.APP_LOGO_URL"
              alt="Logo preview"
              class="preview-image"
            />
            <p v-else class="empty-preview">Belum ada URL logo.</p>
          </div>
          <div class="preview-box">
            <p class="preview-title">Preview Favicon</p>
            <img
              v-if="settings.APP_FAVICON_URL"
              :src="settings.APP_FAVICON_URL"
              alt="Favicon preview"
              class="preview-favicon"
            />
            <p v-else class="empty-preview">Belum ada URL favicon.</p>
          </div>
        </div>
      </section>
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
      
      <section class="glass-panel setting-card card-security">
        <div class="card-head">
          <h3>Keamanan Akun (Ganti Password)</h3>
          <p>Perbarui password akun Anda secara berkala demi keamanan.</p>
        </div>

        <div class="form-grid app-secret-grid">
          <div class="form-group">
            <label>App Secret (JWT & QR Encryption)</label>
            <input
              v-model="settings.APP_SECRET"
              type="password"
              class="form-input"
              placeholder="Kosongkan jika tidak ingin mengubah"
              autocomplete="new-password"
            />
            <p class="field-hint">
              Disimpan terenkripsi di database. Nilai saat ini tidak pernah ditampilkan.
            </p>
            <p class="field-hint secret-status">
              Status:
              <strong>
                {{ settings.APP_SECRET_CONFIGURED === "true" ? "Sudah dikonfigurasi" : "Belum dikonfigurasi" }}
              </strong>
            </p>
          </div>
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
            <button type="submit" class="btn-warning w-full" :disabled="isChangingPass">
              {{ isChangingPass ? 'Memproses...' : 'Perbarui Password' }}
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
  APP_NAME: "",
  APP_TAGLINE: "",
  APP_LOGO_URL: "",
  APP_FAVICON_URL: "",
  APP_SECRET: "",
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
const logoInputRef = ref(null);
const faviconInputRef = ref(null);
const uploading = ref({
  logo: false,
  favicon: false,
});
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

const openUpload = (type) => {
  if (type === "logo") {
    logoInputRef.value?.click();
    return;
  }
  faviconInputRef.value?.click();
};

const onUploadFile = async (event, type) => {
  const input = event?.target;
  const file = input?.files?.[0];
  if (input) input.value = "";
  if (!file) return;

  uploading.value[type] = true;
  try {
    const form = new FormData();
    form.append("type", type);
    form.append("file", file);

    const res = await $fetch("/api/admin/settings/upload", {
      method: "POST",
      body: form,
    });

    if (res.success) {
      settings.value[res.key] = res.url;
      showNotice(
        "success",
        `${type === "logo" ? "Logo" : "Favicon"} berhasil diupload.`,
      );
    }
  } catch (err) {
    showNotice("error", err.data?.statusMessage || "Upload gagal.");
  } finally {
    uploading.value[type] = false;
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
      if (settings.value.APP_SECRET) {
        settings.value.APP_SECRET = "";
        settings.value.APP_SECRET_CONFIGURED = "true";
      }
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

.card-branding {
  grid-column: span 7;
}

.card-scanner, .card-security {
  grid-column: span 5;
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

.inline-actions {
  margin-top: 0.45rem;
}

.small-btn {
  padding: 0.42rem 0.72rem;
  font-size: 0.8rem;
}

.hidden-input {
  display: none;
}

label {
  font-size: 0.82rem;
  color: #d8e4f4;
  font-weight: 600;
}

.preview-grid {
  margin-top: 0.9rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.8rem;
}

.preview-box {
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.7rem;
  background: rgba(8, 17, 33, 0.58);
}

.preview-title {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.preview-image {
  margin-top: 0.5rem;
  width: 100%;
  max-height: 70px;
  object-fit: contain;
}

.preview-favicon {
  margin-top: 0.5rem;
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.empty-preview {
  margin-top: 0.55rem;
  color: var(--text-muted);
  font-size: 0.85rem;
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
  .card-branding,
  .card-scanner,
  .card-security,
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

  .notice {
    font-size: 0.88rem;
  }
}
</style>
