const User = require('../models/User');
const Role = require('../models/Role');
const { isSuperAdmin, isManager } = require('../middleware/authMiddleware');

// GET /api/v1/users?page=1&limit=10&search=jane&siteId=...&roleId=...
const getUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = { _id: { $ne: req.user._id } }; // never show the logged-in user

    // Non-super-admins can only see users in their own site
    if (!isSuperAdmin(req.user)) {
      filter.siteId = req.user.siteId;
    } else if (req.query.siteId) {
      // Super Admin can optionally filter by a specific site
      filter.siteId = req.query.siteId;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }
    if (req.query.roleId) filter.roleId = req.query.roleId;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('siteId', 'name')
        .populate('roleId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('siteId', 'name')
      .populate('roleId', 'name');

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    // Non-super-admins cannot access users outside their site
    if (!isSuperAdmin(req.user) && user.siteId?._id?.toString() !== req.user.siteId?.toString()) {
      const err = new Error('Not authorized to access this user');
      err.statusCode = 403;
      return next(err);
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, siteId, roleId } = req.body;

    const requiresSite = !isSuperAdmin(req.user);
    if (!name || !email || !password || (requiresSite && !siteId) || !roleId) {
      const err = new Error(
        requiresSite
          ? 'name, email, password, siteId, and roleId are all required'
          : 'name, email, password, and roleId are all required'
      );
      err.statusCode = 400;
      return next(err);
    }

    const role = await Role.findById(roleId);
    if (role?.name?.toLowerCase() === 'super admin') {
      const err = new Error('Super Admin cannot be assigned when creating a user');
      err.statusCode = 400;
      return next(err);
    }

    if (isManager(req.user) && role?.name?.toLowerCase() !== 'viewer') {
      const err = new Error('Managers can only create users with the Viewer role');
      err.statusCode = 403;
      return next(err);
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      const err = new Error('A user with that email already exists');
      err.statusCode = 409;
      return next(err);
    }

    const user = await User.create({ name, email, password, siteId, roleId });
    const populated = await user.populate('siteId', 'name');
    await populated.populate('roleId', 'name');

    res.status(201).json({ user: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, email, password, siteId, roleId } = req.body;

    if (email) {
      const existing = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        const err = new Error('A user with that email already exists');
        err.statusCode = 409;
        return next(err);
      }
    }

    // Fetch user first so the pre-save hook can hash a new password
    const user = await User.findById(req.params.id).populate('roleId', 'name');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    // Managers can only edit Viewer-role users
    if (isManager(req.user) && user.roleId?.name?.toLowerCase() !== 'viewer') {
      const err = new Error('Managers can only edit users with the Viewer role');
      err.statusCode = 403;
      return next(err);
    }

    if (roleId) {
      const role = await Role.findById(roleId);
      if (role?.name?.toLowerCase() === 'super admin') {
        const err = new Error('Super Admin cannot be assigned to a user');
        err.statusCode = 400;
        return next(err);
      }
      // Managers can only assign the Viewer role
      if (isManager(req.user) && role?.name?.toLowerCase() !== 'viewer') {
        const err = new Error('Managers can only assign the Viewer role');
        err.statusCode = 403;
        return next(err);
      }
      user.roleId = roleId;
    }

    if (name)     user.name     = name;
    if (email)    user.email    = email;
    if (password) user.password = password; // hook will re-hash
    if (siteId)   user.siteId   = siteId;

    await user.save();
    await user.populate('siteId', 'name');
    await user.populate('roleId', 'name');

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/:id/deactivate  — soft delete
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ message: 'User deactivated', user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/:id/activate
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ message: 'User activated', user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/users/:id  — hard delete
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
};
