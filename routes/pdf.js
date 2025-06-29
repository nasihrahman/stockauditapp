const PDFDocument = require('pdfkit');
const https = require('https');

function getAnswerColor(answer) {
  switch (answer?.toLowerCase()) {
    case 'yes': return '#10b981';
    case 'no': return '#ef4444';
    case 'na': return '#6b7280';
    default: return '#f59e0b';
  }
}

function getGradeColor(grade) {
  switch (grade) {
    case 'EXCELLENT': return '#10b981';
    case 'GOOD': return '#3b82f6';
    case 'FAIR': return '#f59e0b';
    case 'NEEDS IMPROVEMENT': return '#ef4444';
    default: return '#6b7280';
  }
}

function getGrade(scoreText) {
  const match = scoreText.match(/\((\d+)%\)/);
  const percent = match ? parseInt(match[1]) : 0;
  if (percent >= 95) return 'EXCELLENT';
  if (percent >= 85) return 'GOOD';
  if (percent >= 75) return 'FAIR';
  return 'NEEDS IMPROVEMENT';
}

function downloadImageToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

async function generatePDFContent(doc, data) {
  const totalScoreText = data.totalScoreDetails;
  const grade = getGrade(totalScoreText);
  const percent = totalScoreText.match(/\((\d+)%\)/)?.[1] || "0";

  // === COVER PAGE - NO LOGO, CLEAN DESIGN ===
  // Main title - centered and professional
  doc.fontSize(42).fillColor('#1e293b').font('Helvetica-Bold')
    .text('SERVICE EXCELLENCE', 0, 150, { align: 'center' });
  
  doc.fontSize(32).fillColor('#3b82f6')
    .text('AUDIT REPORT', 0, 200, { align: 'center' });

  // Score display with background
  doc.moveDown(4);
  const centerX = doc.page.width / 2;
  const scoreY = 300;
  
  // Score background rectangle
  doc.rect(centerX - 100, scoreY - 40, 200, 80)
    .fill('#f8fafc').stroke('#e2e8f0', 2);
  
  // Score percentage
  doc.fontSize(48).fillColor('#22c55e').font('Helvetica-Bold')
    .text(`${percent}%`, centerX - 50, scoreY - 20, { align: 'left' });

  // Grade display with color
  doc.fontSize(16).fillColor('#374151').font('Helvetica')
    .text('PERFORMANCE GRADE', 0, scoreY + 80, { align: 'center' });
  
  doc.fontSize(28).fillColor(getGradeColor(grade)).font('Helvetica-Bold')
    .text(grade, 0, scoreY + 105, { align: 'center' });

  // Company info at bottom - clean layout
  doc.fontSize(16).fillColor('#6b7280').font('Helvetica')
    // .text(`${data.info.company || 'Company Name'}`, 0, 500, { align: 'center' })
    // .text(`Location: ${data.info.location || 'Location'} - ${data.info.branch || 'Branch'}`, 0, 525, { align: 'center' })
    .text(`Company Name: ${data.info.company || 'N/A'}`, 0, 500, { align: 'center' })

    .text(`Location: ${data.info.location || 'N/A'}`, 0, 525, { align: 'center' })
    .text(`Audit Date: ${data.info.date || 'N/A'}`, 0, 550, { align: 'center' })
    .text(`Inspector: ${data.info.inspector || 'N/A'}`, 0, 575, { align: 'center' });

  doc.addPage();

  // === AUDIT SUMMARY PAGE - COMPLETE INFO ===
  // Page header
  doc.fontSize(24).fillColor('#1e293b').font('Helvetica-Bold')
    .text('Audit Summary', 50, 50);
  
  // Decorative line
  doc.moveTo(50, 85).lineTo(550, 85).stroke('#3b82f6', 3);
  
  // Complete audit information in organized layout
  let currentY = 110;
  doc.fontSize(14).fillColor('#374151').font('Helvetica');
  
  const auditInfo = [
    { label: 'Company Name', value: data.info.company },
    { label: 'Location', value: data.info.location },
    { label: 'Branch', value: data.info.branch },
    { label: 'Audit Date', value: data.info.date },
    { label: 'Inspector Name', value: data.info.inspector },
    { label: 'Total Score', value: data.totalScore },
    { label: 'Score Details', value: data.totalScoreDetails },
    { label: 'Performance Grade', value: grade },
    { label: 'Report Generated', value: new Date().toLocaleDateString() }
  ];

  // Draw info in a structured format
  auditInfo.forEach((item, index) => {
    // Background for each row
    const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(50, currentY, 500, 25).fill(bgColor).stroke('#e5e7eb', 0.5);
    
    // Label and value
    doc.fillColor('#1e293b').font('Helvetica-Bold')
      .text(item.label + ':', 60, currentY + 7, { width: 150 });
    
    doc.fillColor('#374151').font('Helvetica')
      .text(item.value || 'N/A', 220, currentY + 7, { width: 320 });
    
    currentY += 25;
  });

  // === ENHANCED CATEGORY SUMMARY TABLE ===
  currentY += 30;
  doc.fontSize(20).fillColor('#1e293b').font('Helvetica-Bold')
    .text('Category Performance Summary', 50, currentY);
  
  // Decorative line
  doc.moveTo(50, currentY + 30).lineTo(550, currentY + 30).stroke('#3b82f6', 3);
  currentY += 50;

  const tableX = 50;
  const colWidths = [300, 100, 100]; // Adjusted widths
  const rowHeight = 35;

  // Table header
  doc.rect(tableX, currentY, colWidths.reduce((a, b) => a + b), rowHeight)
    .fill('#1e293b');
  
  doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
    .text('Category Name', tableX + 15, currentY + 12)
    .text('Score', tableX + colWidths[0] + 15, currentY + 12)
    .text('Percentage', tableX + colWidths[0] + colWidths[1] + 15, currentY + 12);
  
  currentY += rowHeight;

  // Table rows
  data.categorySummaries.forEach((cat, index) => {
    const match = cat.score.match(/\((\d+)%\)/);
    const percentage = match ? match[1] + '%' : '-';
    const scoreValue = cat.score.split('(')[0].trim();
    
    const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(tableX, currentY, colWidths.reduce((a, b) => a + b), rowHeight)
      .fill(bgColor).stroke('#e2e8f0', 1);

    doc.fillColor('#374151').fontSize(12).font('Helvetica')
      .text(cat.name, tableX + 15, currentY + 12, { width: colWidths[0] - 20 })
      .text(scoreValue, tableX + colWidths[0] + 15, currentY + 12)
      .text(percentage, tableX + colWidths[0] + colWidths[1] + 15, currentY + 12);
    
    currentY += rowHeight;
  });

  // === QUESTIONS BY CATEGORY - FIXED LAYOUT ===
  let currentCategory = '';
  let questionNumber = 1;

  for (const q of data.questions) {
    if (q.category !== currentCategory) {
      doc.addPage();
      currentCategory = q.category;

      // Category header
      const score = data.categorySummaries.find(c => c.name === currentCategory)?.score || '0/0 (0%)';
      
      doc.rect(30, 40, 540, 50).fill('#1e293b');
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
        .text(currentCategory, 50, 55)
        .fontSize(14).font('Helvetica')
        .text(`Category Score: ${score}`, 50, 75);
    }

    // Calculate space needed for this question - updated for table format
    let spaceNeeded = 50; // Base space for table row (reduced from 150)
    if (q.comment) spaceNeeded += 25; // Reduced from 30
    if (q.images?.length > 0) spaceNeeded += q.images.length * 110; // Reduced from 130
    
    // Check if we need a new page
    if (doc.y + spaceNeeded > doc.page.height - 80) {
      doc.addPage();
      
      // Repeat category header on new page
      doc.rect(30, 40, 540, 50).fill('#1e293b');
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
        .text(currentCategory + ' (continued)', 50, 55)
        .fontSize(14).font('Helvetica')
        .text(`Category Score: ${score}`, 50, 75);
      
      doc.y = 110; // Reset Y position after header
    }

    // Ensure we start at correct Y position
    if (doc.y < 110) doc.y = 110;

    // Question container - Table format with question left, answer right
    const startY = doc.y;
    
    // Calculate question text height for proper row sizing
    const questionText = `Q${questionNumber}. ${q.question}`;
    const questionHeight = doc.heightOfString(questionText, { 
      width: 320, // Left column width minus padding
      fontSize: 11 
    });
    
    // Minimum row height for short questions
    const rowHeight = Math.max(questionHeight + 16, 40);
    
    // Draw table row background
    doc.rect(50, startY, 500, rowHeight).fill('#f8fafc').stroke('#d1d5db', 1);
    
    // Left column - Question (70% of width)
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold')
      .text(`Q${questionNumber}.`, 60, startY + 8, { width: 25 });
    
    doc.fillColor('#374151').font('Helvetica')
      .text(q.question, 85, startY + 8, { 
        width: 280,  // Question column width
        lineGap: 1
      });
    
    // Vertical divider line
    doc.moveTo(370, startY).lineTo(370, startY + rowHeight).stroke('#d1d5db', 1);
    
    // Right column - Answer (30% of width)
    doc.fillColor(getAnswerColor(q.answer)).fontSize(12).font('Helvetica-Bold')
      .text(q.answer || 'Not Answered', 385, startY + 8, { 
        width: 150,
        align: 'center',
        valign: 'center'
      });
    
    // Move Y position past the row
    doc.y = startY + rowHeight;

    // Comment section (if exists) - full width below the table row
    if (q.comment) {
      doc.rect(50, doc.y, 500, 25).fill('#ffffff').stroke('#d1d5db', 1);
      doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique')
        .text('Comment:', 60, doc.y + 6, { continued: true })
        .font('Helvetica')
        .text(` ${q.comment}`, { width: 430 });
      
      doc.y += 25;
    }

    // Images section (if any) - reduced spacing
    // if (q.images?.length > 0) {
    //   doc.y += 5; // Reduced from 10
    //   for (const imageUrl of q.images) {
    //     try {
    //       const img = await downloadImageToBuffer(imageUrl);
    //       doc.image(img, 60, doc.y, { fit: [480, 100] }); // Reduced height from 120
    //       doc.y += 110; // Reduced from 130
    //     } catch (err) {
    //       doc.fillColor('#ef4444').fontSize(10)
    //         .text('[Image could not be loaded]', 60, doc.y);
    //       doc.y += 15; // Reduced from 20
    //     }
    //   }
    // }

    // Reduced spacing between questions
    doc.y += 10; // Reduced from 25
    questionNumber++;
  }

  // === FOOTER - SIMPLIFIED APPROACH ===
  // Add footer to current page only (you can add to each page individually if needed)
  doc.fontSize(9).fillColor('#6b7280').font('Helvetica')
    .text(`Report Generated: ${new Date().toLocaleString()}`, 
          50, doc.page.height - 30, { align: 'center', width: 500 });
}

module.exports = { generatePDFContent };