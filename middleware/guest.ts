export default defineNuxtRouteMiddleware(async (to) => {
  const user = useState('auth_user')

  // If we already have the state, redirect immediately
  if (user.value) {
    const redirect = to.query.redirect as string
    return navigateTo(redirect || '/admin/dashboard')
  }

  // On the server, we can check the HttpOnly cookie
  if (process.server) {
    const token = useCookie('auth_token')
    if (!token.value) return // No token, stay on guest page
  }

  // If no state but might have session (client side navigation or server with token)
  try {
    const data = await $fetch('/api/auth/me', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) : {}
    })

    if (data?.success) {
      user.value = data.user
      const redirect = to.query.redirect as string
      return navigateTo(redirect || '/admin/dashboard')
    }
  } catch {
    // API call failed, ignore and stay on guest page
  }
})

