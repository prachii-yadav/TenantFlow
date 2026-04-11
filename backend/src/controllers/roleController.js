const Role = require('../models/Role');

// GET /api/v1/roles?page=1&limit=10&search=...
const getRoles = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.name = new RegExp(req.query.search, 'i');
    }

    const [roles, total] = await Promise.all([
      Role.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Role.countDocuments(filter),
    ]);

    res.status(200).json({
      roles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/roles/:id
const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ role });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/roles
const createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      const err = new Error('Role name is required');
      err.statusCode = 400;
      return next(err);
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      const err = new Error('A role with that name already exists');
      err.statusCode = 409;
      return next(err);
    }

    const role = await Role.create({ name: name.trim(), description });
    res.status(201).json({ role });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/roles/:id
const updateRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (name) {
      const existing = await Role.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (existing) {
        const err = new Error('A role with that name already exists');
        err.statusCode = 409;
        return next(err);
      }
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name: name.trim() }), ...(description !== undefined && { description }) },
      { new: true, runValidators: true }
    );

    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({ role });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/roles/:id
const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ message: 'Role deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRoles, getRoleById, createRole, updateRole, deleteRole };
