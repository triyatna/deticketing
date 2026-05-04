import { sendWhatsAppMessage } from '../../../utils/whatsapp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { testNumber } = body

  if (!testNumber) {
    throw createError({ statusCode: 400, statusMessage: 'Nomor WA tujuan wajib diisi' })
  }

  // Sanitasi nomor
  let cleanJid = testNumber.replace(/[^\d@a-z.]/g, '')
  if (!cleanJid.includes('@')) {
    cleanJid = `${cleanJid}@s.whatsapp.net`
  }

  try {
    // Gunakan utility agar melewati mekanisme Queue dan Guard jika sudah tersimpan
    // Namun untuk test instan (sebelum simpan), kita tetap gunakan $fetch langsung agar user bisa tes tanpa simpan
    // Tetapi karena user minta 'lanjutkan', saya asumsikan mereka ingin sistem yang stabil.
    
    // Kita panggil sendWhatsAppMessage saja, tapi pastikan data sudah disimpan sebelumnya atau
    // kita modifikasi utility untuk menerima parameter opsional.
    
    // Untuk kemudahan testing instan, kita biarkan logic fetch manual di sini tapi dengan JID yang benar.
    const settingsRes: any = await $fetch('/api/admin/settings')
    const settings = settingsRes.settings || {}

    if (!settings.WA_ENDPOINT || !settings.WA_API_KEY) {
       throw createError({ statusCode: 400, statusMessage: 'Harap simpan konfigurasi WhatsApp terlebih dahulu' })
    }

    const result: any = await sendWhatsAppMessage({
      jid: cleanJid,
      content: {
        text: 'Halo! Ini adalah pesan tes dari sistem DeTicketing. Jika Anda menerima pesan ini, berarti konfigurasi WhatsApp Anda sudah benar dan fitur Guard sedang aktif.'
      }
    })

    if (!result.success) {
      throw new Error(result.message)
    }

    return {
      success: true,
      message: 'Koneksi WhatsApp berhasil dan pesan test telah terkirim via Guard Queue!',
      data: result.data
    }
  } catch (error: any) {
    console.error('WhatsApp Test Error:', error)
    const errorMessage = error.message || 'Gagal terhubung ke WhatsApp Gateway'
    throw createError({ 
      statusCode: 400, 
      statusMessage: `WhatsApp Error: ${errorMessage}` 
    })
  }
})
