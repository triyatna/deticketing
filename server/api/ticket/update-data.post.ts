import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded = verifyToken(token)
  if (!decoded || !decoded.id) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }

  const user = await prisma.admin.findUnique({ where: { id: decoded.id } })
  if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required' })
  }

  const body = await readBody(event)
  const { ticketId, registrantName, registrantEmail, formData } = body

  if (!ticketId) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID is required' })
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
    }

    // Update data
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        registrantName: registrantName || ticket.registrantName,
        registrantEmail: registrantEmail || ticket.registrantEmail,
        formData: formData ? JSON.stringify(formData) : ticket.formData
      }
    })

    return {
      success: true,
      ticket: updatedTicket
    }
  } catch (err: any) {
    console.error('Update Ticket Data Error:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Internal server error' })
  }
})
