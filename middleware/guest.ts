export default defineNuxtRouteMiddleware(async () => {
  try {
    const data = await $fetch('/api/auth/me', {
      headers: useRequestHeaders(['cookie'])
    })

    if (data?.success) {
      return navigateTo('/admin/dashboard')
    }
  } catch {
    // no active session, stay on login page
  }
})

