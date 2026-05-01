import crypto from 'node:crypto'
import prisma from './prisma'
import { decryptSettingValue, encryptSettingValue, isEncryptedSettingValue } from './settingsCrypto'

const EVENT_QR_SECRET_PREFIX = 'EVENT_QR_SECRET:'

const buildEventQrSecretKey = (eventId: string) => `${EVENT_QR_SECRET_PREFIX}${String(eventId || '').trim()}`

export const getEventQrSecret = async (eventId: string): Promise<string> => {
  const normalizedEventId = String(eventId || '').trim()
  if (!normalizedEventId) return ''

  let rawValue = ''
  try {
    // @ts-ignore: Prisma client typing can be stale in editor cache
    const record = await prisma.setting.findUnique({
      where: { key: buildEventQrSecretKey(normalizedEventId) },
      select: { value: true }
    })
    rawValue = String(record?.value || '').trim()
  } catch (error) {
    console.error(`Gagal mengambil QR secret untuk event ${normalizedEventId}:`, error)
    return ''
  }

  if (!rawValue) return ''

  try {
    return isEncryptedSettingValue(rawValue) ? decryptSettingValue(rawValue) : rawValue
  } catch {
    return ''
  }
}

export const getOrCreateEventQrSecret = async (eventId: string): Promise<string> => {
  const normalizedEventId = String(eventId || '').trim()
  if (!normalizedEventId) {
    throw new Error('Event ID is required to resolve QR secret.')
  }

  const existing = await getEventQrSecret(normalizedEventId)
  if (existing) return existing

  const generated = crypto.randomBytes(48).toString('hex')
  const encrypted = encryptSettingValue(generated)

  // @ts-ignore: Prisma client typing can be stale in editor cache
  await prisma.setting.upsert({
    where: { key: buildEventQrSecretKey(normalizedEventId) },
    update: { value: encrypted },
    create: {
      key: buildEventQrSecretKey(normalizedEventId),
      value: encrypted
    }
  })

  return generated
}

export const getEventQrSecretSettingKey = (eventId: string) => {
  return buildEventQrSecretKey(eventId)
}

