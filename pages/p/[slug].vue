<template>
  <div class="registration-page">
    <div v-if="pending" class="text-center py-8">Memuat Event...</div>
    <div v-else-if="error || !event" class="text-center py-8">
      <h2>Event tidak ditemukan</h2>
      <NuxtLink to="/" class="btn-outline mt-4">Kembali ke Beranda</NuxtLink>
    </div>
    
    <div v-else class="container pt-8">
      <div class="glass-panel max-w-3xl mx-auto registration-shell">
        <div class="event-header mb-8 text-center">
          <h1 class="gradient-text">{{ event.name }}</h1>
          <p class="text-muted mt-2">{{ event.description }}</p>
          <div v-if="event.quota" class="mt-4 badge badge-gray">
            Kuota Tersisa: {{ availableQuota }}
          </div>
        </div>

        <div v-if="event.quota && availableQuota <= 0" class="alert error">
          Maaf, kuota pendaftaran untuk event ini telah penuh.
        </div>
        
        <form v-else @submit.prevent="submitRegistration" class="registration-form">
          <section class="form-card">
            <h3 class="mb-4">Data Utama Peserta</h3>
            <div class="form-grid static-grid">
          
          <!-- Static Fields -->
          <div class="form-group">
            <label>Nama Lengkap <span class="text-red">*</span></label>
            <input v-model="form.registrantName" type="text" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label>Email Aktif <span class="text-red">*</span></label>
            <input v-model="form.registrantEmail" type="email" class="form-input" required placeholder="Tiket akan dikirim ke email ini" />
          </div>
            </div>
          </section>

          <!-- Dynamic Fields -->
          <section class="form-card">
            <h3 class="mb-4">Form Tambahan</h3>
          <div v-for="(field, index) in formSchema" :key="index" class="form-group dynamic-item">
            <label>{{ field.label }} <span v-if="field.required" class="text-red">*</span></label>
            
            <input 
              v-if="field.type === 'text'" 
              v-model="form.dynamicData[field.label]" 
              type="text" 
              class="form-input" 
              :required="field.required" 
            />
            
            <textarea 
              v-else-if="field.type === 'textarea'" 
              v-model="form.dynamicData[field.label]" 
              class="form-input" 
              rows="3" 
              :required="field.required"
            ></textarea>
            
            <select 
              v-else-if="field.type === 'select'" 
              v-model="form.dynamicData[field.label]" 
              class="form-input" 
              :required="field.required"
            >
              <option value="">-- Pilih --</option>
              <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            
            <div v-else-if="field.type === 'radio'" class="radio-group">
              <label v-for="opt in field.options" :key="opt" class="radio-label">
                <input 
                  type="radio" 
                  :name="`radio_${index}`" 
                  :value="opt" 
                  v-model="form.dynamicData[field.label]" 
                  :required="field.required"
                />
                {{ opt }}
              </label>
            </div>
          </div>
          </section>

          <!-- Payment Proof -->
          <div v-if="event.requireProof" class="form-group mt-4 p-4 border-dashed rounded proof-box">
            <label>Bukti Pembayaran / Transfer (Gambar) <span class="text-red">*</span></label>
            <p class="text-muted text-sm mb-2">Unggah bukti transfer (JPG/PNG). Maks 2MB.</p>
            <input @change="handleFileUpload" type="file" accept="image/jpeg, image/png, image/webp" class="form-input" required />
          </div>

          <div class="form-actions mt-8">
            <button type="submit" class="btn-primary w-full" :disabled="isSubmitting">
              {{ isSubmitting ? 'Mendaftar...' : 'Kirim Pendaftaran' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug

const { data: response, pending, error } = useFetch(`/api/public/event/${slug}`)
const event = computed(() => response.value?.event)
const availableQuota = computed(() => response.value?.availableQuota)

const formSchema = computed(() => {
  if (!event.value?.formSchema) return []
  try {
    return JSON.parse(event.value.formSchema)
  } catch (e) {
    return []
  }
})

const form = ref({
  registrantName: '',
  registrantEmail: '',
  dynamicData: {}
})

const selectedFile = ref(null)
const isSubmitting = ref(false)

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    alert('Ukuran file maksimal 2MB!')
    e.target.value = ''
    selectedFile.value = null
    return
  }
  
  selectedFile.value = file
}

const submitRegistration = async () => {
  isSubmitting.value = true
  try {
    // Gunakan FormData karena ada upload file
    const formData = new FormData()
    formData.append('eventId', event.value.id)
    formData.append('registrantName', form.value.registrantName)
    formData.append('registrantEmail', form.value.registrantEmail)
    formData.append('formData', JSON.stringify(form.value.dynamicData))
    
    if (event.value.requireProof && selectedFile.value) {
      formData.append('paymentProof', selectedFile.value)
    }

    const res = await $fetch('/api/ticket/register', {
      method: 'POST',
      body: formData
    })

    if (res.success) {
      alert('Pendaftaran berhasil! Silakan tunggu konfirmasi dari panitia.')
      router.push('/')
    }
  } catch (err) {
    alert(err.data?.statusMessage || 'Pendaftaran gagal')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
.registration-page {
  min-height: 100vh;
  padding: 2rem 1rem;
}

.registration-shell {
  padding: 1rem;
}

.max-w-3xl { max-width: 800px; }
.mx-auto { margin-left: auto; margin-right: auto; }
.text-center { text-align: center; }
.py-8 { padding: 2rem 0; }
.pt-8 { padding-top: 2rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.mt-8 { margin-top: 2rem; }
.text-muted { color: var(--text-muted); }
.text-red { color: #ef4444; }
.text-sm { font-size: 0.875rem; }
.w-full { width: 100%; }

.badge { padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; display: inline-block; }
.badge-gray { background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }

.alert { padding: 1rem; border-radius: 8px; text-align: center; font-weight: 500; }
.alert.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.form-card {
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(8, 17, 33, 0.45);
  padding: 0.9rem;
}

.static-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label { font-size: 0.84rem; font-weight: 600; color: #d8e4f4; }

.border-dashed { border: 1px dashed var(--glass-border); }
.rounded { border-radius: 8px; }
.p-4 { padding: 1rem; }

.dynamic-item {
  margin-bottom: 0.5rem;
}

.proof-box {
  margin-top: 0.2rem;
}

.radio-group { display: grid; gap: 0.45rem; }
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

@media (max-width: 768px) {
  .static-grid {
    grid-template-columns: 1fr;
  }
}
</style>
