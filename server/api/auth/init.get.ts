import prisma from '../../utils/prisma'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  try {
    // @ts-ignore: Prisma client needs regeneration after server restart
    const adminCount = await prisma.admin.count()
    
    if (adminCount > 0) {
      return { success: false, message: 'Admin already initialized' }
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // @ts-ignore: Prisma client needs regeneration after server restart
    await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN'
      }
    })

    return {
      success: true,
      message: 'Default admin created. Username: admin | Password: admin123'
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to initialize admin' })
  }
})
