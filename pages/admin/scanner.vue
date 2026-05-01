<template>
  <div>
    <div class="header-action">
      <div>
        <h1 class="page-title">Scanner QR Kehadiran</h1>
        <p class="page-subtitle">
          Validasi tiket peserta dengan kamera perangkat secara real-time.
        </p>
      </div>
      <span
        :class="[
          'status-pill',
          isScanning && cameraReady ? 'status-live' : 'status-offline',
        ]"
      >
        {{ isScanning && cameraReady ? "Live Camera" : "Standby" }}
      </span>
    </div>

    <div class="scanner-grid">
      <section class="glass-panel scanner-panel">
        <div class="scanner-toolbar">
          <button
            v-if="!isScanning"
            class="btn-primary"
            @click="startScanner"
            :disabled="startInProgress"
          >
            {{ startInProgress ? "Mempersiapkan..." : "Mulai Scan" }}
          </button>
          <button v-else class="btn-outline" @click="stopScanner">
            Hentikan Scan
          </button>

          <button
            class="btn-outline"
            @click="refreshCameraDevices"
            :disabled="cameraLoading || startInProgress"
          >
            Refresh Kamera
          </button>

          <!-- <button
            class="btn-outline"
            @click="debugCameraAccess"
            :disabled="cameraLoading"
          >
            Debug Kamera
          </button> -->

          <select
            v-model="selectedDeviceId"
            class="form-input camera-select"
            @change="restartScanner"
          >
            <option value="">Kamera Otomatis (Belakang/Utama)</option>
            <option
              v-for="camera in cameraDevices"
              :key="camera.deviceId"
              :value="camera.deviceId"
            >
              {{ camera.label || `Kamera ${camera.index}` }}
            </option>
          </select>

          <button
            class="btn-outline"
            @click="openCaptureFallback"
            :disabled="manualCaptureBusy"
          >
            {{
              manualCaptureBusy ? "Memproses Foto..." : "Scan dari Foto/Kamera"
            }}
          </button>

          <input
            ref="captureInputRef"
            type="file"
            accept="image/*"
            capture="environment"
            class="capture-input"
            @change="onCaptureFileChange"
          />
        </div>

        <div v-if="isIosStandalonePwa" class="camera-alert warning">
          iOS mode PWA memiliki bug kamera bawaan WebKit. Jika kamera gagal di
          mode ini, buka halaman via Safari langsung.
        </div>

        <div class="camera-wrapper">
          <div :id="scannerElementId" class="scanner-region"></div>
          <div class="scan-frame"></div>

          <div v-if="cameraLoading" class="camera-overlay">
            Memuat kamera...
          </div>
          <div v-else-if="cameraError" class="camera-overlay error">
            <div class="overlay-content">
              <p>{{ cameraError }}</p>
              <button class="btn-outline" @click="startScanner">
                Coba Lagi
              </button>
              <button
                v-if="cameraPermissionHelp"
                class="btn-outline"
                @click="showCameraPermissionHelp"
              >
                Lihat Bantuan
              </button>
            </div>
          </div>
          <div v-else-if="!isScanning" class="camera-overlay idle">
            <div class="overlay-content">
              <p>Kamera belum aktif.</p>
              <p class="hint">
                Kamera browser wajib diberi izin oleh sistem keamanan browser.
              </p>
            </div>
          </div>
          <div
            v-else-if="isProcessing && !scannedTicket"
            class="camera-overlay processing"
          >
            Memvalidasi QR...
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="actionModal.open"
      class="modal-overlay"
      @click.self="closeActionModal"
    >
      <div class="glass-panel modal-card">
        <h3>{{ actionModal.title }}</h3>
        <p class="modal-text">{{ actionModal.description }}</p>
        <div class="modal-actions">
          <button
            class="btn-outline"
            :disabled="isProcessing"
            @click="closeActionModal"
          >
            Batal
          </button>
          <button
            :class="
              actionModal.action === 'MASUK' ? 'btn-primary' : 'btn-warning'
            "
            :disabled="isProcessing"
            @click="submitActionFromModal"
          >
            {{ isProcessing ? "Memproses..." : actionModal.confirmLabel }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="scanResultModal.open && scannedTicket"
      class="modal-overlay"
      @click.self="closeScanResultModal"
    >
      <div class="glass-panel modal-card scan-result-modal">
        <div class="scan-modal-head">
          <h3>Konfirmasi Hasil Scan</h3>
          <p class="scan-modal-subtitle">
            QR valid terdeteksi. Lanjutkan dengan aksi kehadiran.
          </p>
        </div>

        <div class="scan-modal-body">
          <div class="scan-info-row">
            <span class="scan-info-label">Nama Peserta</span>
            <strong class="scan-info-value">{{
              scannedTicket.registrantName
            }}</strong>
          </div>
          <div class="scan-info-row">
            <span class="scan-info-label">Event</span>
            <strong class="scan-info-value">{{
              scannedTicket.eventName
            }}</strong>
          </div>
          <div class="scan-info-row">
            <span class="scan-info-label">Status Saat Ini</span>
            <span
              :class="['badge', getBadgeClass(scannedTicket.currentStatus)]"
            >
              {{ scannedTicket.currentStatus.replace("_", " ") }}
            </span>
          </div>
        </div>

        <div class="modal-actions scan-modal-actions">
          <button
            class="btn-outline"
            :disabled="isProcessing"
            @click="closeScanResultModal"
          >
            Tutup
          </button>
          <button
            v-if="getRecommendedAction(scannedTicket.currentStatus) === 'MASUK'"
            class="btn-primary"
            :disabled="isProcessing"
            @click="openActionModalFromScanResult('MASUK')"
          >
            Konfirmasi MASUK
          </button>
          <button
            v-if="
              getRecommendedAction(scannedTicket.currentStatus) === 'KELUAR'
            "
            class="btn-warning"
            :disabled="isProcessing"
            @click="openActionModalFromScanResult('KELUAR')"
          >
            Konfirmasi KELUAR
          </button>
        </div>
      </div>
    </div>

    <div class="toast-stack">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast-item', `toast-${toast.type}`]"
      >
        <p>{{ toast.message }}</p>
        <button class="toast-close" @click="removeToast(toast.id)">x</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Swal from "sweetalert2";

definePageMeta({ layout: "admin", middleware: "auth" });

let Html5QrcodeClass = null;
let Html5QrcodeSupportedFormatsClass = null;

const scannerElementId = "scanner-region-admin";

const html5Qr = ref(null);
const captureInputRef = ref(null);

const scannerState = ref("idle"); // idle | preparing | starting | running | stopping
const isScanning = ref(false);
const startInProgress = ref(false);
const cameraLoading = ref(false);
const cameraReady = ref(false);
const cameraError = ref("");
const cameraPermissionState = ref("unknown"); // unknown | prompt | granted | denied
const cameraPermissionHelp = ref("");

const selectedDeviceId = ref("");
const cameraDevices = ref([]);

const scannedTicket = ref(null);
const isProcessing = ref(false);
const manualCaptureBusy = ref(false);
const actionModal = ref({
  open: false,
  action: "",
  title: "",
  description: "",
  confirmLabel: "",
});
const scanResultModal = ref({
  open: false,
});
const toasts = ref([]);

const isIosStandalonePwa = ref(false);
const isLikelyInAppBrowser = ref(false);
const isSecureCameraContext = ref(false);

let sessionToken = 0;
let scanCooldownUntil = 0;
let permissionStatusWatcher = null;
let toastSeed = 0;
let lastScannedRawToken = "";
let lastScannedAt = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pushToast = (type, message, ttl = 3200) => {
  const id = ++toastSeed;
  toasts.value.push({ id, type, message });
  setTimeout(() => {
    removeToast(id);
  }, ttl);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
};

const playScanBeep = () => {
  if (!import.meta.client) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const audio = new AudioCtx();
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(940, audio.currentTime);
  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.2);
};

