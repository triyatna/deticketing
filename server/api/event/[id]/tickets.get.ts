import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'
import { checkEventAccess } from '../../../utils/checkEventAccess'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded) throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })

  const eventId = getRouterParam(event, 'id')
  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'Event ID required' })
  }

  try {
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        quota: true,
        requireProof: true,
        formSchema: true,
      }
    })

    if (!ev) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    const hasAccess = await checkEventAccess(eventId, decoded.id, decoded.role)
    if (!hasAccess) {
      throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan.' })
    }

    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      select: {
        id: true,
        registrantName: true,
        registrantEmail: true,
        status: true,
        scanStatus: true,
        paymentProofUrl: true,
        createdAt: true,
        formData: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      event: ev,
      tickets
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Server error'
    })
  }
})

