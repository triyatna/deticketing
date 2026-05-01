import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.APP_SECRET || 'fallback-secret-for-jwt-secure'

export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}
