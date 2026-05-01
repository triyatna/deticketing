import jwt from 'jsonwebtoken'

const getJwtSecret = () => {
  return process.env.APP_SECRET || 'fallback-secret-for-jwt-secure'
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
