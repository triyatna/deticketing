import prisma from '../../../utils/prisma'
import { getDecryptedFile } from '../../../utils/fileCrypto'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  // Authentication check
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const decoded = verifyToken(token)
  if (!decoded) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Get ticket ID
  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' })
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket || !ticket.paymentProofUrl) {
      throw createError({ statusCode: 404, statusMessage: 'Bukti pembayaran tidak ditemukan' })
    }

    // In this context, paymentProofUrl stores the local encrypted file name
    const fileName = ticket.paymentProofUrl
    
    // Attempt to decrypt and serve
    const buffer = await getDecryptedFile(fileName)
    
    if (!buffer) {
      throw createError({ statusCode: 404, statusMessage: 'File fisik tidak ditemukan di server' })
    }

    // Determine content type based on extension
    const ext = fileName.split('.').pop()?.toLowerCase()
    let contentType = 'image/jpeg'
    if (ext === 'png') contentType = 'image/png'
    if (ext === 'webp') contentType = 'image/webp'

    // Set headers
    setResponseHeader(event, 'Content-Type', contentType)
    setResponseHeader(event, 'Cache-Control', 'private, max-age=3600')

    // Return the decrypted raw image buffer
    return buffer

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Gagal mendekripsi atau membaca file' })
  }
})
