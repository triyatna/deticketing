<template>
  <div class="create-shell">
    <div class="header-action">
      <div>
        <h1 class="page-title">{{ isEditMode ? 'Edit Event' : 'Buat Event Baru' }}</h1>
        <p class="subtitle">
          {{ isEditMode ? 'Perbarui konfigurasi event dan struktur form pendaftaran.' : 'Builder form advanced dengan tipe input setara Google Form.' }}
        </p>
      </div>
      <NuxtLink to="/admin/events" class="btn-outline">Kembali</NuxtLink>
    </div>

    <div class="glass-panel form-shell mt-4">
      <div v-if="isPrefilling" class="state-box">Memuat detail event...</div>
      <form @submit.prevent="submitEvent">
        <section class="form-card">
          <h3 class="card-title">Informasi Dasar</h3>
          <p class="card-desc">
            Nama, deskripsi, kuota, dan aturan bukti transfer.
          </p>

          <div class="form-grid">
            <div class="form-group row-full">
              <label>Nama Event</label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                required
                placeholder="Contoh: Konser Kemerdekaan"
              />
            </div>

            <div class="form-group row-full">
              <label>Deskripsi Singkat</label>
              <textarea
                v-model="form.description"
                class="form-input"
                rows="3"
                placeholder="Deskripsi event..."
              ></textarea>
            </div>

            <div class="group-divider row-full">
              <span>Branding Form</span>
            </div>

            <div class="form-group row-full">
              <label>Image Header (Logo / Thumbnail)</label>
              <input
                v-model="form.headerImageUrl"
                type="text"
                class="form-input"
                placeholder="https://... atau /uploads/..."
              />
              <div v-if="form.headerImageUrl" class="preview-wrap mt-2">
                <img :src="form.headerImageUrl" class="image-preview-sm" alt="Header Preview" />
              </div>
              <div class="upload-inline">
                <input
                  type="file"
                  class="form-input upload-file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  :disabled="isUploading('header')"
                  @change="onUploadHeaderImage"
                />
                <span class="upload-tip">{{
                  isUploading("header")
                    ? "Uploading..."
                    : "Upload gambar header"
                }}</span>
              </div>
            </div>

            <div class="form-group row-full">
              <label>Background Form</label>
              <select v-model="form.backgroundMode" class="form-input">
                <option value="color">Warna Solid</option>
                <option value="texture">Tekstur Pattern</option>
                <option value="image">Background Image</option>
              </select>
            </div>

            <div
              class="grid-two row-full"
              v-if="form.backgroundMode === 'color'"
            >
              <div class="form-group">
                <label>Warna Background</label>
                <input
                  v-model="form.backgroundColor"
                  type="color"
                  class="form-input color-input"
                />
              </div>
              <div class="form-group">
                <label>Preview Hex</label>
                <input
                  v-model="form.backgroundColor"
                  type="text"
                  class="form-input"
                  placeholder="#0a1222"
                />
              </div>
            </div>

            <div
              class="grid-two row-full"
              v-if="form.backgroundMode === 'texture'"
            >
              <div class="form-group">
                <label>Warna Dasar</label>
                <input
                  v-model="form.backgroundColor"
                  type="color"
                  class="form-input color-input"
                />
              </div>
              <div class="form-group">
                <label>Tipe Tekstur</label>
                <select v-model="form.backgroundTexture" class="form-input">
                  <option value="dots">Dots</option>
                  <option value="grid">Grid</option>
                  <option value="diagonal">Diagonal</option>
                  <option value="zigzag">Zig Zag</option>
                  <option value="crosshatch">Crosshatch</option>
                  <option value="triangles">Triangles</option>
                  <option value="cubes">Cubes</option>
                  <option value="circles">Circles</option>
                  <option value="waves">Waves</option>
                </select>
              </div>
            </div>

            <div
              class="form-group row-full"
              v-if="form.backgroundMode === 'image'"
            >
              <label>URL Background Image</label>
              <input
                v-model="form.backgroundImageUrl"
                type="text"
                class="form-input"
                placeholder="https://... atau /uploads/..."
              />
              <div v-if="form.backgroundImageUrl" class="preview-wrap mt-2">
                <img :src="form.backgroundImageUrl" class="image-preview-sm" alt="Background Preview" />
              </div>
              <div class="upload-inline">
                <input
                  type="file"
                  class="form-input upload-file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  :disabled="isUploading('background')"
                  @change="onUploadBackgroundImage"
                />
                <span class="upload-tip">{{
                  isUploading("background")
                    ? "Uploading..."
                    : "Upload background image"
                }}</span>
              </div>
            </div>

            <div class="group-divider row-full">
              <span>Pembayaran & Validasi</span>
            </div>

            <div class="form-group row-group">
              <div class="flex-1">
                <label>Kuota Pendaftar (Opsional)</label>
                <input
                  v-model="form.quota"
                  type="number"
                  class="form-input"
                  placeholder="Kosongkan jika tak terbatas"
                />
              </div>
            </div>

            <div class="form-group row-full payment-wrap">
              <div class="payment-head mb-4">
                <div>
                  <label class="payment-title">Konfigurasi Pembayaran</label>
                  <p class="payment-subtitle">
                    Aktifkan jika event ini memerlukan biaya pendaftaran.
                  </p>
                </div>
                <div class="toggle-flex">
                  <span class="toggle-status">{{ form.paymentEnabled ? 'Aktif' : 'Nonaktif' }}</span>
                  <label class="switch">
                    <input type="checkbox" v-model="form.paymentEnabled" />
                    <span class="slider round"></span>
                  </label>
                </div>
              </div>

              <div v-if="form.paymentEnabled" class="payment-body-fade">
                <div class="nominal-global-wrap mb-4">
                  <div class="form-group">
                    <label>Nominal Pembayaran Event (Rp)</label>
                    <input
                      v-model="form.nominal"
                      type="number"
                      class="form-input nominal-input-large"
                      placeholder="Contoh: 50000"
                    />
                    <p class="helper-text">
                      Nominal ini akan ditampilkan sebagai jumlah yang harus
                      dibayar oleh pendaftar.
                    </p>
                  </div>
                </div>

                <div class="methods-section-header mb-2">
                  <label class="text-sm font-bold">Metode Pembayaran</label>
                  <button
                    type="button"
                    class="btn-outline small"
                    @click="addPaymentMethod"
                  >
                    + Tambah Metode
                  </button>
                </div>

                <div v-if="!form.paymentMethods.length" class="payment-empty">
                  Belum ada metode pembayaran. Klik tombol di atas untuk menambah.
                </div>

                <div v-else class="payment-list">
                  <article
                    v-for="(method, methodIndex) in form.paymentMethods"
                    :key="method.id"
                    class="payment-item"
                  >
                    <div class="payment-item-head">
                      <span class="payment-chip"
                        >Metode {{ methodIndex + 1 }}</span
                      >
                      <button
                        type="button"
                        class="btn-delete"
                        @click="removePaymentMethod(methodIndex)"
                      >
                        Hapus
                      </button>
                    </div>

                    <div class="grid-two">
                      <div class="form-group">
                        <label>Tipe</label>
                        <select v-model="method.type" class="form-input">
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="qris">QRIS</option>
                          <option value="ewallet">E-Wallet</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Label / Nama Metode</label>
                        <input
                          v-model="method.label"
                          type="text"
                          class="form-input"
                          placeholder="Contoh: BCA, Dana, QRIS Utama"
                        />
                      </div>
                    </div>

                    <div class="grid-two" v-if="method.type !== 'qris'">
                      <div class="form-group">
                        <label>Nama Pemilik</label>
                        <input
                          v-model="method.accountName"
                          type="text"
                          class="form-input"
                          placeholder="Contoh: PT Event Hebat"
                        />
                      </div>
                      <div class="form-group">
                        <label>No Rekening / No Akun</label>
                        <input
                          v-model="method.accountNumber"
                          type="text"
                          class="form-input"
                          placeholder="Contoh: 1234567890"
                        />
                      </div>
                    </div>

                    <div class="form-group" v-if="method.type === 'qris'">
                      <label>URL Gambar QRIS</label>
                      <input
                        v-model="method.qrisImageUrl"
                        type="text"
                        class="form-input"
                        placeholder="https://... atau /uploads/..."
                      />
                      <div v-if="method.qrisImageUrl" class="preview-wrap mt-2">
                        <img :src="method.qrisImageUrl" class="image-preview-sm" alt="QRIS Preview" />
                      </div>
                      <div class="upload-inline">
                        <input
                          type="file"
                          class="form-input upload-file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          :disabled="isUploading(`qris_${method.id}`)"
                          @change="onUploadMethodQris($event, method)"
                        />
                        <span class="upload-tip">{{
                          isUploading(`qris_${method.id}`)
                            ? "Uploading..."
                            : "Upload QRIS image"
                        }}</span>
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Catatan (Opsional)</label>
                      <input
                        v-model="method.note"
                        type="text"
                        class="form-input"
                        placeholder="Contoh: Wajib kirim bukti maksimal 15 menit"
                      />
                    </div>

                    <p
                      v-if="!isValidPaymentMethod(method)"
                      class="payment-warning"
                    >
                      Data metode ini belum lengkap, lengkapi agar dapat dipakai.
                    </p>
                  </article>
                </div>

                <div class="payment-require-wrap">
                  <div class="checkbox-wrap">
                    <label class="checkbox-container">
                      <input
                        type="checkbox"
                        v-model="form.requireProof"
                        :disabled="!canEnableRequireProof"
                      />
                      <span class="checkmark"></span>
                      Wajib Upload Bukti Transfer?
                    </label>
                  </div>
                  <p v-if="!canEnableRequireProof" class="helper-text">
                    Tambahkan minimal 1 metode pembayaran yang valid agar opsi
                    bukti transfer bisa diaktifkan.
                  </p>
                </div>
              </div>
            </div>

            <div class="group-divider row-full">
              <span>Jadwal Pendaftaran</span>
            </div>

            <div class="form-group row-full deadline-wrap">
              <label class="checkbox-container">
                <input
                  type="checkbox"
                  v-model="form.registrationDeadlineEnabled"
                />
                <span class="checkmark"></span>
                Gunakan batas waktu pendaftaran
              </label>
            </div>

            <div
              class="form-group row-full"
              v-if="form.registrationDeadlineEnabled"
            >
              <label>Batas Waktu Pendaftaran</label>
              <input
                v-model="form.registrationDeadlineAt"
                type="datetime-local"
                class="form-input"
              />
            </div>
          </div>
        </section>

        <section class="generator-section form-card">
          <div class="generator-header">
            <div>
              <h3>Form Builder</h3>
              <p class="text-muted text-sm">
                Nama dan Email akan otomatis ditambahkan ke form publik.
              </p>
            </div>
            <div class="toolbar-grid">
              <button
                type="button"
                class="btn-outline small"
                @click="addQuestion"
              >
                + Pertanyaan
              </button>
              <button
                type="button"
                class="btn-outline small"
                @click="addHeading"
              >
                + Title & Deskripsi
              </button>
              <button
                type="button"
                class="btn-outline small"
                @click="addSection"
              >
                + Section
              </button>
              <button type="button" class="btn-outline small" @click="addImage">
                + Image
              </button>
              <button type="button" class="btn-outline small" @click="addVideo">
                + Video
              </button>
            </div>
          </div>

          <div v-if="!form.formSchema.length" class="empty-builder">
            Belum ada elemen. Mulai dengan menambahkan pertanyaan atau section.
          </div>

          <div v-else class="fields-list">
            <draggable
              v-model="form.formSchema"
              item-key="id"
              handle=".drag-handle"
              ghost-class="ghost-item"
              animation="250"
            >
              <template #item="{ element: item, index }">
                <article class="field-item">
                  <div class="field-header">
                    <div class="field-meta">
                      <div class="drag-handle" title="Geser untuk memindahkan">
                        <span class="dots-icon">⋮⋮</span>
                      </div>
                      <span class="field-number">{{ index + 1 }}</span>
                      <span class="field-type">{{ itemTypeLabel(item.itemType) }}</span>
                    </div>
                    <button type="button" @click="removeItem(index)" class="btn-delete">
                      Hapus
                    </button>
                  </div>

                  <div v-if="item.itemType === 'question'" class="field-body">
                    <div class="form-group">
                      <label>Judul Pertanyaan</label>
                      <input
                        v-model="item.label"
                        type="text"
                        class="form-input"
                        required
                        placeholder="Contoh: Nama Instansi"
                      />
                    </div>

                    <div class="form-group">
                      <label>Deskripsi (Opsional)</label>
                      <input
                        v-model="item.description"
                        type="text"
                        class="form-input"
                        placeholder="Jelaskan maksud pertanyaan ini..."
                      />
                    </div>

                    <div class="form-group">
                      <label>Tipe Input</label>
                      <select v-model="item.questionType" class="form-input">
                        <option value="short_answer">Short Answer</option>
                        <option value="paragraph">Paragraph</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="checkboxes">Checkboxes</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="file_upload">File Upload</option>
                        <option value="linear_scale">Linear Scale</option>
                        <option value="rating">Rating</option>
                        <option value="multiple_choice_grid">
                          Multiple Choice Grid
                        </option>
                        <option value="checkbox_grid">Checkbox Grid</option>
                      </select>
                    </div>

                    <div class="checkbox-wrap mt-auto">
                      <label class="checkbox-container">
                        <input type="checkbox" v-model="item.required" />
                        <span class="checkmark"></span>
                        Wajib Diisi?
                      </label>
                    </div>

                    <div
                      v-if="usesOptions(item.questionType)"
                      class="form-group row-full"
                    >
                      <label>Opsi (Satu per baris)</label>
                      <textarea
                        v-model="item.optionsText"
                        class="form-input"
                        rows="3"
                        placeholder="Opsi 1&#10;Opsi 2&#10;Opsi 3"
                      ></textarea>
                    </div>

                    <div
                      v-if="item.questionType === 'linear_scale'"
                      class="grid-two row-full"
                    >
                      <div class="form-group">
                        <label>Range (Min - Max)</label>
                        <div class="flex-row gap-2">
                          <select v-model="item.scaleMin" class="form-input">
                            <option :value="0">0</option>
                            <option :value="1">1</option>
                          </select>
                          <span>sampai</span>
                          <select v-model="item.scaleMax" class="form-input">
                            <option v-for="n in 9" :key="n" :value="n + 1">
                              {{ n + 1 }}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div class="form-group">
                        <label>Label (Opsional)</label>
                        <div class="flex-row gap-2">
                          <input
                            v-model="item.scaleMinLabel"
                            type="text"
                            class="form-input"
                            placeholder="Min label"
                          />
                          <input
                            v-model="item.scaleMaxLabel"
                            type="text"
                            class="form-input"
                            placeholder="Max label"
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="item.questionType === 'rating'"
                      class="form-group row-full"
                    >
                      <label>Jumlah Bintang Maksimal</label>
                      <select v-model="item.ratingMax" class="form-input">
                        <option v-for="n in 10" :key="n" :value="n">
                          {{ n }}
                        </option>
                      </select>
                    </div>

                    <div
                      v-if="usesGrid(item.questionType)"
                      class="grid-two row-full"
                    >
                      <div class="form-group">
                        <label>Baris (Rows - satu per baris)</label>
                        <textarea
                          v-model="item.gridRowsText"
                          class="form-input"
                          rows="3"
                        ></textarea>
                      </div>
                      <div class="form-group">
                        <label>Kolom (Columns - satu per baris)</label>
                        <textarea
                          v-model="item.gridColsText"
                          class="form-input"
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="item.itemType === 'heading'" class="content-body">
                    <div class="form-group">
                      <label>Judul (Title)</label>
                      <input
                        v-model="item.title"
                        type="text"
                        class="form-input"
                        placeholder="Contoh: Informasi Pribadi"
                      />
                    </div>
                    <div class="form-group">
                      <label>Deskripsi (Opsional)</label>
                      <textarea
                        v-model="item.description"
                        class="form-input"
                        rows="2"
                      ></textarea>
                    </div>
                  </div>

                  <div v-else-if="item.itemType === 'section'" class="content-body">
                    <div class="section-divider">
                      <span>BAGIAN BARU (SECTION)</span>
                    </div>
                    <div class="form-group">
                      <label>Judul Section</label>
                      <input
                        v-model="item.title"
                        type="text"
                        class="form-input"
                      />
                    </div>
                    <div class="form-group">
                      <label>Deskripsi Section</label>
                      <textarea
                        v-model="item.description"
                        class="form-input"
                        rows="2"
                      ></textarea>
                    </div>
                  </div>

                  <div v-else-if="item.itemType === 'image'" class="content-body">
                    <div class="form-group">
                      <label>URL Gambar</label>
                      <input
                        v-model="item.imageUrl"
                        type="text"
                        class="form-input"
                        placeholder="https://... atau /uploads/..."
                      />
                      <div v-if="item.imageUrl" class="preview-wrap mt-2">
                        <img
                          :src="item.imageUrl"
                          class="image-preview-sm"
                          alt="Content Preview"
                        />
                      </div>
                      <div class="upload-inline">
                        <input
                          type="file"
                          class="form-input upload-file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          :disabled="isUploading(`content_${item.id}`)"
                          @change="onUploadContentImage($event, item)"
                        />
                        <span class="upload-tip">{{
                          isUploading(`content_${item.id}`)
                            ? "Uploading..."
                            : "Upload gambar konten"
                        }}</span>
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Caption / Deskripsi (Opsional)</label>
                      <textarea
                        v-model="item.description"
                        class="form-input"
                        rows="3"
                        placeholder="Keterangan gambar"
                      ></textarea>
                    </div>
                  </div>

                  <div v-else-if="item.itemType === 'video'" class="content-body">
                    <div class="form-group">
                      <label>URL Video (YouTube/Vimeo)</label>
                      <input
                        v-model="item.videoUrl"
                        type="url"
                        class="form-input"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Caption / Deskripsi (Opsional)</label>
                      <textarea
                        v-model="item.description"
                        class="form-input"
                        rows="3"
                        placeholder="Keterangan video"
                      ></textarea>
                    </div>
                  </div>
                </article>
              </template>
            </draggable>
          </div>
        </section>

        <div class="form-actions mt-8">
          <button type="submit" class="btn-primary" :disabled="isLoading || isPrefilling">
            {{ isLoading ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan Event" : "Simpan & Generate Link") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import draggable from "vuedraggable";

definePageMeta({ layout: "admin", middleware: "auth" });
const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const isPrefilling = ref(false);
const uploadBusy = ref({});
const form = ref({
  name: "",
  description: "",
  headerImageUrl: "",
  backgroundMode: "color",
  backgroundColor: "#0a1222",
  backgroundTexture: "dots",
  backgroundImageUrl: "",
  registrationDeadlineEnabled: false,
  registrationDeadlineAt: "",
  quota: "",
  paymentEnabled: false,
  requireProof: false,
  nominal: "",
  paymentMethods: [],
  formSchema: [],
});

const editId = computed(() => String(route.query.editId || "").trim());
const isEditMode = computed(() => !!editId.value);

const generateId = () => {
  return `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

const isUploading = (key) => !!uploadBusy.value[key];

const setUploading = (key, value) => {
  uploadBusy.value = {
    ...uploadBusy.value,
    [key]: value,
  };
};

const uploadImageFile = async (file, context, busyKey) => {
  if (!file) return "";
  if (file.size > 4 * 1024 * 1024) {
    Swal.fire({ title: "Error", text: "Ukuran gambar maksimal 4MB.", icon: "error", background: "#0f172a", color: "#f8fafc" });
    return "";
  }

  setUploading(busyKey, true);
  try {
    const multipart = new FormData();
    multipart.append("context", context);
    multipart.append("file", file);

    const res = await $fetch("/api/admin/media/upload", {
      method: "POST",
      body: multipart,
    });
    return res?.url || "";
  } catch (error) {
    Swal.fire({ title: "Error", text: error.data?.statusMessage || "Upload gambar gagal", icon: "error", background: "#0f172a", color: "#f8fafc" });
    return "";
  } finally {
    setUploading(busyKey, false);
  }
};

const getFileFromInput = (evt) => {
  const input = evt?.target;
  const file = input?.files?.[0] || null;
  if (input) input.value = "";
  return file;
};

const onUploadHeaderImage = async (evt) => {
  const file = getFileFromInput(evt);
  if (!file) return;
  const url = await uploadImageFile(file, "event-header", "header");
  if (url) form.value.headerImageUrl = url;
};

const onUploadBackgroundImage = async (evt) => {
  const file = getFileFromInput(evt);
  if (!file) return;
  const url = await uploadImageFile(file, "event-background", "background");
  if (url) form.value.backgroundImageUrl = url;
};

const onUploadMethodQris = async (evt, method) => {
  const file = getFileFromInput(evt);
  if (!file || !method) return;
  const busyKey = `qris_${method.id}`;
  const url = await uploadImageFile(file, "payment-qris", busyKey);
  if (url) method.qrisImageUrl = url;
};

const onUploadContentImage = async (evt, item) => {
  const file = getFileFromInput(evt);
  if (!file || !item) return;
  const busyKey = `content_${item.id}`;
  const url = await uploadImageFile(file, "content-image", busyKey);
  if (url) item.imageUrl = url;
};

const addQuestion = () => {
  form.value.formSchema.push({
    id: generateId(),
    itemType: "question",
    label: "",
    description: "",
    questionType: "short_answer",
    required: true,
    optionsText: "",
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "",
    scaleMaxLabel: "",
    ratingMax: 5,
    gridRowsText: "",
    gridColsText: "",
  });
};

const addHeading = () => {
  form.value.formSchema.push({
    id: generateId(),
    itemType: "heading",
    title: "",
    description: "",
  });
};

const addSection = () => {
  form.value.formSchema.push({
    id: generateId(),
    itemType: "section",
    title: "",
    description: "",
  });
};

const addImage = () => {
  form.value.formSchema.push({
    id: generateId(),
    itemType: "image",
    imageUrl: "",
    description: "",
  });
};

const addVideo = () => {
  form.value.formSchema.push({
    id: generateId(),
    itemType: "video",
    videoUrl: "",
    description: "",
  });
};

const addPaymentMethod = () => {
  form.value.paymentMethods.push({
    id: generateId(),
    type: "bank_transfer",
    label: "",
    accountName: "",
    accountNumber: "",
    qrisImageUrl: "",
    note: "",
  });
};

const removePaymentMethod = (index) => {
  form.value.paymentMethods.splice(index, 1);
};

const removeItem = (index) => {
  form.value.formSchema.splice(index, 1);
};

const usesOptions = (type) => {
  return ["multiple_choice", "checkboxes", "dropdown"].includes(type);
};

const usesGrid = (type) => {
  return ["multiple_choice_grid", "checkbox_grid"].includes(type);
};

const parseList = (rawValue) => {
  return String(rawValue || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const itemTypeLabel = (itemType) => {
  const map = {
    question: "Pertanyaan",
    heading: "Title & Deskripsi",
    section: "Section",
    image: "Image",
    video: "Video",
  };
  return map[itemType] || itemType;
};

const mapLegacyQuestionType = (legacyType) => {
  const mapping = {
    text: "short_answer",
    textarea: "paragraph",
    select: "dropdown",
    radio: "multiple_choice",
  };
  return mapping[legacyType] || "short_answer";
};

const toEditorQuestionItem = (item, index) => {
  return {
    id: String(item?.id || generateId() || `q_${index}`),
    itemType: "question",
    label: String(item?.label || ""),
    description: String(item?.description || ""),
    questionType: String(
      item?.questionType || mapLegacyQuestionType(String(item?.type || "text")),
    ),
    required: item?.required !== false,
    optionsText: Array.isArray(item?.options)
      ? item.options.join("\n")
      : String(item?.optionsText || ""),
    scaleMin: Number.isFinite(Number(item?.scaleMin)) ? Number(item.scaleMin) : 1,
    scaleMax: Number.isFinite(Number(item?.scaleMax)) ? Number(item.scaleMax) : 5,
    scaleMinLabel: String(item?.scaleMinLabel || ""),
    scaleMaxLabel: String(item?.scaleMaxLabel || ""),
    ratingMax: Number.isFinite(Number(item?.ratingMax)) ? Number(item.ratingMax) : 5,
    gridRowsText: Array.isArray(item?.gridRows)
      ? item.gridRows.join("\n")
      : String(item?.gridRowsText || ""),
    gridColsText: Array.isArray(item?.gridCols)
      ? item.gridCols.join("\n")
      : String(item?.gridColsText || ""),
  };
};

const toEditorContentItem = (item, index) => {
  if (item?.itemType === "heading") {
    return {
      id: String(item?.id || `heading_${index}`),
      itemType: "heading",
      title: String(item?.title || ""),
      description: String(item?.description || ""),
    };
  }

  if (item?.itemType === "section") {
    return {
      id: String(item?.id || `section_${index}`),
      itemType: "section",
      title: String(item?.title || ""),
      description: String(item?.description || ""),
    };
  }

  if (item?.itemType === "image") {
    return {
      id: String(item?.id || `image_${index}`),
      itemType: "image",
      imageUrl: String(item?.imageUrl || ""),
      description: String(item?.description || ""),
    };
  }

  if (item?.itemType === "video") {
    return {
      id: String(item?.id || `video_${index}`),
      itemType: "video",
      videoUrl: String(item?.videoUrl || ""),
      description: String(item?.description || ""),
    };
  }

  return null;
};

const loadEventForEdit = async () => {
  if (!isEditMode.value) return;

  isPrefilling.value = true;
  try {
    const res = await $fetch(`/api/event/${editId.value}`);
    const eventItem = res?.event;
    if (!eventItem) {
      await Swal.fire({ title: "Error", text: "Event tidak ditemukan.", icon: "error", background: "#0f172a", color: "#f8fafc" });
      router.push("/admin/events");
      return;
    }

    form.value.name = String(eventItem.name || "");
    form.value.description = String(eventItem.description || "");
    form.value.quota =
      eventItem.quota === null || eventItem.quota === undefined
        ? ""
        : String(eventItem.quota);
    const requireProofFromEvent = !!eventItem.requireProof;

    let parsedSchema = [];
    try {
      const parsed = JSON.parse(eventItem.formSchema || "[]");
      parsedSchema = Array.isArray(parsed) ? parsed : [];
    } catch {
      parsedSchema = [];
    }

    const meta =
      parsedSchema.find((item) => item?.itemType === "form_meta") || {};

    form.value.headerImageUrl = String(meta?.headerImageUrl || "");
    form.value.backgroundMode = String(meta?.backgroundMode || "color");
    form.value.backgroundColor = String(meta?.backgroundColor || "#0a1222");
    form.value.backgroundTexture = String(meta?.backgroundTexture || "dots");
    form.value.backgroundImageUrl = String(meta?.backgroundImageUrl || "");
    form.value.nominal = String(meta?.nominal || "");
    form.value.paymentEnabled = !!meta?.paymentEnabled;
    form.value.registrationDeadlineEnabled = !!meta?.registrationDeadlineEnabled;
    form.value.registrationDeadlineAt = form.value.registrationDeadlineEnabled
      ? String(meta?.registrationDeadlineAt || "")
      : "";

    form.value.paymentMethods = Array.isArray(meta?.paymentSettings)
      ? meta.paymentSettings.map((method, index) => ({
          id: String(method?.id || `pay_${index}`),
          type: String(method?.type || "bank_transfer"),
          label: String(method?.label || ""),
          accountName: String(method?.accountName || ""),
          accountNumber: String(method?.accountNumber || ""),
          qrisImageUrl: String(method?.qrisImageUrl || ""),
          note: String(method?.note || ""),
        }))
      : [];

    const editableItems = parsedSchema
      .filter((item) => item?.itemType !== "form_meta")
      .map((item, index) => {
        if (item?.itemType === "question" || !item?.itemType) {
          return toEditorQuestionItem(item, index);
        }
        return toEditorContentItem(item, index);
      })
      .filter(Boolean);

    form.value.formSchema = editableItems;
    form.value.requireProof = requireProofFromEvent;
  } catch (error) {
    await Swal.fire({ title: "Error", text: error?.data?.statusMessage || "Gagal memuat detail event.", icon: "error", background: "#0f172a", color: "#f8fafc" });
    router.push("/admin/events");
  } finally {
    isPrefilling.value = false;
  }
};

const normalizePaymentMethod = (method) => {
  return {
    id: String(method?.id || generateId()),
    type: String(method?.type || "bank_transfer"),
    label: String(method?.label || "").trim(),
    accountName: String(method?.accountName || "").trim(),
    accountNumber: String(method?.accountNumber || "").trim(),
    qrisImageUrl: String(method?.qrisImageUrl || "").trim(),
    note: String(method?.note || "").trim(),
  };
};

const isValidPaymentMethod = (method) => {
  const normalized = normalizePaymentMethod(method);
  if (!normalized.label) return false;

  if (normalized.type === "qris") {
    return !!normalized.qrisImageUrl;
  }

  return !!normalized.accountName && !!normalized.accountNumber;
};

const validPaymentMethods = computed(() => {
  return form.value.paymentMethods
    .map((method) => normalizePaymentMethod(method))
    .filter((method) => isValidPaymentMethod(method));
});

const canEnableRequireProof = computed(
  () => validPaymentMethods.value.length > 0,
);

watch(canEnableRequireProof, (allowed) => {
  if (!allowed && form.value.requireProof) {
    form.value.requireProof = false;
  }
});

const normalizeQuestionItem = (item) => {
  const question = {
    id: item.id || generateId(),
    itemType: "question",
    label: String(item.label || ""),
    description: String(item.description || ""),
    questionType: String(item.questionType || "short_answer"),
    required: item.required !== false,
    options: [],
    scaleMin: Number.isFinite(Number(item.scaleMin))
      ? Number(item.scaleMin)
      : 1,
    scaleMax: Number.isFinite(Number(item.scaleMax))
      ? Number(item.scaleMax)
      : 5,
    scaleMinLabel: String(item.scaleMinLabel || ""),
    scaleMaxLabel: String(item.scaleMaxLabel || ""),
    ratingMax: Number.isFinite(Number(item.ratingMax))
      ? Number(item.ratingMax)
      : 5,
    gridRows: [],
    gridCols: [],
  };

  if (question.scaleMax < question.scaleMin) {
    const min = question.scaleMin;
    question.scaleMin = question.scaleMax;
    question.scaleMax = min;
  }

  if (usesOptions(question.questionType)) {
    question.options = parseList(item.optionsText);
  }

  if (usesGrid(question.questionType)) {
    question.gridRows = parseList(item.gridRowsText);
    question.gridCols = parseList(item.gridColsText);
  }

  if (question.questionType === "rating") {
    question.ratingMax = Math.max(3, Math.min(10, question.ratingMax || 5));
  }

  if (question.questionType === "linear_scale") {
    question.scaleMin = Math.max(0, Math.min(10, question.scaleMin || 1));
    question.scaleMax = Math.max(
      question.scaleMin + 1,
      Math.min(10, question.scaleMax || 5),
    );
  }

  return question;
};

const normalizeContentItem = (item) => {
  if (item.itemType === "heading") {
    return {
      id: item.id || generateId(),
      itemType: "heading",
      title: String(item.title || ""),
      description: String(item.description || ""),
    };
  }

  if (item.itemType === "section") {
    return {
      id: item.id || generateId(),
      itemType: "section",
      title: String(item.title || ""),
      description: String(item.description || ""),
    };
  }

  if (item.itemType === "image") {
    return {
      id: item.id || generateId(),
      itemType: "image",
      imageUrl: String(item.imageUrl || ""),
      description: String(item.description || ""),
    };
  }

  if (item.itemType === "video") {
    return {
      id: item.id || generateId(),
      itemType: "video",
      videoUrl: String(item.videoUrl || ""),
      description: String(item.description || ""),
    };
  }

  return null;
};

const submitEvent = async () => {
  isLoading.value = true;
  try {
    const processedSchema = form.value.formSchema
      .map((item) => {
        if (item.itemType === "question") {
          return normalizeQuestionItem(item);
        }
        return normalizeContentItem(item);
      })
      .filter(Boolean)
      .filter((item) => {
        if (item.itemType === "question") return !!String(item.label || "").trim();
        if (item.itemType === "heading") return !!String(item.title || "").trim();
        if (item.itemType === "section") return !!String(item.title || "").trim();
        if (item.itemType === "image") return !!String(item.imageUrl || "").trim();
        if (item.itemType === "video") return !!String(item.videoUrl || "").trim();
        return true;
      });

    const formMeta = {
      itemType: "form_meta",
      headerImageUrl: String(form.value.headerImageUrl || "").trim(),
      backgroundMode: String(form.value.backgroundMode || "color"),
      backgroundColor: String(form.value.backgroundColor || "#0a1222"),
      backgroundTexture: String(form.value.backgroundTexture || "dots"),
      backgroundImageUrl: String(form.value.backgroundImageUrl || "").trim(),
      nominal: String(form.value.nominal || "").trim(),
      paymentEnabled: !!form.value.paymentEnabled,
      paymentSettings: validPaymentMethods.value,
      registrationDeadlineEnabled: !!form.value.registrationDeadlineEnabled,
      registrationDeadlineAt: form.value.registrationDeadlineEnabled
        ? String(form.value.registrationDeadlineAt || "")
        : "",
    };

    if (form.value.requireProof && !validPaymentMethods.value.length) {
      Swal.fire({ title: "Perhatian", text: "Lengkapi minimal 1 metode pembayaran valid sebelum mengaktifkan bukti transfer.", icon: "warning", background: "#0f172a", color: "#f8fafc" });
      return;
    }

    const payload = {
      ...form.value,
      formSchema: [formMeta, ...processedSchema],
    };

    const endpoint = isEditMode.value
      ? `/api/event/${editId.value}`
      : "/api/event/create";
    const method = isEditMode.value ? "PUT" : "POST";

    const res = await $fetch(endpoint, {
      method,
      body: payload,
    });

    if (res.success) {
      if (isEditMode.value) {
        await Swal.fire({ title: "Sukses", text: "Event berhasil diperbarui.", icon: "success", background: "#0f172a", color: "#f8fafc", confirmButtonColor: "#3b82f6" });
      } else {
        await Swal.fire({ title: "Sukses", text: `Event berhasil dibuat! Link: /form/${res.event.slug}`, icon: "success", background: "#0f172a", color: "#f8fafc", confirmButtonColor: "#3b82f6" });
      }
      router.push("/admin/events");
    }
  } catch (error) {
    Swal.fire({ title: "Error", text: error.data?.statusMessage || "Gagal menyimpan event", icon: "error", background: "#0f172a", color: "#f8fafc" });
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadEventForEdit();
});
</script>

<style scoped lang="scss">
.create-shell {
  max-width: 1160px;
  margin: 0 auto;
}

.form-shell form {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

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

.subtitle {
  margin-top: 0.35rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.form-shell {
  padding: 1rem;
}

.state-box {
  margin-bottom: 0.9rem;
  padding: 0.85rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  color: var(--text-muted);
  background: rgba(8, 17, 33, 0.48);
}

.mt-4 {
  margin-top: 1rem;
}
.mt-8 {
  margin-top: 2rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.text-sm {
  font-size: 0.875rem;
}

.form-card {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    rgba(8, 17, 33, 0.5),
    rgba(7, 14, 28, 0.45)
  );
  padding: 1rem;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.06);
}

.generator-section {
  margin-top: 0;
}

.card-title {
  font-size: 1.03rem;
}

.card-desc {
  margin-top: 0.28rem;
  color: var(--text-muted);
  font-size: 0.84rem;
}

.helper-text {
  color: #fbbf24;
  font-size: 0.78rem;
  margin-top: 0.4rem;
}

.form-grid {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 0.95rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
}

.row-group {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  gap: 0.95rem;
}

.row-full {
  grid-column: 1 / -1;
}

.full-span {
  grid-column: 1 / -1;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.color-input {
  min-height: 44px;
  padding: 0.24rem;
}

.group-divider {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.3rem;
}

.group-divider::after {
  content: "";
  height: 1px;
  flex: 1;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.4),
    rgba(148, 163, 184, 0.05)
  );
}

.group-divider span {
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #b9cae0;
  font-weight: 700;
}

.flex-1 {
  flex: 1;
}

label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #d8e4f4;
}

.generator-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.toolbar-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 0.45rem;
  max-width: 540px;
}

.btn-outline.small {
  padding: 0.42rem 0.68rem;
  font-size: 0.74rem;
  white-space: nowrap;
}

.empty-builder {
  border: 1px dashed var(--line-soft);
  border-radius: 12px;
  padding: 1rem;
  color: var(--text-muted);
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-item {
  background: rgba(6, 14, 28, 0.52);
  border: 1px dashed var(--line-soft);
  border-radius: 12px;
  padding: 0.92rem;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.field-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-type {
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  font-size: 0.7rem;
  color: var(--text-muted);
  padding: 0.15rem 0.45rem;
}

.field-number {
  background: var(--primary);
  color: #fff;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: bold;
}

.btn-delete {
  background: none;
  border: none;
  color: #ff8ca1;
  cursor: pointer;
  font-size: 0.82rem;
}

.btn-delete:hover {
  text-decoration: underline;
}

.field-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.content-body {
  display: grid;
  gap: 0.7rem;
}

.radio-group {
  display: grid;
  gap: 0.45rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.52rem 0.65rem;
  background: rgba(11, 21, 39, 0.6);
}

.checkbox-wrap {
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 0.55rem 0.7rem;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.deadline-wrap {
  margin-top: -0.2rem;
}

.payment-wrap {
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 0.78rem;
  background: rgba(9, 18, 34, 0.52);
}

.payment-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.payment-title {
  font-size: 0.9rem;
  color: #e5edf7;
}

.payment-subtitle {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.payment-empty {
  margin-top: 0.6rem;
  border: 1px dashed var(--line-soft);
  border-radius: 10px;
  padding: 0.7rem;
  color: var(--text-muted);
}

.payment-list {
  margin-top: 0.7rem;
  display: grid;
  gap: 0.75rem;
}

.payment-item {
  border: 1px dashed var(--line-soft);
  border-radius: 10px;
  padding: 0.74rem;
  background: rgba(8, 16, 30, 0.5);
}

.payment-require-wrap {
  margin-top: 0.8rem;
  border-top: 1px dashed rgba(148, 163, 184, 0.26);
  padding-top: 0.7rem;
}

.payment-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.55rem;
  gap: 0.65rem;
}

.payment-chip {
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.payment-warning {
  color: #fca5a5;
  font-size: 0.78rem;
  margin-top: 0.25rem;
}

.upload-inline {
  margin-top: 0.38rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.42rem;
}

.upload-file {
  min-height: 40px;
  padding: 0.34rem 0.5rem;
  flex: 1;
}

.upload-tip {
  color: var(--text-muted);
  font-size: 0.74rem;
  white-space: nowrap;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  font-size: 0.875rem;
  user-select: none;
  height: 42px;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 10px;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: rgba(15, 23, 42, 0.78);
  border: 1px solid var(--line-soft);
  border-radius: 4px;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: rgba(255, 255, 255, 0.1);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--primary);
  border-color: var(--primary);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

@media (max-width: 900px) {
  .form-shell {
    padding: 0.85rem;
  }

  .form-grid,
  .row-group,
  .field-body,
  .grid-two {
    grid-template-columns: 1fr;
  }

  .toolbar-grid {
    justify-content: start;
    max-width: none;
  }

  .upload-inline {
    flex-direction: column;
    align-items: stretch;
    gap: 0.26rem;
  }

  .upload-tip {
    white-space: normal;
  }
}

@media (max-width: 640px) {
  .form-card {
    padding: 0.82rem;
  }

  .field-item {
    padding: 0.78rem;
  }

  .group-divider {
    margin-top: 0.2rem;
  }
}

.image-preview-sm {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid var(--line-soft);
  background: rgba(0, 0, 0, 0.2);
  margin-top: 0.5rem;
}

.nominal-input-large {
  font-size: 1.1rem;
  font-weight: 700;
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.05);
}

.nominal-input-large:focus {
  border-color: #4ade80;
  box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.15);
}

.toggle-flex {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-status {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
}

.toggle-status.active {
  color: #4ade80;
}

/* Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(148, 163, 184, 0.2);
  transition: 0.4s;
  border: 1px solid var(--line-soft);
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

input:focus + .slider {
  box-shadow: 0 0 1px #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.payment-body-fade {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.methods-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
}

.drag-handle {
  cursor: grab;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 0.5rem;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.dots-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.ghost-item {
  opacity: 0.4;
  background: var(--primary-soft) !important;
  border: 1px dashed var(--primary) !important;
}

.flex-row { display: flex; align-items: center; }
.gap-2 { gap: 0.5rem; }
.mt-auto { margin-top: auto; }
</style>
