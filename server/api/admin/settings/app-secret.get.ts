import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'
import { decryptSettingValue, isEncryptedSettingValue } from '../../../utils/settingsCrypto'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'OWNER') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak. Hanya Owner.' })
  }


  try {
    // @ts-ignore: Prisma client needs regeneration
    const setting = await prisma.setting.findUnique({
      where: { key: 'APP_SECRET' },
      select: { value: true },
    })

    const rawValue = String(setting?.value || '').trim()
    if (!rawValue) {
      throw createError({ statusCode: 404, statusMessage: 'App secret belum tersedia.' })
    }

    const secret = isEncryptedSettingValue(rawValue)
      ? decryptSettingValue(rawValue)
      : rawValue

    if (!String(secret || '').trim()) {
      throw createError({ statusCode: 404, statusMessage: 'App secret belum tersedia.' })
    }

    return {
      success: true,
      secret: String(secret).trim(),
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Gagal mengambil app secret.' })
  }
})

