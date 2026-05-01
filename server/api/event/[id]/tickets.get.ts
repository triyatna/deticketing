import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'id')

  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'Event ID required' })
  }

  try {
    const ev = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!ev) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      event: ev,
      tickets
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
