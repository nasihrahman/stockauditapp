const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

// MongoDB connection

require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB Cloud');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // <-- Add this line to support JSON body parsing
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', async (req, res) => {
  const { Category, Question } = require('./models/audit');
  const categories = await Category.find();
  const questions = await Question.find().populate('category');
  res.render('index', {
    company: { name: 'Your Company', logo: '/logo.png' },
    categories,
    questions
  });
});

const auditRoutes = require('./routes/audit');
app.use(auditRoutes);

// API routes for AJAX answer save/retrieve
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
