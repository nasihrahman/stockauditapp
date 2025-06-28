const express = require('express');
const router = express.Router();
const { Category, Question, Answer } = require('../models/audit');
const { storage } = require('../cloudinary'); // Use Cloudinary storage
const multer = require('multer');
const upload = multer({ storage }); // ✅ Only declare ONCE

// --- Admin Routes ---
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

// --- Main Audit Route ---
router.get('/audit', async (req, res) => {
  const categories = await Category.find();
  const questions = await Question.find().populate('category');
  res.render('audit', { categories, questions });
});

// --- Handle Answers + Image Uploads (Cloudinary) ---
router.post('/audit/answer/:questionId', upload.array('images', 5), async (req, res) => {
  const images = req.files ? req.files.map(f => f.path) : []; // Cloudinary path
  await Answer.create({
    question: req.params.questionId,
    response: req.body.response,
    comment: req.body.comment,
    images
  });
  res.redirect('/audit');
});

module.exports = router;
