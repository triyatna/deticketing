import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        quota: true,
        requireProof: true,
        createdByName: true,
        createdAt: true,

      },
      orderBy: { createdAt: 'desc' }
    })

    const token = getCookie(event, 'auth_token')
    const decoded = token ? verifyToken(token) : null

    return {
      success: true,
      events,
      user: decoded ? { id: decoded.id, role: decoded.role } : null
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch events'
    })
  }
})
