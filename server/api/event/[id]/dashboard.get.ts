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

  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)

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
          isPaid = true;
          
          // Get all approved tickets to calculate revenue per order
          const approvedTicketsList = await prisma.ticket.findMany({
            where: { eventId, status: 'APPROVED' },
            select: { orderId: true }
          });

          const orders: Record<string, number> = {};
          approvedTicketsList.forEach(t => {
            const oid = t.orderId || 'manual';
            orders[oid] = (orders[oid] || 0) + 1;
          });

          const nominal = Number(formMeta.nominal);
          const pEnabled = !!formMeta.promoEnabled;
          const pMin = Number(formMeta.promoMinTickets || 2);
          const pType = String(formMeta.promoType || 'free_ticket');
          const pVal = Number(formMeta.promoValue || 1);

          for (const qty of Object.values(orders)) {
            let orderDiscount = 0;
            if (pEnabled) {
              if (pType === 'free_ticket') {
                const bundleSize = pMin + pVal;
                const freeCount = Math.floor(qty / bundleSize) * pVal;
                orderDiscount = freeCount * nominal;
              } else if (pType === 'discount' && qty >= pMin) {
                orderDiscount = pVal;
              }
            }
            revenue += Math.max(0, (qty * nominal) - orderDiscount);
          }
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
    const regTrendMap: Record<string, number> = {};
    const regLabels: string[] = [];
    const regData: number[] = [];
    
    // Exactly 7 days ending today
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startToday);
      d.setDate(d.getDate() - i);
      days.push(d);
      regLabels.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
    }

    const regTrendTickets = await prisma.ticket.findMany({
      where: { 
        eventId,
        createdAt: { gte: days[0] } // Start from the oldest day in our labels
      },
      select: { createdAt: true }
    });

    days.forEach(d => {
      const dStr = getLocalDateString(d);
      const count = regTrendTickets.filter(t => getLocalDateString(new Date(t.createdAt)) === dStr).length;
      regData.push(count);
    });

    const regTrend = {
      labels: regLabels,
      data: regData
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
