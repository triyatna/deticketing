import fs from 'node:fs'
import path from 'node:path'
import { resolveSqliteFilePath } from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Manual verification of OWNER role for safety
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded: any = verifyToken(token)
  if (!decoded) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  const user = await prisma.admin.findUnique({ where: { id: decoded.id } })
  if (!user || user.role !== 'OWNER') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak: Hanya OWNER yang dapat mengelola backup' })
  }

  // Get current DB path from environment or default
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  const dbPath = resolveSqliteFilePath(dbUrl)

  if (!dbPath || !fs.existsSync(dbPath)) {
    throw createError({ statusCode: 404, statusMessage: 'File database tidak ditemukan untuk di-backup' })
  }

  // Create backup directory in /data/backups
  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  // Generate backup filename with timestamp
  const now = new Date()
  const timestamp = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  
  const backupFileName = `backup_manual_${timestamp}.db`
  const backupPath = path.resolve(backupDir, backupFileName)

  try {
    // Copy the file
    fs.copyFileSync(dbPath, backupPath)
    
    return {
      success: true,
      message: `Backup berhasil dibuat: ${backupFileName}`,
      path: backupFileName
    }
  } catch (err) {
    console.error('Backup Error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyalin file database' })
  }
})
