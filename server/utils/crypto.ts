import crypto from 'crypto'

const algorithm = 'aes-256-cbc'

// Get secret from env, ensure it's exactly 32 bytes for AES-256
const getSecret = () => {
  const secret = process.env.APP_SECRET || 'default-secret-key-must-be-32-chars!'
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32)
}

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(getSecret()), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export const decrypt = (text: string): string => {
  const textParts = text.split(':')
  const ivStr = textParts.shift()
  if (!ivStr) throw new Error('Invalid encrypted text format')
  
  const iv = Buffer.from(ivStr, 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(getSecret()), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}
