import prisma from '../../utils/prisma'
import bcrypt from 'bcrypt'
import { generateToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username dan Password wajib diisi' })
  }

  try {
    // @ts-ignore: Prisma client needs regeneration after server restart
    const admin = await prisma.admin.findUnique({
      where: { username }
    })

    if (!admin) {
      throw createError({ statusCode: 401, statusMessage: 'Username atau Password salah' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      throw createError({ statusCode: 401, statusMessage: 'Username atau Password salah' })
    }

    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role })

    // Set HTTP-Only Cookie
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'lax'
    })

    return {
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    }
  } catch (error: any) {
    console.error('Login Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Kesalahan server' })
  }
})
