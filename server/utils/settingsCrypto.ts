import crypto from 'node:crypto'
import { getOrCreateRuntimeSecret } from './runtimeSecrets'

const SETTINGS_ENCRYPT_PREFIX = 'enc:v1:'

const getSettingsMasterKey = () => {
  const seed =
    process.env.SETTINGS_ENCRYPTION_KEY ||
    process.env.APP_SECRET_MASTER ||
    getOrCreateRuntimeSecret('SETTINGS_ENCRYPTION_KEY')

  return crypto.createHash('sha256').update(String(seed)).digest()
}

export const encryptSettingValue = (plainText: string): string => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', getSettingsMasterKey(), iv)
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  return `${SETTINGS_ENCRYPT_PREFIX}${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export const decryptSettingValue = (storedValue: string): string => {
  const raw = String(storedValue || '')

  if (!raw.startsWith(SETTINGS_ENCRYPT_PREFIX)) {
    return raw
  }

  const payload = raw.slice(SETTINGS_ENCRYPT_PREFIX.length)
  const [ivHex, encryptedHex] = payload.split(':')
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted setting format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', getSettingsMasterKey(), iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

export const isEncryptedSettingValue = (value: string) => {
  return String(value || '').startsWith(SETTINGS_ENCRYPT_PREFIX)
}
