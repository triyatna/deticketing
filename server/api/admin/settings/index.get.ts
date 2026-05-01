import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // @ts-ignore: Prisma client needs regeneration
    const settings = await prisma.setting.findMany()
    const settingsMap = settings.reduce((acc: Record<string, string>, s: any) => { acc[s.key] = s.value; return acc }, {} as Record<string, string>)
    
    return {
      success: true,
      settings: settingsMap
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch settings' })
  }
})
