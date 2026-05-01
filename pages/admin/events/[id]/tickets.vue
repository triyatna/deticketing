<template>
  <div>
    <div class="header-action">
      <h1 class="page-title">Pendaftar Event: {{ event?.name || 'Loading...' }}</h1>
      <NuxtLink to="/admin/events" class="btn-outline">Kembali</NuxtLink>
    </div>

    <div class="glass-panel mt-4">
      <div v-if="pending" class="text-center py-8">Loading pendaftar...</div>
      <div v-else-if="error" class="text-center py-8 text-red">Gagal memuat data.</div>
      <div v-else-if="!tickets?.length" class="text-center py-8 text-muted">Belum ada pendaftar untuk event ini.</div>
      
      <div v-else class="table-responsive">
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
            <tr v-for="ticket in tickets" :key="ticket.id">
              <td>{{ ticket.registrantName }}</td>
              <td>{{ ticket.registrantEmail }}</td>
              <td>{{ new Date(ticket.createdAt).toLocaleString('id-ID') }}</td>
              <td>
                <a v-if="ticket.paymentProofUrl" :href="`/api/admin/proof/${ticket.id}`" target="_blank" class="text-blue">Lihat Bukti</a>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span :class="['badge', ticket.status === 'APPROVED' ? 'badge-green' : 'badge-yellow']">
                  {{ ticket.status }}
                </span>
              </td>
              <td>
                <span :class="['badge', getScanBadgeClass(ticket.scanStatus)]">
                  {{ ticket.scanStatus.replace('_', ' ') }}
                </span>
              </td>
              <td>
                <button 
                  v-if="ticket.status === 'PENDING'" 
                  @click="approveTicket(ticket.id)" 
                  class="btn-primary small"
                  :disabled="approvingId === ticket.id"
                >
                  {{ approvingId === ticket.id ? 'Mengirim...' : 'Approve & Kirim QR' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const eventId = route.params.id

// We fetch the event and its tickets
const { data: response, pending, error, refresh } = useFetch(`/api/event/${eventId}/tickets`)
const event = computed(() => response.value?.event)
const tickets = computed(() => response.value?.tickets || [])

const approvingId = ref(null)

const getScanBadgeClass = (status) => {
  if (status === 'MASUK') return 'badge-green'
  if (status === 'KELUAR') return 'badge-yellow'
  return 'badge-gray'
}

const approveTicket = async (ticketId) => {
  if (!confirm('Approve pembayaran ini? Sistem akan mengirimkan E-Ticket berisi QR Code ke email pendaftar.')) return
  
  approvingId.value = ticketId
  try {
    const res = await $fetch('/api/ticket/approve', {
      method: 'POST',
      body: { ticketId }
    })
    
    if (res.success) {
      alert('Berhasil! QR Code telah dikirim ke email peserta.')
      await refresh()
    }
  } catch (err) {
    alert(err.data?.statusMessage || 'Gagal menyetujui tiket')
  } finally {
    approvingId.value = null
  }
}
</script>

<style scoped lang="scss">
.header-action { display: flex; justify-content: space-between; align-items: center; }
.page-title { font-size: 1.5rem; }
.mt-4 { margin-top: 1rem; }
.text-center { text-align: center; }
.py-8 { padding: 2rem 0; }
.text-muted { color: var(--text-muted); }
.text-red { color: #ef4444; }
.text-blue { color: var(--primary); text-decoration: none; }
.text-blue:hover { text-decoration: underline; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--glass-border); }
.data-table th { color: var(--text-muted); font-weight: 500; font-size: 0.875rem; }

.badge { padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.badge-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.badge-yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.badge-gray { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

.btn-primary.small { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
</style>
