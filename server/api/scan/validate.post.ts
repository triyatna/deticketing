import prisma from '../../utils/prisma'
import { decrypt } from '../../utils/crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { qrToken } = body

  if (!qrToken) {
    throw createError({ statusCode: 400, statusMessage: 'QR Token is required' })
  }

  try {
    const decrypted = decrypt(qrToken)
    // decrypted format: eventId_ticketId
    const parts = decrypted.split('_')
    if (parts.length !== 2) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid QR Code format' })
    }

    const ticketId = parts[1]

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true }
    })

    if (!ticket) {
      throw createError({ statusCode: 404, statusMessage: 'Tiket tidak ditemukan' })
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
  } catch (error) {
    console.error('Scan Validate Error:', error)
    throw createError({ statusCode: 400, statusMessage: 'QR Code tidak valid atau rusak.' })
  }
})
