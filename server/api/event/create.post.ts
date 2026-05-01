import prisma from '../../utils/prisma'

const randomChars = (length = 10) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * alphabet.length)
    out += alphabet[idx]
  }
  return out
}

const slugifyEventName = (value: string) => {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, description, quota, formSchema, requireProof } = body

  if (!name || !formSchema) {
    throw createError({ statusCode: 400, statusMessage: 'Nama dan Form Schema wajib diisi' })
  }

  if (requireProof) {
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

    if (!validMethods.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Lengkapi minimal 1 metode pembayaran valid sebelum mewajibkan bukti transfer.'
      })
    }
  }

  const baseSlug = slugifyEventName(String(name || '')) || 'event'

  let slug = ''
  for (let i = 0; i < 8; i += 1) {
    const candidate = `${baseSlug}${randomChars(10)}`
    const exists = await prisma.event.findUnique({ where: { slug: candidate } })
    if (!exists) {
      slug = candidate
      break
    }
  }

  if (!slug) {
    slug = `${baseSlug}${Date.now().toString(36)}`
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        name,
        slug,
        description,
        quota: quota ? parseInt(quota) : null,
        formSchema: JSON.stringify(formSchema),
        requireProof: !!requireProof
      }
    })

    return {
      success: true,
      event: newEvent
    }
  } catch (error) {
    console.error('Create Event Error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat event' })
  }
})
