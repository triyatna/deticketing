import { defineEventHandler, getCookie, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded = verifyToken(token)
  if (!decoded) throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })

  const staff = await prisma.admin.findMany({
    where: { 
      email: { not: null },
      role: { not: 'PETUGAS' }
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: 'asc' }
  })

  return { success: true, staff }
})
