import prisma from './prisma'

export interface WhatsAppMessage {
  jid: string
  content: {
    text?: string
    image?: { url: string }
    caption?: string
  }
}

// Sequential Queue Implementation
let lastMessagePromise: Promise<any> = Promise.resolve()

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const sendWhatsAppMessage = async (message: WhatsAppMessage) => {
  // Use a sequential queue to prevent overlapping delays and API hits
  // This ensures that even if traffic is high, messages are processed one by one
  const currentMessageTask = async () => {
    try {
      // @ts-ignore: Prisma client needs regeneration
      const settingsDb = await prisma.setting.findMany({
        where: {
          key: { in: ['WA_ENDPOINT', 'WA_API_KEY', 'WA_GUARD_ENABLED', 'WA_GUARD_DELAY_MIN', 'WA_GUARD_DELAY_MAX'] }
        }
      })

      const settings = settingsDb.reduce((acc: Record<string, string>, s: any) => {
        acc[s.key] = s.value
        return acc
      }, {} as Record<string, string>)

      const endpoint = settings['WA_ENDPOINT']
      const apiKey = settings['WA_API_KEY']
      const guardEnabled = settings['WA_GUARD_ENABLED'] === 'true'
      const minDelay = parseInt(settings['WA_GUARD_DELAY_MIN'] || '1')
      const maxDelay = parseInt(settings['WA_GUARD_DELAY_MAX'] || '5')

      if (!endpoint || !apiKey) {
        console.warn('WhatsApp Gateway not configured properly.')
        return { success: false, message: 'WhatsApp Gateway not configured' }
      }

      // Apply Guard Delay
      if (guardEnabled) {
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000
        await delay(randomDelay)
      }

      // Sanitize JID (ensure it's clean and has @s.whatsapp.net)
      let cleanJid = message.jid.replace(/[^\d@a-z.]/g, '')
      if (!cleanJid.includes('@')) {
        cleanJid = `${cleanJid}@s.whatsapp.net`
      }

      const response = await $fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          ...message,
          jid: cleanJid
        }
      })

      return { success: true, data: response }
    } catch (error: any) {
      console.error('WhatsApp Send Error:', error)
      return { 
        success: false, 
        message: error.data?.message || error.message || 'Failed to send WhatsApp message' 
      }
    }
  }

  // Queue the task
  lastMessagePromise = lastMessagePromise.then(currentMessageTask).catch(() => {
    // If one fails, still allow the next one to proceed
    return currentMessageTask()
  })

  return lastMessagePromise
}
