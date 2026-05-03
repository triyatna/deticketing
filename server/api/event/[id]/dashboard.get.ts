import { defineEventHandler, getCookie, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { verifyToken } from '../../../utils/jwt'
import { checkEventAccess } from '../../../utils/checkEventAccess'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const decoded: any = verifyToken(token)
  if (!decoded) throw createError({ statusCode: 403, statusMessage: 'Akses ditolak.' })

  const eventId = event.context.params?.id
  if (!eventId) throw createError({ statusCode: 400, statusMessage: 'Event ID required' })

  try {
    const eventData = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!eventData) throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan' })

    const hasAccess = await checkEventAccess(eventId, decoded.id, decoded.role)
    if (!hasAccess) throw createError({ statusCode: 404, statusMessage: 'Event tidak ditemukan' })

    // Aggregate tickets
    const [
      totalTickets,
      approvedTickets,
      pendingTickets,
      rejectedTickets,
      masukTickets,
      keluarTickets,
      belumHadirTickets
    ] = await Promise.all([
      prisma.ticket.count({ where: { eventId } }),
      prisma.ticket.count({ where: { eventId, status: 'APPROVED' } }),
      prisma.ticket.count({ where: { eventId, status: 'PENDING' } }),
      prisma.ticket.count({ where: { eventId, status: 'REJECTED' } }),
      prisma.ticket.count({ where: { eventId, scanStatus: 'MASUK' } }),
      prisma.ticket.count({ where: { eventId, scanStatus: 'KELUAR' } }),
      prisma.ticket.count({ where: { eventId, scanStatus: 'BELUM_HADIR' } })
    ])

    // Calculate revenue
    let revenue = 0
    let isPaid = false
    try {
      const schema = JSON.parse(eventData.formSchema)
      const formMeta = Array.isArray(schema) ? schema.find((s: any) => s.itemType === 'form_meta') : {}
      if (formMeta && formMeta.paymentEnabled && formMeta.nominal) {
        isPaid = true
        revenue = approvedTickets * Number(formMeta.nominal)
      }
    } catch {
      // ignore
    }

    // Get recent registrations
    const recentTickets = await prisma.ticket.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        registrantName: true,
        registrantEmail: true,
        status: true,
        createdAt: true
      }
    })

    // Calculate 7-day trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today + 6 past days = 7 days

    const trendTickets = await prisma.ticket.findMany({
      where: { 
        eventId,
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true, scanStatus: true }
    });

    // Group by day (YYYY-MM-DD)
    const trendMap: Record<string, { total: number, belumHadir: number, masuk: number, keluar: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0] as string;
      trendMap[dateStr] = { total: 0, belumHadir: 0, masuk: 0, keluar: 0 };
    }

    trendTickets.forEach(t => {
      const dateStr = new Date(t.createdAt).toISOString().split('T')[0] as string;
      if (trendMap[dateStr] !== undefined) {
        trendMap[dateStr].total++;
        if (t.scanStatus === 'BELUM_HADIR') trendMap[dateStr].belumHadir++;
        else if (t.scanStatus === 'MASUK') trendMap[dateStr].masuk++;
        else if (t.scanStatus === 'KELUAR') trendMap[dateStr].keluar++;
      }
    });

    const trendData = {
      labels: Object.keys(trendMap).map(d => {
        const dateObj = new Date(d);
        return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      }),
      data: Object.values(trendMap).map(m => m.total),
      belumHadir: Object.values(trendMap).map(m => m.belumHadir),
      masuk: Object.values(trendMap).map(m => m.masuk),
      keluar: Object.values(trendMap).map(m => m.keluar),
    };

    return {
      success: true,
      event: {
        id: eventData.id,
        name: eventData.name,
        quota: eventData.quota,
        isPaid
      },
      metrics: {
        total: totalTickets,
        approved: approvedTickets,
        pending: pendingTickets,
        rejected: rejectedTickets,
        checkin: masukTickets,
        checkout: keluarTickets,
        notArrived: belumHadirTickets,
        revenue
      },
      recentRegistrations: recentTickets,
      trend: trendData
    }

  } catch (error: any) {
    console.error('Dashboard Stats Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal mengambil data dashboard' })
  }
})
