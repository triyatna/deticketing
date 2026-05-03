<template>
  <div class="login-page">
    <div class="login-shell glass-panel">
      <div class="login-brand">
        <p class="kicker">Admin Access</p>
        <img
          v-if="appLogoUrl"
          :src="appLogoUrl"
          :alt="appName"
          class="brand-logo"
        />
        <h1 v-else class="gradient-text">{{ appName }} Console</h1>
        <p class="muted">
          Masuk untuk kelola event, verifikasi tiket, dan operasional check-in
          peserta.
        </p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-head">
          <h2>Sign In</h2>
          <p>Gunakan akun staf atau owner untuk lanjut ke dashboard.</p>
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
            placeholder="Masukkan username"
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
              autocomplete="current-password"
              placeholder="Masukkan password"
            />
            <button type="button" class="btn-toggle-password" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
              <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>

        <button type="submit" class="btn-primary submit-btn" :disabled="isLoading || checkingSetup">
          {{ checkingSetup ? 'Memeriksa Setup...' : (isLoading ? 'Memproses...' : 'Masuk') }}
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
const form = ref({ username: '', password: '' })
const showPassword = ref(false)
const isLoading = ref(false)
const checkingSetup = ref(true)
const errorMessage = ref('')

const handleLogin = async () => {
  if (checkingSetup.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: form.value
    })

    if (response.success) {
      router.push('/admin/dashboard')
    }
  } catch (error) {
    errorMessage.value = error.data?.statusMessage || 'Login gagal. Periksa kembali kredensial Anda.'
  } finally {
    isLoading.value = false
  }
}

const checkOwnerSetup = async () => {
  checkingSetup.value = true
  try {
    const res = await $fetch('/api/auth/setup-status')
    if (res?.success && !res.ownerExists) {
      router.replace('/admin/setup-owner')
      return
    }
  } catch {
    // keep login available on transient errors
  } finally {
    checkingSetup.value = false
  }
}

onMounted(async () => {
  await checkOwnerSetup()
})
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 3vw, 2rem);
}

.login-shell {
  width: 100%;
  max-width: 980px;
  padding: clamp(1rem, 2.5vw, 1.45rem);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: clamp(1rem, 2vw, 1.5rem);
}

.login-brand {
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

.login-form {
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
  .login-shell {
    grid-template-columns: 1fr;
  }
}
</style>
