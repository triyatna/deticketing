import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const eventId = getRouterParam(event, 'id')
  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'ID event tidak valid.' })
  }

  try {
    const targetEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!targetEvent) {
      throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan.' })
    }

    return {
      success: true,
      event: targetEvent
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Gagal memuat detail event.'
    })
  }
})
