const User = require('../models/User');
const Role = require('../models/Role');
const Site = require('../models/Site');
const { isSuperAdmin } = require('../middleware/authMiddleware');

// GET /api/v1/dashboard
const getStats = async (req, res, next) => {
  try {
    if (isSuperAdmin(req.user)) {
      // Super Admin — global stats across all sites
      const [totalUsers, activeUsers, totalRoles, totalSites, usersPerSite] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Role.countDocuments(),
        Site.countDocuments(),
        User.aggregate([
          { $group: { _id: '$siteId', count: { $sum: 1 } } },
          { $lookup: { from: 'sites', localField: '_id', foreignField: '_id', as: 'site' } },
          { $unwind: '$site' },
          { $project: { _id: 0, label: '$site.name', count: 1 } },
          { $sort: { count: -1 } },
        ]),
      ]);

      return res.status(200).json({
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalRoles,
        totalSites,
        chart: usersPerSite,       // users per site
        chartLabel: 'Users per Site',
      });
    }

    // All other roles — stats scoped to their own site
    const siteId = req.user.siteId;

    const [totalUsers, activeUsers, totalRoles, usersPerRole] = await Promise.all([
      User.countDocuments({ siteId }),
      User.countDocuments({ siteId, isActive: true }),
      Role.countDocuments(),
      User.aggregate([
        { $match: { siteId } },
        { $group: { _id: '$roleId', count: { $sum: 1 } } },
        { $lookup: { from: 'roles', localField: '_id', foreignField: '_id', as: 'role' } },
        { $unwind: '$role' },
        { $project: { _id: 0, roleName: '$role.name', count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.status(200).json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalRoles,
      usersPerRole,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
