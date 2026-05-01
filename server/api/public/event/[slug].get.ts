import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug required' })
  }

  try {
    const ev = await prisma.event.findUnique({
      where: { slug }
    })

    if (!ev) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    let availableQuota = null
    if (ev.quota !== null) {
      const ticketsCount = await prisma.ticket.count({ where: { eventId: ev.id } })
      availableQuota = ev.quota - ticketsCount
    }

    return {
      success: true,
      event: {
        id: ev.id,
        name: ev.name,
        description: ev.description,
        formSchema: ev.formSchema,
        requireProof: ev.requireProof,
        quota: ev.quota
      },
      availableQuota
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
