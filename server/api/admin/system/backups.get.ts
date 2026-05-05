import fs from 'node:fs'
import path from 'node:path'
import { verifyToken } from '../../../utils/jwt'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded: any = verifyToken(token)
  if (!decoded) throw createError({ statusCode: 401, statusMessage: 'Invalid token' })

  const admin = await prisma.admin.findUnique({ where: { id: decoded.id } })
  if (!admin || admin.role !== 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Unauthorized access' })

  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  
  if (!fs.existsSync(backupDir)) {
    return { success: true, backups: [] }
  }

  try {
    const files = fs.readdirSync(backupDir)
    const backups = files
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f))
        return {
          name: f,
          size: stats.size,
          createdAt: stats.birthtime
        }
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return {
      success: true,
      backups
    }
  } catch (err) {
    return { success: false, backups: [] }
  }
})
