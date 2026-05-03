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
  const query = getQuery(event)
  const requestedFile = query.file ? String(query.file) : null

  if (!ticketId) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' })
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      throw createError({ statusCode: 404, statusMessage: 'Tiket tidak ditemukan' })
    }

    let fileName = ticket.paymentProofUrl
    let downloadFileName = 'bukti_bayar'

    if (requestedFile && ticket.formData) {
      try {
        const formData = JSON.parse(ticket.formData)
        let fileFound = false
        for (const key in formData) {
          if (formData[key]?.fileName === requestedFile) {
            fileFound = true
            fileName = requestedFile
            downloadFileName = formData[key].originalName || requestedFile
            break
          }
        }
        if (!fileFound) {
           throw createError({ statusCode: 403, statusMessage: 'File tidak valid untuk tiket ini' })
        }
      } catch {
        // Ignore
      }
    }

    if (!fileName) {
      throw createError({ statusCode: 404, statusMessage: 'File tidak ditemukan' })
    }

    // Attempt to decrypt and serve
    const buffer = await getDecryptedFile(fileName)
    
    if (!buffer) {
      throw createError({ statusCode: 404, statusMessage: 'File fisik tidak ditemukan di server' })
    }

    // Determine content type based on extension
    const ext = fileName.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === 'png') contentType = 'image/png'
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
    if (ext === 'webp') contentType = 'image/webp'
    if (ext === 'pdf') contentType = 'application/pdf'

    // Set headers
    setResponseHeader(event, 'Content-Type', contentType)
    setResponseHeader(event, 'Content-Disposition', `inline; filename="${downloadFileName}"`)
    setResponseHeader(event, 'Cache-Control', 'private, max-age=3600')

    // Return the decrypted raw image buffer
    return buffer

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Gagal mendekripsi atau membaca file' })
  }
})
