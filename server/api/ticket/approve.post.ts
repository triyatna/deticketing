import prisma from '../../utils/prisma'
import QRCode from 'qrcode'
import { encrypt } from '../../utils/crypto'
import { sendTicketEmail } from '../../utils/mailer'
import { resolveRequestBaseUrl } from '../../utils/requestBaseUrl'

export default defineEventHandler(async (event) => {
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

    // Generate Encrypted Token: eventId_ticketId
    const rawToken = `${ticket.eventId}_${ticket.id}`
    const encryptedToken = encrypt(rawToken)

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
