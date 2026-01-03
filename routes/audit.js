const express = require('express');
const router = express.Router();
const { Category, Question, Answer } = require('../models/audit');
const { cloudinary } = require('../cloudinary');
const multer = require('multer');
const sharp = require('sharp');
const upload = multer({ storage: multer.memoryStorage() });

// --- Admin Routes ---
// router.get('/admin', async (req, res) => {
//   const categories = await Category.find();
//   const questions = await Question.find().populate('category');
//   res.render('admin', { categories, questions });
// });

const Company = require('../models/company');

// router.post('/admin/category', async (req, res) => {
//   await Category.create({ name: req.body.name });
//   res.redirect('/admin');
// });

router.post('/admin/category', async (req, res) => {
  const { name, companyId } = req.body;
  try {
    await Category.create({ name, company: companyId });
    res.redirect(`/admin?company=${companyId}`);
  } catch (err) {
    if (err.code === 11000) {
      return res.send(`<script>alert("Category '${name}' already exists!"); window.location.href = "/admin?company=${companyId}";</script>`);
    }
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
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

  // console.log('Received req.body.text:', req.body.text); // Log the raw input

  const questionTexts = req.body.text.split(',').map(text => text.trim()).filter(text => text.length > 0); // Split, trim, and filter empty strings

  // console.log('Processed questionTexts:', questionTexts); // Log the processed array

  if (req.body.newCategory && req.body.newCategory.trim()) {
    const newCat = await Category.create({ name: req.body.newCategory.trim() });
    categoryId = newCat._id;
  }

  if (questionTexts.length === 0) {
    // Handle case where no valid questions were provided
    return res.redirect(`/admin?company=${companyId}`);
  }

  // Create multiple questions
  const questionsToCreate = [];
  let maxOrder = await Question.findOne({ category: categoryId }).sort({ order: -1 }).select('order');
  maxOrder = maxOrder ? maxOrder.order : -1; // Start from -1 so the first question is 0

  for (const text of questionTexts) {
    maxOrder++;
    questionsToCreate.push({
      text: text,
      category: categoryId,
      company: companyId,
      order: maxOrder
    });
  }

  await Question.insertMany(questionsToCreate); // Use insertMany for efficiency

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
  const questions = await Question.find({ company: companyId }).populate('category').sort({ order: 1 });

  res.render('index', { company, categories, questions });
});


// --- Handle Answers + Image Uploads (Cloudinary) ---
router.post('/audit/answer/:questionId', upload.array('images', 5), async (req, res) => {
  const question = await Question.findById(req.params.questionId);
  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        // Compress/resize with sharp
        const compressedBuffer = await sharp(file.buffer)
          .resize({ width: 1000 }) // adjust width as needed
          .jpeg({ quality: 70 }) // adjust quality as needed
          .toBuffer();
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload_stream(
          { folder: 'audits', resource_type: 'image' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
            } else if (result && result.secure_url) {
              images.push(result.secure_url);
            }
          }
        );
        // cloudinary.uploader.upload_stream returns a writable stream
        uploadResult.end(compressedBuffer);
      } catch (err) {
        console.error('Image compression/upload error:', err);
      }
    }
  }
  await Answer.create({
    question: req.params.questionId,
    response: req.body.response,
    comment: req.body.comment,
    images
  });
  res.redirect(`/audit/${question.company}`);
});



router.post('/admin/category/reorder', async (req, res) => {
  const { order } = req.body; // Expects: [ "catId1", "catId2", ... ]
  try {
    const bulkOps = order.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { position: index } }
      }
    }));

    if (bulkOps.length > 0) {
      await Category.bulkWrite(bulkOps);
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
