import prisma from '../../utils/prisma'
import bcrypt from 'bcrypt'
import { generateToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = String(body?.username || '').trim()
  const name = String(body?.name || '').trim()
  const password = String(body?.password || '')
  const confirmPassword = String(body?.confirmPassword || '')

  if (!username || !name || !password || !confirmPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Semua field wajib diisi.' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password minimal 8 karakter.' })
  }

  if (password !== confirmPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Konfirmasi password tidak cocok.' })
  }

  try {
    const owner = await prisma.admin.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (owner) {
      throw createError({ statusCode: 409, statusMessage: 'Owner sudah tersedia. Setup tidak dapat dilakukan lagi.' })
    }

    const existing = await prisma.admin.findUnique({
      where: { username }
    })
    if (existing) {
      throw createError({ statusCode: 400, statusMessage: 'Username sudah digunakan.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const created = await prisma.admin.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role: 'ADMIN'
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true
      }
    })

    const token = generateToken({
      id: created.id,
      username: created.username,
      role: created.role
    })

    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/',
      sameSite: 'strict'
    })

    return {
      success: true,
      message: 'Owner berhasil dibuat.',
      user: created
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Gagal membuat owner'
    })
  }
})

