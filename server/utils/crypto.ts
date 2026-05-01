import crypto from 'crypto'
import { getOrCreateRuntimeSecret } from './runtimeSecrets'

const algorithm = 'aes-256-cbc'

// Get secret from env, ensure it's exactly 32 bytes for AES-256
const resolveSecretKey = (secretInput?: string) => {
  const secret = String(secretInput || '').trim()
  const baseSecret =
    secret || String(process.env.APP_SECRET || '').trim() || getOrCreateRuntimeSecret('APP_SECRET')
  return crypto.createHash('sha256').update(String(baseSecret)).digest('base64').substring(0, 32)
}

const getSecret = () => {
  const secret =
    String(process.env.APP_SECRET || '').trim() || getOrCreateRuntimeSecret('APP_SECRET')
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32)
}

const encryptByKey = (text: string, key: string): string => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

const decryptByKey = (text: string, key: string): string => {
  const textParts = text.split(':')
  const ivStr = textParts.shift()
  if (!ivStr) throw new Error('Invalid encrypted text format')

  const iv = Buffer.from(ivStr, 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export const encryptWithSecret = (text: string, secretInput: string): string => {
  return encryptByKey(text, resolveSecretKey(secretInput))
}

export const decryptWithSecret = (text: string, secretInput: string): string => {
  return decryptByKey(text, resolveSecretKey(secretInput))
}

export const encrypt = (text: string): string => {
  return encryptByKey(text, getSecret())
}

export const decrypt = (text: string): string => {
  return decryptByKey(text, getSecret())
}
