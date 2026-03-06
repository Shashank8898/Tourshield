const { verifyToken } = require('@clerk/backend')

exports.authenticateToken = async (req, res, next) => {
  try {
    // Get the token from Authorization header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.slice(7)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    console.log('🔍 Verifying token:', token.substring(0, 20) + '...')

    // Verify the Clerk JWT token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    })

    console.log('✅ Token verified for user:', payload.sub)

    // Add user info to request object
    req.user = {
      id: payload.sub,
      email: payload.email || null,
      firstName: payload.given_name || null,
      lastName: payload.family_name || null
    }

    next()

  } catch (error) {
    console.error('❌ Token verification failed:', error.message)
    
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
