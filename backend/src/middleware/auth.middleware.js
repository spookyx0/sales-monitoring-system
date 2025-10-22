const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(createError(401, 'Not authorized, no token'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(createError(401, 'Token expired'));
      }
      return next(createError(403, 'Not authorized, token failed'));
    }
    req.user = user; // The user payload from the token { id, role }
    next();
  });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Not authorized'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, `User role '${req.user.role}' is not authorized to access this route`)
      );
    }
    next();
  };
};

module.exports = { authenticateToken, authorize };