const getNextActionLabel = (currentStatus) => {
  return currentStatus === "MASUK" ? "keluar" : "masuk";
};

const getRecommendedAction = (currentStatus) => {
  if (currentStatus === "MASUK") return "KELUAR";
  if (currentStatus === "BELUM_HADIR" || currentStatus === "KELUAR") {
    return "MASUK";
  }
  return "";
};

const announceParticipant = (name, currentStatus) => {
  if (!import.meta.client || !("speechSynthesis" in window) || !name) return;

  try {
    window.speechSynthesis.cancel();
    const actionLabel = getNextActionLabel(currentStatus);
    const utter = new SpeechSynthesisUtterance(
      `Scan berhasil! Nama ${name}, silahkan ${actionLabel}`,
    );
    utter.lang = "id-ID";
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch {
    // noop
  }
};

const announceStatusConfirmed = (name, action) => {
  if (!import.meta.client || !("speechSynthesis" in window) || !name) return;

  try {
    window.speechSynthesis.cancel();
    const statusLabel = action === "KELUAR" ? "keluar" : "masuk";
    const utter = new SpeechSynthesisUtterance(
      `Nama ${name}, berhasil ${statusLabel}`,
    );
    utter.lang = "id-ID";
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch {
    // noop
  }
};

const pauseScannerSafely = () => {
  try {
    if (html5Qr.value && scannerState.value === "running") {
      html5Qr.value.pause(true);
    }
  } catch {
    // noop
  }
};

const resumeScannerSafely = () => {
  try {
    if (html5Qr.value && scannerState.value === "running") {
      html5Qr.value.resume();
    }
  } catch {
    // noop
  }
};

const loadHtml5Qrcode = async () => {
  if (!import.meta.client) return false;

  if (!Html5QrcodeClass) {
    const module = await import("html5-qrcode");
    Html5QrcodeClass = module.Html5Qrcode;
    Html5QrcodeSupportedFormatsClass = module.Html5QrcodeSupportedFormats;
  }

  return true;
};

const debugCameraAccess = async () => {
  console.table({
    href: location.href,
    origin: location.origin,
    protocol: location.protocol,
    hostname: location.hostname,
    isSecureContext: window.isSecureContext,
    hasMediaDevices: Boolean(navigator.mediaDevices),
    hasGetUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
    permissionState: cameraPermissionState.value,
    userAgent: navigator.userAgent,
  });

  try {
    if (document.permissionsPolicy?.allowsFeature) {
      console.log(
        "Permissions Policy camera allowed:",
        document.permissionsPolicy.allowsFeature("camera"),
      );
    }

    if (document.featurePolicy?.allowsFeature) {
      console.log(
        "Feature Policy camera allowed:",
        document.featurePolicy.allowsFeature("camera"),
      );
    }
  } catch (error) {
    console.warn("Tidak bisa membaca permissions policy:", error);
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    console.log("RAW CAMERA TEST SUCCESS:", stream);

    stream.getTracks().forEach((track) => track.stop());

    pushToast("success", "Tes kamera berhasil. Permission dan browser aman.");
  } catch (error) {
    console.error("RAW CAMERA TEST FAILED:", {
      name: error?.name,
      message: error?.message,
      constraint: error?.constraint,
    });

    pushToast("error", `Tes kamera gagal: ${error?.name} - ${error?.message}`);
  }
};

const detectRuntime = () => {
  if (!import.meta.client) return;

  const ua = navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/i.test(ua);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true;

  isIosStandalonePwa.value = Boolean(isIos && standalone);

  isLikelyInAppBrowser.value =
    /FBAN|FBAV|Instagram|Line|Twitter|TikTok|MicroMessenger|; wv\)/i.test(ua);

  isSecureCameraContext.value =
    window.isSecureContext ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";
};

const getBrowserCameraInstruction = () => {
  const ua = navigator.userAgent || "";

  if (/iPad|iPhone|iPod/i.test(ua)) {
    return "Buka Settings iPhone > Safari > Camera > Allow, atau buka halaman ini langsung lewat Safari. Jika mode PWA bermasalah, buka lewat Safari biasa.";
  }

  if (/Android/i.test(ua)) {
    return "Buka Chrome > ikon gembok/info di address bar > Permissions/Site settings > Camera > Allow, lalu reload halaman.";
  }

  return "Buka pengaturan browser untuk domain ini, izinkan Camera, lalu reload halaman.";
};

const setCameraError = (message, help = "") => {
  cameraError.value = message;
  cameraPermissionHelp.value = help || "";
};

const normalizeCameraError = (error) => {
  const name = error?.name || "CameraError";
  const message = error?.message || "";

  if (!isSecureCameraContext.value) {
    return "Kamera hanya bisa digunakan melalui HTTPS atau localhost.";
  }

  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Izin kamera ditolak atau diblokir oleh browser.";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Perangkat kamera tidak ditemukan.";
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera, meeting, atau tab lain lalu coba lagi.";
  }

  if (
    name === "OverconstrainedError" ||
    name === "ConstraintNotSatisfiedError"
  ) {
    return "Konfigurasi kamera tidak cocok di perangkat ini. Sistem akan mencoba kamera lain.";
  }

  if (name === "NotSupportedError" || name === "InsecureContextError") {
    return "Browser tidak mendukung kamera pada mode ini. Gunakan HTTPS atau localhost.";
  }

  if (/permission|notallowed|denied/i.test(message)) {
    return "Izin kamera ditolak atau belum diberikan.";
  }

  if (/timed out|timeout/i.test(message)) {
    return "Membuka kamera timeout. Coba pilih kamera lain atau gunakan scan dari foto.";
  }

  if (message) return message;

  return "Terjadi kendala saat membuka kamera.";
};

