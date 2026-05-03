import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'

const hasValidPaymentMethods = (formSchema: any[]) => {
  const schemaArray = Array.isArray(formSchema) ? formSchema : []
  const meta = schemaArray.find((item) => item?.itemType === 'form_meta') || {}
  const methods = Array.isArray(meta?.paymentSettings) ? meta.paymentSettings : []

  const validMethods = methods
    .map((method: any, index: number) => ({
      id: String(method?.id || `pay_${index}`),
      type: String(method?.type || 'bank_transfer'),
      label: String(method?.label || '').trim(),
      accountName: String(method?.accountName || '').trim(),
      accountNumber: String(method?.accountNumber || '').trim(),
      qrisImageUrl: String(method?.qrisImageUrl || '').trim(),
      nominal: String(method?.nominal || '').trim()
    }))
    .filter((method: any) => {
      if (!method.label) return false
      if (method.type === 'qris') return !!method.qrisImageUrl
      return !!method.accountName && !!method.accountNumber
    })

  return validMethods.length > 0
}

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded = verifyToken(token) as any
  if (!decoded || decoded.role === 'PETUGAS') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }


  const eventId = getRouterParam(event, 'id')
  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'ID event tidak valid.' })
  }

  const body = await readBody(event)
  const { name, description, quota, formSchema, requireProof } = body

  if (!name || !formSchema) {
    throw createError({ statusCode: 400, statusMessage: 'Nama dan Form Schema wajib diisi' })
  }

  if (requireProof && !hasValidPaymentMethods(formSchema)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Lengkapi minimal 1 metode pembayaran valid sebelum mewajibkan bukti transfer.'
    })
  }

  try {
    const targetEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true }
    })

    if (!targetEvent) {
      throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan.' })
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        name: String(name),
        description: description ? String(description) : '',
        quota: quota ? parseInt(quota) : null,
        formSchema: JSON.stringify(formSchema),
        requireProof: !!requireProof
      }
    })

    return {
      success: true,
      event: updatedEvent
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Gagal memperbarui event.'
    })
  }
})
