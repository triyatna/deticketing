import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  // Role verification
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded: any = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak. Hanya Admin Utama (Owner).' })
  }

  try {
    const owner = await prisma.admin.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    })

    const staffList = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    const mappedStaff = staffList.map((staff) => ({
      ...staff,
      isOwner: owner ? staff.id === owner.id : false,
      isCurrentUser: staff.id === decoded.id
    }))

    return { success: true, staff: mappedStaff }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal memuat data staff' })
  }
})
