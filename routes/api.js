const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Answer } = require('../models/audit');

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
    const { questionId, response, comment } = req.body;
    if (!questionId || !questionId.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid questionId' });
    }
    let images = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
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
      await answer.save();
    } else {
      answer = await Answer.create({
        question: questionId,
        response,
        // Always set comment, even if empty string
        comment: typeof comment !== 'undefined' ? comment : '',
        images
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


module.exports = router;