const checkCameraPermission = async () => {
  if (!import.meta.client) return "unknown";

  try {
    if (!navigator.permissions?.query) {
      cameraPermissionState.value = "unknown";
      return "unknown";
    }

    const status = await navigator.permissions.query({ name: "camera" });

    cameraPermissionState.value = status.state;
    permissionStatusWatcher = status;

    status.onchange = () => {
      cameraPermissionState.value = status.state;
    };

    return status.state;
  } catch {
    cameraPermissionState.value = "unknown";
    return "unknown";
  }
};

const requestCameraPermission = async () => {
  if (!import.meta.client) return false;

  cameraPermissionHelp.value = "";

  if (!window.isSecureContext) {
    setCameraError(
      "Kamera tidak bisa dibuka karena halaman belum dianggap secure context.",
      "Pastikan halaman dibuka dari HTTPS ngrok, bukan http://localhost dari HP dan bukan dari iframe/in-app browser.",
    );
    return false;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraError(
      "Browser tidak mendukung akses kamera.",
      "Gunakan Chrome Android atau Safari iPhone terbaru. Jangan buka dari WhatsApp, Instagram, TikTok, atau in-app browser.",
    );
    return false;
  }

  let stream = null;

  try {
    // PENTING:
    // Untuk mobile, panggil video:true dulu agar browser memunculkan popup izin.
    // Jangan langsung pakai facingMode environment di tahap permission.
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    cameraPermissionState.value = "granted";
    cameraError.value = "";
    cameraPermissionHelp.value = "";

    return true;
  } catch (error) {
    console.error("Camera permission rejected:", {
      name: error?.name,
      message: error?.message,
      constraint: error?.constraint,
      secureContext: window.isSecureContext,
      mediaDevices: Boolean(navigator.mediaDevices),
      getUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
      userAgent: navigator.userAgent,
    });

    const errorName = error?.name || "";

    if (errorName === "NotAllowedError" || errorName === "SecurityError") {
      cameraPermissionState.value = "denied";

      setCameraError(
        "Izin kamera ditolak atau diblokir.",
        "Jika popup izin tidak muncul, berarti browser sudah memblokir kamera untuk domain ini. Buka Site Settings/Pengaturan Situs, izinkan Camera, lalu reload halaman.",
      );

      return false;
    }

    if (errorName === "NotFoundError") {
      setCameraError("Kamera tidak ditemukan di perangkat ini.");
      return false;
    }

    if (errorName === "NotReadableError") {
      setCameraError(
        "Kamera sedang dipakai aplikasi lain.",
        "Tutup aplikasi kamera, Zoom, Google Meet, WhatsApp video call, atau tab browser lain lalu coba lagi.",
      );
      return false;
    }

    if (errorName === "OverconstrainedError") {
      setCameraError(
        "Konfigurasi kamera tidak cocok.",
        "Coba reload halaman, lalu pilih kamera lain dari dropdown.",
      );
      return false;
    }

    setCameraError(
      error?.message || "Gagal meminta izin kamera.",
      "Coba buka langsung dari Chrome/Safari, bukan dari in-app browser.",
    );

    return false;
  } finally {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      await wait(350);
    }
  }
};

