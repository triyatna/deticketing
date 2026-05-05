export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useState("auth_user");

  // If user state exists, they are authenticated
  if (user.value) return;

  // On the server, we can check the HttpOnly cookie directly
  if (process.server) {
    const token = useCookie("auth_token");
    if (!token.value) {
      return navigateTo({
        path: "/admin/login",
        query: { redirect: to.fullPath },
      });
    }
  }

  // If no state, we must verify the session
  try {
    const data = await $fetch("/api/auth/me", {
      headers: import.meta.server ? useRequestHeaders(["cookie"]) : {},
    });

    if (data?.success) {
      user.value = data.user;
    } else {
      return navigateTo({
        path: "/admin/login",
        query: { redirect: to.fullPath },
      });
    }
  } catch (e) {
    return navigateTo({
      path: "/admin/login",
      query: { redirect: to.fullPath },
    });
  }
});
