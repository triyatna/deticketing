import prisma from '../../../../utils/prisma'
import { verifyToken } from '../../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded = verifyToken(token)
  if (!decoded) throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })

  const eventId = getRouterParam(event, 'id')
  const ticketId = getRouterParam(event, 'ticketId')

  if (!eventId || !ticketId) {
    throw createError({ statusCode: 400, statusMessage: 'Parameter tidak valid' })
  }

  try {
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        formSchema: true,
      }
    })

    if (!ev) {
      throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan' })
    }

    const ticket: any = await prisma.ticket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      throw createError({ statusCode: 404, statusMessage: 'Tiket tidak ditemukan' })
    }

    let siblingTickets: any[] = []
    if ((ticket as any).orderId) {
      siblingTickets = await prisma.ticket.findMany({
        where: { 
          orderId: (ticket as any).orderId,
          id: { not: ticketId }
        } as any
      })
    }

    return {
      success: true,
      event: ev,
      ticket,
      siblings: siblingTickets
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Server error'
    })
  }
})
