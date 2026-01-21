function getCompanyIdFromUrl() {
  return window.location.pathname.split('/').pop(); // gets last segment from /audit/:companyId
}

function openAudit(id) {
    window.location.href = `/audit/${id}`;
  }

 function editCompany(id) {
    window.location.href = `/admin?company=${id}`;
  }



   document.getElementById('clearAllBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all responses? This action cannot be undone.')) {
        clearAllResponses();
    }
});

function clearAllResponses() {
    // Clear all radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });
    
    // Clear all comments
    document.querySelectorAll('.comment-input').forEach(input => {
        input.value = '';
    });
    
    // Clear all image previews
    document.querySelectorAll('.image-preview').forEach(preview => {
        preview.innerHTML = '';
    });
    // Clear info panel fields
    // document.querySelectorAll('.info-value').forEach(field => {
    //     field.textContent = '';
    // });
    // Update scores
    updateScores();
    
    // Send clear request to backend
    fetch('/api/clear-all/' + getCompanyIdFromUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('All responses cleared successfully!');
        }
    })
    .catch(err => {
        console.error('Error clearing responses:', err);
        alert('Error clearing responses. Please try again.');
    });
}

// PDF Export Functionality
document.getElementById('exportPdfBtn').addEventListener('click', function() {
    this.textContent = ' Generating PDF...';
    this.disabled = true;
    
    generatePDF().then(() => {
        this.textContent = ' Save PDF';
        this.disabled = false;
    }).catch(err => {
        console.error('PDF Generation Error:', err);
        alert('Error generating PDF. Please try again.');
        this.textContent = ' Save PDF';
        this.disabled = false;
    });
});

document.getElementById('exportPdfBtnBottom').addEventListener('click', function() {
    this.textContent = ' Generating PDF...';
    this.disabled = true;
    
    generatePDF().then(() => {
        this.textContent = ' Save PDF';
        this.disabled = false;
    }).catch(err => {
        console.error('PDF Generation Error:', err);
        alert('Error generating PDF. Please try again.');
        this.textContent = ' Save PDF';
        this.disabled = false;
    });
});

async function generatePDF() {
    try {
        // Prepare audit data
        const auditData = await prepareAuditData();
        
        // Send to backend for PDF generation
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auditData)
        });
        
        if (!response.ok) {
            throw new Error('PDF generation failed');
        }
        
        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        throw error;
    }
}

