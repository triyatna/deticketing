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
              <th>Slug URL</th>
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
                <a :href="`/p/${event.slug}`" target="_blank" class="event-link">/p/{{ event.slug }}</a>
              </td>
              <td>{{ event.quota ? event.quota : 'Tak Terbatas' }}</td>
              <td>
                <span :class="['badge', event.requireProof ? 'badge-green' : 'badge-gray']">
                  {{ event.requireProof ? 'Wajib' : 'Opsional' }}
                </span>
              </td>
              <td>
                <NuxtLink :to="`/admin/events/${event.id}/tickets`" class="btn-outline action-btn">
                  Lihat Pendaftar
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: response, pending, error } = useFetch('/api/event')
const events = computed(() => response.value?.events || [])
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
}

.event-link:hover {
  text-decoration: underline;
}

.action-btn {
  padding: 0.44rem 0.72rem;
  font-size: 0.82rem;
}
</style>
