import prisma from '../../utils/prisma'
import { saveEncryptedFile } from '../../utils/fileCrypto'
import { sendStaffNotificationEmail } from '../../utils/mailer'
import { resolveRequestBaseUrl } from '../../utils/requestBaseUrl'
import { broadcastToRoom } from '../../utils/wsHub'

const firstCsvValue = (value: string | undefined) => {
  if (!value) return ''
  return String(value).split(',')[0]?.trim() || ''
}

const collectServerDeviceMeta = (event: any) => {
  const headers = event.node.req.headers || {}
  const remoteAddress = String(event.node.req.socket?.remoteAddress || '').trim()
  const xForwardedFor = firstCsvValue(headers['x-forwarded-for'] as string | undefined)
  const cfConnectingIp = String(headers['cf-connecting-ip'] || '').trim()
  const realIp = String(headers['x-real-ip'] || '').trim()
  const ip = cfConnectingIp || xForwardedFor || realIp || remoteAddress

  return {
    ip,
    source: {
      cfConnectingIp,
      xForwardedFor,
      xRealIp: realIp,
      remoteAddress
    },
    headers: {
      userAgent: String(headers['user-agent'] || '').trim(),
      acceptLanguage: String(headers['accept-language'] || '').trim(),
      secChUa: String(headers['sec-ch-ua'] || '').trim(),
      secChUaMobile: String(headers['sec-ch-ua-mobile'] || '').trim(),
      secChUaPlatform: String(headers['sec-ch-ua-platform'] || '').trim(),
      secFetchSite: String(headers['sec-fetch-site'] || '').trim(),
      secFetchMode: String(headers['sec-fetch-mode'] || '').trim(),
      referer: String(headers.referer || '').trim(),
      origin: String(headers.origin || '').trim(),
      host: String(headers.host || '').trim()
    },
    recordedAt: new Date().toISOString()
  }
}

