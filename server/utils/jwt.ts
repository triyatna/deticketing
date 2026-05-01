import jwt from 'jsonwebtoken'
import { getOrCreateRuntimeSecret } from './runtimeSecrets'

const getJwtSecret = () => {
  const fromEnv = String(process.env.APP_SECRET || '').trim()
  if (fromEnv) return fromEnv
  const generated = getOrCreateRuntimeSecret('APP_SECRET')
  process.env.APP_SECRET = generated
  return generated
}

export type AuthTokenPayload = jwt.JwtPayload & {
  id: string
  username?: string
  name?: string
  role: string
}

export const generateToken = (payload: any) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '1d' })
}

export const verifyToken = (token: string): AuthTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (!decoded || typeof decoded === 'string') return null
    return decoded as AuthTokenPayload
  } catch (error) {
    return null
  }
}
