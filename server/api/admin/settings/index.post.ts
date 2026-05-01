import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const settings = body.settings // Expecting Record<string, string>

  if (!settings || typeof settings !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid settings format' })
  }

  try {
    const transaction = Object.entries(settings).map(([key, value]) => {
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
