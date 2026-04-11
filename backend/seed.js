require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Site = require('./src/models/Site');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Site.deleteMany({}),
    ]);
    console.log('Cleared existing data.');

    // Create roles
    const [superAdminRole, adminRole, managerRole, viewerRole] = await Role.insertMany([
      { name: 'Super Admin', description: 'Full access across all sites and tenants' },
      { name: 'Admin',       description: 'Full access within their own site' },
      { name: 'Manager',     description: 'Can create and edit within their own site, no delete' },
      { name: 'Viewer',      description: 'Read-only access within their own site' },
    ]);
    console.log('Roles created: Super Admin, Admin, Manager, Viewer');

    // Create sites
    const [acmeSite, betaSite] = await Site.insertMany([
      { name: 'Acme Corp', domain: 'acme.com' },
      { name: 'Beta Inc',  domain: 'beta.io'  },
    ]);
    console.log('Sites created: Acme Corp, Beta Inc');

    // Create users (passwords are hashed by the pre-save hook)
    await User.create([
      {
        name:     'Super Admin',
        email:    'superadmin@tenantflow.com',
        password: 'superadmin123',
        roleId:   superAdminRole._id,
        isActive: true,
      },
      {
        name:     'Admin User',
        email:    'admin@tenantflow.com',
        password: 'admin123',
        siteId:   acmeSite._id,
        roleId:   adminRole._id,
        isActive: true,
      },
      {
        name:     'Manager User',
        email:    'manager@tenantflow.com',
        password: 'manager123',
        siteId:   acmeSite._id,
        roleId:   managerRole._id,
        isActive: true,
      },
      {
        name:     'Viewer User',
        email:    'viewer@tenantflow.com',
        password: 'viewer123',
        siteId:   betaSite._id,
        roleId:   viewerRole._id,
        isActive: true,
      },
      {
        name:     'Beta Admin',
        email:    'admin@beta.io',
        password: 'admin123',
        siteId:   betaSite._id,
        roleId:   adminRole._id,
        isActive: true,
      },
      {
        name:     'Inactive User',
        email:    'inactive@tenantflow.com',
        password: 'inactive123',
        siteId:   betaSite._id,
        roleId:   viewerRole._id,
        isActive: false,
      },
    ]);
    console.log('Users created.');

    console.log('\n✔ Seed complete! Login credentials:');
    console.log('──────────────────────────────────────────────────────');
    console.log('  Super Admin → superadmin@tenantflow.com / superadmin123  (sees ALL sites)');
    console.log('  Admin       → admin@tenantflow.com      / admin123        (Acme Corp only)');
    console.log('  Admin       → admin@beta.io             / admin123        (Beta Inc only)');
    console.log('  Manager     → manager@tenantflow.com    / manager123      (Acme Corp only)');
    console.log('  Viewer      → viewer@tenantflow.com     / viewer123       (Beta Inc only)');
    console.log('──────────────────────────────────────────────────────');

  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
