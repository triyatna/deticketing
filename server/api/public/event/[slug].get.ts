import prisma from '../../../utils/prisma'

type PublicEventCacheEntry = {
  data: any
  expiresAt: number
}

const PUBLIC_EVENT_CACHE_TTL_MS = 5 * 1000
const publicEventCache = new Map<string, PublicEventCacheEntry>()

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug required' })
  }

  try {
    const now = Date.now()
    const cached = publicEventCache.get(slug)
    if (cached && cached.expiresAt > now) {
      return cached.data
    }

    const ev = await prisma.event.findUnique({
      where: { slug }
    })

    if (!ev) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    let availableQuota = null
    if (ev.quota !== null) {
      const ticketsCount = await prisma.ticket.count({ where: { eventId: ev.id } })
      availableQuota = ev.quota - ticketsCount
    }

    const response = {
      success: true,
      event: {
        id: ev.id,
        name: ev.name,
        description: ev.description,
        formSchema: ev.formSchema,
        requireProof: ev.requireProof,
        quota: ev.quota
      },
      availableQuota
    }

    publicEventCache.set(slug, {
      data: response,
      expiresAt: now + PUBLIC_EVENT_CACHE_TTL_MS
    })

    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Server error'
    })
  }
})
