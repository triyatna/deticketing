import fs from 'node:fs'
import path from 'node:path'
import { resolveSqliteFilePath } from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded: any = verifyToken(token)
  if (!decoded) throw createError({ statusCode: 401, statusMessage: 'Invalid token' })

  const admin = await prisma.admin.findUnique({ where: { id: decoded.id } })
  if (!admin || admin.role !== 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Akses ditolak' })

  const query = getQuery(event)
  const fileName = query.fileName as string
  
  let targetPath = ''
  let downloadName = ''

  if (fileName) {
    // Download specific backup
    const backupDir = path.resolve(process.cwd(), 'data', 'backups')
    targetPath = path.resolve(backupDir, fileName)
    downloadName = fileName
  } else {
    // Download current active database
    const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
    targetPath = resolveSqliteFilePath(dbUrl)
    downloadName = `database_active_${new Date().toISOString().split('T')[0]}.db`
  }

  if (!targetPath || !fs.existsSync(targetPath)) {
    throw createError({ statusCode: 404, statusMessage: 'File tidak ditemukan' })
  }

  const stats = fs.statSync(targetPath)
  
  setHeaders(event, {
    'Content-Type': 'application/x-sqlite3',
    'Content-Disposition': `attachment; filename="${downloadName}"`,
    'Content-Length': stats.size.toString()
  })

  return fs.createReadStream(targetPath)
})
