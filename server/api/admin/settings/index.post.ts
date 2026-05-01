import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const body = await readBody(event)
  const settings = body.settings // Expecting Record<string, string>

  if (!settings || typeof settings !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid settings format' })
  }

  try {
    const isInternalSecretKey = (key: string) => {
      return key === 'APP_SECRET' || key.startsWith('EVENT_QR_SECRET:')
    }
    const plainEntries = Object.entries(settings).filter(([key]) => key !== 'APP_SECRET_CONFIGURED')

    const transaction = plainEntries
      .filter(([key]) => !isInternalSecretKey(String(key || '')))
      .map(([key, value]) => {
        // @ts-ignore: Prisma client needs regeneration
        return prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        })
      })

    await prisma.$transaction(transaction)

    return {
      success: true,
      message: 'Pengaturan berhasil disimpan'
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan pengaturan' })
  }
})
