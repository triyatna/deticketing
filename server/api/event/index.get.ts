import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        quota: true,
        requireProof: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      events
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch events'
    })
  }
})
