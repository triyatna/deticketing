import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  try {
    // @ts-ignore: Prisma client needs regeneration
    const settings = await prisma.setting.findMany()
    const isInternalSecretKey = (key: string) => {
      return key === 'APP_SECRET' || key.startsWith('EVENT_QR_SECRET:')
    }
    const settingsMap = settings.reduce((acc: Record<string, string>, s: any) => {
      if (isInternalSecretKey(String(s.key || ''))) return acc
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)
    const hasAppSecret = settings.some((s: any) => s.key === 'APP_SECRET' && String(s.value || '').trim() !== '')
    
    return {
      success: true,
      settings: {
        ...settingsMap,
        APP_SECRET: '',
        APP_SECRET_CONFIGURED: hasAppSecret ? 'true' : 'false',
      }
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch settings' })
  }
})
