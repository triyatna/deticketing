export default defineNuxtRouteMiddleware(async (to, from) => {
  // Try to fetch user from API
  try {
    const { data, error } = await useFetch('/api/auth/me', {
      headers: useRequestHeaders(['cookie'])
    })

    // If API returns an error or no data, redirect to login
    if (error.value || !data.value?.success) {
      return navigateTo('/admin/login')
    }
  } catch (e) {
    return navigateTo('/admin/login')
  }
})
