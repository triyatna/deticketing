import prisma from '../../utils/prisma'
import { saveEncryptedFile } from '../../utils/fileCrypto'
import { sendStaffNotificationEmail } from '../../utils/mailer'
import { resolveRequestBaseUrl } from '../../utils/requestBaseUrl'

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
  let paymentProofFile: any = null
  const dynamicFiles: Record<string, any> = {}

  for (const field of formData) {
    if (field.name === 'eventId') eventId = field.data.toString()
    if (field.name === 'registrantName') registrantName = field.data.toString()
    if (field.name === 'registrantEmail') registrantEmail = field.data.toString()
    if (field.name === 'formData') formDataStr = field.data.toString()
    if (field.name === 'deviceMeta') deviceMetaStr = field.data.toString()
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
        registrationDeadlineEnabled = !!meta?.registrationDeadlineEnabled
        registrationDeadlineAt = String(meta?.registrationDeadlineAt || '').trim()
        allowDuplicateEmail = !!meta?.allowDuplicateEmail
        allowDuplicateDevice = meta?.allowDuplicateDevice !== false
        notifyEnabled = !!meta?.notifyEnabled
        notifyEmails = Array.isArray(meta?.notifyEmails) ? meta.notifyEmails : []
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
    } catch {
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
      if (currentRegistrants >= evt.quota) {
        throw createError({ statusCode: 400, statusMessage: 'Kuota pendaftaran telah penuh' })
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

    let parsedFormData: Record<string, any> = {}
    try {
      const parsed = JSON.parse(formDataStr)
      if (parsed && typeof parsed === 'object') {
        parsedFormData = parsed
      }
    } catch {
      parsedFormData = {}
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

    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        registrantName,
        registrantEmail,
        formData: JSON.stringify(parsedFormData),
        paymentProofUrl: savedFileName // Reusing this field to store the local filename
      }
    })

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
        ticket.id,
        registrantName,
        registrantEmail,
        baseUrl,
        paymentProofArg
      ).catch((err) => {
        console.error('Failed to send staff notification email:', err)
      })
    }

    return {
      success: true,
      ticketId: ticket.id
    }
  } catch (error: any) {
    console.error('Register Ticket Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal mendaftar' })
  }
})
