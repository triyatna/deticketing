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
      prisma.ticket.count({ where: { eventId, scanStatus: 'BELUM_HADIR', status: 'APPROVED' } })
    ])

    // Calculate revenue
    let revenue = 0
    let isPaid = false
    let isRunning = false
    try {
      const schema = JSON.parse(eventData.formSchema)
      const formMeta = Array.isArray(schema) ? schema.find((s: any) => s.itemType === 'form_meta') : {}
      if (formMeta) {
        if (formMeta.paymentEnabled && formMeta.nominal) {
          isPaid = true
          revenue = approvedTickets * Number(formMeta.nominal)
        }
        if (formMeta.eventDate) {
          const now = new Date()
          const evtDate = new Date(formMeta.eventDate)
          // Consider running if event date is today or has passed (started)
          isRunning = now >= evtDate
        }
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

    // Calculate Registration Trend (7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const regTrendTickets = await prisma.ticket.findMany({
      where: { 
        eventId,
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true }
    });

    const regTrendMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0] as string;
      regTrendMap[dateStr] = 0;
    }
    regTrendTickets.forEach(t => {
      const dateStr = new Date(t.createdAt).toISOString().split('T')[0] as string;
      if (regTrendMap[dateStr] !== undefined) regTrendMap[dateStr]++;
    });

    const regTrend = {
      labels: Object.keys(regTrendMap).map(d => {
        const dateObj = new Date(d);
        return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      }),
      data: Object.values(regTrendMap)
    };

    // Calculate Attendance Trend (Hourly if within Event Period)
    let attendanceTrend: any = null;
    let isEventPeriod = false;
    let startOfEvent: Date | null = null;
    let endOfEvent: Date | null = null;
    
    try {
      const schema = JSON.parse(eventData.formSchema)
      const formMeta = Array.isArray(schema) ? schema.find((s: any) => s.itemType === 'form_meta') : {}
      if (formMeta?.eventDate) {
        startOfEvent = new Date(formMeta.eventDate);
        startOfEvent.setHours(0, 0, 0, 0);
        
        endOfEvent = formMeta.eventEndDate ? new Date(formMeta.eventEndDate) : new Date(formMeta.eventDate);
        endOfEvent.setHours(23, 59, 59, 999);

        const now = new Date();
        if (now >= startOfEvent && now <= endOfEvent) {
          isEventPeriod = true;
        }
      }
    } catch { /* ignore */ }

    if (isEventPeriod && startOfEvent && endOfEvent) {
      const logs = await prisma.scanLog.findMany({
        where: {
          ticket: { eventId },
          scannedAt: { gte: startOfEvent, lte: endOfEvent }
        },
        select: { scannedAt: true, action: true }
      });

      // Calculate total hours
      const diffMs = endOfEvent.getTime() - startOfEvent.getTime();
      const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const isMultiDay = totalHours > 24;

      const hourlyLabels = [];
      const hourlyMasuk = Array(totalHours).fill(0);
      const hourlyKeluar = Array(totalHours).fill(0);
      const hourlyBelumHadir = Array(totalHours).fill(0);

      for (let i = 0; i < totalHours; i++) {
        const d = new Date(startOfEvent.getTime() + i * 60 * 60 * 1000);
        const hourStr = `${d.getHours().toString().padStart(2, '0')}:00`;
        if (isMultiDay) {
          hourlyLabels.push(`${d.getDate()}/${d.getMonth() + 1} ${hourStr}`);
        } else {
          hourlyLabels.push(hourStr);
        }
      }

      logs.forEach(log => {
        const logMs = new Date(log.scannedAt).getTime();
        const hourIndex = Math.floor((logMs - startOfEvent!.getTime()) / (1000 * 60 * 60));
        if (hourIndex >= 0 && hourIndex < totalHours) {
          if (log.action === 'MASUK') hourlyMasuk[hourIndex]++;
          else if (log.action === 'KELUAR') hourlyKeluar[hourIndex]++;
        }
      });

      let cumulativeMasuk = 0;
      for (let h = 0; h < totalHours; h++) {
        cumulativeMasuk += hourlyMasuk[h];
        hourlyBelumHadir[h] = Math.max(0, approvedTickets - cumulativeMasuk);
      }

      attendanceTrend = {
        labels: hourlyLabels,
        masuk: hourlyMasuk,
        keluar: hourlyKeluar,
        belumHadir: hourlyBelumHadir
      };
    }

    return {
      success: true,
      event: {
        id: eventData.id,
        name: eventData.name,
        quota: eventData.quota,
        isPaid,
        isRunning,
        isEventPeriod
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
      regTrend,
      attendanceTrend
    }

  } catch (error: any) {
    console.error('Dashboard Stats Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Gagal mengambil data dashboard' })
  }
})
