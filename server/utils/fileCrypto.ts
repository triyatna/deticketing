import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { getOrCreateRuntimeSecret } from './runtimeSecrets'

const algorithm = 'aes-256-cbc'

// Generate standard 32 bytes key from the APP_SECRET
const getSecret = () => {
  const secret =
    String(process.env.APP_SECRET || '').trim() || getOrCreateRuntimeSecret('APP_SECRET')
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32)
}

export const encryptBuffer = (buffer: Buffer): Buffer => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(getSecret()), iv)
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  
  // Return IV + Encrypted Data
  return Buffer.concat([iv, encrypted])
}

export const decryptBuffer = (encryptedBuffer: Buffer): Buffer => {
  const iv = encryptedBuffer.subarray(0, 16)
  const encryptedData = encryptedBuffer.subarray(16)
  
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(getSecret()), iv)
  return Buffer.concat([decipher.update(encryptedData), decipher.final()])
}

export const saveEncryptedFile = async (buffer: Buffer, fileName: string): Promise<string> => {
  const uploadsDir = path.resolve(process.cwd(), 'server/private/uploads')
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const encryptedBuffer = encryptBuffer(buffer)
  const filePath = path.join(uploadsDir, fileName)
  
  await fs.promises.writeFile(filePath, encryptedBuffer)
  
  return fileName
}

export const getDecryptedFile = async (fileName: string): Promise<Buffer | null> => {
  const filePath = path.resolve(process.cwd(), 'server/private/uploads', fileName)
  
  if (!fs.existsSync(filePath)) {
    return null
  }

  const encryptedBuffer = await fs.promises.readFile(filePath)
  return decryptBuffer(encryptedBuffer)
}

export const deleteEncryptedFile = async (fileName: string): Promise<boolean> => {
  const filePath = path.resolve(process.cwd(), 'server/private/uploads', fileName)
  if (!fs.existsSync(filePath)) {
    return false
  }

  await fs.promises.unlink(filePath)
  return true
}
