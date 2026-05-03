import { defineEventHandler, getCookie, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  // Role verification
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded: any = verifyToken(token)
  if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER')) {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak. Hanya Admin atau Owner.' })
  }


  try {
    const owner = await prisma.admin.findFirst({
      where: { role: { in: ['OWNER', 'ADMIN'] } },
      orderBy: [
        { role: 'asc' }, // OWNER will come before ADMIN if sorted alphabetically? No.
        { createdAt: 'asc' }
      ],
      select: { id: true, role: true }
    })

    const staffList = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    const mappedStaff = staffList.map((staff) => {
      const isOwner = staff.role === 'OWNER' || (owner && staff.id === owner.id);
      return {
        ...staff,
        isOwner,
        isCurrentUser: String(staff.id) === String(decoded.id)
      }
    })


    return { success: true, staff: mappedStaff }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal memuat data staff' })
  }
})
