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
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.render('login', { error: 'Invalid credentials' });
  }

  req.session.user = user._id;
  res.redirect('/');
});


router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.render('register', { error: 'Username or Email already exists' });

    const newUser = new User({ username, email, password });
    await newUser.save();
    res.redirect('/auth/login');
  } catch (err) {
    res.render('register', { error: err.message });
  }
});


module.exports = router;
