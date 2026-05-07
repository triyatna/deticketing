import prisma from '../../utils/prisma'
import QRCode from 'qrcode'
import { encryptWithSecret } from '../../utils/crypto'
import { sendTicketEmail } from '../../utils/mailer'
import { resolveRequestBaseUrl } from '../../utils/requestBaseUrl'
import { getOrCreateEventQrSecret } from '../../utils/eventQrSecret'
import { broadcastToRoom } from '../../utils/wsHub'
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
    const primaryTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true }
    })

    if (!primaryTicket) throw createError({ statusCode: 404, statusMessage: 'Tiket tidak ditemukan' })
    
    const isResend = primaryTicket.status === 'APPROVED'

    const ticketsToProcess = isResend
      ? [primaryTicket]
      : ((primaryTicket as any).orderId 
          ? await prisma.ticket.findMany({ 
              where: { 
                orderId: (primaryTicket as any).orderId, 
                status: 'PENDING' 
              } as any, 
              include: { event: true } 
            })
          : [primaryTicket])

    if (ticketsToProcess.length === 0 && !isResend) {
       throw createError({ statusCode: 400, statusMessage: 'Tidak ada tiket pending yang bisa diapprove' })
    }

    const baseUrl = resolveRequestBaseUrl(event)
    const eventQrSecret = await getOrCreateEventQrSecret(primaryTicket.eventId)

    for (let i = 0; i < ticketsToProcess.length; i++) {
      const ticket: any = ticketsToProcess[i]
      if (!ticket) continue
      
      // Delay if more than one ticket to avoid spam flagging
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      const rawToken = `${ticket.eventId}_${ticket.id}`
      const eventName = ticket.event?.name || primaryTicket.event.name
      
      const encryptedPayload = encryptWithSecret(rawToken, eventQrSecret)
      const encryptedToken = `v1.${ticket.eventId}.${encryptedPayload}`

      const qrCodeDataUrl = await QRCode.toDataURL(encryptedToken, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400
      })

      // Send email
      await sendTicketEmail(
        ticket.registrantEmail, 
        ticket.registrantName, 
        eventName, 
        qrCodeDataUrl, 
        baseUrl
      )

      // Update in DB
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'APPROVED',
          qrCodeToken: encryptedToken
        }
      })
    }

    broadcastToRoom(`event:${primaryTicket.eventId}`, { type: 'update', action: 'ticket_approved' })
    broadcastToRoom('global', { type: 'update', action: 'ticket_approved' })

    return {
      success: true,
      message: isResend
        ? 'E-Ticket berhasil dikirim ulang ke email.'
        : (ticketsToProcess.length > 1 
            ? `${ticketsToProcess.length} tiket dalam pesanan ini berhasil diapprove.`
            : 'Tiket berhasil diapprove dan QR Code telah dikirim ke email.')
    }
  } catch (error: any) {
    console.error('Approve Ticket Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal approve tiket' })
  }
})
