const express = require('express');
const router = express.Router();
const path = require('path');
const PdfPrinter = require('pdfmake');
const { generatePdfMakeDocDefinition } = require('./pdf');


const https = require('https');
const sharp = require('sharp');


// Helper to fetch remote image, compress/resize with sharp, and return base64 data URL
async function fetchImageAsDataURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', async () => {
        try {
          const buffer = Buffer.concat(data);
          // Resize and compress image using sharp
          // You can adjust width/height/quality as needed
          const output = await sharp(buffer)
            .resize({ width: 400 }) // Resize to max width 400px (adjust as needed)
            .jpeg({ quality: 60 }) // Compress JPEG to 60% quality
            .toBuffer();
          resolve(`data:image/jpeg;base64,${output.toString('base64')}`);
        } catch (err) {
          reject(err);
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Recursively replace all image URLs in questions with base64 data URLs
async function embedImagesInAuditData(auditData) {
  if (!auditData.questions) return auditData;
  for (const q of auditData.questions) {
    if (Array.isArray(q.images)) {
      for (let i = 0; i < q.images.length; i++) {
        const url = q.images[i];
        if (typeof url === 'string' && url.startsWith('http')) {
          try {
            q.images[i] = await fetchImageAsDataURL(url);
          } catch (e) {
            // If image fails, leave as is or set to null
            q.images[i] = null;
          }
        }
      }
      // Remove any nulls (failed images)
      q.images = q.images.filter(Boolean);
    }
  }
  return auditData;
}

router.post('/generate-pdf', async (req, res) => {
  try {
    let auditData = req.body;
    auditData = await embedImagesInAuditData(auditData);
    const docDefinition = generatePdfMakeDocDefinition(auditData);

    // Set up fonts for pdfmake
    const fonts = {
      // Poppins: {
      //   normal: path.join(__dirname, '../public/fonts/Poppins-Regular.ttf'),
      //   bold: path.join(__dirname, '../public/fonts/Poppins-Bold.ttf'),
      //   italics: path.join(__dirname, '../public/fonts/Poppins-Regular.ttf'), // Use regular if italics not available
      //   bolditalics: path.join(__dirname, '../public/fonts/Poppins-Bold.ttf')
      // },
      // // Poppins: {
      // //   normal: 'Poppins',
      // //   bold: 'Poppins-Bold',
      // //   italics: 'Poppins-Italic',
      // //   extrabold: 'Poppins-ExtraBold',
      // // },
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Audit_Report.pdf');
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
