const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, unique: true, trim: true },
    domain: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Site', siteSchema);
