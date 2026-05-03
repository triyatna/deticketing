import prisma from '../../utils/prisma'
import QRCode from 'qrcode'
import { encryptWithSecret } from '../../utils/crypto'
import { sendTicketEmail } from '../../utils/mailer'
import { resolveRequestBaseUrl } from '../../utils/requestBaseUrl'
import { getOrCreateEventQrSecret } from '../../utils/eventQrSecret'

import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded || decoded.role === 'PETUGAS') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const body = await readBody(event)
  const { ticketId } = body


  if (!ticketId) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' })
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true }
    })

    if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Tiket tidak ditemukan' })
    if (ticket.status === 'APPROVED') throw createError({ statusCode: 400, statusMessage: 'Tiket sudah diapprove' })

    // Generate event-scoped encrypted token: v1.{eventId}.{encryptedPayload}
    const eventQrSecret = await getOrCreateEventQrSecret(ticket.eventId)
    const rawToken = `${ticket.eventId}_${ticket.id}`
    const encryptedPayload = encryptWithSecret(rawToken, eventQrSecret)
    const encryptedToken = `v1.${ticket.eventId}.${encryptedPayload}`

    // Generate QR Code as Data URI
    const qrCodeDataUrl = await QRCode.toDataURL(encryptedToken, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400
    })

    const baseUrl = resolveRequestBaseUrl(event)

    // Send Email FIRST. If this fails, the ticket remains PENDING.
    await sendTicketEmail(ticket.registrantEmail, ticket.registrantName, ticket.event.name, qrCodeDataUrl, baseUrl)

    // Update ticket in database ONLY IF email succeeds
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'APPROVED',
        qrCodeToken: encryptedToken
      }
    })

    return {
      success: true,
      message: 'Tiket berhasil diapprove dan QR Code telah dikirim ke email.'
    }
  } catch (error: any) {
    console.error('Approve Ticket Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal approve tiket' })
  }
})