export default defineEventHandler(async (event) => {
  // Parsing multipart/form-data
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid form data' })
  }

  let eventId = '', registrantName = '', registrantEmail = '', formDataStr = '', deviceMetaStr = ''
  let quantity = 1
  let additionalNames: string[] = []
  let paymentProofFile: any = null
  const dynamicFiles: Record<string, any> = {}

  for (const field of formData) {
    if (field.name === 'eventId') eventId = field.data.toString()
    if (field.name === 'registrantName') registrantName = field.data.toString()
    if (field.name === 'registrantEmail') registrantEmail = field.data.toString()
    if (field.name === 'formData') formDataStr = field.data.toString()
    if (field.name === 'deviceMeta') deviceMetaStr = field.data.toString()
    if (field.name === 'quantity') quantity = parseInt(field.data.toString()) || 1
    if (field.name === 'additionalNames') {
      try {
        const parsed = JSON.parse(field.data.toString())
        if (Array.isArray(parsed)) additionalNames = parsed.map(n => String(n || '').trim()).filter(Boolean)
      } catch {}
    }
    if (field.name === 'paymentProof' && field.filename) {
      paymentProofFile = field
    }
    if (field.filename && field.name?.startsWith('dynamicFile:')) {
      const questionId = field.name.split('dynamicFile:')[1]
      if (questionId) {
        dynamicFiles[questionId] = field
      }
    }
  }

  if (!eventId || !registrantName || !registrantEmail || !formDataStr) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak lengkap' })
  }

  registrantName = registrantName
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()

  try {
    const evt = await prisma.event.findUnique({ where: { id: eventId } })
    if (!evt) throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan' })

    let registrationDeadlineEnabled = false
    let registrationDeadlineAt = ''
    let paymentSettings: Array<Record<string, any>> = []
    let allowDuplicateEmail = false
    let allowDuplicateDevice = true
    let notifyEnabled = false
    let notifyEmails: string[] = []
    try {
      const parsedSchema = JSON.parse(evt.formSchema || '[]')
      if (Array.isArray(parsedSchema)) {
        const meta = parsedSchema.find((item) => item?.itemType === 'form_meta')
        const allowMultiTicket = !!meta?.allowMultiTicket
        const maxTicketsPerOrder = Number(meta?.maxTicketsPerOrder ?? 0)

        if (quantity > 1 && !allowMultiTicket) {
          throw createError({ statusCode: 400, statusMessage: 'Event ini tidak mengizinkan pembelian lebih dari 1 tiket.' })
        }

        if (allowMultiTicket && maxTicketsPerOrder > 0 && quantity > maxTicketsPerOrder) {
          throw createError({ statusCode: 400, statusMessage: `Maksimal pembelian adalah ${maxTicketsPerOrder} tiket per pesanan.` })
        }

        registrationDeadlineEnabled = !!meta?.registrationDeadlineEnabled
        registrationDeadlineAt = String(meta?.registrationDeadlineAt || '').trim()
        allowDuplicateEmail = !!meta?.allowDuplicateEmail
        allowDuplicateDevice = meta?.allowDuplicateDevice !== false
        notifyEmails = Array.isArray(meta?.notifyEmails) ? meta.notifyEmails : []
        const promoEnabled = !!meta?.promoEnabled
        const promoMinTickets = Number(meta?.promoMinTickets ?? 2)
        const promoType = String(meta?.promoType || 'free_ticket')
        const promoValue = Number(meta?.promoValue ?? 1)
        const methods: Array<Record<string, any>> = Array.isArray(meta?.paymentSettings)
          ? meta.paymentSettings as Array<Record<string, any>>
          : []
        paymentSettings = methods
          .map((method: Record<string, any>, index: number) => ({
            id: String(method?.id || `pay_${index}`),
            type: String(method?.type || 'bank_transfer'),
            label: String(method?.label || '').trim(),
            accountName: String(method?.accountName || '').trim(),
            accountNumber: String(method?.accountNumber || '').trim(),
            qrisImageUrl: String(method?.qrisImageUrl || '').trim(),
            note: String(method?.note || '').trim()
          }))
          .filter((method: Record<string, any>) => {
            if (!method.label) return false
            if (method.type === 'qris') return !!method.qrisImageUrl
            return !!method.accountName && !!method.accountNumber
          })
      }
    } catch (e: any) {
      if (e.statusCode) throw e
      registrationDeadlineEnabled = false
      registrationDeadlineAt = ''
      paymentSettings = []
      allowDuplicateDevice = true
      notifyEnabled = false
      notifyEmails = []
    }

    if (registrationDeadlineEnabled && registrationDeadlineAt) {
      const deadlineDate = new Date(registrationDeadlineAt)
      if (!Number.isNaN(deadlineDate.getTime()) && Date.now() > deadlineDate.getTime()) {
        throw createError({ statusCode: 400, statusMessage: 'Pendaftaran sudah ditutup.' })
      }
    }

    if (evt.quota !== null) {
      const currentRegistrants = await prisma.ticket.count({ where: { eventId } })
      if (currentRegistrants + quantity > evt.quota) {
        throw createError({ statusCode: 400, statusMessage: 'Kuota pendaftaran tidak mencukupi untuk jumlah tiket yang diminta' })
      }
    }

    if (!allowDuplicateEmail) {
      const existingTicket = await prisma.ticket.findFirst({
        where: { eventId, registrantEmail }
      })
      if (existingTicket) {
        throw createError({ statusCode: 400, statusMessage: 'Email ini sudah terdaftar pada event ini.' })
      }
    }

    let parsedDeviceMeta: Record<string, any> = {}
    let deviceHash = ''
    const serverDeviceMeta = collectServerDeviceMeta(event)
    try {
      const parsed = JSON.parse(deviceMetaStr || '{}')
      if (parsed && typeof parsed === 'object') {
        parsedDeviceMeta = parsed
      }
      deviceHash = String(parsedDeviceMeta?.hash || '').trim()
    } catch {
      parsedDeviceMeta = {}
      deviceHash = ''
    }

    if (!allowDuplicateDevice && deviceHash) {
      const deviceHashNeedle = `"hash":"${deviceHash}"`
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          eventId,
          formData: {
            contains: deviceHashNeedle
          }
        },
        select: { id: true }
      })

      if (existingTicket) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Perangkat ini sudah pernah mendaftar pada event ini.'
        })
      }
    }

    if (evt.requireProof && !paymentProofFile) {
      throw createError({ statusCode: 400, statusMessage: 'Bukti pembayaran (gambar) wajib dilampirkan' })
    }

    if (evt.requireProof && !paymentSettings.length) {
      throw createError({ statusCode: 400, statusMessage: 'Konfigurasi metode pembayaran belum lengkap.' })
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrantEmail.trim())) {
      throw createError({ statusCode: 400, statusMessage: 'Format Email tidak valid' })
    }

    if (quantity > 1 && additionalNames.length !== quantity - 1) {
      throw createError({ statusCode: 400, statusMessage: 'Daftar nama peserta rombongan tidak lengkap' })
    }

    let parsedFormData: Record<string, any> = {}
    try {
      const parsed = JSON.parse(formDataStr)
      if (parsed && typeof parsed === 'object') {
        parsedFormData = parsed
      }
    } catch {
      parsedFormData = {}
    }

    // Server-side validation of required fields from schema
    try {
      const schema = JSON.parse(evt.formSchema || '[]')
      if (Array.isArray(schema)) {
        const questions = schema.filter(item => item?.itemType === 'question')
        for (const q of questions) {
          if (!q.required) continue
          
          const iterations = (quantity > 1 && q.enableMulti) ? quantity : 1
          for (let pIdx = 0; pIdx < iterations; pIdx++) {
            const ansId = (quantity > 1 && q.enableMulti) ? `${q.id}_p${pIdx}` : q.id
            const val = parsedFormData[ansId]
            const pLabel = iterations > 1 ? ` (Peserta ${pIdx + 1})` : ''

            if (['short_answer', 'paragraph', 'multiple_choice', 'dropdown', 'date', 'time', 'linear_scale', 'rating'].includes(q.questionType)) {
              if (val === undefined || val === null || String(val).trim() === '') {
                throw createError({ statusCode: 400, statusMessage: `Field wajib belum diisi: ${q.label}${pLabel}` })
              }
            } else if (q.questionType === 'checkboxes') {
              if (!Array.isArray(val) || val.length === 0) {
                throw createError({ statusCode: 400, statusMessage: `Field wajib belum diisi: ${q.label}${pLabel}` })
              }
            } else if (q.questionType === 'file_upload') {
              if (!dynamicFiles[ansId] && !parsedFormData[ansId]?.fileName) {
                throw createError({ statusCode: 400, statusMessage: `File wajib diunggah: ${q.label}${pLabel}` })
              }
            } else if (q.questionType === 'multiple_choice_grid' || q.questionType === 'checkbox_grid') {
              const matrix = val || {}
              const rows = Array.isArray(q.gridRows) ? q.gridRows : (String(q.gridRowsText || '').split(/\r?\n|,/).map(s => s.trim()).filter(Boolean))
              const isAllAnswered = rows.every((row: string) => {
                const rVal = matrix[row]
                if (q.questionType === 'multiple_choice_grid') return rVal && String(rVal).trim() !== ''
                return Array.isArray(rVal) && rVal.length > 0
              })
              if (!isAllAnswered) {
                throw createError({ statusCode: 400, statusMessage: `Grid wajib diisi lengkap: ${q.label}${pLabel}` })
              }
            }
          }
        }
      }
    } catch (e: any) {
      if (e.statusCode) throw e
      console.error('Schema validation error:', e)
    }

    parsedDeviceMeta = {
      ...(parsedDeviceMeta || {}),
      server: serverDeviceMeta
    }

    parsedFormData.__deviceMeta = parsedDeviceMeta

    for (const [questionId, file] of Object.entries(dynamicFiles)) {
      if (!file?.data) continue
      if (file.data.length > 10 * 1024 * 1024) {
        throw createError({ statusCode: 400, statusMessage: `Ukuran file untuk pertanyaan ${questionId} melebihi 10MB` })
      }

      const ext = file.filename?.includes('.') ? file.filename.split('.').pop() : 'bin'
      const safeExt = String(ext || 'bin').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin'
      const uniqueDynamicName = `form_${questionId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`
      await saveEncryptedFile(file.data, uniqueDynamicName)

      parsedFormData[questionId] = {
        fileName: uniqueDynamicName,
        originalName: file.filename || `upload.${safeExt}`,
        mimeType: file.type || 'application/octet-stream',
        size: file.data.length
      }
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase()
    const allNames = [registrantName, ...additionalNames]
    
    const ticketCreationPromises = allNames.map((name, index) => {
      const formattedName = name
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()

      // Clone formData and split multi-participant answers
      const ticketFormData = { ...parsedFormData }
      for (const [key, value] of Object.entries(ticketFormData)) {
        if (key.includes('_p')) {
          const parts = key.split('_p')
          const pIdx = parseInt(parts.pop() || '-1')
          const qId = parts.join('_p')
          if (pIdx === index) {
            ticketFormData[qId] = value
          }
          delete ticketFormData[key]
        }
      }

      return prisma.ticket.create({
        data: {
          eventId,
          registrantName: formattedName,
          registrantEmail,
          formData: JSON.stringify(ticketFormData),
          paymentProofUrl: savedFileName,
          orderId
        } as any
      })
    })

    const results = await prisma.$transaction(ticketCreationPromises)
    const primaryTicket = results[0]

    if (!primaryTicket) {
      throw createError({ statusCode: 500, statusMessage: 'Gagal membuat tiket' })
    }

    if (notifyEnabled && notifyEmails.length > 0) {
      const baseUrl = resolveRequestBaseUrl(event)
      const paymentProofArg = paymentProofFile ? {
        data: paymentProofFile.data,
        filename: paymentProofFile.filename || 'payment_proof.png',
        mimeType: paymentProofFile.type || 'application/octet-stream'
      } : undefined;

      sendStaffNotificationEmail(
        notifyEmails,
        evt.name,
        eventId,
        primaryTicket.id,
        registrantName,
        registrantEmail,
        baseUrl,
        paymentProofArg,
        {
          totalTickets: results.length,
          allNames: allNames.map(n => n.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim())
        }
      ).catch((err) => {
        console.error('Failed to send staff notification email:', err)
      })
    }

    broadcastToRoom(`event:${eventId}`, { type: 'update', action: 'new_registration' })
    broadcastToRoom('global', { type: 'update', action: 'new_registration' })

    return {
      success: true,
      ticketId: primaryTicket.id,
      orderId: orderId,
      count: results.length
    }
  } catch (error: any) {
    console.error('Register Ticket Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal mendaftar' })
  }
})
