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
    const questions = await Question.find({ company: companyId }).sort({ order: 1 }).populate('category');
    // console.log('Questions fetched for admin page (before render):', questions.map(q => ({ id: q._id, text: q.text, order: q.order })));
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





// POST route for adding a question
router.post('/question', isAdmin, async (req, res) => {
  console.log('Received question submission:', req.body);
  const { companyId, category, text, single_text } = req.body;
  console.log('single_text:', single_text, 'text:', text);
  try {
    const { companyId, category, text, single_text } = req.body;
    const lastQuestion = await Question.findOne({ company: companyId }).sort({ order: -1 });
    let currentOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    let questions = [];

    if (single_text && single_text.trim()) {
      // Add single question, even if it contains commas
      questions.push({ text: single_text.trim(), category, company: companyId, order: currentOrder });
      currentOrder++; // Increment order for the single question
    } else if (text && text.trim()) {
      // Add multiple questions, splitting by commas
      const questionTexts = text.split(',').map(q => q.trim()).filter(q => q);
      for (const qText of questionTexts) {
        questions.push({ text: qText, category, company: companyId, order: currentOrder });
        currentOrder++; // Increment order for each question in the multiple questions field
      }
    }

    if (questions.length > 0) {
      await Question.insertMany(questions);
    }

    res.redirect(`/admin?company=${companyId}`);
  } catch (err) {
    console.error('Error adding question:', err);
    res.status(500).send('Failed to add question');
  }
});

// GET route for editing a question
router.get('/edit-question/:id', isAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('category');
    const categories = await Category.find({ company: question.company });
    if (!question) {
      return res.status.send('Question not found');
    }
    res.render('edit-question', { question, categories, role: req.session.role });
  } catch (err) {
    console.error('Error loading edit question page:', err);
    res.status(500).send('Failed to load edit question page');
  }
});


// POST route for updating a question
router.post('/edit-question/:id', isAdmin, async (req, res) => {
  try {
    const { text, category } = req.body;
    await Question.findByIdAndUpdate(req.params.id, { text, category });
    const question = await Question.findById(req.params.id);
    res.redirect(`/admin?company=${question.company}`);
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).send('Failed to update question');
  }
});


// GET route for editing categories
router.get('/edit-category', isAdmin, async (req, res) => {
  try {
    const companyId = req.query.company;
    const categories = await Category.find({ company: companyId });
    res.render('edit-category', { categories, companyId, role: req.session.role });
  } catch (err) {
    console.error('Error loading edit category page:', err);
    res.status(500).send('Failed to load edit category page');
  }
});

// POST route for updating a category
router.post('/edit-category/:id', isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    await Category.findByIdAndUpdate(req.params.id, { name });
    const category = await Category.findById(req.params.id);
    res.redirect(`/admin/edit-category?company=${category.company}`);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).send('Failed to update category');
  }
});


// POST route for reordering questions
router.post('/question/reorder', isAdmin, async (req, res) => {
  try {
    const { order } = req.body;
    // console.log('Received reorder request. Order array:', order);
    for (let i = 0; i < order.length; i++) {
      try {
        const updatedQuestion = await Question.findByIdAndUpdate(order[i], { order: i }, { new: true });
        // console.log(`Updated question ${order[i]} with order ${i}. Result:`, updatedQuestion);
      } catch (updateErr) {
        console.error(`Error updating question ${order[i]}:`, updateErr);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error reordering questions:', err);
    res.status(500).json({ success: false, message: 'Failed to reorder questions' });
  }
});



// // GET route to fix question order (run once)
// router.get('/fix-question-order', isAdmin, async (req, res) => {
//   try {
//     const companyId = req.query.company;
//     if (!companyId) {
//       return res.status(400).send('Company ID is required');
//     }

//     const questions = await Question.find({ company: companyId }).sort({ _id: 1 }); // Get questions in creation order

//     for (let i = 0; i < questions.length; i++) {
//       await Question.findByIdAndUpdate(questions[i]._id, { order: i });
//     }

//     res.send('Question order has been fixed. You can now go back to the admin page.');

//   } catch (err) {
//     console.error('Error fixing question order:', err);
//     res.status(500).send('Failed to fix question order');
//   }
// });

module.exports = router;
