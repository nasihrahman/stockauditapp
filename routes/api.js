// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const mongoose = require('mongoose');
// const { Answer, Question } = require('../models/audit');

// // Multer setup for image uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '../public/uploads'));
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
// const upload = multer({ storage });

// // GET /api/answers - get all answers
// router.get('/answers', async (req, res) => {
//   try {
//     const answers = await Answer.find();
//     res.json({ success: true, answers });
//   } catch (err) {
//     console.error('Error fetching answers:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // POST /api/answer - upsert answer for a question
// router.post('/answer', upload.array('images', 5), async (req, res) => {
//   // Enhanced debug logging
//   console.log('--- Incoming /api/answer request ---');
//   console.log('Raw body:', req.body);
//   console.log('Content-Type:', req.get('Content-Type'));
//   console.log('Body keys:', Object.keys(req.body));
  
//   if (req.files && req.files.length) {
//     console.log('Files:', req.files.map(f => ({ name: f.originalname, path: f.path })));
//   } else {
//     console.log('Files: none');
//   }

//   try {
//     const { questionId, response, comment } = req.body;
    
//     // Enhanced validation
//     console.log('Extracted values:');
//     console.log('- questionId:', questionId, typeof questionId);
//     console.log('- response:', response, typeof response);
//     console.log('- comment:', comment, typeof comment);
    
//     // Validate questionId
//     if (!questionId) {
//       console.error('Missing questionId');
//       return res.status(400).json({ success: false, error: 'Missing questionId' });
//     }
    
//     if (typeof questionId !== 'string') {
//       console.error('questionId is not a string:', typeof questionId);
//       return res.status(400).json({ success: false, error: 'questionId must be a string' });
//     }
    
//     if (!mongoose.Types.ObjectId.isValid(questionId)) {
//       console.error('Invalid ObjectId format:', questionId);
//       return res.status(400).json({ success: false, error: 'Invalid questionId format' });
//     }
    
//     // Verify question exists
//     const questionExists = await Question.findById(questionId);
//     if (!questionExists) {
//       console.error('Question not found:', questionId);
//       return res.status(404).json({ success: false, error: 'Question not found' });
//     }
//     console.log('Question found:', questionExists.text);
    
//     // Process images
//     let images = [];
//     if (req.files && req.files.length > 0) {
//       images = req.files.map(f => '/uploads/' + f.filename);
//       console.log('Processed images:', images);
//     }
    
//     // Check if we have any data to save
//     const hasResponse = response && ['yes', 'no', 'na'].includes(response);
//     const hasComment = comment && comment.trim().length > 0;
//     const hasImages = images.length > 0;
    
//     console.log('Data validation:');
//     console.log('- hasResponse:', hasResponse);
//     console.log('- hasComment:', hasComment);
//     console.log('- hasImages:', hasImages);
    
//     if (!hasResponse && !hasComment && !hasImages) {
//       console.log('No valid data to save');
//       return res.status(400).json({ success: false, error: 'No valid answer data provided' });
//     }
    
//     // Find or create answer
//     let answer = await Answer.findOne({ question: questionId });
//     console.log('Existing answer found:', !!answer);
    
//     if (answer) {
//       // Update existing answer
//       console.log('Updating existing answer...');
      
//       if (hasResponse) {
//         console.log('Updating response from', answer.response, 'to', response);
//         answer.response = response;
//       }
      
//       if (typeof comment !== 'undefined') {
//         console.log('Updating comment from', answer.comment, 'to', comment);
//         answer.comment = comment || ''; // Allow empty string to clear comment
//       }
      
//       if (hasImages) {
//         console.log('Adding images to existing:', answer.images);
//         answer.images = (answer.images || []).concat(images);
//         console.log('New images array:', answer.images);
//       }
      
//       await answer.save();
//       console.log('Answer updated successfully');
      
//     } else {
//       // Create new answer
//       console.log('Creating new answer...');
      
//       const answerData = {
//         question: questionId,
//         response: hasResponse ? response : undefined,
//         comment: hasComment ? comment : '',
//         images: images || []
//       };
      
//       console.log('New answer data:', answerData);
      
//       answer = await Answer.create(answerData);
//       console.log('Answer created successfully:', answer._id);
//     }
    
//     // Populate the question for response
//     await answer.populate('question');
    
//     console.log('Final answer:', {
//       id: answer._id,
//       question: answer.question._id,
//       response: answer.response,
//       comment: answer.comment,
//       images: answer.images
//     });
    
//     res.json({ success: true, answer });
    
//   } catch (err) {
//     console.error('Error in /api/answer:', err);
//     console.error('Stack trace:', err.stack);
    
//     // Send detailed error for debugging
//     res.status(500).json({ 
//       success: false, 
//       error: err.message,
//       details: process.env.NODE_ENV === 'development' ? err.stack : undefined
//     });
//   }
// });

// // Remove image from answer
// router.post('/answer/remove-image', async (req, res) => {
//   try {
//     const { questionId, imgIdx } = req.body;
    
//     if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
//       return res.status(400).json({ success: false, error: 'Invalid questionId' });
//     }
    
//     const answer = await Answer.findOne({ question: questionId });
//     if (!answer) {
//       return res.status(404).json({ success: false, error: 'Answer not found' });
//     }
    
