import prisma from '../../../utils/prisma'
import bcrypt from 'bcrypt'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const id = event.context.params?.id
  const body = await readBody(event)
  const { password } = body

  if (!password) {
    throw createError({ statusCode: 400, statusMessage: 'Password baru wajib diisi' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.admin.update({
      where: { id: Number(id) },
      data: { password: hashedPassword }
    })

    return { success: true, message: 'Password staff berhasil diperbarui.' }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal memperbarui password' })
  }
})
