<template>
  <div class="error-page texture-dots">
    <div class="glass-panel error-card text-center">
      <div class="error-code gradient-text">{{ error.statusCode || 500 }}</div>
      <h1 class="error-title">{{ errorTitle }}</h1>
      <p class="text-muted error-desc">
        {{ errorMessage }}
      </p>
      <div class="error-actions">
        <button @click="handleError" class="btn-primary error-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Kembali ke Beranda
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  error: Object
})

const handleError = () => clearError({ redirect: '/' })

const errorTitle = computed(() => {
  if (props.error?.statusCode === 404) return 'Halaman Tidak Ditemukan'
  if (props.error?.statusCode === 403) return 'Akses Ditolak'
  if (props.error?.statusCode === 401) return 'Tidak Diizinkan'
  return 'Terjadi Kesalahan Sistem'
})

const errorMessage = computed(() => {
  if (props.error?.statusMessage) return props.error.statusMessage
  if (props.error?.message) return props.error.message
  if (props.error?.statusCode === 404) return 'Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.'
  return 'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.'
})
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background-color: #0a1222;
  color: #f8fafc;
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 16px 16px;
  font-family: 'Inter', sans-serif;
}

.error-card {
  max-width: 480px;
  width: 100%;
  padding: 3.5rem 2.5rem;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: rgba(8, 17, 33, 0.65);
  backdrop-filter: blur(16px);
}

.error-code {
  font-size: clamp(4rem, 10vw, 6rem);
  font-weight: 900;
  line-height: 1;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.error-title {
  font-size: clamp(1.4rem, 4vw, 1.8rem);
  margin-bottom: 1rem;
  font-weight: 800;
  color: #fff;
  text-align: center;
}

.error-desc {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  max-width: 380px;
  text-align: center;
  color: #94a3b8;
}

.error-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
}

.error-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.85rem 1.8rem;
  font-size: 1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
}

.error-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
}

.text-center { text-align: center; }
</style>
