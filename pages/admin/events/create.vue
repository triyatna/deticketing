<template>
  <div class="create-shell">
    <div class="header-action">
      <div>
        <h1 class="page-title">Buat Event Baru</h1>
        <p class="subtitle">Susun konfigurasi event dan form pendaftaran dalam satu alur.</p>
      </div>
      <NuxtLink to="/admin/events" class="btn-outline">Kembali</NuxtLink>
    </div>

    <div class="glass-panel form-shell mt-4">
      <form @submit.prevent="submitEvent">
        <section class="form-card">
          <h3 class="card-title">Informasi Dasar</h3>
          <p class="card-desc">Nama, deskripsi, kuota, dan aturan bukti transfer.</p>

          <div class="form-grid">
          <div class="form-group">
            <label>Nama Event</label>
            <input v-model="form.name" type="text" class="form-input" required placeholder="Contoh: Konser Kemerdekaan" />
          </div>
          
          <div class="form-group">
            <label>Deskripsi Singkat</label>
            <textarea v-model="form.description" class="form-input" rows="3" placeholder="Deskripsi event..."></textarea>
          </div>

          <div class="form-group row-group">
            <div class="flex-1">
              <label>Kuota Pendaftar (Opsional)</label>
              <input v-model="form.quota" type="number" class="form-input" placeholder="Kosongkan jika tak terbatas" />
            </div>
            <div class="flex-1 checkbox-wrap">
              <label class="checkbox-container">
                <input type="checkbox" v-model="form.requireProof" />
                <span class="checkmark"></span>
                Wajib Upload Bukti Transfer?
              </label>
            </div>
          </div>
        </div>
        </section>

        <!-- Form Generator Section -->
        <section class="generator-section form-card">
          <div class="generator-header">
            <h3>Custom Form Builder</h3>
            <button type="button" @click="addField" class="btn-outline small">Tambah Pertanyaan</button>
          </div>
          <p class="text-muted text-sm mb-4">Nama dan Email akan otomatis ditambahkan ke form publik.</p>

          <div class="fields-list">
            <div v-for="(field, index) in form.formSchema" :key="index" class="field-item">
              <div class="field-header">
                <span class="field-number">{{ index + 1 }}</span>
                <button type="button" @click="removeField(index)" class="btn-delete">Hapus</button>
              </div>
              <div class="field-body">
                <div class="form-group">
                  <label>Label Pertanyaan</label>
                  <input v-model="field.label" type="text" class="form-input" required placeholder="Contoh: Ukuran Baju" />
                </div>
                <div class="form-group">
                  <label>Tipe Input</label>
                  <select v-model="field.type" class="form-input">
                    <option value="text">Teks Singkat</option>
                    <option value="textarea">Paragraf</option>
                    <option value="select">Dropdown</option>
                    <option value="radio">Pilihan Ganda (Radio)</option>
                  </select>
                </div>
                <div class="form-group" v-if="['select', 'radio'].includes(field.type)">
                  <label>Pilihan (pisahkan dengan koma)</label>
                  <input v-model="field.options" type="text" class="form-input" required placeholder="S, M, L, XL" />
                </div>
                <div class="checkbox-wrap">
                  <label class="checkbox-container">
                    <input type="checkbox" v-model="field.required" />
                    <span class="checkmark"></span>
                    Wajib Diisi?
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="form-actions mt-8">
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Menyimpan...' : 'Simpan & Generate Link' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const router = useRouter()

const isLoading = ref(false)
const form = ref({
  name: '',
  description: '',
  quota: '',
  requireProof: false,
  formSchema: []
})

const addField = () => {
  form.value.formSchema.push({
    label: '',
    type: 'text',
    required: true,
    options: ''
  })
}

const removeField = (index) => {
  form.value.formSchema.splice(index, 1)
}

const submitEvent = async () => {
  isLoading.value = true
  try {
    // Process form schema options
    const processedSchema = form.value.formSchema.map(f => {
      if (['select', 'radio'].includes(f.type) && f.options) {
        return { ...f, options: f.options.split(',').map(s => s.trim()) }
      }
      return f
    })

    const payload = {
      ...form.value,
      formSchema: processedSchema
    }

    const res = await $fetch('/api/event/create', {
      method: 'POST',
      body: payload
    })

    if (res.success) {
      alert(`Event berhasil dibuat! Link: /p/${res.event.slug}`)
      router.push('/admin/events')
    }
  } catch (error) {
    alert(error.data?.statusMessage || 'Gagal membuat event')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.create-shell {
  max-width: 1080px;
  margin: 0 auto;
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

.mt-4 { margin-top: 1rem; }
.mt-8 { margin-top: 2rem; }
.mb-4 { margin-bottom: 1rem; }
.text-sm { font-size: 0.875rem; }

.form-card {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: rgba(8, 17, 33, 0.45);
  padding: 0.95rem;
}

.form-card + .form-card {
  margin-top: 0.9rem;
}

.card-title {
  font-size: 1rem;
}

.card-desc {
  margin-top: 0.28rem;
  color: var(--text-muted);
  font-size: 0.84rem;
}

.form-grid {
  margin-top: 0.8rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.row-group {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  gap: 0.9rem;
}
.flex-1 { flex: 1; }

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
  margin-bottom: 0.4rem;
}

.btn-outline.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field-item {
  background: rgba(6, 14, 28, 0.48);
  border: 1px dashed var(--line-soft);
  border-radius: 12px;
  padding: 1rem;
}

.field-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
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
.btn-delete:hover { text-decoration: underline; }

.field-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

/* Custom Checkbox */
.checkbox-wrap {
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 0.55rem 0.7rem;
  min-height: 44px;
  display: flex;
  align-items: center;
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
  background-color: rgba(255,255,255,0.1);
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
  .form-grid,
  .row-group,
  .field-body {
    grid-template-columns: 1fr;
  }
}
</style>
