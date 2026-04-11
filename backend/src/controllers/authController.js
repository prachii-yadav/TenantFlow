const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      return next(err);
    }

    // Find user and populate site + role for the response
    const user = await User.findOne({ email })
      .populate('siteId', 'name')
      .populate('roleId', 'name');

    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    if (!user.isActive) {
      const err = new Error('Account is deactivated');
      err.statusCode = 403;
      return next(err);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    const token = signToken(user._id);

    res.status(200).json({
      token,
      user, // password stripped by toJSON transform on the model
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/auth/me  — returns the logged-in user's profile
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('siteId', 'name')
      .populate('roleId', 'name');

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe };
