// middleware/auth.js
const { clerkClient } = require('@clerk/backend')

exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[7]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    })
  }

  try {
    // Verify Clerk session token
    const sessionToken = await clerkClient.verifyToken(token)
    req.user = { id: sessionToken.sub }
    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    })
  }
}
