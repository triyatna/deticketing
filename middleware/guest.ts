export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const data = await $fetch('/api/auth/me', {
      headers: useRequestHeaders(['cookie'])
    })

    if (data?.success) {
      const redirect = to.query.redirect as string
      if (redirect) {
        return navigateTo(redirect)
      }
      return navigateTo('/admin/dashboard')
    }
  } catch {
    // no active session, stay on login page
  }
})

