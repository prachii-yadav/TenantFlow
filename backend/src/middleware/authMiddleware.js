const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Not authorized — no token');
      err.statusCode = 401;
      return next(err);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user (without password) to the request, populate role for permission checks
    const user = await User.findById(decoded.id).select('-password').populate('roleId', 'name');

    if (!user) {
      const err = new Error('Not authorized — user no longer exists');
      err.statusCode = 401;
      return next(err);
    }

    if (!user.isActive) {
      const err = new Error('Not authorized — account is deactivated');
      err.statusCode = 403;
      return next(err);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      err.message = 'Not authorized — invalid token';
      err.statusCode = 401;
    } else if (err.name === 'TokenExpiredError') {
      err.message = 'Not authorized — token expired';
      err.statusCode = 401;
    }
    next(err);
  }
};

// Convenience: returns true if the user's role is "Super Admin"
const isSuperAdmin = (user) =>
  user?.roleId?.name?.toLowerCase() === 'super admin';

// Convenience: returns true if the user's role is "Manager"
const isManager = (user) =>
  user?.roleId?.name?.toLowerCase() === 'manager';

module.exports = { protect, isSuperAdmin, isManager };
