const mongoose = require('mongoose');

const infoSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Company' },
  company: { type: String },
  location: String,
  date: String,
  branch: String,
  manager: String,
  inspector: String
}, { timestamps: true });

module.exports = mongoose.model('Info', infoSchema);