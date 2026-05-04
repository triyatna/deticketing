<template>
  <div>
    <div class="header-action">
      <div>
        <h1 class="page-title">Detail Event</h1>
        <p class="subtitle">Informasi lengkap konfigurasi dan pengaturan event.</p>
      </div>
      <div class="action-buttons">
        <NuxtLink v-if="userRole !== 'PETUGAS'" :to="`/admin/events/${eventId}/edit`" class="btn-primary">
          Edit Event
        </NuxtLink>
        <NuxtLink to="/admin/events" class="btn-outline">Kembali</NuxtLink>
      </div>
    </div>

    <div v-if="pending" class="state-box mt-4">Memuat detail event...</div>
    <div v-else-if="error" class="state-box error mt-4">Gagal memuat detail event.</div>
    <div v-else-if="event" class="detail-wrapper mt-4">
      
      <!-- Informasi Utama -->
      <div class="glass-panel mb-6">
        <h2 class="section-title">Informasi Dasar</h2>
        <div class="grid-details">
          <div class="detail-item">
            <label>Nama Event</label>
            <p>{{ event.name }}</p>
          </div>
          <div class="detail-item">
            <label>URL Pendaftaran</label>
            <p>
              <a :href="`/form/${event.slug}`" target="_blank" class="event-link">/form/{{ event.slug }}</a>
            </p>
          </div>
          <div class="detail-item full-width">
            <label>Deskripsi</label>
            <p class="whitespace-pre-wrap">{{ event.description || 'Tidak ada deskripsi.' }}</p>
          </div>
          <div class="detail-item">
            <label>Dibuat Oleh</label>
            <p>{{ event.createdByName || '-' }}</p>
          </div>
          <div class="detail-item">
            <label>Terakhir Diupdate</label>
            <p>{{ formatDateTime(event.updatedAt) }}</p>
          </div>
        </div>
      </div>

      <div class="grid-two-cols">
        <!-- Jadwal & Kuota -->
        <div class="glass-panel">
          <h2 class="section-title">Jadwal & Kuota</h2>
          <div class="detail-list">
            <div class="detail-row">
              <span class="label">Tipe Event</span>
              <span class="value">{{ formMeta.isMultiDay ? 'Multi-Day' : 'Single Day' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Tanggal Event</span>
              <span class="value">
                {{ formMeta.isMultiDay ? formatDate(formMeta.eventDate) + ' - ' + formatDate(formMeta.eventEndDate) : formatDate(formMeta.eventDate) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Waktu</span>
              <span class="value">{{ formMeta.eventStartTime || '-' }} - {{ formMeta.eventEndTime || '-' }} ({{ formMeta.timezone || 'WIB' }})</span>
            </div>
            <div class="detail-row">
              <span class="label">Batas Pendaftaran</span>
              <span class="value text-red">{{ formatDateTime(formMeta.deadline) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Kuota Maksimal</span>
              <span class="value">{{ event.quota ? `${event.quota} Orang` : 'Tak Terbatas' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Multi-Ticket Checkout</span>
              <span :class="['badge', formMeta.allowMultiTicket ? 'badge-green' : 'badge-gray']">
                {{ formMeta.allowMultiTicket ? 'Aktif' : 'Nonaktif' }}
              </span>
            </div>
            <div class="detail-row" v-if="formMeta.allowMultiTicket">
              <span class="label">Maksimal Tiket Per Order</span>
              <span class="value">{{ formMeta.maxTicketsPerOrder || 5 }} Tiket</span>
            </div>
          </div>
        </div>

        <!-- Pembayaran -->
        <div class="glass-panel">
          <h2 class="section-title">Konfigurasi Pembayaran</h2>
          <div class="detail-list">
            <div class="detail-row">
              <span class="label">Status</span>
              <span :class="['badge', formMeta.paymentEnabled ? 'badge-green' : 'badge-gray']">
                {{ formMeta.paymentEnabled ? 'Berbayar' : 'Gratis' }}
              </span>
            </div>
            <template v-if="formMeta.paymentEnabled">
              <div class="detail-row">
                <span class="label">Nominal</span>
                <span class="value font-bold">Rp {{ formatNumber(formMeta.nominal) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Wajib Bukti</span>
                <span class="value">{{ event.requireProof ? 'Ya' : 'Tidak' }}</span>
              </div>
              <div class="mt-4">
                <p class="label mb-2">Metode Pembayaran:</p>
                <div v-if="!formMeta.paymentMethods?.length" class="text-muted text-sm">Tidak ada metode</div>
                <div v-else class="methods-grid">
                  <div v-for="method in formMeta.paymentMethods" :key="method.id" class="method-box">
                    <div class="method-head">
                      <span class="method-type">{{ method.type.toUpperCase() }}</span>
                      <span class="method-label">{{ method.label }}</span>
                    </div>
                    <div v-if="method.type !== 'qris'" class="method-info">
                      {{ method.accountNumber }} ({{ method.accountName }})
                    </div>
                    <div v-else class="method-qris">
                      <img :src="method.qrisImageUrl" alt="QRIS" class="qris-small">
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Akses & Notifikasi -->
        <div class="glass-panel">
          <h2 class="section-title">Akses & Notifikasi</h2>
          <div class="detail-list">
            <div class="detail-row">
              <span class="label">Pendaftaran</span>
              <span :class="['badge', formMeta.formActive !== false ? 'badge-green' : 'badge-red']">
                {{ formMeta.formActive !== false ? 'Buka' : 'Tutup' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Email Notifikasi</span>
              <span class="value">{{ formMeta.enableEmailNotification ? 'Aktif' : 'Nonaktif' }}</span>
            </div>
            <div class="info-block mt-4" v-if="formMeta.enableEmailNotification && formMeta.notifyEmails?.length">
              <p class="label mb-1">Email Penerima:</p>
              <div class="tags">
                <span class="tag" v-for="email in formMeta.notifyEmails" :key="email">{{ email }}</span>
              </div>
            </div>
            <div class="info-block mt-4">
              <p class="label mb-1">Staf Ter-assign:</p>
              <div class="tags">
                <template v-if="formMeta.assignedPanitia?.length || formMeta.assignedPetugas?.length">
                  <span class="tag tag-blue" v-for="p in formMeta.assignedPanitia" :key="p">{{ p }}</span>
                  <span class="tag tag-purple" v-for="p in formMeta.assignedPetugas" :key="p">{{ p }}</span>
                </template>
                <span class="text-muted text-sm" v-else>Semua Staf</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Tambahan -->
        <div class="glass-panel">
          <h2 class="section-title">Form Tambahan</h2>
          <div v-if="!customFields.length" class="text-muted py-4">Tidak ada field tambahan.</div>
          <div class="field-list" v-else>
            <div v-for="(field, i) in customFields" :key="i" class="field-item">
              <div class="field-info">
                <span class="field-label">{{ field.label }}</span>
                <span class="field-type">{{ field.type }}</span>
                <span v-if="field.required" class="badge-red-mini">Wajib</span>
              </div>
              <div v-if="field.options?.length" class="field-options">
                Pilihan: {{ field.options.join(', ') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Desain Halaman -->
        <div class="glass-panel">
          <h2 class="section-title">Desain Pendaftaran</h2>
          <div class="detail-list">
            <div class="detail-row">
              <span class="label">Background</span>
              <span class="value">{{ formMeta.backgroundMode === 'image' ? 'Gambar' : 'Warna' }}</span>
            </div>
            <div v-if="formMeta.backgroundMode === 'color'" class="mt-4 flex items-center gap-4">
              <div class="swatch" :style="{ backgroundColor: formMeta.backgroundColor || '#0f172a' }"></div>
              <div class="text-sm">
                <p class="font-bold">{{ formMeta.backgroundColor || '#0f172a' }}</p>
                <p class="text-muted capitalize">{{ formMeta.backgroundTexture || 'No Texture' }}</p>
              </div>
            </div>
            <div v-if="formMeta.backgroundMode === 'image' && formMeta.backgroundImageUrl" class="mt-4">
              <img :src="formMeta.backgroundImageUrl" class="bg-preview" alt="Background">
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const eventId = route.params.id

const { data: response, pending, error } = useFetch(`/api/event/${eventId}`, {
  key: `admin-event-detail-${eventId}`
})

const event = computed(() => response.value?.event || null)
const userRole = computed(() => response.value?.user?.role || 'PANITIA')

const parsedFormSchema = computed(() => {
  if (!event.value?.formSchema) return []
  try {
    return JSON.parse(event.value.formSchema)
  } catch (e) {
    return []
  }
})

const formMeta = computed(() => {
  return parsedFormSchema.value.find(item => item.itemType === 'form_meta') || {}
})

const customFields = computed(() => {
  return parsedFormSchema.value.filter(item => item.itemType !== 'form_meta')
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return dateStr }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return dateStr }
}

const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('id-ID').format(num)
}
</script>

<style scoped lang="scss">
.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.glass-panel {
  padding: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--line-soft);
}

.grid-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.detail-item p {
  font-size: 1rem;
  font-weight: 500;
}

.grid-two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .grid-two-cols {
    grid-template-columns: 1fr;
  }
}

.detail-list {
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px dashed var(--line-soft);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.detail-row .value {
  font-size: 0.95rem;
  font-weight: 600;
}

.methods-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.method-box {
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--line-soft);
  padding: 0.75rem;
  border-radius: 8px;
}

.method-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.method-type {
  font-size: 0.7rem;
  font-weight: 800;
  background: var(--primary);
  color: #fff;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.method-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.method-info {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.qris-small {
  max-width: 120px;
  background: #fff;
  padding: 4px;
  border-radius: 4px;
  display: block;
  margin-top: 0.5rem;
}

.info-block {
  background: rgba(0, 0, 0, 0.15);
  padding: 0.75rem;
  border-radius: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.tag-blue { color: #60a5fa; background: rgba(96, 165, 250, 0.15); }
.tag-purple { color: #a78bfa; background: rgba(167, 139, 250, 0.15); }

.field-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-item {
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--line-soft);
  border-radius: 8px;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.field-type {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.badge-red-mini {
  font-size: 0.65rem;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.field-options {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.swatch {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid var(--line-soft);
}

.bg-preview {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--line-soft);
}

.event-link {
  color: var(--secondary);
  text-decoration: none;
}

.event-link:hover {
  text-decoration: underline;
}

.state-box {
  padding: 2.5rem;
  text-align: center;
  background: var(--bg-card);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
}

.state-box.error {
  color: var(--danger);
  border-color: rgba(251, 113, 133, 0.3);
}

.text-red { color: var(--danger); }
.font-bold { font-weight: 700; }
.whitespace-pre-wrap { white-space: pre-wrap; }
.text-muted { color: var(--text-muted); }
.text-sm { font-size: 0.85rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-4 { margin-top: 1rem; }
.py-4 { padding: 1rem 0; }
.flex { display: flex; }
.items-center { align-items: center; }
.gap-4 { gap: 1rem; }
.capitalize { text-transform: capitalize; }
.font-semibold { font-weight: 600; }
</style>