const ensureReader = async () => {
  await loadHtml5Qrcode();
  await nextTick();

  const scannerElement = document.getElementById(scannerElementId);

  if (!scannerElement) {
    throw new Error("Element scanner tidak ditemukan.");
  }

  if (!html5Qr.value) {
    html5Qr.value = new Html5QrcodeClass(scannerElementId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormatsClass.QR_CODE],
      useBarCodeDetectorIfSupported: true,
    });
  }
};

const disposeReader = async () => {
  if (!html5Qr.value) return;

  try {
    await html5Qr.value.stop();
  } catch {
    // scanner mungkin belum running
  }

  try {
    html5Qr.value.clear();
  } catch {
    // noop
  }

  html5Qr.value = null;
};

const stopScanner = async () => {
  sessionToken += 1;
  scannerState.value = "stopping";

  startInProgress.value = false;
  cameraLoading.value = false;
  cameraReady.value = false;
  isScanning.value = false;

  await disposeReader();

  scanResultModal.value.open = false;
  actionModal.value.open = false;
  scannerState.value = "idle";
};

const refreshCameraDevices = async () => {
  try {
    await loadHtml5Qrcode();

    if (!Html5QrcodeClass) {
      cameraDevices.value = [];
      return;
    }

    const cameras = await Html5QrcodeClass.getCameras();

    cameraDevices.value = cameras.map((cam, index) => ({
      deviceId: cam.id,
      label: cam.label || "",
      index: index + 1,
    }));
  } catch (error) {
    console.error("Gagal mengambil daftar kamera:", error);
    cameraDevices.value = [];
  }
};

