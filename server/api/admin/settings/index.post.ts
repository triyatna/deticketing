import prisma from '../../../utils/prisma'
import { encryptSettingValue } from '../../../utils/settingsCrypto'
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
    const plainEntries = Object.entries(settings).filter(([key]) => key !== 'APP_SECRET_CONFIGURED')
    const appSecretRaw = String(settings.APP_SECRET || '').trim()

    const transaction = plainEntries
      .filter(([key]) => key !== 'APP_SECRET')
      .map(([key, value]) => {
        // @ts-ignore: Prisma client needs regeneration
        return prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        })
      })

    if (appSecretRaw) {
      const encryptedSecret = encryptSettingValue(appSecretRaw)
      // @ts-ignore: Prisma client needs regeneration
      transaction.push(prisma.setting.upsert({
        where: { key: 'APP_SECRET' },
        update: { value: encryptedSecret },
        create: { key: 'APP_SECRET', value: encryptedSecret }
      }))
      process.env.APP_SECRET = appSecretRaw
    }

    await prisma.$transaction(transaction)

    return {
      success: true,
      message: 'Pengaturan berhasil disimpan'
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan pengaturan' })
  }
})
