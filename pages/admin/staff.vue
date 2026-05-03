<template>
  <div>
    <div class="header-action">
      <div>
        <h1 class="page-title">Manajemen Staff</h1>
        <p class="subtitle">Kelola akun operasional staff deticketing.</p>
      </div>
      <button v-if="canAddStaff" @click="openModal = true" class="btn-primary">
        Tambah Staff
      </button>
    </div>

    <!-- Main List -->
    <div class="glass-panel mt-4">
      <div v-if="pending || loadingUser" class="text-center py-8">
        Memuat data...
      </div>
      <div v-else-if="error" class="text-center py-8 text-red">
        Gagal memuat data staff.
      </div>
      <div v-else-if="!staffList?.length" class="text-center py-8 text-muted">
        Belum ada staff.
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Tgl Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in staffList" :key="staff.id">
              <td>{{ staff.name }}</td>
              <td>{{ staff.username }}</td>
              <td>{{ staff.email || "-" }}</td>
              <td>
                <span :class="['badge', getBadgeClass(staff.role)]">
                  {{ staff.role }}
                </span>
              </td>
              <td>
                {{ new Date(staff.createdAt).toLocaleDateString("id-ID") }}
              </td>
              <td>
                <div v-if="canManageStaff(staff)" class="flex-actions">
                  <!-- Ganti Role: Owner for all, Admin for Panitia/Petugas -->
                  <button
                    v-if="canChangeRole(staff)"
                    @click="changeRole(staff)"
                    class="btn-role small"
                    title="Ganti Role"
                  >
                    Role
                  </button>

                  <button
                    v-if="!staff.email"
                    @click="updateEmail(staff)"
                    class="btn-email small"
                    title="Tambah Email"
                  >
                    Email
                  </button>

                  <button
                    @click="resetPassword(staff)"
                    class="btn-reset small"
                    title="Ubah/Reset Password"
                  >
                    Pass
                  </button>

                  <button
                    v-if="!staff.isCurrentUser"
                    @click="deleteStaff(staff.id)"
                    class="btn-delete small"
                  >
                    Hapus
                  </button>
                </div>

                <span v-else-if="staff.isCurrentUser" class="text-muted text-xs">Anda (Protected)</span>
                <span v-else class="text-muted text-xs">Protected</span>
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
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              required
              placeholder="staff@example.com"
            />
          </div>

          <div class="form-group">
            <label>Username</label>
            <input
              v-model="form.username"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Password Awal</label>
            <div class="password-wrapper">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                required
              />
              <button type="button" class="btn-toggle-password" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
                <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>

          <div class="form-group full-row">
            <label>Role</label>
            <select v-model="form.role" class="form-input">
              <option value="PETUGAS">Petugas (Scanner & View)</option>
              <option value="PANITIA">Panitia (Scanner, Edit, Approve)</option>
               <option v-if="currentUser?.role === 'OWNER'" value="ADMIN">Admin (Full Control Events)</option>
            </select>
          </div>

          <div class="modal-actions mt-4">
            <button
              type="button"
              @click="openModal = false"
              class="btn-outline flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn-primary flex-1"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Swal from "sweetalert2";

definePageMeta({ layout: "admin", middleware: "auth" });
useHead({ title: "Manajemen Staff" });

const {
  data: response,
  pending,
  error,
  refresh,
} = useFetch("/api/admin/staff");
const staffList = computed(() => response.value?.staff || []);

const currentUser = ref(null);
const loadingUser = ref(true);

const openModal = ref(false);
const isSubmitting = ref(false);
const showPassword = ref(false);

const form = ref({
  name: "",
  username: "",
  email: "",
  password: "",
  role: "PETUGAS",
});

onMounted(async () => {
  try {
    const res = await $fetch("/api/auth/me");
    if (res.success) currentUser.value = res.user;
  } finally {
    loadingUser.value = false;
  }
});

const canAddStaff = computed(() => {
  return (
    currentUser.value?.role === "OWNER" || currentUser.value?.role === "ADMIN"
  );
});

const roleHierarchy = {
  OWNER: 4,
  ADMIN: 3,
  PANITIA: 2,
  PETUGAS: 1,
};

const canManageStaff = (staff) => {
  if (!currentUser.value) return false;

  const myRole = currentUser.value.role;
  const targetRole = staff.role;

  if (myRole === "OWNER") return true;

  if (myRole === "ADMIN") {
    // Admin can manage self OR roles below them (Panitia, Petugas)
    return staff.isCurrentUser || roleHierarchy[targetRole] < 3;
  }

  return false;
};

const getBadgeClass = (role) => {
  if (role === "OWNER") return "badge-warning";
  if (role === "ADMIN") return "badge-primary";
  if (role === "PANITIA") return "badge-green";
  return "badge-secondary";
};

