import prisma from '../../../../utils/prisma'

type DeviceStatusCacheEntry = {
  blocked: boolean
  expiresAt: number
}

const DEVICE_STATUS_CACHE_TTL_MS = 30 * 1000
const deviceStatusCache = new Map<string, DeviceStatusCacheEntry>()

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug required' })
  }

  const body = await readBody(event)
  const deviceHash = String(body?.deviceHash || '').trim()
  if (!deviceHash) {
    return { success: true, blocked: false }
  }

  try {
    const ev = await prisma.event.findUnique({
      where: { slug },
      select: { id: true, formSchema: true }
    })

    if (!ev) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    let allowDuplicateDevice = true
    try {
      const parsed = JSON.parse(ev.formSchema || '[]')
      if (Array.isArray(parsed)) {
        const meta = parsed.find((item) => item?.itemType === 'form_meta') || {}
        allowDuplicateDevice = meta?.allowDuplicateDevice !== false
      }
    } catch {
      allowDuplicateDevice = true
    }

    if (allowDuplicateDevice) {
      return { success: true, blocked: false }
    }

    const cacheKey = `${ev.id}:${deviceHash}`
    const now = Date.now()
    const cached = deviceStatusCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return {
        success: true,
        blocked: cached.blocked
      }
    }

    const deviceHashNeedle = `"hash":"${deviceHash}"`
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        eventId: ev.id,
        formData: {
          contains: deviceHashNeedle
        }
      },
      select: { id: true }
    })
    const blocked = !!existingTicket
    deviceStatusCache.set(cacheKey, {
      blocked,
      expiresAt: now + DEVICE_STATUS_CACHE_TTL_MS
    })

    return {
      success: true,
      blocked
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Server error'
    })
  }
})
