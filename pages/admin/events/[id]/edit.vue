<template>
  <div class="redirecting-wrap">
    <p>Mengalihkan ke editor event...</p>
  </div>
</template>

<script setup>
definePageMeta({ layout: "admin", middleware: "auth" });

const route = useRoute();

await navigateTo(`/admin/events/create?editId=${route.params.id}`);
</script>

<style scoped>
.redirecting-wrap {
  padding: 1rem;
  color: var(--text-muted);
}
</style>
