import bcrypt from 'bcrypt'
import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded = verifyToken(token)
  if (!decoded || !decoded.id) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }

  const body = await readBody(event)
  const { password } = body

  if (!password) {
    throw createError({ statusCode: 400, statusMessage: 'Password is required' })
  }

  const admin = await prisma.admin.findUnique({ where: { id: decoded.id } })
  if (!admin) {
    throw createError({ statusCode: 404, statusMessage: 'Admin not found' })
  }

  const isValid = await bcrypt.compare(password, admin.password)
  if (!isValid) {
    throw createError({ statusCode: 403, statusMessage: 'Password salah. Konfirmasi gagal.' })
  }

  return {
    success: true,
    message: 'Konfirmasi berhasil'
  }
})