async function prepareAuditData() {
    // Get info panel data
    const infoData = {
        company: document.querySelector('[name="company"]').textContent.trim(),
        location: document.querySelector('[name="location"]').textContent.trim(),
        date: document.querySelector('[name="date"]').textContent.trim(),
        branch: document.querySelector('[name="branch"]').textContent.trim(),
        manager: document.querySelector('[name="manager"]').textContent.trim(),
        inspector: document.querySelector('[name="inspector"]').textContent.trim()
    };
    
    // Get category summaries
    const categorySummaries = [];
    document.querySelectorAll('.category-card').forEach(catCard => {
        const catName = catCard.querySelector('.category-title').childNodes[0].textContent.trim();
        const catBadge = catCard.querySelector('.category-score-badge');
        const scoreText = catBadge ? catBadge.textContent : '0/0 (0%)';
        
        categorySummaries.push({
            name: catName,
            score: scoreText
        });
    });

    
    // Get total score
    const totalScore = document.getElementById('totalScore').textContent;
    const totalScoreDetails = document.getElementById('totalScoreDetails').textContent;
    
    // Get all questions and answers
    const questionsData = [];
    document.querySelectorAll('.question-item').forEach(item => {
        const questionId = item.getAttribute('data-question-id');
        const questionText = item.querySelector('.question-text').textContent.trim();
        const categoryCard = item.closest('.category-card');
        const categoryName = categoryCard.querySelector('.category-title').childNodes[0].textContent.trim();
        
        // Get selected answer and severity
        let selectedAnswer = 'Not Answered';
        let severity = null;
        const radios = item.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            if (radio.checked) {
                if (radio.name.startsWith('response-')) {
                    selectedAnswer = radio.value.toUpperCase();
                } else if (radio.name.startsWith('severity-')) {
                    severity = radio.value;
                }
            }
        });
        
        // Get comment
        const comment = item.querySelector('.comment-input').value.trim();
        
        // Get images
        const images = [];
        const imageElements = item.querySelectorAll('.image-preview img');
        imageElements.forEach(img => {
            images.push(img.src);
        });
        
        questionsData.push({
            id: questionId,
            category: categoryName,
            question: questionText,
            answer: selectedAnswer,
            severity: severity,
            comment: comment,
            images: images
        });
    });
    
    return {
        info: infoData,
        categorySummaries: categorySummaries,
        totalScore: totalScore,
        totalScoreDetails: totalScoreDetails,
        questions: questionsData,
        generatedAt: new Date().toISOString()
    };
}

    let isPrefilling = false;
    // --- AJAX: Fetch and prefill answers on load ---
    function fetchAndPrefillAnswers() {
      isPrefilling = true; // ⛳️ Start prefilling
      fetch(`/api/answers?companyId=${getCompanyIdFromUrl()}`)
        .then(res => res.json())
        .then(data => {
          if (data.answers) {
            data.answers.forEach(ans => {
              // Set radio
              if (ans.response) {
                const radio = document.querySelector(`input[type="radio"][name='response-${ans.question}'][value='${ans.response}']`);
                if (radio) {
                  radio.checked = true;
                  
                  // Show no-options if prefilled value is 'no'
                  if (ans.response === 'no') {
                    const noOptions = document.getElementById(`no-options-${ans.question}`);
                    if (noOptions) noOptions.style.display = 'block';
                  }

                  // Trigger change event to update score UI
                  radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }
              // Set severity
              if (ans.severity) {
                const sevRadio = document.querySelector(`input[type="radio"][name='severity-${ans.question}'][value='${ans.severity}']`);
                if (sevRadio) sevRadio.checked = true;
              }
              // Set comment
              const comment = document.querySelector(`.question-item[data-question-id='${ans.question}'] .comment-input`);
              if (comment && typeof ans.comment === 'string') comment.value = ans.comment;
              // Set image preview(s)
              if (ans.images && ans.images.length) {
                renderImagePreview(ans.question, ans.images);
              }
            });
            updateScores();
          }
        })
        .finally(() => {
          isPrefilling = false; // ✅ Done prefilling
        });
    }

    // --- AJAX: Save answer ---
    function saveAnswer(questionId, data, isImage) {
        const companyId = getCompanyIdFromUrl();
      let fetchOptions = {
        method: 'POST',
        body: undefined
      };
      if (isImage) {
        const formData = new FormData();
        Object.keys(data).forEach(k => formData.append(k, data[k]));
        formData.append('companyId', companyId); 
        fetchOptions.body = formData;
      } else {
        data.companyId = companyId;
        fetchOptions.headers = { 'Content-Type': 'application/json' };
        fetchOptions.body = JSON.stringify(data);
      }
      fetch('/api/answer', fetchOptions)
        .then(res => res.json())
        .then(resp => {
          if (resp.success && resp.answer && resp.answer.images && isImage) {
            renderImagePreview(questionId, resp.answer.images);
          }
        })
        .catch(() => {
          alert('Failed to save answer. Please try again.');
        });
    }

    // --- Scoring logic: update per-question, per-category, and total scores ---
    function updateScores() {
      // Per-question score badge
      document.querySelectorAll('.question-item').forEach(function(item) {
        const radios = item.querySelectorAll('input[type="radio"]');
        let score = 0;
        radios.forEach(r => {
          if (r.checked && r.value === 'yes') score = 1;
        });
        const badge = item.querySelector('.question-score-badge');
        if (badge) badge.textContent = score;
      });

      // Per-category and total
      let totalScore = 0, totalPossible = 0;
      document.querySelectorAll('.category-card').forEach(function(catCard) {
        const catId = catCard.getAttribute('data-category-id');
        const questions = catCard.querySelectorAll('.question-item');
        let catScore = 0, catPossible = 0;
        questions.forEach(function(item) {
          const radios = item.querySelectorAll('input[type="radio"]');
          let answered = false;
          radios.forEach(r => {
            if (r.checked) {
              answered = true;
              if (r.value === 'yes') catScore += 1;
            }
          });
          // Only count as possible if not N/A
          if (answered && radios[2] && !radios[2].checked) catPossible += 1;
          // If N/A is selected, do not count as possible
          if (answered && radios[2] && radios[2].checked) {
            // N/A selected, do not increment possible
          } else if (answered) {
            // Yes/No selected, increment possible
            // Already handled above
          }
        });
        totalScore += catScore;
        totalPossible += catPossible;
        // Update category badge
        const catBadge = catCard.querySelector('.category-score-badge');
        if (catBadge) {
          catBadge.textContent = `${catScore}/${catPossible} (${catPossible ? Math.round(catScore/catPossible*100) : 0}%)`;
        }
      });
      // Update total
      document.getElementById('totalScore').textContent = totalScore;
      document.getElementById('totalScoreDesktop').textContent = totalScore;
      const percentage = totalPossible ? Math.round(totalScore / totalPossible * 100) : 0;
      document.getElementById('totalScoreDetails').textContent = `${totalScore} / ${totalPossible} (${percentage}%)`;
      document.getElementById('totalScorePercent').textContent = `${percentage}%`;
      // Update summary panel
      updateSummaryPanel();
    }

    // --- DYNAMIC SUMMARY PANEL ---
    // function updateSummaryPanel() {
    //   const tbody = document.getElementById('summaryTableBody');
    //   tbody.innerHTML = '';
    //   document.querySelectorAll('.category-card').forEach(function(catCard) {
    //     const catName = catCard.querySelector('.category-title').childNodes[0].textContent.trim();
    //     const catBadge = catCard.querySelector('.category-score-badge');
    //     let score = catBadge ? catBadge.textContent : '0/0 (0%)';
    //     let [scored, possible] = score.split('/');
    //     possible = possible.split(' ')[0];
    //     let percent = score.match(/\((\d+)%\)/);
    //     percent = percent ? percent[1] : '0';
    //     let status = 'Pending', badgeClass = 'badge bg-secondary';
    //     if (possible > 0) {
    //       if (percent >= 80) { status = 'Pass'; badgeClass = 'badge bg-success'; }
    //       else if (percent >= 50) { status = 'Warning'; badgeClass = 'badge bg-secondary'; }
    //       else { status = 'Fail'; badgeClass = 'badge bg-danger'; }
    //     }
    //     const tr = document.createElement('tr');
    //     tr.innerHTML = `
    //       <td class="fw-semibold">${catName}</td>
    //       <td>${scored}/${possible}</td>
    //       <td>${percent}%</td>
    //       <td><span class="${badgeClass}">${status}</span></td>
    //     `;
    //     tbody.appendChild(tr);
    //   });
    // }
    
    function updateSummaryPanel() {
  const tbody = document.getElementById('summaryTableBody');
  tbody.innerHTML = '';

  document.querySelectorAll('.category-card').forEach(function (catCard) {
    const catName = catCard.querySelector('.category-title').childNodes[0].textContent.trim();
    const catBadge = catCard.querySelector('.category-score-badge');
    const categoryId = catCard.getAttribute('data-category-id');

    let score = catBadge ? catBadge.textContent : '0/0 (0%)';
    let [scored, possible] = score.split('/');
    possible = possible.split(' ')[0];
    let percentMatch = score.match(/\((\d+)%\)/);
    let percent = percentMatch ? percentMatch[1] : '0';

    let status = 'Pending', badgeClass = 'badge';
    if (possible > 0) {
      if (percent == 100) { status = 'Outstanding'; badgeClass = 'badge  badge-outstanding'; }
      else if (percent >= 95 && percent <= 99) { status = 'Excellent'; badgeClass = 'badge  badge-excellent'; }
      else if (percent >= 85 && percent <= 94) { status = 'Good'; badgeClass = 'badge badge-good'; }
      else if (percent >= 75 && percent <= 84) { status = 'Average'; badgeClass = 'badge badge-average'; }
      else { status = 'Poor'; badgeClass = 'badge badge-poor'; }
    }

    const tr = document.createElement('tr');
    tr.classList.add('summary-category-row');
    tr.setAttribute('data-category-id', categoryId);
    tr.style.cursor = 'pointer';

    tr.innerHTML = `
      <td><span class="clickable-category">${catName}</span></td>
      <td>${scored}/${possible}</td>
      <td>${percent}%</td>
      <td><span class="${badgeClass}">${status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Attach click handlers
  document.querySelectorAll('.summary-category-row').forEach(row => {
    row.addEventListener('click', () => {
      const catId = row.getAttribute('data-category-id');
      const targetCard = document.querySelector(`.category-card[data-category-id="${catId}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Optional highlight effect
        targetCard.classList.add('highlight-category');
        setTimeout(() => {
          targetCard.classList.remove('highlight-category');
        }, 1500);
      }
    });
  });
}


    // --- Listen for radio changes ---
    document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        if (isPrefilling) return;
        
        const questionItem = this.closest('.question-item');
        const questionId = questionItem.getAttribute('data-question-id');
        const noOptions = document.getElementById(`no-options-${questionId}`);
        
        // Handle showing/hiding Major/Minor options
        if (this.name === `response-${questionId}`) {
          if (this.value === 'no') {
            if (noOptions) noOptions.style.display = 'block';
          } else {
            if (noOptions) {
              noOptions.style.display = 'none';
              // Uncheck major/minor if switched away from 'No'
              noOptions.querySelectorAll('input').forEach(r => r.checked = false);
            }
          }
        }

        updateScores();
        const response = questionItem.querySelector(`input[name="response-${questionId}"]:checked`)?.value;
        const severity = questionItem.querySelector(`input[name="severity-${questionId}"]:checked`)?.value;
        const comment = questionItem.querySelector('.comment-input').value;
        
        saveAnswer(questionId, { questionId, response, severity, comment });
      });
    });

    // --- Listen for comment changes (debounced) ---
    document.querySelectorAll('.comment-input').forEach(function(input) {
      let timeout;
      input.addEventListener('input', function () {
        clearTimeout(timeout);
        const questionItem = this.closest('.question-item');
        const questionId = questionItem.getAttribute('data-question-id');
        const radios = questionItem.querySelectorAll('input[type="radio"]');
        let response = '';
        radios.forEach(r => { if (r.checked) response = r.value; });
        const comment = this.value;
        // 🚫 Prevent overwriting comment with empty string unless explicitly cleared
        if (isPrefilling) return;
        
        timeout = setTimeout(() => {
          saveAnswer(questionId, { questionId, response: response || undefined, comment });
        }, 500);
      });
      // Replace Add Comment button with Clear Comment button logic
      // Create wrapper and icon button
      const wrapper = document.createElement('div');
      wrapper.className = 'comment-input-wrapper';
      
      // Insert wrapper before input
      input.parentNode.insertBefore(wrapper, input);
      
      // Move input into wrapper
      wrapper.appendChild(input);
      
      // Create X button
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '&times;';
      btn.className = 'clear-comment-icon-btn';
      btn.title = 'Clear comment';
      
      // Add button to wrapper
      wrapper.appendChild(btn);

      btn.addEventListener('click', function() {
        if (isPrefilling) return;
        input.value = '';
        const questionItem = input.closest('.question-item');
        const questionId = questionItem.getAttribute('data-question-id');
        const radios = questionItem.querySelectorAll('input[type="radio"]');
        let response = '';
        radios.forEach(r => { if (r.checked) response = r.value; });
        // Explicitly clear comment in backend
        saveAnswer(questionId, { questionId, response: response || undefined, comment: '' });
      });
    });

    // --- Listen for image uploads ---
    document.querySelectorAll('input[type="file"]').forEach(function(input) {
      input.addEventListener('change', function() {
        const questionItem = this.closest('.question-item');
        const questionId = questionItem.getAttribute('data-question-id');
        const radios = questionItem.querySelectorAll('input[type="radio"]');
        let response = '';
        radios.forEach(r => { if (r.checked) response = r.value; });
        const comment = questionItem.querySelector('.comment-input').value;
        if (this.files && this.files.length) {
          const formData = new FormData();
          formData.append('questionId', questionId);
          formData.append('response', response);
          formData.append('comment', comment);
          formData.append('images', this.files[0]);
          formData.append('companyId', getCompanyIdFromUrl()); 
          fetch('/api/answer', {
            method: 'POST',
            body: formData
          })
            .then(res => res.json())
            .then(resp => {
              if (resp.success && resp.answer && resp.answer.images) {
                renderImagePreview(questionId, resp.answer.images);
              }
            })
            .catch(() => {
              alert('Failed to upload image.');
            });
        }
      });
    });

    // --- IMAGE PREVIEW + REMOVE BUTTON ---
    function renderImagePreview(questionId, images) {
      const preview = document.querySelector(`.question-item[data-question-id='${questionId}'] .image-preview`);
      if (preview) {
        preview.innerHTML = '';
        images.forEach((img, idx) => {
          const wrapper = document.createElement('div');
          wrapper.style.display = 'inline-block';
          wrapper.style.position = 'relative';
          wrapper.style.marginRight = '14px';
          wrapper.style.marginBottom = '8px';
          const imageEl = document.createElement('img');
          imageEl.src = img;
          imageEl.alt = 'Preview';
          imageEl.style.maxWidth = '220px';
          imageEl.style.maxHeight = '220px';
          imageEl.style.borderRadius = '12px';
          imageEl.style.boxShadow = '0 2px 8px rgba(30,41,59,0.10)';
          imageEl.style.border = '2.5px solid #e0e7ef';
          imageEl.style.objectFit = 'cover';
          imageEl.style.display = 'block';
          imageEl.style.position = 'relative';
          // --- Modal open on click ---
          imageEl.style.cursor = 'pointer';
          imageEl.addEventListener('click', function(e) {
            e.preventDefault();
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('imageModalImg');

            modalImg.src = img;
            modal.classList.add('active');
          });
          // ...existing code for removeBtn...
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'remove-image-btn';
          removeBtn.innerHTML = '&times;';
          removeBtn.title = 'Remove image';
          removeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fetch(`/api/answer/image-remove`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questionId, image: img })
            })
              .then(res => res.json())
              .then(resp => {
                if (resp.success && resp.answer && resp.answer.images) {
                  renderImagePreview(questionId, resp.answer.images);
                }
              });
          });
          wrapper.appendChild(imageEl);
          wrapper.appendChild(removeBtn);
          preview.appendChild(wrapper);
        });
      }
    }
    // --- Modal close logic ---
    document.addEventListener('DOMContentLoaded', function () {
      fetchAndPrefillAnswers();
    const editBtn = document.getElementById('toggle-edit-btn');
    const infoValues = document.querySelectorAll('.info-panel .info-value');
    let isEditing = false;

    editBtn.addEventListener('click', function () {
      isEditing = !isEditing;

      infoValues.forEach(valueDiv => {
        if (isEditing) {
          valueDiv.setAttribute('contenteditable', 'true');
          valueDiv.style.background = '#fff';
          valueDiv.style.borderBottom = '2px solid #3730a3';
          valueDiv.style.color = '#3730a3';
        } else {
          valueDiv.removeAttribute('contenteditable');
          valueDiv.style.background = '';
          valueDiv.style.borderBottom = '';
          valueDiv.style.color = '';
        }
      });

      editBtn.innerText = isEditing ? 'Save Info' : 'Edit Info';

      // Optionally, on save, you could collect and send the edited values via fetch() here.
    });
      const modal = document.getElementById('imageModal');
      const closeModalBtn = document.getElementById('closeModalBtn');
      closeModalBtn.addEventListener('click', function() {
        modal.classList.remove('active');
        document.getElementById('modalImage').src = '';
      });
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.classList.remove('active');
          document.getElementById('modalImage').src = '';
        }
      });
    });

    // --- INFO PANEL EDITABLE WITH EDIT ICON ---
    

    // Modal close logic
    // const modal = document.getElementById('imageModal');
    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('closeImageModal').addEventListener('click', () => {
  document.getElementById('imageOptionModal').style.display = 'none';
});

  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalImg');
  const modalClose = document.getElementById('closeModalBtn'); // ✅ correct ID

  // Close on X button
  modalClose.addEventListener('click', function () {
    modal.classList.remove('active');
    modalImg.src = '';
  });

  // Close when clicking outside the modal content
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.classList.remove('active');
      modalImg.src = '';
    }
  });
});

  
document.addEventListener('DOMContentLoaded', () => {
  fetchInfoPanel();

  const editBtn = document.getElementById('toggle-edit-btn');
  const infoFields = document.querySelectorAll('.info-value');
  let editing = false;

  editBtn.addEventListener('click', async () => {
    editing = !editing;

    if (editing) {
      // Enable edit mode
      editBtn.textContent = 'Save Changes';
      infoFields.forEach(field => {
        field.setAttribute('contenteditable', 'true');
        field.style.backgroundColor = '#f8fafc';
        field.style.border = '1px solid #4f46e5';
        field.style.borderRadius = '4px';
        field.style.padding = '4px 6px';
        field.style.outline = 'none';
      });
    } else {
      // Save mode
      editBtn.textContent = 'Edit Info';
      infoFields.forEach(field => {
        field.removeAttribute('contenteditable');
        field.style.backgroundColor = '';
        field.style.border = '';
        field.style.padding = '';
      });
      await saveInfoPanel();
    }
  });
});

