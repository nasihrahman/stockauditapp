const express = require('express');
const router = express.Router();
const Company = require('../models/company');

// Temporary hardcoded credentials
// const TEMP_USER = {
//   username: 'admin',
//   password: '1234'
// };

// // Middleware to check if user is logged in
// function isAuthenticated(req, res, next) {
//   if (req.session && req.session.user) return next();
//   res.redirect('/login');
// }

// // Render login page
// router.get('/login', (req, res) => {
//   res.render('login');
// });

// // Handle login form submission
// router.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   if (username === TEMP_USER.username && password === TEMP_USER.password) {
//     req.session.user = { username };
//     return res.json({ success: true });
//   } else {
//     return res.status(401).json({ success: false, message: 'Invalid credentials' });
//   }
// });

// // Logout route
// router.get('/logout', (req, res) => {
//   req.session.destroy();
//   res.redirect('/login');
// });

// Dashboard route
// router.get('/dashboard', isAuthenticated, async (req, res) => {
//   try {
//     const companies = await Company.find();
//     res.render('dashboard', {
//       companies,
//       user: req.session.user
//     });
//   } catch (err) {
//     console.error('Error loading dashboard:', err);
//     res.status(500).send('Failed to load dashboard');
//   }
// });

router.get('/dashboard', async (req, res) => {
  try {
    const companies = await Company.find();
    res.render('dashboard', { companies, user: { username: 'TEMP_ADMIN' } });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).send('Failed to load dashboard');
  }
});
// POST /api/companies
router.post('/api/companies', async (req, res) => {
  try {
    const company = await Company.create({ name: req.body.name });
    res.json({ success: true, companyId: company._id });
  } catch (err) {
    res.json({ success: false, message: 'Error creating company' });
  }
});


module.exports = router;
