import { defineEventHandler, getCookie, createError, getRouterParam } from 'h3'
import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  // Role verification
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER')) {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const staffId = getRouterParam(event, 'id')
  if (!staffId) throw createError({ statusCode: 400, statusMessage: 'ID dibutuhkan' })

  // Prevent self-deletion
  if (String(staffId) === String(decoded.id)) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak bisa menghapus akun Anda sendiri.' })
  }

  try {
    const target = await prisma.admin.findUnique({ where: { id: staffId } })
    if (!target) throw createError({ statusCode: 404, statusMessage: 'Staff tidak ditemukan' })

    const roleHierarchy: any = { OWNER: 4, ADMIN: 3, PANITIA: 2, PETUGAS: 1 }

    if (target.role === 'OWNER') {
       throw createError({ statusCode: 400, statusMessage: 'Akun Owner tidak dapat dihapus.' })
    }

    if (decoded.role === 'ADMIN' && roleHierarchy[target.role] >= 3) {
      throw createError({ statusCode: 403, statusMessage: 'Admin tidak bisa menghapus Admin lain atau Owner.' })
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
