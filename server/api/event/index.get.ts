import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    const token = getCookie(event, 'auth_token')
    const decoded: any = token ? verifyToken(token) : null

    const allEvents = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        quota: true,
        requireProof: true,
        createdByName: true,
        createdAt: true,
        formSchema: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    let events = allEvents

    if (decoded && (decoded.role === 'PANITIA' || decoded.role === 'PETUGAS')) {
      events = allEvents.filter(ev => {
        try {
          const schema = JSON.parse(ev.formSchema || '[]')
          const meta = schema.find((i: any) => i?.itemType === 'form_meta') || {}
          if (!meta.assignmentEnabled) return true
          const ids: string[] = Array.isArray(meta.assignedStaffIds) ? meta.assignedStaffIds : []
          return ids.includes(decoded.id)
        } catch {
          return true
        }
      })
    }

    const safeEvents = events.map(({ formSchema: _, ...rest }) => rest)

    return {
      success: true,
      events: safeEvents,
      user: decoded ? { id: decoded.id, role: decoded.role } : null
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch events'
    })
  }
})

