<script setup>
const route = useRoute()
await navigateTo(`/form/${route.params.slug}`, { redirectCode: 301 })
</script>

