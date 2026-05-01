import { defineEventHandler, getCookie, createError, getRouterParam } from 'h3'
import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  // Role verification
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const staffId = getRouterParam(event, 'id')
  if (!staffId) throw createError({ statusCode: 400, statusMessage: 'ID dibutuhkan' })

  // Prevent self-deletion
  if (staffId === decoded.id) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak bisa menghapus akun Anda sendiri' })
  }

  try {
    const owner = await prisma.admin.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    })

    if (owner && staffId === owner.id) {
      throw createError({ statusCode: 400, statusMessage: 'Akun Owner tidak dapat dihapus.' })
    }

    await prisma.admin.delete({ where: { id: staffId } })
    return { success: true, message: 'Staff berhasil dihapus' }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Gagal menghapus staff'
    })
  }
})
