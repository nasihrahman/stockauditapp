const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/company');
const { Category, Question } = require('../models/audit');

// Middleware to check if user is authenticated and has admin role
function isAdmin(req, res, next) {
  if (req.session.user && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).send('Access Denied: Admins only');
  }
}

// GET route to render admin dashboard (admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const companyId = req.query.company; // Get company ID from query parameter
    if (!companyId) {
      return res.status(400).send('Company ID is required');
    }
    const company = await Company.findById(companyId);
    const categories = await Category.find({ company: companyId });
    const questions = await Question.find({ company: companyId }).populate('category');
    res.render('admin', { company, categories, questions, role: req.session.role });
  } catch (err) {
    console.error('Error loading admin page:', err);
    res.status(500).send('Failed to load admin page');
  }
});

// GET route to render add user form (admin only)
router.get('/add-user', isAdmin, (req, res) => {
  res.render('add-user', { error: null, role: req.session.role });
});

// POST route to handle adding new user (admin only)
router.post('/add-user', isAdmin, async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.render('add-user', { error: 'Username or Email already exists' });
    }

    const newUser = new User({ username, email, password, role });
    await newUser.save();
    res.redirect('/admin/add-user'); // Redirect back to the add user page or a success page
  } catch (err) {
    res.render('add-user', { error: err.message });
  }
});

module.exports = router;