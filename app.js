const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const app = express();
const expressPDFRoutes = require('./routes/Express');
app.use(express.json({ limit: '20mb' })); // in case large data/images are passed
app.use('/api', expressPDFRoutes);
app.use(express.static('public'));
const methodOverride = require('method-override');
const authRoutes = require('./routes/auth'); // adjust if named differently
const session = require('express-session');
const Company = require('./models/company');

// Allow method override using ?_method=PUT or hidden input in form
app.use(methodOverride('_method'));
dotenv.config();

// MongoDB connection


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'tempSecret',
  resave: false,
  saveUninitialized: true
}));

app.use('/auth', authRoutes);
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

 // <-- Add this line to support JSON body parsing
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// app.get('/', async (req, res) => {
//   const { Category, Question } = require('./models/audit');
//   const categories = await Category.find();
//   const questions = await Question.find().populate('category');
//   res.render('index', {
//     company: { name: 'Your Company', logo: '/logo.png' },
//     categories,
//     questions
//   });
// });
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  return res.redirect('/auth/login');
}
app.get('/test-session', (req, res) => {
  res.send(req.session);
});

// const Company = require('./models/company');

app.get('/', isAuthenticated, async (req, res) => {
  const companies = await Company.find();
  res.render('dashboard', { companies });
});


const auditRoutes = require('./routes/audit');
app.use(auditRoutes);

// API routes for AJAX answer save/retrieve
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
