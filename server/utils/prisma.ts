import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

const normalizeDbUrl = (value: string) => {
  return String(value || '').trim()
}

const ensureDatabaseUrl = () => {
  const existing = normalizeDbUrl(process.env.DATABASE_URL || '')
  if (existing) return existing

  const cwd = process.cwd()
  const candidates = [
    { filePath: path.resolve(cwd, 'prisma', 'dev.db'), url: 'file:./prisma/dev.db' },
    { filePath: path.resolve(cwd, 'dev.db'), url: 'file:./dev.db' }
  ]

  const found = candidates.find((candidate) => fs.existsSync(candidate.filePath))
  const resolved = found?.url || 'file:./prisma/dev.db'

  process.env.DATABASE_URL = resolved
  return resolved
}

ensureDatabaseUrl()

const prisma = new PrismaClient()

export default prisma
