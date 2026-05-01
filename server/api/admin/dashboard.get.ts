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

  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)

  try {
    const [
      totalEvents,
      totalRegistrations,
      totalApproved,
      totalPending,
      todayRegistrations,
      todayScans,
      todayCheckIns,
      todayCheckOuts,
      recentEvents,
      recentRegistrations,
      recentScans,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'APPROVED' } }),
      prisma.ticket.count({ where: { status: 'PENDING' } }),
      prisma.ticket.count({ where: { createdAt: { gte: startToday } } }),
      prisma.scanLog.count({ where: { scannedAt: { gte: startToday } } }),
      prisma.scanLog.count({ where: { scannedAt: { gte: startToday }, action: 'MASUK' } }),
      prisma.scanLog.count({ where: { scannedAt: { gte: startToday }, action: 'KELUAR' } }),
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          quota: true,
          requireProof: true,
          createdAt: true,
          _count: { select: { tickets: true } },
        },
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

    return {
      success: true,
      summary: {
        totalEvents,
        totalRegistrations,
        totalApproved,
        totalPending,
        todayRegistrations,
        todayScans,
        todayCheckIns,
        todayCheckOuts,
      },
      recentEvents: recentEvents.map((item) => ({
        ...item,
        totalTickets: item._count.tickets,
      })),
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

