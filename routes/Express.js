const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { generatePDFContent } = require('./pdf');

router.post('/generate-pdf', async (req, res) => {
  try {
    const auditData = req.body;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Audit_Report.pdf');
    
    doc.pipe(res);
    await generatePDFContent(doc, auditData);
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
