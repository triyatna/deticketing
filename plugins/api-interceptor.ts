export default defineNuxtPlugin((nuxtApp) => {
  const handleAuthError = () => {
    if (process.client) {
      const user = useState('auth_user')
      user.value = null
      
      const token = useCookie('auth_token')
      token.value = null

      // Redirect to login if not already there, preventing infinite loops
      if (window.location.pathname !== '/admin/login' && window.location.pathname.startsWith('/admin')) {
        window.location.href = `/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
    }
  }

  // Hook into Nuxt's default $fetch instance globally
  globalThis.$fetch = $fetch.create({
    onResponseError({ response }: { response: any }) {
      if (response.status === 401 || response.status === 403) {
        handleAuthError()
      }
    }
  })

  // Additionally, hook into useFetch responses if possible via vue hooks
  nuxtApp.hook('app:error', (error: any) => {
    if (error?.statusCode === 401 || error?.statusCode === 403 || error?.response?.status === 401) {
      handleAuthError()
    }
  })
})