//     if (!answer.images || !answer.images[imgIdx]) {
//       return res.status(400).json({ success: false, error: 'Image not found' });
//     }
    
//     answer.images.splice(imgIdx, 1);
//     await answer.save();
    
//     res.json({ success: true, answer });
//   } catch (err) {
//     console.error('Error removing image:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { Answer, Question } = require('../models/audit');

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
    console.error('Error fetching answers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/answer - upsert answer for a question
// Handle both JSON and multipart requests
router.post('/answer', (req, res, next) => {
  // Check if this is a multipart request (has files)
  const contentType = req.get('Content-Type') || '';
  
  if (contentType.includes('multipart/form-data')) {
    // Use multer for multipart requests
    upload.array('images', 5)(req, res, next);
  } else {
    // Skip multer for JSON requests
    next();
  }
}, async (req, res) => {
  // Enhanced debug logging
  console.log('--- Incoming /api/answer request ---');
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Raw body:', req.body);
  console.log('Body keys:', Object.keys(req.body));
  
  if (req.files && req.files.length) {
    console.log('Files:', req.files.map(f => ({ name: f.originalname, path: f.path })));
  } else {
    console.log('Files: none');
  }

  try {
    let { questionId, response, comment } = req.body;
    
    // Handle case where data might be nested (sometimes happens with multipart)
    if (!questionId && req.body.data) {
      const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
      questionId = data.questionId;
      response = data.response;
      comment = data.comment;
    }
    
    // Enhanced validation
    console.log('Extracted values:');
    console.log('- questionId:', questionId, typeof questionId);
    console.log('- response:', response, typeof response);
    console.log('- comment:', comment, typeof comment);
    
    // Validate questionId
    if (!questionId) {
      console.error('Missing questionId - req.body:', req.body);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing questionId',
        receivedBody: req.body
      });
    }
    
    // Convert to string if it isn't already
    questionId = String(questionId).trim();
    
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      console.error('Invalid ObjectId format:', questionId);
      return res.status(400).json({ success: false, error: 'Invalid questionId format' });
    }
    
    // Verify question exists
    const questionExists = await Question.findById(questionId);
    if (!questionExists) {
      console.error('Question not found:', questionId);
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    console.log('Question found:', questionExists.text);
    
    // Process images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => '/uploads/' + f.filename);
      console.log('Processed images:', images);
    }
    
    // Check if we have any data to save
    const hasResponse = response && ['yes', 'no', 'na'].includes(response);
    const hasComment = comment && typeof comment === 'string' && comment.trim().length > 0;
    const hasImages = images.length > 0;
    
    console.log('Data validation:');
    console.log('- hasResponse:', hasResponse);
    console.log('- hasComment:', hasComment);
    console.log('- hasImages:', hasImages);
    
    // Allow saving even if only one field has data
    if (!hasResponse && !hasComment && !hasImages) {
      // Special case: allow saving with empty comment to clear it
      if (typeof comment === 'string') {
        console.log('Allowing save to clear comment');
      } else {
        console.log('No valid data to save');
        return res.status(400).json({ success: false, error: 'No valid answer data provided' });
      }
    }
    
    // Find or create answer
    let answer = await Answer.findOne({ question: questionId });
    console.log('Existing answer found:', !!answer);
    
    if (answer) {
      // Update existing answer
      console.log('Updating existing answer...');
      
      if (hasResponse) {
        console.log('Updating response from', answer.response, 'to', response);
        answer.response = response;
      }
      
      if (typeof comment !== 'undefined') {
        console.log('Updating comment from', answer.comment, 'to', comment);
        answer.comment = comment || ''; // Allow empty string to clear comment
      }
      
      if (hasImages) {
        console.log('Adding images to existing:', answer.images);
        answer.images = (answer.images || []).concat(images);
        console.log('New images array:', answer.images);
      }
      
      await answer.save();
      console.log('Answer updated successfully');
      
    } else {
      // Create new answer
      console.log('Creating new answer...');
      
      const answerData = {
        question: questionId,
        response: hasResponse ? response : undefined,
        comment: typeof comment === 'string' ? comment : '',
        images: images || []
      };
      
      console.log('New answer data:', answerData);
      
      answer = await Answer.create(answerData);
      console.log('Answer created successfully:', answer._id);
    }
    
    // Populate the question for response
    await answer.populate('question');
    
    console.log('Final answer:', {
      id: answer._id,
      question: answer.question._id,
      response: answer.response,
      comment: answer.comment,
      images: answer.images
    });
    
    res.json({ success: true, answer });
    
  } catch (err) {
    console.error('Error in /api/answer:', err);
    console.error('Stack trace:', err.stack);
    
    // Send detailed error for debugging
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Remove image from answer
router.post('/answer/remove-image', async (req, res) => {
  try {
    const { questionId, imgIdx } = req.body;
    
    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, error: 'Invalid questionId' });
    }
    
    const answer = await Answer.findOne({ question: questionId });
    if (!answer) {
      return res.status(404).json({ success: false, error: 'Answer not found' });
    }
    
    if (!answer.images || !answer.images[imgIdx]) {
      return res.status(400).json({ success: false, error: 'Image not found' });
    }
    
    answer.images.splice(imgIdx, 1);
    await answer.save();
    
    res.json({ success: true, answer });
  } catch (err) {
    console.error('Error removing image:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;