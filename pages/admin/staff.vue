<template>
  <div>
    <div class="header-action">
      <div>
        <h1 class="page-title">Manajemen Staff</h1>
        <p class="subtitle">Kelola akun panitia/admin dengan struktur akses yang aman.</p>
      </div>
      <button @click="openModal = true" class="btn-primary">Tambah Staff</button>
    </div>

    <!-- Main List -->
    <div class="glass-panel mt-4">
      <div v-if="pending" class="text-center py-8">Loading staff...</div>
      <div v-else-if="error" class="text-center py-8 text-red">Gagal memuat data staff. (Pastikan Anda login sebagai ADMIN)</div>
      <div v-else-if="!staffList?.length" class="text-center py-8 text-muted">Belum ada staff.</div>
      
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Username</th>
              <th>Role</th>
              <th>Tgl Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in staffList" :key="staff.id">
              <td>{{ staff.name }}</td>
              <td>{{ staff.username }}</td>
              <td>
                <span
                  :class="[
                    'badge',
                    staff.isOwner ? 'badge-warning' : (staff.role === 'ADMIN' ? 'badge-primary' : 'badge-green')
                  ]"
                >
                  {{ staff.isOwner ? 'OWNER' : staff.role }}
                </span>
              </td>
              <td>{{ new Date(staff.createdAt).toLocaleDateString('id-ID') }}</td>
              <td>
                <div v-if="!staff.isOwner && !staff.isCurrentUser" class="flex-actions">
                  <button 
                    @click="resetPassword(staff)" 
                    class="btn-reset small"
                    title="Ubah/Reset Password"
                  >
                    Reset Pass
                  </button>
                  <button 
                    @click="deleteStaff(staff.id)" 
                    class="btn-delete small"
                  >
                    Hapus
                  </button>
                </div>
                <span v-else class="text-muted">Protected</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="openModal" class="modal-overlay">
      <div class="glass-panel modal-content">
        <h3 class="modal-title mb-4">Tambah Staff Baru</h3>
        <form @submit.prevent="createStaff" class="form-grid">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input v-model="form.name" type="text" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label>Username</label>
            <input v-model="form.username" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label>Password Awal</label>
            <input v-model="form.password" type="password" class="form-input" required />
          </div>

          <div class="form-group">
            <label>Role</label>
            <select v-model="form.role" class="form-input">
              <option value="PANITIA">Panitia (Scanner & Approval)</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
          </div>

          <div class="modal-actions mt-4">
            <button type="button" @click="openModal = false" class="btn-outline flex-1">Batal</button>
            <button type="submit" class="btn-primary flex-1" :disabled="isSubmitting">
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Swal from 'sweetalert2'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: response, pending, error, refresh } = useFetch('/api/admin/staff')
const staffList = computed(() => response.value?.staff || [])

const openModal = ref(false)
const isSubmitting = ref(false)
const form = ref({
  name: '',
  username: '',
  password: '',
  role: 'PANITIA'
})

const createStaff = async () => {
  isSubmitting.value = true
  try {
    const res = await $fetch('/api/admin/staff', {
      method: 'POST',
      body: form.value
    })
    
    if (res.success) {
      Swal.fire({
        title: 'Sukses!',
        text: 'Staff berhasil ditambahkan!',
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#3b82f6'
      })
      openModal.value = false
      form.value = { name: '', username: '', password: '', role: 'PANITIA' }
      refresh()
    }
  } catch (err) {
    Swal.fire({
      title: 'Error',
      text: err.data?.statusMessage || 'Gagal menambahkan staff',
      icon: 'error',
      background: '#0f172a',
      color: '#f8fafc'
    })
  } finally {
    isSubmitting.value = false
  }
}

const deleteStaff = async (id) => {
  const result = await Swal.fire({
    title: 'Konfirmasi',
    text: 'Anda yakin ingin menghapus staff ini secara permanen?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal',
    background: '#0f172a',
    color: '#f8fafc',
    confirmButtonColor: '#ef4444'
  })
  if (!result.isConfirmed) return
  
  try {
    const res = await $fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
    if (res.success) {
      Swal.fire({
        title: 'Terhapus!',
        text: res.message,
        icon: 'success',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#3b82f6'
      })
      refresh()
    }
  } catch (err) {
    Swal.fire({
      title: 'Error',
      text: err.data?.statusMessage || 'Gagal menghapus staff',
      icon: 'error',
      background: '#0f172a',
      color: '#f8fafc'
    })
  }
}
const resetPassword = async (staff) => {
  const { value: newPassword } = await Swal.fire({
    title: `Reset Password: ${staff.name}`,
    input: 'password',
    inputLabel: 'Password Baru',
    inputPlaceholder: 'Masukkan password baru',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Reset Sekarang',
    cancelButtonText: 'Batal',
    background: '#0f172a',
    color: '#f8fafc',
    confirmButtonColor: '#3b82f6',
    inputValidator: (value) => {
      if (!value) return 'Password tidak boleh kosong!'
      if (value.length < 6) return 'Minimal 6 karakter!'
    }
  })

  if (newPassword) {
    try {
      const res = await $fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PUT',
        body: { password: newPassword }
      })
      if (res.success) {
        Swal.fire({
          title: 'Sukses!',
          text: 'Password staff berhasil diperbarui.',
          icon: 'success',
          background: '#0f172a',
          color: '#f8fafc',
          confirmButtonColor: '#3b82f6'
        })
      }
    } catch (err) {
      Swal.fire({
        title: 'Gagal',
        text: err.data?.statusMessage || 'Gagal mengubah password',
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc'
      })
    }
  }
}
</script>

<style scoped lang="scss">
.header-action { display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem; }
.page-title { font-size: clamp(1.2rem, 2vw, 1.55rem); }
.subtitle { margin-top: 0.34rem; color: var(--text-muted); font-size: 0.89rem; }
.mt-4 { margin-top: 1rem; }
.mb-4 { margin-bottom: 1rem; }
.py-8 { padding: 2rem 0; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-red { color: #ef4444; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--glass-border); }
.data-table th { color: var(--text-muted); font-weight: 500; font-size: 0.875rem; }

.badge { padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.badge-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.badge-primary { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

.btn-delete.small {
  background: none;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-delete.small:hover { background: rgba(239, 68, 68, 0.1); }

.btn-reset.small {
  background: none;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-reset.small:hover { background: rgba(59, 130, 246, 0.1); }

.flex-actions {
  display: flex;
  gap: 0.5rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(2, 8, 23, 0.7);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  width: 100%;
  max-width: 520px;
  padding: 1rem;
}
.modal-title { font-size: 1.05rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
label { font-size: 0.82rem; color: #d8e4f4; font-weight: 600; }
.modal-actions { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
