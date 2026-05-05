import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async () => {
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