const pushUniqueAttempt = (attempts, keys, label, input, key) => {
  if (keys.has(key)) return;

  keys.add(key);
  attempts.push({ label, input });
};

const buildCameraAttempts = () => {
  const attempts = [];
  const keys = new Set();

  if (selectedDeviceId.value) {
    pushUniqueAttempt(
      attempts,
      keys,
      "selected-device-string",
      selectedDeviceId.value,
      `device-string:${selectedDeviceId.value}`,
    );

    pushUniqueAttempt(
      attempts,
      keys,
      "selected-device-constraint",
      { deviceId: { exact: selectedDeviceId.value } },
      `device-exact:${selectedDeviceId.value}`,
    );
  }

  pushUniqueAttempt(
    attempts,
    keys,
    "facing-ideal-environment",
    { facingMode: { ideal: "environment" } },
    "facing:environment-ideal",
  );

  pushUniqueAttempt(
    attempts,
    keys,
    "facing-simple-environment",
    { facingMode: "environment" },
    "facing:environment-simple",
  );

  if (!selectedDeviceId.value && cameraDevices.value.length > 0) {
    const preferredBackCameras = cameraDevices.value.filter((device) =>
      /(back|rear|environment|belakang|kamera belakang|0, facing back)/i.test(
        device.label || "",
      ),
    );

    preferredBackCameras.forEach((device, index) => {
      pushUniqueAttempt(
        attempts,
        keys,
        `preferred-back-device-${index + 1}`,
        device.deviceId,
        `device-string:${device.deviceId}`,
      );
    });

    cameraDevices.value.forEach((device, index) => {
      pushUniqueAttempt(
        attempts,
        keys,
        `available-device-${index + 1}`,
        device.deviceId,
        `device-string:${device.deviceId}`,
      );
    });
  }

  pushUniqueAttempt(
    attempts,
    keys,
    "facing-ideal-user",
    { facingMode: { ideal: "user" } },
    "facing:user-ideal",
  );

  pushUniqueAttempt(attempts, keys, "basic-video", true, "video:true");

  return attempts;
};

const resetScannerUiState = () => {
  cameraLoading.value = false;
  cameraReady.value = false;
  isScanning.value = false;
  startInProgress.value = false;
  scannerState.value = "idle";
};

