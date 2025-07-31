const jwtService = require('../config/jwt');

const authMiddleware = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify the access token
    const decoded = jwtService.verifyAccessToken(token);
    req.user = decoded; // Store the decoded user information in the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid access token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);

  if (token) {
    try {
      const decoded = jwtService.verifyAccessToken(token);
      req.user = decoded;
    } catch (error) {
      // Silently fail for optional auth
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
