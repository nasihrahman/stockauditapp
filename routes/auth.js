const express = require('express');
const router = express.Router();
const User = require('../models/User'); // make sure this path is correct

// Hardcoded credentials for example
const USER = { username: 'admin', password: '1234' };

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// router.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   if (username === USER.username && password === USER.password) {
//     req.session.user = username;
//     return res.redirect('/');
//   }
//   res.render('login', { error: 'Invalid credentials' });
// });

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Attempting login for username:', username);

  const user = await User.findOne({ username });
  if (!user) {
    console.log('User not found for username:', username);
    return res.render('login', { error: 'Invalid credentials' });
  }

  console.log('User found. Comparing passwords...');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    console.log('Password comparison failed for username:', username);
    return res.render('login', { error: 'Invalid credentials' });
  }

  console.log('Login successful for username:', username);
  req.session.user = user._id;
  req.session.role = user.role; // Store user's role in session
  res.redirect('/');
});


router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