const processDetectedQr = async (decodedText) => {
  if (!decodedText || scannedTicket.value || isProcessing.value) return;
  if (Date.now() < scanCooldownUntil) return;
  if (
    decodedText === lastScannedRawToken &&
    Date.now() - lastScannedAt < 10000
  ) {
    return;
  }

  scanCooldownUntil = Date.now() + 800;
  lastScannedRawToken = decodedText;
  lastScannedAt = Date.now();
  isProcessing.value = true;
  pauseScannerSafely();

  try {
    const res = await $fetch("/api/scan/validate", {
      method: "POST",
      body: { qrToken: decodedText },
      timeout: 7000,
      retry: 0,
    });

    if (res.success) {
      scannedTicket.value = res.ticket;
      scanResultModal.value.open = true;
      playScanBeep();
      announceParticipant(
        res.ticket?.registrantName || "",
        res.ticket?.currentStatus || "",
      );
      pushToast(
        "success",
        `QR valid: ${res.ticket?.registrantName || "Peserta"}`,
      );
    }
  } catch (err) {
    const message = err?.data?.statusMessage || "QR Code tidak valid";
    await Swal.fire({
      title: "Gagal!",
      text: message,
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#f43f5e",
      background: "#0f172a",
      color: "#f1f7ff",
    });
    resumeScannerSafely();
  } finally {
    isProcessing.value = false;
  }
};

const onDecodeSuccess = async (decodedText) => {
  cameraLoading.value = false;
  cameraReady.value = true;
  cameraError.value = "";

  await processDetectedQr(decodedText);
};

const onDecodeError = () => {
  // decode miss sering terjadi saat kamera aktif, jadi tidak perlu ditampilkan
};

const startScanner = async () => {
  if (startInProgress.value) return;

  const token = ++sessionToken;

  startInProgress.value = true;
  cameraLoading.value = true;
  cameraReady.value = false;
  cameraError.value = "";
  cameraPermissionHelp.value = "";
  isScanning.value = true;
  scannedTicket.value = null;
  scanResultModal.value.open = false;
  actionModal.value.open = false;
  isProcessing.value = false;
  scannerState.value = "preparing";

  try {
    detectRuntime();

    if (!isSecureCameraContext.value) {
      setCameraError(
        "Kamera tidak bisa digunakan karena halaman belum HTTPS.",
        "Deploy menggunakan HTTPS. Untuk development gunakan http://localhost, bukan IP lokal seperti http://192.168.x.x.",
      );
      resetScannerUiState();
      return;
    }

    if (isLikelyInAppBrowser.value) {
      console.warn(
        "Kemungkinan dibuka dari in-app browser. Kamera bisa dibatasi.",
      );
    }

    await ensureReader();
    await checkCameraPermission();

    const allowed = await requestCameraPermission();

    if (!allowed) {
      resetScannerUiState();
      return;
    }

    await refreshCameraDevices();
    await ensureReader();

    const scanConfig = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrSize = Math.floor(Math.min(280, minEdge * 0.72));

        return {
          width: qrSize,
          height: qrSize,
        };
      },
      aspectRatio: 1.333,
      disableFlip: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
    };

    let lastError = null;
    const attempts = buildCameraAttempts();

    for (const attempt of attempts) {
      if (token !== sessionToken || !isScanning.value) {
        startInProgress.value = false;
        return;
      }

      try {
        scannerState.value = "starting";

        console.info("Mencoba membuka kamera:", attempt.label, attempt.input);

        await ensureReader();

        await html5Qr.value.start(
          attempt.input,
          scanConfig,
          onDecodeSuccess,
          onDecodeError,
        );

        if (token !== sessionToken || !isScanning.value) {
          await stopScanner();
          return;
        }

        scannerState.value = "running";
        cameraLoading.value = false;
        cameraReady.value = true;
        cameraError.value = "";
        cameraPermissionHelp.value = "";
        startInProgress.value = false;

        console.info("Kamera berhasil dibuka:", attempt.label);

        return;
      } catch (error) {
        console.error("Gagal membuka kamera:", attempt.label, error);
        lastError = error;

        await disposeReader();
        await wait(180);

        if (
          error?.name === "NotAllowedError" ||
          error?.name === "SecurityError"
        ) {
          break;
        }
      }
    }

    const message = normalizeCameraError(lastError);

    setCameraError(
      message,
      cameraPermissionState.value === "denied"
        ? getBrowserCameraInstruction()
        : "Coba pilih kamera lain, reload halaman, atau gunakan tombol Scan dari Foto/Kamera.",
    );

    resetScannerUiState();
  } catch (error) {
    console.error("Scanner fatal error:", error);

    setCameraError(
      error?.message || "Scanner gagal dimulai. Coba reload halaman.",
      getBrowserCameraInstruction(),
    );

    resetScannerUiState();
  }
};

