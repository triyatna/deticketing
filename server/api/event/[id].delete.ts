import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'
import { deleteEncryptedFile } from '../../utils/fileCrypto'
import { getEventQrSecretSettingKey } from '../../utils/eventQrSecret'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded: any = verifyToken(token)
  if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER')) {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }


  const eventId = getRouterParam(event, 'id')
  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'ID event tidak valid.' })
  }

  try {
    const targetEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true }
    })

    if (!targetEvent) {
      throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan.' })
    }

    const relatedTickets = await prisma.ticket.findMany({
      where: { eventId },
      select: { id: true, paymentProofUrl: true }
    })

    const ticketIds = relatedTickets.map((ticket) => ticket.id)
    const proofFiles = relatedTickets
      .map((ticket) => ticket.paymentProofUrl)
      .filter((value): value is string => !!value)

    await prisma.$transaction(async (tx) => {
      if (ticketIds.length > 0) {
        await tx.scanLog.deleteMany({
          where: { ticketId: { in: ticketIds } }
        })
      }

      await tx.ticket.deleteMany({ where: { eventId } })
      await tx.setting.deleteMany({ where: { key: getEventQrSecretSettingKey(eventId) } })
      await tx.event.delete({ where: { id: eventId } })
    })

    if (proofFiles.length > 0) {
      for (const fileName of proofFiles) {
        try {
          await deleteEncryptedFile(fileName)
        } catch {
          // Keep deletion flow successful even if orphaned files cannot be removed.
        }
      }
    }

    return {
      success: true,
      message: `Event "${targetEvent.name}" berhasil dihapus.`
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Gagal menghapus event.'
    })
  }
})
