import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded || decoded.role === 'PETUGAS') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  try {
    const staff = await prisma.admin.findMany({
      where: {
        role: { in: ['PANITIA', 'PETUGAS'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    })

    return { success: true, staff }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message || 'Gagal memuat daftar staff' })
  }
})
