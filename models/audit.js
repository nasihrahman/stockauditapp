const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
});

const AnswerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  response: { type: String, enum: ['yes', 'no', 'na'] }, // not required for comment/image only
  comment: { type: String },
  images: [{ type: String }], // store image file paths
  createdAt: { type: Date, default: Date.now }
  // Optionally, add user/audit fields for multi-user support
  // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // audit: { type: mongoose.Schema.Types.ObjectId, ref: 'Audit' }
});

module.exports = {
  Category: mongoose.model('Category', CategorySchema),
  Question: mongoose.model('Question', QuestionSchema),
  Answer: mongoose.model('Answer', AnswerSchema)
};

// DEBUG: Log all question IDs on server start
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/stockaudit', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
      const questions = await module.exports.Question.find();
      console.log('All Question IDs in DB:');
      questions.forEach(q => console.log(q._id.toString(), q.text));
      process.exit(0);
    })
    .catch(err => {
      console.error('DB connection error:', err);
      process.exit(1);
    });
}


