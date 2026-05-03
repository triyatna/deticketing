<template>
  <div class="setup-page">
    <div class="setup-shell glass-panel">
      <div class="setup-brand">
        <p class="kicker">First Setup</p>
        <img
          v-if="appLogoUrl"
          :src="appLogoUrl"
          :alt="appName"
          class="brand-logo"
        />
        <h1 v-else class="gradient-text">{{ appName }} Console</h1>
        <p class="muted">
          Buat akun owner pertama untuk mengaktifkan panel admin.
        </p>
      </div>

      <form class="setup-form" @submit.prevent="handleSetup">
        <div class="form-head">
          <h2>Setup Owner</h2>
          <p>Akun owner hanya bisa dibuat sekali saat belum ada admin utama.</p>
        </div>

        <div class="form-group">
          <label for="name">Nama Owner</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-input"
            required
            autocomplete="name"
            placeholder="Masukkan nama owner"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            required
            autocomplete="email"
            placeholder="email@owner.com"
          />
        </div>


        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            required
            autocomplete="username"
            placeholder="Masukkan username owner"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              required
              autocomplete="new-password"
              placeholder="Minimal 8 karakter"
            />
            <button type="button" class="btn-toggle-password" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
              <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Konfirmasi Password</label>
          <div class="password-wrapper">
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              required
              autocomplete="new-password"
              placeholder="Ulangi password"
            />
            <button type="button" class="btn-toggle-password" @click="showConfirmPassword = !showConfirmPassword" aria-label="Toggle confirm password visibility">
              <svg v-if="showConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>

        <button type="submit" class="btn-primary submit-btn" :disabled="isLoading || checkingStatus">
          {{ isLoading ? "Memproses..." : "Buat Owner & Masuk Dashboard" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  middleware: 'guest'
})

const router = useRouter()
const { appName, appLogoUrl } = useBranding()

const checkingStatus = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)


const form = ref({
  name: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
})


const checkSetupStatus = async () => {
  checkingStatus.value = true
  try {
    const res = await $fetch('/api/auth/setup-status')
    if (res?.ownerExists) {
      router.replace('/admin/login')
    }
  } catch {
    router.replace('/admin/login')
  } finally {
    checkingStatus.value = false
  }
}

const handleSetup = async () => {
  if (form.value.password.length < 8) {
    errorMessage.value = 'Password minimal 8 karakter.'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Konfirmasi password tidak cocok.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch('/api/auth/setup-owner', {
      method: 'POST',
      body: form.value
    })

    if (res?.success) {
      router.push('/admin/dashboard')
    }
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal membuat owner.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await checkSetupStatus()
})
</script>

<style scoped lang="scss">
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 3vw, 2rem);
}

.setup-shell {
  width: 100%;
  max-width: 980px;
  padding: clamp(1rem, 2.5vw, 1.45rem);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: clamp(1rem, 2vw, 1.5rem);
}

.setup-brand {
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: clamp(1rem, 2vw, 1.3rem);
  background: linear-gradient(
    145deg,
    rgba(11, 26, 49, 0.7),
    rgba(7, 17, 32, 0.62)
  );
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kicker {
  color: var(--text-muted);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  margin-top: 0.2rem;
  font-size: clamp(1.5rem, 4vw, 1.95rem);
}

.brand-logo {
  max-width: 190px;
  max-height: 54px;
  object-fit: contain;
}

.muted {
  margin-top: 0.48rem;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.setup-form {
  display: grid;
  gap: 0.9rem;
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: clamp(1rem, 2vw, 1.25rem);
  background: rgba(8, 18, 33, 0.62);
}

.form-head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.form-head p {
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.form-group {
  display: grid;
  gap: 0.4rem;
}

label {
  color: #d5e2f1;
  font-size: 0.84rem;
  font-weight: 600;
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


.error-alert {
  background: rgba(251, 113, 133, 0.16);
  border: 1px solid rgba(251, 113, 133, 0.42);
  color: #ffd8df;
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  font-size: 0.85rem;
}

.submit-btn {
  width: 100%;
}

@media (max-width: 900px) {
  .setup-shell {
    grid-template-columns: 1fr;
  }
}
</style>