async function fetchInfoPanel() {
//   const res = await fetch('/api/info');
// const companyId = getCompanyIdFromUrl();
const companyId = getCompanyIdFromUrl();// gets ID from URL 
const res = await fetch(`/api/info?companyId=${companyId}`);

  const data = await res.json();
  if (data.info) {
    document.querySelector('[name="company"]').textContent = data.info.company || '';
    document.querySelector('[name="location"]').textContent = data.info.location || '';
    document.querySelector('[name="date"]').textContent = data.info.date || '';
    document.querySelector('[name="branch"]').textContent = data.info.branch || '';
    document.querySelector('[name="manager"]').textContent = data.info.manager || '';
    document.querySelector('[name="inspector"]').textContent = data.info.inspector || '';
  }
}

async function saveInfoPanel() {
    const companyId = getCompanyIdFromUrl();
  const body = {
    companyId,
    company: document.querySelector('[name="company"]').textContent.trim(),
    location: document.querySelector('[name="location"]').textContent.trim(),
    date: document.querySelector('[name="date"]').textContent.trim(),
    branch: document.querySelector('[name="branch"]').textContent.trim(),
    manager: document.querySelector('[name="manager"]').textContent.trim(),
    inspector: document.querySelector('[name="inspector"]').textContent.trim(),
  };

  await fetch('/api/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  alert('Info panel saved!');
}


let currentQuestionId = null;

document.querySelectorAll('.open-image-options').forEach(btn => {
  btn.addEventListener('click', function () {
    currentQuestionId = this.getAttribute('data-question-id'); // track which question to attach image to
    document.getElementById('imageOptionModal').style.display = 'flex';
  });
});

document.getElementById('uploadFileBtn').addEventListener('click', () => {
  const input = document.getElementById('hiddenImageInput');
  input.removeAttribute('capture');
  input.click();
});

document.getElementById('captureCameraBtn').addEventListener('click', () => {
  const input = document.getElementById('hiddenImageInput');

  // Force capture from camera for mobile
  input.setAttribute('capture', 'environment');  // Use 'user' for front camera
  input.setAttribute('accept', 'image/*');
  
  input.click(); // open camera directly if supported
});



document.getElementById('hiddenImageInput').addEventListener('change', function () {
  if (this.files && this.files[0]) {
    const questionItem = document.querySelector(`.question-item[data-question-id="${currentQuestionId}"]`);
    const radios = questionItem.querySelectorAll('input[type="radio"]');
    let response = '';
    radios.forEach(r => { if (r.checked) response = r.value; });

    if (!response) {
      const naRadio = questionItem.querySelector(`input[value="na"]`);
      if (naRadio) {
        naRadio.checked = true;
        response = 'na';
      }
    }

    const comment = questionItem.querySelector('.comment-input').value;
    const formData = new FormData();
    formData.append('questionId', currentQuestionId);
    formData.append('companyId', getCompanyIdFromUrl());  
    formData.append('response', response);
    formData.append('comment', comment);
    formData.append('images', this.files[0]);

    fetch('/api/answer', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(resp => {
        if (resp.success && resp.answer && resp.answer.images) {
          renderImagePreview(currentQuestionId, resp.answer.images);
        } else {
          alert('Upload failed.');
        }
      })
      .catch(() => alert('Upload failed.'));

    // Reset & close modal
    this.value = '';
    document.getElementById('imageOptionModal').style.display = 'none';
  }
});
