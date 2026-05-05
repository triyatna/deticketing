import fs from 'node:fs'
import path from 'node:path'
import { resolveSqliteFilePath } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { fileName } = await readBody(event)
  if (!fileName) {
    throw createError({ statusCode: 400, statusMessage: 'Nama file backup tidak disertakan' })
  }

  // Path database aktif
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  const dbPath = resolveSqliteFilePath(dbUrl)

  // Path file backup
  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  const backupPath = path.resolve(backupDir, fileName)

  if (!fs.existsSync(backupPath)) {
    throw createError({ statusCode: 404, statusMessage: 'File backup tidak ditemukan' })
  }

  try {
    // 1. Buat backup darurat dari DB saat ini (sebelum di-overwrite)
    const timestamp = new Date().getTime()
    const emergencyBackupPath = path.resolve(backupDir, `emergency_before_restore_${timestamp}.db`)
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, emergencyBackupPath)
    }

    // 2. Overwrite DB aktif dengan backup pilihan
    fs.copyFileSync(backupPath, dbPath)

    return {
      success: true,
      message: 'Database berhasil dipulihkan dari backup. Sistem akan melakukan restart.'
    }
  } catch (err) {
    console.error('Restore Error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Gagal memulihkan database' })
  }
})
