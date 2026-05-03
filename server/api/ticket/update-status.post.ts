import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'
import { defineEventHandler, getCookie, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded || decoded.role === 'PETUGAS') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const body = await readBody(event)
  const { ticketId, status } = body

  if (!ticketId || !status) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID dan Status required' })
  }

  const allowedStatuses = ['PENDING', 'REJECTED']
  if (!allowedStatuses.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Status tidak valid.' })
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      throw createError({ statusCode: 404, statusMessage: 'Tiket tidak ditemukan' })
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    })

    return { success: true, ticket: updatedTicket }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message || 'Gagal mengubah status tiket' })
  }
})
