<template>
  <div>
    <div class="header-action">
      <div>
        <h1 class="page-title">Kelola Event</h1>
        <p class="subtitle">Daftar event aktif, kuota, dan akses cepat ke data pendaftar.</p>
      </div>
      <NuxtLink to="/admin/events/create" class="btn-primary">Buat Event Baru</NuxtLink>
    </div>

    <div class="glass-panel table-shell">


      <div v-if="pending" class="state-box">Memuat daftar event...</div>
      <div v-else-if="error" class="state-box error">Gagal memuat data event.</div>
      <div v-else-if="!events?.length" class="state-box">Belum ada event. Mulai dari membuat event pertama.</div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Event</th>
              <th>URL</th>
              <th>Kuota</th>
              <th>Status Bukti</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in events" :key="event.id">
              <td>
                <p class="event-name">{{ event.name }}</p>
              </td>
              <td>
                <div class="url-cell">
                  <a :href="`/form/${event.slug}`" target="_blank" class="event-link">/form/{{ event.slug }}</a>
                  <button @click="copyUrl(event.slug)" class="btn-copy" title="Salin Link">
                    Copy
                  </button>
                </div>
              </td>
              <td>{{ event.quota ? event.quota : 'Tak Terbatas' }}</td>
              <td>
                <span :class="['badge', event.requireProof ? 'badge-green' : 'badge-gray']">
                  {{ event.requireProof ? 'Wajib' : 'Opsional' }}
                </span>
              </td>
              <td>
                <div class="action-group">
                  <NuxtLink :to="`/admin/events/${event.id}/edit`" class="btn-outline action-btn">
                    Edit Event
                  </NuxtLink>
                  <NuxtLink :to="`/admin/events/${event.id}/tickets`" class="btn-outline action-btn">
                    Lihat Pendaftar
                  </NuxtLink>
                   <button type="button" class="btn-danger action-btn" @click="handleDeleteEvent(event)">
                     Hapus
                   </button>
                </div>
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
import Swal from 'sweetalert2'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: response, pending, error, refresh } = useFetch('/api/event')
const events = computed(() => response.value?.events || [])

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

const copyUrl = (slug) => {
  const url = `${window.location.origin}/form/${slug}`;
  navigator.clipboard.writeText(url).then(() => {
    showNotice('success', 'URL berhasil disalin ke clipboard!');
  }).catch(() => {
    showNotice('error', 'Gagal menyalin URL.');
  });
};

const handleDeleteEvent = async (eventItem) => {
  const result = await Swal.fire({
    title: 'Hapus Event?',
    text: `Anda yakin ingin menghapus event "${eventItem.name}"? Semua tiket dan bukti transfer akan ikut terhapus.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    background: '#0f172a',
    color: '#f8fafc',
    confirmButtonColor: '#ef4444'
  })

  if (!result.isConfirmed) return

  try {
    const res = await $fetch(`/api/event/${eventItem.id}`, {
      method: 'DELETE'
    })
    if (res.success) {
      showNotice('success', res.message || 'Event berhasil dihapus.')
      await refresh()
    }
  } catch (err) {
    showNotice('error', err.data?.statusMessage || 'Gagal menghapus event.')
  }
}
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

.subtitle {
  margin-top: 0.35rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.table-shell {
  margin-top: 1rem;
  padding: 0.9rem;
}



.state-box {
  padding: 1rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  color: var(--text-muted);
}

.state-box.error {
  color: #ffd3dc;
  border-color: rgba(251, 113, 133, 0.34);
}

.event-name {
  font-weight: 700;
}

.event-link {
  color: #7ddcff;
  text-decoration: none;
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-link:hover {
  text-decoration: underline;
}

.url-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  max-width: 200px;
}

.btn-copy {
  background: rgba(125, 220, 255, 0.1);
  border: 1px solid rgba(125, 220, 255, 0.3);
  color: #7ddcff;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  flex-shrink: 0;
}

.btn-copy:hover {
  background: rgba(125, 220, 255, 0.2);
  border-color: #7ddcff;
}

.action-btn {
  padding: 0.44rem 0.72rem;
  font-size: 0.82rem;
}

.action-group {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-danger {
  border: 1px solid rgba(251, 113, 133, 0.45);
  color: #ffdce4;
  background: rgba(127, 29, 29, 0.35);
  border-radius: 10px;
  padding: 0.5rem 0.8rem;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(153, 27, 27, 0.45);
}



@media (max-width: 760px) {
  .modal-actions button {
    width: 100%;
  }
}
</style>
