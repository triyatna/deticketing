import { defineEventHandler, getCookie, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import bcrypt from 'bcrypt'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  // Role verification
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded: any = verifyToken(token)
  if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'OWNER')) {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const body = await readBody(event)
  const { username, password, name, role, email } = body

  if (decoded.role === 'ADMIN' && (role === 'OWNER' || role === 'ADMIN')) {
    throw createError({ statusCode: 403, statusMessage: 'Admin hanya bisa menambahkan role Panitia atau Petugas.' })
  }



  if (!username || !password || !name || !email) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak lengkap. Email wajib diisi.' })
  }

  try {
    const existingUsername = await prisma.admin.findUnique({ where: { username } })
    if (existingUsername) {
      throw createError({ statusCode: 400, statusMessage: 'Username sudah terpakai' })
    }

    const existingEmail = await prisma.admin.findFirst({ where: { email } })
    if (existingEmail) {
      throw createError({ statusCode: 400, statusMessage: 'Email sudah terpakai' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    if (role === 'OWNER') {
      throw createError({ statusCode: 403, statusMessage: 'Role Owner hanya bisa ada satu di sistem.' })
    }

    const allowedRoles = ['PANITIA', 'PETUGAS']
    if (decoded.role === 'OWNER') allowedRoles.push('ADMIN')
    
    const finalRole = allowedRoles.includes(role) ? role : 'PETUGAS'


    const newStaff = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role: finalRole
      },
      select: { id: true, username: true, email: true, name: true, role: true }
    })


    return { success: true, staff: newStaff }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal membuat staff' })
  }

})
