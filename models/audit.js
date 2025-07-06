const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
});

CategorySchema.index({ name: 1, company: 1 }, { unique: true });

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
});


// const AnswerSchema = new mongoose.Schema({
//   question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
//   response: { type: String, enum: ['yes', 'no', 'na'] }, // not required for comment/image only
//   comment: { type: String },
//   images: [{ type: String }], // store image file paths
//   createdAt: { type: Date, default: Date.now }
//   // Optionally, add user/audit fields for multi-user support
//   // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   // audit: { type: mongoose.Schema.Types.ObjectId, ref: 'Audit' }
// });

const AnswerSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  response: { type: String, enum: ['yes', 'no', 'na'] },
  comment: String,
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Category: mongoose.model('Category', CategorySchema),
  Question: mongoose.model('Question', QuestionSchema),
  Answer: mongoose.model('Answer', AnswerSchema)
};


