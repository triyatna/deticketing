import prisma from '../../utils/prisma'
import { saveEncryptedFile } from '../../utils/fileCrypto'

export default defineEventHandler(async (event) => {
  // Parsing multipart/form-data
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid form data' })
  }

  let eventId = '', registrantName = '', registrantEmail = '', formDataStr = ''
  let paymentProofFile: any = null

  for (const field of formData) {
    if (field.name === 'eventId') eventId = field.data.toString()
    if (field.name === 'registrantName') registrantName = field.data.toString()
    if (field.name === 'registrantEmail') registrantEmail = field.data.toString()
    if (field.name === 'formData') formDataStr = field.data.toString()
    if (field.name === 'paymentProof' && field.filename) {
      paymentProofFile = field
    }
  }

  if (!eventId || !registrantName || !registrantEmail || !formDataStr) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak lengkap' })
  }

  try {
    const evt = await prisma.event.findUnique({ where: { id: eventId } })
    if (!evt) throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan' })

    if (evt.quota !== null) {
      const currentRegistrants = await prisma.ticket.count({ where: { eventId } })
      if (currentRegistrants >= evt.quota) {
        throw createError({ statusCode: 400, statusMessage: 'Kuota pendaftaran telah penuh' })
      }
    }

    if (evt.requireProof && !paymentProofFile) {
      throw createError({ statusCode: 400, statusMessage: 'Bukti pembayaran (gambar) wajib dilampirkan' })
    }

    let savedFileName = null
    if (paymentProofFile) {
      // Validate file type
      if (!paymentProofFile.type?.startsWith('image/')) {
        throw createError({ statusCode: 400, statusMessage: 'File harus berupa gambar' })
      }
      
      const ext = paymentProofFile.filename.split('.').pop()
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
      
      // Save encrypted file
      await saveEncryptedFile(paymentProofFile.data, uniqueFileName)
      savedFileName = uniqueFileName
    }

    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        registrantName,
        registrantEmail,
        formData: formDataStr, // Already stringified JSON from frontend
        paymentProofUrl: savedFileName // Reusing this field to store the local filename
      }
    })

    return {
      success: true,
      ticketId: ticket.id
    }
  } catch (error: any) {
    console.error('Register Ticket Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal mendaftar' })
  }
})
