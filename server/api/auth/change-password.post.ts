import prisma from '../../utils/prisma'
import bcrypt from 'bcrypt'
import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded) throw createError({ statusCode: 401, statusMessage: 'Invalid token' })

  const body = await readBody(event)
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak lengkap' })
  }

  try {
    const user = await prisma.admin.findUnique({ where: { id: decoded.id } })
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Akun tidak ditemukan' })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      throw createError({ statusCode: 400, statusMessage: 'Password lama Anda salah' })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await prisma.admin.update({
      where: { id: decoded.id },
      data: { password: hashedNewPassword }
    })

    return { success: true, message: 'Password berhasil diperbarui.' }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal mengubah password' })
  }
})
