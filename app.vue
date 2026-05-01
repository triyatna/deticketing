<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
const { loadBranding, appName, appTagline, appFaviconUrl } = useBranding();

await callOnce("load-global-branding", async () => {
  await loadBranding();
});

useHead(() => ({
  title: appTagline.value || "Premium Ticketing System",
  titleTemplate: (titleChunk) => {
    const base = appName.value || "NexTicket";
    if (titleChunk) return `${titleChunk} - ${base}`;
    return `${base} - ${appTagline.value || "Premium Ticketing System"}`;
  },
  link: appFaviconUrl.value
    ? [
        {
          rel: "icon",
          href: appFaviconUrl.value,
        },
      ]
    : [],
}));
</script>
