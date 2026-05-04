import { defineEventHandler, getCookie, createError } from 'h3'
import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded: any = verifyToken(token)
  if (!decoded) throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })

  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      formSchema: true
    }
  })

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const activeEvents = events.filter(e => {
    try {
      const schema = JSON.parse(e.formSchema)
      const meta = Array.isArray(schema) ? schema.find((s: any) => s.itemType === 'form_meta') : {}
      
      const eventDate = meta?.eventDate ? new Date(meta.eventDate) : null
      const eventEndDate = meta?.eventEndDate ? new Date(meta.eventEndDate) : eventDate

      if (!eventEndDate) return true 

      const endLimit = new Date(eventEndDate)
      endLimit.setHours(23, 59, 59, 999)
      return endLimit >= now
    } catch {
      return true
    }
  })

  return {
    success: true,
    events: activeEvents.map(e => ({
      id: e.id,
      name: e.name,
      slug: e.slug
    }))
  }
})
