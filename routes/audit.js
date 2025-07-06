const express = require('express');
const router = express.Router();
const { Category, Question, Answer } = require('../models/audit');
const { storage } = require('../cloudinary');
const multer = require('multer');
const upload = multer({ storage });

// --- Admin Routes ---
// router.get('/admin', async (req, res) => {
//   const categories = await Category.find();
//   const questions = await Question.find().populate('category');
//   res.render('admin', { categories, questions });
// });

const Company = require('../models/company');

router.get('/admin', async (req, res) => {
  const companyId = req.query.company;
  if (!companyId) return res.status(400).send('Missing company ID');

  const company = await Company.findById(companyId);
  const categories = await Category.find({ company: companyId }).sort({ position: 1 });
  const questions = await Question.find({ company: companyId }).populate('category');

  res.render('admin', { company, categories, questions });
});



// router.post('/admin/category', async (req, res) => {
//   await Category.create({ name: req.body.name });
//   res.redirect('/admin');
// });

router.post('/admin/category', async (req, res) => {
  const { name, companyId } = req.body;
  await Category.create({ name, company: companyId });
  res.redirect(`/admin?company=${companyId}`);
});


router.delete('/admin/category/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    await Question.deleteMany({ category: categoryId });
    await Category.findByIdAndDelete(categoryId);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.post('/admin/question', async (req, res) => {
  let categoryId = req.body.category;
  const { companyId } = req.body;
  if (req.body.newCategory && req.body.newCategory.trim()) {
    const newCat = await Category.create({ name: req.body.newCategory.trim() });
    categoryId = newCat._id;
  }
  await Question.create({ text: req.body.text, category: categoryId,company: companyId });
  // res.redirect('/admin');
  res.redirect(`/admin?company=${companyId}`);
});

// router.post('/admin/question/delete/:id', async (req, res) => {
//   await Question.findByIdAndDelete(req.params.id);
//   res.redirect('/admin');
// });

router.post('/admin/question/delete/:id', async (req, res) => {
  const q = await Question.findById(req.params.id);
  const companyId = q.company;
  await Question.findByIdAndDelete(req.params.id);
  res.redirect(`/admin?company=${companyId}`);
});


// --- Main Audit Route ---
// router.get('/audit', async (req, res) => {
//   const categories = await Category.find();
//   const questions = await Question.find().populate('category');
//   res.render('audit', { categories, questions });
// });

router.get('/audit/:companyId', async (req, res) => {
  const companyId = req.params.companyId;

  const company = await Company.findById(companyId);
  const categories = await Category.find({ company: companyId }).sort({ position: 1 });
  const questions = await Question.find({ company: companyId }).populate('category');

  res.render('index', { company, categories, questions });
});


// --- Handle Answers + Image Uploads (Cloudinary) ---
router.post('/audit/answer/:questionId', upload.array('images', 5), async (req, res) => {
  const question = await Question.findById(req.params.questionId);
  const images = req.files ? req.files.map(f => f.path) : [];
  await Answer.create({
    question: req.params.questionId,
    response: req.body.response,
    comment: req.body.comment,
    images
  });
  // res.redirect('/audit');
  res.redirect(`/audit/${question.company}`);
});

// routes/edit.js or wherever you handle views
router.get('/edit-question/:id', async (req, res) => {
  const question = await Question.findById(req.params.id).populate('category');
  if (!question) return res.status(404).send('Question not found');

  const companyId = question.company; 
  const categories = await Category.find({company: companyId});
  res.render('edit-question', { question, categories, company: companyId});
});

router.post('/edit-question/:id', async (req, res) => {
  const { text, category } = req.body;
  await Question.findByIdAndUpdate(req.params.id, { text, category });
  res.redirect('/admin');
});

router.post('/admin/category/reorder', async (req, res) => {
  const { order } = req.body; // Expects: [ "catId1", "catId2", ... ]
  try {
    for (let i = 0; i < order.length; i++) {
      await Category.findByIdAndUpdate(order[i], { position: i });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to reorder categories' });
  }
});


// edit category name
router.post('/api/category/edit', async (req, res) => {
  const { categoryId, newName, companyId } = req.body;
  try {
    await Category.findByIdAndUpdate(categoryId, { name: newName });
    res.redirect(`/admin?company=${companyId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update category');
  }
});

module.exports = router;