const restartScanner = async () => {
  if (!isScanning.value) return;

  await stopScanner();
  await nextTick();
  await wait(250);
  await startScanner();
};

const openCaptureFallback = () => {
  if (manualCaptureBusy.value) return;

  captureInputRef.value?.click();
};

const onCaptureFileChange = async (event) => {
  const target = event?.target;
  const file = target?.files?.[0];

  if (target) target.value = "";
  if (!file) return;

  manualCaptureBusy.value = true;

  try {
    await ensureReader();

    const result = await html5Qr.value.scanFileV2(file, false);

    if (!result?.decodedText) {
      throw new Error("QR tidak terdeteksi.");
    }

    await processDetectedQr(result.decodedText);
  } catch (error) {
    console.error("Gagal scan dari foto:", error);
    await Swal.fire({
      title: "Scan Gagal",
      text: "QR tidak terdeteksi dari foto. Coba foto lebih dekat, terang, dan tidak blur.",
      icon: "warning",
      confirmButtonText: "Coba Lagi",
      confirmButtonColor: "#f43f5e",
      background: "#0f172a",
      color: "#f1f7ff",
    });
  } finally {
    manualCaptureBusy.value = false;
  }
};

const openActionModal = (action) => {
  if (!scannedTicket.value || isProcessing.value) return;

  actionModal.value = {
    open: true,
    action,
    title: action === "MASUK" ? "Konfirmasi Check-in" : "Konfirmasi Check-out",
    description:
      action === "MASUK"
        ? `Tandai ${scannedTicket.value.registrantName} sebagai MASUK?`
        : `Tandai ${scannedTicket.value.registrantName} sebagai KELUAR?`,
    confirmLabel: action === "MASUK" ? "Ya, Tandai MASUK" : "Ya, Tandai KELUAR",
  };
};

const closeScanResultModal = () => {
  if (isProcessing.value) return;
  resetScan();
};

const openActionModalFromScanResult = (action) => {
  scanResultModal.value.open = false;
  openActionModal(action);
};

const closeActionModal = () => {
  if (isProcessing.value) return;
  resetScan();
};

const submitActionFromModal = async () => {
  if (!scannedTicket.value || !actionModal.value.action) return;

  isProcessing.value = true;

  try {
    const res = await $fetch("/api/scan/confirm", {
      method: "POST",
      body: {
        ticketId: scannedTicket.value.id,
        action: actionModal.value.action,
        expectedStatus: scannedTicket.value.currentStatus,
      },
      timeout: 7000,
      retry: 0,
    });

    if (res.success) {
      const action = actionModal.value.action;
      const statusLabel = action === "KELUAR" ? "keluar" : "masuk";
      const participantName = scannedTicket.value.registrantName || "Peserta";

      announceStatusConfirmed(participantName, action);
      pushToast("success", `Nama ${participantName}, berhasil ${statusLabel}.`);
      resetScan();
    }
  } catch (err) {
    pushToast("error", err?.data?.statusMessage || "Gagal mengubah status");
    isProcessing.value = false;
  }
};

const resetScan = () => {
  scannedTicket.value = null;
  isProcessing.value = false;
  scanResultModal.value.open = false;
  actionModal.value.open = false;
  resumeScannerSafely();
};

const getBadgeClass = (status) => {
  if (status === "MASUK") return "badge-green";
  if (status === "KELUAR") return "badge-yellow";

  return "badge-gray";
};

const showCameraPermissionHelp = () => {
  pushToast(
    "info",
    cameraPermissionHelp.value ||
      getBrowserCameraInstruction() ||
      "Izinkan kamera dari pengaturan browser, lalu reload halaman.",
    5500,
  );
};

onMounted(async () => {
  detectRuntime();
  await checkCameraPermission();

  if (cameraPermissionState.value === "granted") {
    await refreshCameraDevices();
  }

  if (isIosStandalonePwa.value) {
    console.warn(
      "iOS PWA mode terdeteksi. Jika kamera gagal, buka lewat Safari biasa.",
    );
  }

  if (isLikelyInAppBrowser.value) {
    console.warn(
      "In-app browser terdeteksi. Jika kamera gagal, buka lewat Chrome/Safari.",
    );
  }
});

