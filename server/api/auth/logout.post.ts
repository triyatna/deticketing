export default defineEventHandler(async (event) => {
  // Clear the cookie
  deleteCookie(event, 'auth_token', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  })

  return {
    success: true,
    message: 'Logged out successfully'
  }
})