const createStaff = async () => {
  isSubmitting.value = true;
  try {
    const res = await $fetch("/api/admin/staff", {
      method: "POST",
      body: form.value,
    });

    if (res.success) {
      Swal.fire({
        title: "Sukses!",
        text: "Staff berhasil ditambahkan!",
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
      });
      openModal.value = false;
      form.value = {
        name: "",
        username: "",
        email: "",
        password: "",
        role: "PETUGAS",
      };
      refresh();
    }
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: err.data?.statusMessage || "Gagal menambahkan staff",
      icon: "error",
      background: "#0f172a",
      color: "#f8fafc",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const canChangeRole = (staff) => {
  if (!currentUser.value) return false;
  if (staff.isCurrentUser) return false;

  const myRole = currentUser.value.role;
  const targetRole = staff.role;

  if (myRole === "OWNER") return true;

  if (myRole === "ADMIN") {
    // Admin can change role of Panitia and Petugas
    return roleHierarchy[targetRole] < 3;
  }

  return false;
};

const changeRole = async (staff) => {
  const options = {
    PETUGAS: "Petugas",
    PANITIA: "Panitia",
  };

  // Only Owner can promote to Admin
  if (currentUser.value?.role === "OWNER") {
    options.ADMIN = "Admin";
  }



  const { value: newRole } = await Swal.fire({
    title: `Ganti Role: ${staff.name}`,
    input: "select",
    inputOptions: options,
    inputPlaceholder: "Pilih role baru",
    showCancelButton: true,
    background: "#0f172a",
    color: "#f8fafc",
  });

  if (newRole) {
    try {
      const res = await $fetch(`/api/admin/staff/${staff.id}`, {
        method: "PUT",
        body: { role: newRole },
      });
      if (res.success) {
        Swal.fire({
          title: "Berhasil",
          text: "Role diperbarui",
          icon: "success",
          background: "#0f172a",
          color: "#f8fafc",
        });
        refresh();
      }
    } catch (err) {
      Swal.fire({
        title: "Gagal",
        text: err.data?.statusMessage || "Gagal ganti role",
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc",
      });
    }
  }
};

const updateEmail = async (staff) => {
  const { value: newEmail } = await Swal.fire({
    title: `Update Email: ${staff.name}`,
    input: "email",
    inputPlaceholder: "Masukkan email valid",
    showCancelButton: true,
    background: "#0f172a",
    color: "#f8fafc",
  });

  if (newEmail) {
    try {
      const res = await $fetch(`/api/admin/staff/${staff.id}`, {
        method: "PUT",
        body: { email: newEmail },
      });
      if (res.success) {
        Swal.fire({
          title: "Sukses",
          icon: "success",
          background: "#0f172a",
          color: "#f8fafc",
        });
        refresh();
      }
    } catch (err) {
      Swal.fire({
        title: "Gagal",
        text: err.data?.statusMessage,
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc",
      });
    }
  }
};

const deleteStaff = async (id) => {
  const result = await Swal.fire({
    title: "Hapus Staff?",
    text: "Aksi ini tidak bisa dibatalkan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    background: "#0f172a",
    color: "#f8fafc",
  });
  if (!result.isConfirmed) return;

  try {
    const res = await $fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    if (res.success) {
      refresh();
    }
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: err.data?.statusMessage,
      icon: "error",
      background: "#0f172a",
      color: "#f8fafc",
    });
  }
};

const resetPassword = async (staff) => {
  const { value: newPassword } = await Swal.fire({
    title: `Reset Pass: ${staff.name}`,
    input: "password",
    inputPlaceholder: "Password baru",
    showCancelButton: true,
    background: "#0f172a",
    color: "#f8fafc",
  });

  if (newPassword) {
    try {
      await $fetch(`/api/admin/staff/${staff.id}`, {
        method: "PUT",
        body: { password: newPassword },
      });
      Swal.fire({
        title: "Sukses",
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
      });
    } catch (err) {
      Swal.fire({
        title: "Gagal",
        text: err.data?.statusMessage,
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc",
      });
    }
  }
};
</script>

<style scoped lang="scss">
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
  margin-top: 0.34rem;
  color: var(--text-muted);
  font-size: 0.89rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.py-8 {
  padding: 2rem 0;
}
.text-center {
  text-align: center;
}
.text-muted {
  color: var(--text-muted);
}
.text-xs {
  font-size: 0.75rem;
}
.text-red {
  color: #ef4444;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--glass-border);
}
.data-table th {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.875rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-secondary {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}
.badge-green {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}
.badge-primary {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
.badge-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.btn-delete.small {
  background: none;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
}
.btn-delete.small:hover {
  background: rgba(239, 68, 68, 0.1);
}

.btn-reset.small {
  background: none;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
}
.btn-reset.small:hover {
  background: rgba(59, 130, 246, 0.1);
}

.btn-email.small {
  background: none;
  border: 1px solid #10b981;
  color: #10b981;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
}
.btn-email.small:hover {
  background: rgba(16, 185, 129, 0.1);
}

.btn-role.small {
  background: none;
  border: 1px solid #f59e0b;
  color: #f59e0b;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
}
.btn-role.small:hover {
  background: rgba(245, 158, 11, 0.1);
}

.flex-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .form-input {
  width: 100%;
  padding-right: 2.5rem;
}

.btn-toggle-password {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-toggle-password:hover {
  color: #edf4ff;
}

.btn-toggle-password svg {
  width: 1.25rem;
  height: 1.25rem;
}


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
.modal-title {
  font-size: 1.05rem;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.full-row {
  grid-column: 1 / -1;
}
label {
  font-size: 0.82rem;
  color: #d8e4f4;
  font-weight: 600;
}
.modal-actions {
  display: flex;
  gap: 1rem;
}
.flex-1 {
  flex: 1;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
