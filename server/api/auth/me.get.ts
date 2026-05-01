import { verifyToken } from '../../utils/jwt'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded: any = verifyToken(token)
  if (!decoded) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }

  try {
    // @ts-ignore: Prisma client needs regeneration after server restart
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, name: true, role: true }
    })

    if (!admin) {
      throw createError({ statusCode: 401, statusMessage: 'User not found' })
    }

    return {
      success: true,
      user: admin
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
