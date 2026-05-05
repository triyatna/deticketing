import prisma from '../../utils/prisma'
import { verifyToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }

  const query = getQuery(event)
  const regRange = (query.range as string) || '7d'
  const eventRange = (query.eventRange as string) || '7d'

  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)

  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  try {
    const [
      totalEvents,
      totalRegistrations,
      totalApproved,
      totalPending,
      totalRejected,
      todayRegistrations,
      todayScans,
      todayCheckIns,
      todayCheckOuts,
      allEventsRaw,
      recentRegistrations,
      recentScans,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'APPROVED' } }),
      prisma.ticket.count({ where: { status: 'PENDING' } }),
      prisma.ticket.count({ where: { status: 'REJECTED' } }),
      prisma.ticket.count({ where: { createdAt: { gte: startToday } } }),
      prisma.scanLog.count({ where: { scannedAt: { gte: startToday } } }),
      prisma.scanLog.count({ where: { scannedAt: { gte: startToday }, action: 'MASUK' } }),
      prisma.scanLog.count({ where: { scannedAt: { gte: startToday }, action: 'KELUAR' } }),
      prisma.event.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          quota: true,
          formSchema: true,
          createdAt: true,
          _count: { select: { tickets: true } },
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ticket.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          registrantName: true,
          registrantEmail: true,
          status: true,
          scanStatus: true,
          createdAt: true,
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.scanLog.findMany({
        take: 6,
        orderBy: { scannedAt: 'desc' },
        select: {
          id: true,
          action: true,
          scannedAt: true,
          scannedBy: true,
          ticket: {
            select: {
              id: true,
              registrantName: true,
              event: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ])

    // Calculate Upcoming Events
    const now = new Date()
    const upcomingEvents = allEventsRaw.filter(evt => {
      try {
        if (!evt.formSchema) return false
        const schema = JSON.parse(evt.formSchema)
        if (!Array.isArray(schema)) return false
        const meta = schema.find((i: any) => i.itemType === 'form_meta')
        if (meta?.eventDate) {
          const evtDate = new Date(meta.eventDate)
          return evtDate >= now
        }
        return false
      } catch {
        return false
      }
    }).map(evt => ({
      id: evt.id,
      name: evt.name,
      slug: evt.slug,
      totalTickets: evt._count?.tickets || 0
    }))

    // 1. Calculate Registration Trend (Per Event)
    const regLabels: string[] = []
    const eventDatasets: { name: string, data: number[] }[] = []
    
    let regDays = 7
    if (regRange === '30d') regDays = 30
    else if (regRange === '1y') regDays = 12

    const regAgo = new Date(startToday)
    if (regRange === '1y') {
      regAgo.setMonth(regAgo.getMonth() - 11)
      regAgo.setDate(1)
    } else {
      regAgo.setDate(regAgo.getDate() - (regDays - 1))
    }

    const trendRaw = await prisma.ticket.findMany({
      where: { createdAt: { gte: regAgo } },
      select: {
        createdAt: true,
        event: { select: { name: true } }
      }
    })

    // Use names of active events for datasets to ensure all events show up
    const activeEventNames = [...new Set(allEventsRaw.map(e => e.name))]
    activeEventNames.forEach(name => {
      eventDatasets.push({ name, data: [] })
    })

    const days: Date[] = []
    if (regRange === '1y') {
      for (let i = 0; i < 12; i++) {
        const d = new Date(regAgo)
        d.setMonth(d.getMonth() + i)
        regLabels.push(d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }))
        
        eventDatasets.forEach(ds => {
          const count = trendRaw.filter(t => {
            if (!t.event?.name || t.event.name !== ds.name) return false
            const tDate = new Date(t.createdAt)
            return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear()
          }).length
          ds.data.push(count)
        })
      }
    } else {
      // Create exactly 'regDays' labels ending today
      for (let i = regDays - 1; i >= 0; i--) {
        const d = new Date(startToday)
        d.setDate(d.getDate() - i)
        days.push(d)
        regLabels.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
      }

      days.forEach(d => {
        const dStr = getLocalDateString(d)
        eventDatasets.forEach(ds => {
          const count = trendRaw.filter(t => {
            if (!t.event?.name || t.event.name !== ds.name) return false
            return getLocalDateString(new Date(t.createdAt)) === dStr
          }).length
          ds.data.push(count)
        })
      })
    }

    // 2. Calculate Event Trend
    const eventLabels: string[] = []
    const eventTrendData: number[] = []
    const eventTrendNames: string[][] = []
    let evDays = 7
    if (eventRange === '30d') evDays = 30
    if (eventRange === '1y') evDays = 12

    if (eventRange === '1y') {
      const yearAgo = new Date()
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      yearAgo.setDate(1)
      yearAgo.setHours(0, 0, 0, 0)

      for (let i = 0; i < 12; i++) {
        const d = new Date(yearAgo)
        d.setMonth(d.getMonth() + i)
        eventLabels.push(d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }))
        
        const matches = allEventsRaw.filter(evt => {
          try {
            if (!evt.formSchema) return false
            const schema = JSON.parse(evt.formSchema)
            if (!Array.isArray(schema)) return false
            const meta = schema.find((item: any) => item.itemType === 'form_meta')
            if (meta?.eventDate) {
              const evtDate = new Date(meta.eventDate)
              return evtDate.getMonth() === d.getMonth() && evtDate.getFullYear() === d.getFullYear()
            }
            return false
          } catch { return false }
        })
        eventTrendData.push(matches.length)
        eventTrendNames.push(matches.map(m => m.name))
      }
    } else {
      for (let i = evDays - 1; i >= 0; i--) {
        const d = new Date(startToday)
        d.setDate(d.getDate() - i)
        eventLabels.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
        
        const dStr = getLocalDateString(d)
        const matches = allEventsRaw.filter(evt => {
          try {
            if (!evt.formSchema) return false
            const schema = JSON.parse(evt.formSchema)
            if (!Array.isArray(schema)) return false
            const meta = schema.find((item: any) => item.itemType === 'form_meta')
            if (meta?.eventDate) {
              return getLocalDateString(new Date(meta.eventDate)) === dStr
            }
            return false
          } catch { return false }
        })
        eventTrendData.push(matches.length)
        eventTrendNames.push(matches.map(m => m.name))
      }
    }

    return {
      success: true,
      summary: {
        totalEvents,
        totalRegistrations,
        totalApproved,
        totalPending,
        totalRejected,
        todayRegistrations,
        todayScans,
        todayCheckIns,
        todayCheckOuts,
        upcomingCount: upcomingEvents.length
      },
      trend: {
        labels: regLabels,
        eventDatasets: eventDatasets
      },
      eventTrend: {
        labels: eventLabels,
        data: eventTrendData,
        names: eventTrendNames
      },
      recentEvents: allEventsRaw.slice(0, 5).map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        quota: item.quota,
        createdAt: item.createdAt,
        totalTickets: item._count.tickets,
      })),
      upcomingEvents: upcomingEvents.slice(0, 5),
      recentRegistrations,
      recentScans,
      user: {
        id: (decoded as any).id,
        role: (decoded as any).role,
      },
      generatedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error('[Dashboard API Error]:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Gagal memuat data dashboard. Pastikan database sudah terinisialisasi.',
    })
  }
})

