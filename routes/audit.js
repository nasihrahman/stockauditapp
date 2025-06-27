const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Category, Question, Answer } = require('../models/audit');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Admin: List, add, delete questions and categories
router.get('/admin', async (req, res) => {
  const categories = await Category.find();
  const questions = await Question.find().populate('category');
  res.render('admin', { categories, questions });
});

router.post('/admin/category', async (req, res) => {
  await Category.create({ name: req.body.name });
  res.redirect('/admin');
});

router.post('/admin/question', async (req, res) => {
  let categoryId = req.body.category;
  if (req.body.newCategory && req.body.newCategory.trim()) {
    // Create new category if provided
    const newCat = await Category.create({ name: req.body.newCategory.trim() });
    categoryId = newCat._id;
  }
  await Question.create({ text: req.body.text, category: categoryId });
  res.redirect('/admin');
});

router.post('/admin/question/delete/:id', async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

// Main audit form
router.get('/audit', async (req, res) => {
  const categories = await Category.find();
  const questions = await Question.find().populate('category');
  res.render('audit', { categories, questions });
});

// Submit answer with comment and image(s)
router.post('/audit/answer/:questionId', upload.array('images', 5), async (req, res) => {
  const images = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
  await Answer.create({
    question: req.params.questionId,
    response: req.body.response,
    comment: req.body.comment,
    images
  });
  res.redirect('/audit');
});

// TODO: Add routes for editing/removing images and comments

module.exports = router;
