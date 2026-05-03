import prisma from '../../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const owner = await prisma.admin.findFirst({
      where: { role: 'OWNER' },
      select: { id: true }
    })

    return {
      success: true,
      ownerExists: !!owner
    }
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'Gagal memeriksa status setup owner' })
  }
})

