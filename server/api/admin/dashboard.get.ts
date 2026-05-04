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
  const range = (query.range as string) || '7d'

  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)

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
        const schema = JSON.parse(evt.formSchema)
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
      totalTickets: evt._count.tickets
    }))

    // Fetch Trend Data
    let daysToFetch = 7
    if (range === '30d') daysToFetch = 30
    if (range === '1y') daysToFetch = 12 // Months for 1 year

    const trendLabels: string[] = []
    const trendData: number[] = []

    if (range === '1y') {
      const yearAgo = new Date()
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      yearAgo.setDate(1)
      yearAgo.setHours(0, 0, 0, 0)

      const trendRaw = await prisma.ticket.findMany({
        where: { createdAt: { gte: yearAgo } },
        select: { createdAt: true }
      })

      for (let i = 0; i < 12; i++) {
        const d = new Date(yearAgo)
        d.setMonth(d.getMonth() + i)
        const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
        trendLabels.push(label)

        const count = trendRaw.filter(t => {
          const tDate = new Date(t.createdAt)
          return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear()
        }).length
        trendData.push(count)
      }
    } else {
      const ago = new Date()
      ago.setDate(ago.getDate() - (daysToFetch - 1))
      ago.setHours(0, 0, 0, 0)

      const trendRaw = await prisma.ticket.findMany({
        where: { createdAt: { gte: ago } },
        select: { createdAt: true }
      })

      for (let i = 0; i < daysToFetch; i++) {
        const d = new Date(ago)
        d.setDate(d.getDate() + i)
        const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        trendLabels.push(dateStr)
        
        const count = trendRaw.filter(t => {
          const tDate = new Date(t.createdAt)
          return tDate.getDate() === d.getDate() && tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear()
        }).length
        trendData.push(count)
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
        labels: trendLabels,
        data: trendData
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
        id: decoded.id,
        role: decoded.role,
      },
      generatedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Gagal memuat data dashboard',
    })
  }
})

