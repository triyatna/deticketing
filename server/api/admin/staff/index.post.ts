import { defineEventHandler, getCookie, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import bcrypt from 'bcrypt'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  // Role verification
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const body = await readBody(event)
  const { username, password, name, role } = body

  if (!username || !password || !name) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak lengkap' })
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { username } })
    if (existing) {
      throw createError({ statusCode: 400, statusMessage: 'Username sudah terpakai' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newStaff = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role === 'ADMIN' ? 'ADMIN' : 'PANITIA'
      },
      select: { id: true, username: true, name: true, role: true }
    })

    return { success: true, staff: newStaff }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal membuat staff' })
  }
})
