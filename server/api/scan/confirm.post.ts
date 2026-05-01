import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ticketId, action, expectedStatus } = body

  if (!ticketId || !action || !expectedStatus) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (action !== 'MASUK' && action !== 'KELUAR') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
  }

  try {
    // ATOMIC UPDATE: Prevents Race Conditions
    // It only updates if the current status matches the expectedStatus.
    // If two panitias press "Masuk" exactly at the same millisecond, 
    // the database will only allow one to succeed because after the first one, 
    // the status is no longer the expectedStatus.
    const result = await prisma.ticket.updateMany({
      where: {
        id: ticketId,
        scanStatus: expectedStatus
      },
      data: {
        scanStatus: action
      }
    })

    if (result.count === 0) {
      // Meaning no rows were updated. Either ticket doesn't exist, or status changed (race condition)
      const currentTicket = await prisma.ticket.findUnique({ where: { id: ticketId } })
      if (!currentTicket) {
        throw createError({ statusCode: 404, statusMessage: 'Tiket tidak ditemukan' })
      }
      
      throw createError({ 
        statusCode: 409, 
        statusMessage: `Gagal! Status saat ini sudah berubah menjadi ${currentTicket.scanStatus}. Mungkin panitia lain sudah melakukan scan.` 
      })
    }

    // Log the scan action
    await prisma.scanLog.create({
      data: {
        ticketId,
        action,
        scannedBy: 'Admin/Panitia' // Can be expanded to track actual logged-in user
      }
    })

    return {
      success: true,
      message: `Berhasil mencatat status: ${action}`
    }
  } catch (error: any) {
    console.error('Scan Confirm Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Terjadi kesalahan pada server' })
  }
})
