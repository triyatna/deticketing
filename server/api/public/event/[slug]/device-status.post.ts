import prisma from '../../../../utils/prisma'

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

    const tickets = await prisma.ticket.findMany({
      where: { eventId: ev.id },
      select: { formData: true }
    })

    const blocked = tickets.some((ticket) => {
      try {
        const parsed = JSON.parse(ticket.formData || '{}')
        const existingHash = String(parsed?.__deviceMeta?.hash || '').trim()
        return existingHash && existingHash === deviceHash
      } catch {
        return false
      }
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