onBeforeUnmount(async () => {
  if (permissionStatusWatcher) {
    permissionStatusWatcher.onchange = null;
    permissionStatusWatcher = null;
  }

  await stopScanner();
});
</script>

<style scoped lang="scss">
.header-action {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title {
  font-size: clamp(1.2rem, 2vw, 1.55rem);
}

.page-subtitle {
  margin-top: 0.35rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.62rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.status-live {
  color: #7af5a2;
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.34);
}

.status-offline {
  color: #b3c3d7;
  background: rgba(148, 163, 184, 0.14);
  border-color: rgba(148, 163, 184, 0.3);
}

.scanner-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.scanner-panel {
  padding: 1rem;
}

.scanner-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

.camera-select {
  min-width: 220px;
}

.capture-input {
  display: none;
}

.camera-alert {
  margin-top: 0.9rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(8, 17, 33, 0.56);
  padding: 0.9rem;
}

.camera-alert.warning {
  border-color: rgba(245, 158, 11, 0.36);
  color: #ffe2a7;
}

.hint {
  font-size: 0.86rem;
  color: var(--text-muted);
  margin-top: 0.3rem;
}

.camera-wrapper {
  margin-top: 0.9rem;
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: #03060d;
  position: relative;
  border: 1px solid var(--line-soft);
  min-height: 300px;
}

.scanner-region {
  width: 100%;
  min-height: 300px;
}

.scanner-region :deep(video) {
  width: 100% !important;
  min-height: 300px !important;
  object-fit: cover !important;
}

.scanner-region :deep(canvas) {
  display: none !important;
}

.scan-frame {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(55vw, 260px);
  height: min(55vw, 260px);
  transform: translate(-50%, -50%);
  border: 2px solid rgba(20, 184, 166, 0.72);
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px rgba(8, 17, 33, 0.8);
  pointer-events: none;
  z-index: 2;
}

.camera-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(3, 10, 22, 0.76);
  color: #f4fdff;
  font-weight: 700;
  padding: 1rem;
}

.camera-overlay.idle {
  background: rgba(3, 10, 22, 0.86);
}

.camera-overlay.error {
  background: rgba(33, 8, 12, 0.82);
}

.camera-overlay.processing {
  background: rgba(14, 116, 144, 0.45);
}

.overlay-content {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  align-items: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(2, 8, 23, 0.7);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  width: min(520px, 100%);
  padding: 1rem;
}

.modal-text {
  margin-top: 0.6rem;
  color: var(--text-muted);
}

.modal-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.scan-result-modal {
  width: min(560px, 100%);
}

.scan-modal-head h3 {
  font-size: 1.08rem;
}

.scan-modal-subtitle {
  margin-top: 0.3rem;
  color: var(--text-muted);
  font-size: 0.86rem;
}

.scan-modal-body {
  margin-top: 0.9rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(8, 17, 33, 0.52);
  padding: 0.78rem;
  display: grid;
  gap: 0.6rem;
}

.scan-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.24);
  padding-bottom: 0.55rem;
}

.scan-info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.scan-info-label {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.scan-info-value {
  text-align: right;
  color: #f1f7ff;
}

.scan-modal-actions {
  margin-top: 0.9rem;
}

.toast-stack {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1300;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  max-width: min(400px, calc(100vw - 2rem));
}

.toast-item {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.6rem;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  background: rgba(9, 20, 38, 0.95);
  padding: 0.65rem 0.72rem;
  color: #e8f2ff;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
}

.toast-success {
  border-color: rgba(34, 197, 94, 0.4);
}

.toast-error {
  border-color: rgba(251, 113, 133, 0.44);
}

.toast-info {
  border-color: rgba(56, 189, 248, 0.44);
}

.toast-close {
  border: none;
  background: transparent;
  color: #c9d8ee;
  font-size: 0.9rem;
  cursor: pointer;
}

@media (max-width: 1100px) {
  .scanner-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .scanner-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .camera-select {
    min-width: 0;
  }

  .scan-info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.28rem;
  }

  .scan-info-value {
    text-align: left;
  }

  .scan-modal-actions {
    display: grid;
    grid-template-columns: 1fr;
    justify-content: stretch;
  }
}
</style>
