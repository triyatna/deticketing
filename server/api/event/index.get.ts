import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      events
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch events' })
  }
})
