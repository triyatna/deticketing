import fs from 'node:fs/promises'
import path from 'node:path'
import { verifyToken } from '../../../utils/jwt'

const ALLOWED_CONTEXTS = new Set([
  'event-header',
  'event-background',
  'payment-qris',
  'content-image'
])

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif'
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded: any = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })
  }

  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'Form upload tidak valid.' })
  }

  let context = 'content-image'
  let filePart: any = null

  for (const part of parts) {
    if (part.name === 'context') context = String(part.data?.toString?.() || 'content-image')
    if (part.name === 'file' && part.filename) filePart = part
  }

  if (!ALLOWED_CONTEXTS.has(context)) {
    throw createError({ statusCode: 400, statusMessage: 'Context upload tidak valid.' })
  }

  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'File tidak ditemukan.' })
  }

  if (filePart.data.length > MAX_UPLOAD_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Ukuran file maksimal 4MB.' })
  }

  const mimeType = String(filePart.type || '').toLowerCase()
  if (!ALLOWED_MIME.has(mimeType)) {
    throw createError({ statusCode: 400, statusMessage: 'File harus berformat PNG, JPG, WEBP, atau GIF.' })
  }

  const extension = EXT_BY_MIME[mimeType] || 'bin'
  const safeContext = context.replace(/[^a-z0-9-]/gi, '')
  const safeName = `${safeContext}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`

  const mediaDir = path.resolve(process.cwd(), 'public', 'uploads', 'event-media')
  await fs.mkdir(mediaDir, { recursive: true })

  const absoluteFilePath = path.join(mediaDir, safeName)
  await fs.writeFile(absoluteFilePath, filePart.data)

  return {
    success: true,
    url: `/uploads/event-media/${safeName}`
  }
})
