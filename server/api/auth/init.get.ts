export default defineEventHandler(async (event) => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Endpoint init dinonaktifkan. Gunakan /admin/setup-owner untuk membuat akun owner pertama.'
  })
})
