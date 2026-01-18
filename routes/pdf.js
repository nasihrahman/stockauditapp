
// Helper functions (same logic as before)
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

function forceJpgFormat(url) {
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/f_jpg/');
}

// Main pdfmake doc definition generator
function generatePdfMakeDocDefinition(data) {
  const totalScoreText = data.totalScoreDetails;
  const grade = getGrade(totalScoreText);
  const percent = totalScoreText.match(/\((\d+)%\)/)?.[1] || "0";

  // Category summary table
  const categorySummaryTable = [
    [
      { text: 'Category Name', style: 'tableHeader' },
      { text: 'Score', style: 'tableHeader' },
      { text: 'Percentage', style: 'tableHeader' }
    ],
    ...data.categorySummaries.map(cat => {
      const match = cat.score.match(/\((\d+)%\)/);
      const percentage = match ? match[1] + '%' : '-';
      const scoreValue = cat.score.split('(')[0].trim();
      return [
        { text: cat.name, style: 'tableCell' },
        { text: scoreValue, style: 'tableCell' },
        { text: percentage, style: 'tableCell' }
      ];
    })
  ];

  // Questions by category as tables
  let questionsByCategory = [];
  let currentCategory = '';
  let questionRows = [];
  let questionNumber = 1;
  const pushCategoryTable = () => {
    if (!currentCategory || questionRows.length === 0) return;
    questionsByCategory.push({
      table: {
        widths: ['70%', '30%'],
        body: [
          [
            {
              colSpan: 2,
              text: `${currentCategory}     Score: ${data.categorySummaries.find(c => c.name === currentCategory)?.score || '0/0 (0%)'}`,
              style: 'categoryHeaderTable',
              alignment: 'left',
              margin: [0, 0, 0, 0]
            },
            {}
          ],
          ...questionRows
        ]
      },
      layout: {
        fillColor: function (rowIndex, node, columnIndex) {
          if (rowIndex === 0) return '#1e293b';
          return rowIndex % 2 === 0 ? '#f8fafc' : '#fff';
        },
        paddingLeft: function() { return 12; },
        paddingRight: function() { return 12; },
        paddingTop: function() { return 8; },
        paddingBottom: function() { return 8; },
        hLineWidth: function(i, node) { return i === 1 ? 2 : 0.5; },
        vLineWidth: function() { return 0.5; },
        hLineColor: function(i, node) { return i === 1 ? '#1e293b' : '#e5e7eb'; },
        vLineColor: function() { return '#e5e7eb'; }
      },
      margin: [0, 20, 0, 20]
    });
    questionRows = [];
  };

  data.questions.forEach((q, idx) => {
    if (q.category !== currentCategory) {
      pushCategoryTable();
      currentCategory = q.category;
      questionNumber = 1;
    }
    // Question row
    let questionCell = {
      stack: [
        { text: ` ${q.question}`, style: 'questionText', alignment: 'left' },
        ...(q.comment ? [{ text: `Comment: ${q.comment}`, style: 'commentText', margin: [0, 4, 0, 0] }] : [])
      ]
    };
    let answerCell = { text: q.answer || 'Not Answered', style: 'answerText', color: getAnswerColor(q.answer), alignment: 'center' };
    questionRows.push([questionCell, answerCell]);
    // Images (as extra row)
    if (q.images?.length > 0) {
      questionRows.push([
        {
          colSpan: 2,
          stack: q.images.map(imgUrl => ({ image: forceJpgFormat(imgUrl), width: 150, margin: [0, 4, 0, 8] })),
          margin: [0, 4, 0, 8]
        },
        {}
      ]);
    }
    questionNumber++;
  });
  pushCategoryTable();

  // Main doc definition
  const docDefinition = {
    content: [
      // COVER PAGE
      {
        image: 'images/logo.png',
        width: 170,
        alignment: 'center',
        margin: [0, 50, 0, 30]
      },
      {
        text: 'AUDIT REPORT',
        style: 'coverTitle',
        margin: [20, 20, 20, 20]
      },
      {
        text: `${percent}%`,
        style: 'coverScore',
        margin: [0, 0, 0, 10]
      },
      {
        text: 'PERFORMANCE GRADE',
        style: 'coverSubtitle',
        margin: [0, 20, 0, 10]
      },
      {
        text: grade,
        style: 'coverGrade',
        color: getGradeColor(grade),
        margin: [0, 0, 0, 40]
      },
      {
        stack: [
          { text: `Company Name: ${data.info.company || 'N/A'}` },
          { text: `Outlet: ${data.info.location || 'N/A'}` },
          { text: `Audit Date: ${data.info.date || 'N/A'}` },
          { text: `Auditor: ${data.info.inspector || 'N/A'}` }
        ],
        style: 'coverInfo',
        margin: [0, 40, 0, 0]
      },
      { text: '', pageBreak: 'after' },


      // AUDIT SUMMARY PAGE
      { text: 'Audit Summary', style: 'sectionTitle', alignment: 'center' },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            alignment: 'center',
            table: {
              widths: [150, '*'],
              body: [
                ['Company Name', data.info.company],
                ['Outlet', data.info.location],
                ['Branch', data.info.branch],
                ['Audit Date', data.info.date],
                ['Manager On Duty',data.info.manager],
                ['Auditor Name', data.info.inspector],
                ['Total Score', data.totalScore],
                ['Score Details', data.totalScoreDetails],
                ['Performance Grade', grade],
                ['Report Generated', new Date().toLocaleDateString()]
              ]
            },
            layout: {
              hLineWidth: function() { return 0.5; },
              vLineWidth: function() { return 0.5; },
              hLineColor: function() { return '#e5e7eb'; },
              vLineColor: function() { return '#e5e7eb'; },
              paddingLeft: function() { return 12; },
              paddingRight: function() { return 12; },
              paddingTop: function() { return 8; },
              paddingBottom: function() { return 8; }
            },
            margin: [0, 10, 0, 30]
          },
          { width: '*', text: '' }
        ],
        columnGap: 0
      },
      { text: '', pageBreak: 'after' },

      // CATEGORY PERFORMANCE SUMMARY PAGE
      { text: 'Category Performance Summary', style: 'sectionTitle', alignment: 'center' },
      {
        columns: [
          {
            width: 'auto',
            alignment: 'center',
            table: {
              widths: [250, 100, 100],
              body: categorySummaryTable
            },
            layout: {
              hLineWidth: function() { return 0.5; },
              vLineWidth: function() { return 0.5; },
              hLineColor: function() { return '#e5e7eb'; },
              vLineColor: function() { return '#e5e7eb'; },
              paddingLeft: function() { return 12; },
              paddingRight: function() { return 12; },
              paddingTop: function() { return 8; },
              paddingBottom: function() { return 8; }
            },
            margin: [0, 10, 0, 30]
          }
        ],
        columnGap: 0
      },
      { text: '', pageBreak: 'after' },

      // QUESTIONS BY CATEGORY
      ...questionsByCategory
    ],
    styles: {
      coverTitle: { fontSize: 38, bold: true, alignment: 'center', color: '#1e293b' },
      coverScore: { fontSize: 48, bold: true, color: '#22c55e', alignment: 'center' },
      coverSubtitle: { fontSize: 16, color: '#374151', alignment: 'center' },
      coverGrade: { fontSize: 28, bold: true, alignment: 'center' },
      coverInfo: { fontSize: 14, color: '#6b7280', alignment: 'center' },
      sectionTitle: { fontSize: 24, bold: true, color: '#1e293b', margin: [0, 0, 0, 10] },
      tableHeader: { fillColor: '#1e293b', color: 'white', bold: true, fontSize: 14, alignment: 'center' },
      tableCell: { fontSize: 12, color: '#374151', alignment: 'center' },
      categoryHeader: { fontSize: 18, bold: true, color: 'black', lineHeight: 1.3 },
      categoryHeaderBg: {
        fillColor: '#1e293b',
        color: '#1e293b',
        margin: [0, 10, 0, 10],
        alignment: 'left',
        fontSize: 18,
        bold: true,
        lineHeight: 1.3,
        padding: 10
      },
      categoryHeaderTable: { fontSize: 16, bold: true, color: 'white', fillColor: '#1e293b', margin: [0, 0, 0, 0], alignment: 'left', lineHeight: 1.3, padding: 10 },
      categoryScore: { fontSize: 14, color: 'black', margin: [0, 0, 0, 0] },
      questionText: { fontSize: 11, color: '#374151', margin: [0, 0, 0, 2] },
      questionComment: { fontSize: 10, italics: true, color: '#6b7280', margin: [0, 2, 0, 0] },
      answerText: { fontSize: 12, bold: true, alignment: 'center' },
      commentText: { fontSize: 10, italics: true, color: '#6b7280' }
    },
    footer: function(currentPage, pageCount) {
      return {
        text: `Report Generated: ${new Date().toLocaleString()} | Page ${currentPage} of ${pageCount}`,
        alignment: 'center',
        fontSize: 9,
        color: '#6b7280',
        margin: [0, 0, 0, 10]
      };
    },
    defaultStyle: {
      font: 'Helvetica'
    }
  };

  return docDefinition;
}

module.exports = { generatePdfMakeDocDefinition };