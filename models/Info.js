const mongoose = require('mongoose');

const infoSchema = new mongoose.Schema({
  company: String,
  location: String,
  date: String,
  branch: String,
  manager: String,
  inspector: String
}, { timestamps: true });

module.exports = mongoose.model('Info', infoSchema);