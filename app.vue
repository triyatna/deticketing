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
  title: appName.value || "DeTicketing",
  titleTemplate: (titleChunk) => {
    const name = appName.value || "DeTicketing";
    const tagline = appTagline.value || "Premium Ticketing System";
    if (titleChunk) return `${name} - ${titleChunk}`;
    return `${name} - ${tagline}`;
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
