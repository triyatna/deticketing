import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, description, quota, formSchema, requireProof } = body

  if (!name || !formSchema) {
    throw createError({ statusCode: 400, statusMessage: 'Nama dan Form Schema wajib diisi' })
  }

  // Generate a unique slug: slugified name + random string
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const uniqueId = Math.random().toString(36).substring(2, 8)
  const slug = `${baseSlug}-${uniqueId}`

  try {
    const newEvent = await prisma.event.create({
      data: {
        name,
        slug,
        description,
        quota: quota ? parseInt(quota) : null,
        formSchema: JSON.stringify(formSchema),
        requireProof: !!requireProof
      }
    })

    return {
      success: true,
      event: newEvent
    }
  } catch (error) {
    console.error('Create Event Error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat event' })
  }
})
