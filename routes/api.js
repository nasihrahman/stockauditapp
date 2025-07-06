const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Question, Category, Answer } = require('../models/audit');
const Info = require('../models/Info');
const { cloudinary, storage } = require('../cloudinary'); // Uncomment if using Cloudinary
const PDFDocument = require('pdfkit');
const { generatePDFContent } = require('./pdf'); // Adjust path if different

// Multer setup for image uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '../public/uploads'));
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
const upload = multer({ storage });

// GET /api/answers - get all answers
router.get('/answers', async (req, res) => {
  try {
    const answers = await Answer.find();
    res.json({ success: true, answers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/answer - upsert answer for a question
router.post('/answer', upload.array('images', 5), async (req, res) => {
  // Debug logging for troubleshooting
  console.log('--- Incoming /api/answer request ---');
  console.log('Body:', req.body);
  if (req.files && req.files.length) {
    console.log('Files:', req.files.map(f => f.originalname));
  } else {
    console.log('Files: none');
  }

  try {
    const { questionId, response, comment, companyId } = req.body;

    
    if (!questionId || !questionId.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid questionId' });
    }
    let images = req.files ? req.files.map(f => f.path) : [];

    // Only proceed if at least one of response, comment, or images is present
    if (!response && !comment && images.length === 0) {
      return res.status(400).json({ success: false, error: 'No answer data provided.' });
    }
    let answer = await Answer.findOne({ question: questionId });
    if (answer) {
      if (typeof response !== 'undefined') answer.response = response;
      // Always set comment, even if empty string
      if (typeof comment !== 'undefined') answer.comment = comment;
      if (images.length > 0) {
        answer.images = answer.images.concat(images);
      }
      // Do NOT delete the answer if comment is empty; just save it
      if (!answer.company) answer.company = companyId;
      await answer.save();
    } else {
      answer = await Answer.create({
        question: questionId,
        response,
        // Always set comment, even if empty string
        comment: typeof comment !== 'undefined' ? comment : '',
        images,
        company: companyId // 👈 REQUIRED!
      });
    }
    res.json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove image from answer
router.post('/answer/image-remove', async (req, res) => {
  try {
    const { questionId, image } = req.body;

    if (!questionId || !questionId.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid questionId' });
    }

    const answer = await Answer.findOne({ question: questionId });
    if (!answer) return res.status(404).json({ success: false, error: 'Answer not found' });

    const index = answer.images.indexOf(image);
    if (index === -1) {
      return res.status(400).json({ success: false, error: 'Image not found in answer' });
    }

    answer.images.splice(index, 1);
    await answer.save();

    res.json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// router.get('/info', async (req, res) => {
//   try {
//     let info = await Info.findOne();
//     if (!info) info = await Info.create({}); // Create default if missing
//     res.json({ success: true, info });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

router.get('/info', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ success: false, error: 'Missing companyId' });

    let info = await Info.findOne({ companyId });
    if (!info) {
      info = await Info.create({
        companyId,
        company: '',
        location: '',
        date: '',
        branch: '',
        manager: '',
        inspector: ''
      });
    } // Create default

    res.json({ success: true, info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// POST /api/info - update info panel values
// router.post('/info', async (req, res) => {
//   try {
//     const body = req.body;

//     let info = await Info.findOne();
//     if (!info) {
//       info = await Info.create(body);
//     } else {
//       Object.assign(info, body);
//       await info.save();
//     }

//     res.json({ success: true, info });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

router.post('/info', async (req, res) => {
  try {
    const { companyId, ...body } = req.body;
    if (!companyId) return res.status(400).json({ success: false, error: 'Missing companyId' });

    let info = await Info.findOne({ companyId });
    if (!info) {
      info = await Info.create({ companyId, ...body });
    } else {
      Object.assign(info, body);
      await info.save();
    }

    res.json({ success: true, info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// POST /api/generate-pdf - export audit report as PDF
router.post('/generate-pdf', async (req, res) => {
  try {
    const doc = new PDFDocument({ autoFirstPage: false });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Audit_Report.pdf');
    console.log('Generating PDF with data:', req.body);
    doc.pipe(res);
    await generatePDFContent(doc, req.body);
    doc.end();
  } catch (error) {
    console.error('PDF generation failed:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'PDF generation failed.' });
    } else {
      res.end();
    }
  }
});

// --- Update Question ---
router.put('/question/:id', async (req, res) => {
  const { text, category } = req.body;
  try {
    await Question.findByIdAndUpdate(req.params.id, { text, category });
    res.redirect('/admin'); // Redirect to admin panel after update
  } catch (err) {
    res.status(500).send('Failed to update question: ' + err.message);
  }
});

// POST /api/clear-all - clears all answers from the database
router.post('/clear-all', async (req, res) => {
  try {
    await Answer.deleteMany({});
    await Info.deleteMany();
      await Info.create({
        company: '',
        location: '',
        date: '',
        branch: '',
        manager: '',
        inspector: ''
});
    console.log('All answers cleared from the database.');
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing answers:', err);
    res.status(500).json({ success: false, message: 'Failed to clear answers' });
  }
});

const Company = require('../models/company');

router.post('/companies', async (req, res) => {
  try {
    const company = await Company.create({ name: req.body.name });
    res.json({ success: true, companyId: company._id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating company' });
  }
});
//category rename route
router.post('/category/edit', async (req, res) => {
  const { categoryId, newName, companyId } = req.body;
  try {
    await Category.findByIdAndUpdate(categoryId, { name: newName });
    res.redirect(`/admin?company=${companyId}`);
  } catch (err) {
    console.error('Error updating category name:', err);
    res.status(500).send('Failed to update category');
  }
});


module.exports = router;
