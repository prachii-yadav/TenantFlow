const Site = require('../models/Site');

// GET /api/v1/sites?page=1&limit=10&search=...
const getSites = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.name = new RegExp(req.query.search, 'i');
    }

    const [sites, total] = await Promise.all([
      Site.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Site.countDocuments(filter),
    ]);

    res.status(200).json({
      sites,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/sites/:id
const getSiteById = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      const err = new Error('Site not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ site });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/sites
const createSite = async (req, res, next) => {
  try {
    const { name, domain } = req.body;

    if (!name || !name.trim()) {
      const err = new Error('Site name is required');
      err.statusCode = 400;
      return next(err);
    }

    const existing = await Site.findOne({ name: name.trim() });
    if (existing) {
      const err = new Error('A site with that name already exists');
      err.statusCode = 409;
      return next(err);
    }

    const site = await Site.create({ name: name.trim(), domain });
    res.status(201).json({ site });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/sites/:id
const updateSite = async (req, res, next) => {
  try {
    const { name, domain } = req.body;

    if (name) {
      const existing = await Site.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (existing) {
        const err = new Error('A site with that name already exists');
        err.statusCode = 409;
        return next(err);
      }
    }

    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name: name.trim() }), ...(domain !== undefined && { domain }) },
      { new: true, runValidators: true }
    );

    if (!site) {
      const err = new Error('Site not found');
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({ site });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/sites/:id
const deleteSite = async (req, res, next) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    if (!site) {
      const err = new Error('Site not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ message: 'Site deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSites, getSiteById, createSite, updateSite, deleteSite };
