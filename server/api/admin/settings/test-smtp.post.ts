import nodemailer from 'nodemailer'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, smtpFromEmail, testEmail } = body

  if (!testEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Email tujuan wajib diisi' })
  }

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFromName || !smtpFromEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Harap lengkapi semua konfigurasi SMTP' })
  }

  try {
    // @ts-ignore: Prisma client needs regeneration
    const settingsDb = await prisma.setting.findMany({
      where: { key: { in: ['APP_NAME'] } }
    })
    const settingsMap = settingsDb.reduce((acc: Record<string, string>, s: any) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    const appName = settingsMap.APP_NAME || 'NexTicket'

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: String(smtpPort) === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.verify()

    const formattedFrom = `"${smtpFromName}" <${smtpFromEmail}>`

    await transporter.sendMail({
      from: formattedFrom,
      to: testEmail,
      subject: `Test Koneksi SMTP Berhasil - ${appName}`,
      html: `<p>Selamat! Konfigurasi SMTP Anda di ${appName} berjalan dengan sempurna.</p>`
    })

    return {
      success: true,
      message: 'Koneksi berhasil dan email test telah terkirim!'
    }
  } catch (error: any) {
    console.error('SMTP Test Error Detail:', error)
    
    // Berikan pesan yang lebih deskriptif
    const errorMessage = error.response || error.message || 'Gagal terhubung ke server SMTP'
    throw createError({ 
      statusCode: 400, 
      statusMessage: `SMTP Error: ${errorMessage}` 
    })
  }
})
