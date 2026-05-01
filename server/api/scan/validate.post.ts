import prisma from '../../utils/prisma'
import { decrypt, decryptWithSecret } from '../../utils/crypto'
import { getEventQrSecret } from '../../utils/eventQrSecret'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { qrToken } = body

  if (!qrToken) {
    throw createError({ statusCode: 400, statusMessage: 'QR Token is required' })
  }

  try {
    let eventIdFromToken = ''
    let ticketId = ''

    if (String(qrToken).startsWith('v1.')) {
      const chunks = String(qrToken).split('.')
      if (chunks.length < 3) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid QR Code format' })
      }

      eventIdFromToken = String(chunks[1] || '').trim()
      const encryptedPayload = chunks.slice(2).join('.')
      if (!eventIdFromToken || !encryptedPayload) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid QR Code format' })
      }

      const eventSecret = await getEventQrSecret(eventIdFromToken)
      if (!eventSecret) {
        throw createError({ statusCode: 400, statusMessage: 'QR secret event tidak ditemukan.' })
      }

      const decrypted = decryptWithSecret(encryptedPayload, eventSecret)
      const parts = decrypted.split('_')
      if (parts.length !== 2) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid QR Code format' })
      }

      if (parts[0] !== eventIdFromToken) {
        throw createError({ statusCode: 400, statusMessage: 'QR event mismatch.' })
      }

      ticketId = parts[1]
    } else {
      // Backward compatibility for legacy QR token (global APP_SECRET)
      const decrypted = decrypt(qrToken)
      const parts = decrypted.split('_')
      if (parts.length !== 2) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid QR Code format' })
      }
      eventIdFromToken = parts[0]
      ticketId = parts[1]
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        eventId: true,
        status: true,
        scanStatus: true,
        registrantName: true,
        event: {
          select: {
            name: true
          }
        }
      }
    })

    if (!ticket) {
      throw createError({ statusCode: 404, statusMessage: 'Tiket tidak ditemukan' })
    }
    if (ticket.eventId !== eventIdFromToken) {
      throw createError({ statusCode: 400, statusMessage: 'QR Code tidak cocok dengan event tiket.' })
    }

    if (ticket.status !== 'APPROVED') {
      throw createError({ statusCode: 400, statusMessage: 'Pembayaran tiket ini belum dikonfirmasi atau ditolak.' })
    }

    // Return ticket info for frontend confirmation
    return {
      success: true,
      ticket: {
        id: ticket.id,
        registrantName: ticket.registrantName,
        eventName: ticket.event.name,
        currentStatus: ticket.scanStatus, // BELUM_HADIR, MASUK, KELUAR
      }
    }
  } catch (error: any) {
    console.error('Scan Validate Error:', error)
    if (error.statusMessage) throw error
    throw createError({ statusCode: 400, statusMessage: 'QR Code tidak valid atau rusak.' })
  }
})
