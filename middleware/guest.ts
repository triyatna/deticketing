export default defineNuxtRouteMiddleware(async () => {
  try {
    const { data, error } = await useFetch('/api/auth/me', {
      headers: useRequestHeaders(['cookie'])
    })

    if (!error.value && data.value?.success) {
      return navigateTo('/admin/dashboard')
    }
  } catch {
    // no active session, stay on login page
  }
})
