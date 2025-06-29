// // public/js/audit.js
// // All JS logic from index.ejs moved here for maintainability.

// // --- AJAX: Fetch and prefill answers on load ---
// function fetchAndPrefillAnswers() {
//   fetch('/api/answers')
//     .then(res => res.json())
//     .then(data => {
//       if (data.answers) {
//         data.answers.forEach(ans => {
//           // Set radio
//           if (ans.response) {
//             const radio = document.querySelector(`input[type="radio"][name='response-${ans.question}'][value='${ans.response}']`);
//             if (radio) {
//               radio.checked = true;
//               // Trigger change event to update score UI
//               radio.dispatchEvent(new Event('change', { bubbles: true }));
//             }
//           }
//           // Set comment
//           if (ans.comment) {
//             const comment = document.querySelector(`.question-item[data-question-id='${ans.question}'] .comment-input`);
//             if (comment) comment.value = ans.comment;
//           }
//           // Set image preview(s)
//           if (ans.images && ans.images.length) {
//             const preview = document.querySelector(`.question-item[data-question-id='${ans.question}'] .image-preview`);
//             if (preview) {
//               preview.innerHTML = ans.images.map(img => `<img src='${img}' style='max-width:100px;max-height:100px;border-radius:8px;margin-right:6px;'>`).join('');
//             }
//           }
//         });
//         updateScores();
//       }
//     });
// }

// // --- AJAX: Save answer ---
// function saveAnswer(questionId, data, isImage) {
//   let fetchOptions = {
//     method: 'POST',
//     body: undefined
//   };
//   if (isImage) {
//     const formData = new FormData();
//     Object.keys(data).forEach(k => formData.append(k, data[k]));
//     fetchOptions.body = formData;
//   } else {
//     fetchOptions.headers = { 'Content-Type': 'application/json' };
//     fetchOptions.body = JSON.stringify(data);
//   }
//   fetch('/api/answer', fetchOptions)
//     .then(res => res.json())
//     .then(resp => {
//       if (resp.success && resp.answer && resp.answer.images && isImage) {
//         const preview = document.querySelector(`.question-item[data-question-id='${questionId}'] .image-preview`);
//         if (preview) {
//           preview.innerHTML = resp.answer.images.map(img => `<img src='${img}' style='max-width:100px;max-height:100px;border-radius:8px;margin-right:6px;'>`).join('');
//         }
//       }
//     })
//     .catch(() => {
//       alert('Failed to save answer. Please try again.');
//     });
// }

// // --- Listen for radio changes ---
// document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
//   radio.addEventListener('change', function() {
//     updateScores();
//     const questionItem = this.closest('.question-item');
//     const questionId = questionItem.getAttribute('data-question-id');
//     const response = this.value;
//     const comment = questionItem.querySelector('.comment-input').value;
//     saveAnswer(questionId, { questionId, response, comment });
//   });
// });

// // --- Listen for comment changes (debounced) ---
// document.querySelectorAll('.comment-input').forEach(function(input) {
//   let timeout;
//   input.addEventListener('input', function() {
//     clearTimeout(timeout);
//     const questionItem = this.closest('.question-item');
//     const questionId = questionItem.getAttribute('data-question-id');
//     const radios = questionItem.querySelectorAll('input[type="radio"]');
//     let response = '';
//     radios.forEach(r => { if (r.checked) response = r.value; });
//     const comment = this.value;
//     timeout = setTimeout(() => {
//       saveAnswer(questionId, { questionId, response: response || undefined, comment });
//     }, 500);
//   });
// });

// // --- Listen for image uploads ---
// document.querySelectorAll('input[type="file"]').forEach(function(input) {
//   input.addEventListener('change', function() {
//     const questionItem = this.closest('.question-item');
//     const questionId = questionItem.getAttribute('data-question-id');
//     const radios = questionItem.querySelectorAll('input[type="radio"]');
//     let response = '';
//     radios.forEach(r => { if (r.checked) response = r.value; });
//     const comment = questionItem.querySelector('.comment-input').value;
//     if (this.files && this.files.length) {
//       const formData = new FormData();
//       formData.append('questionId', questionId);
//       formData.append('response', response);
//       formData.append('comment', comment);
//       formData.append('images', this.files[0]);
//       fetch('/api/answer', {
//         method: 'POST',
//         body: formData
//       })
//         .then(res => res.json())
//         .then(resp => {
//           if (resp.success && resp.answer && resp.answer.images) {
//             const preview = questionItem.querySelector('.image-preview');
//             if (preview) {
//               preview.innerHTML = resp.answer.images.map(img => `<img src='${img}' style='max-width:100px;max-height:100px;border-radius:8px;margin-right:6px;'>`).join('');
//             }
//           }
//         })
//         .catch(() => {
//           alert('Failed to upload image.');
//         });
//     }
//   });
// });

// // --- Save All Answers in Category ---
// document.addEventListener('DOMContentLoaded', function() {
//   document.querySelectorAll('.save-all-category-btn').forEach(function(btn) {
//     btn.addEventListener('click', function() {
//       const categoryId = btn.getAttribute('data-category-id');
//       const questionItems = document.querySelectorAll(`.question-item[data-category-id='${categoryId}']`);
//       const savePromises = [];
//       questionItems.forEach(function(questionItem) {
//         const questionId = questionItem.getAttribute('data-question-id');
//         if (!questionId) return; // Skip if questionId is missing
//         const radios = questionItem.querySelectorAll('input[type="radio"]');
//         let response = '';
//         radios.forEach(r => { if (r.checked) response = r.value; });
//         let comment = questionItem.querySelector('.comment-input').value || '';
//         comment = comment.trim();
//         // Only send if response is selected or comment is non-empty after trimming
//         if (response || comment.length > 0) {
//           savePromises.push(
//             fetch('/api/answer', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({ questionId, response: response || undefined, comment })
//             })
//             .then(res => res.json())
//           );
//         }
//       });
//       Promise.all(savePromises).then(results => {
//         if (results.every(r => r.success)) {
//           alert('All answers in this category have been saved!');
//         } else {
//           alert('Some answers failed to save. Please try again.');
//         }
//       });
//     });
//   });
//   fetchAndPrefillAnswers();
//   // updateScores(); // Not needed, fetchAndPrefillAnswers triggers it
// });

// // --- Dynamic scoring function ---
// function updateScores() {
//   let totalScore = 0;
//   let totalPossible = 0;
//   // For each category
//   document.querySelectorAll('.category-card').forEach(function(catCard) {
//     const catId = catCard.getAttribute('data-category-id');
//     let catScore = 0;
//     let catPossible = 0;
//     // For each question in this category
//     catCard.querySelectorAll('.question-item').forEach(function(qItem) {
//       const qId = qItem.getAttribute('data-question-id');
//       let score = 0;
//       const radios = qItem.querySelectorAll('input[type="radio"]');
//       let answered = false;
//       radios.forEach(radio => {
//         if (radio.checked) {
//           answered = true;
//           if (radio.value === 'yes') score = 1;
//         }
//       });
//       // Update per-question badge
//       const badge = qItem.querySelector('.question-score-badge');
//       if (badge) badge.textContent = answered ? score : '0';
//       // Always count this question toward possible
//       catScore += score;
//       catPossible += 1;
//     });
//     // Update per-category badge
//     const catBadge = catCard.querySelector('.category-score-badge');
//     let percent = catPossible ? Math.round((catScore / catPossible) * 100) : 0;
//     if (catBadge) catBadge.textContent = `${catScore}/${catPossible} (${percent}%)`;
//     totalScore += catScore;
//     totalPossible += catPossible;
//   });
//   // Update total score
//   const totalScoreElem = document.getElementById('totalScore');
//   const totalScoreDetails = document.getElementById('totalScoreDetails');
//   let totalPercent = totalPossible ? Math.round((totalScore / totalPossible) * 100) : 0;
//   if (totalScoreElem) totalScoreElem.textContent = totalScore;
//   if (totalScoreDetails) totalScoreDetails.textContent = `${totalScore} / ${totalPossible} (${totalPercent}%)`;
// }

// // --- Add event listener for the new comment-clear (cross) icon
// function setupCommentClearButtons() {
//   document.querySelectorAll('.comment-clear').forEach(function(clearBtn) {
//     clearBtn.addEventListener('click', function(e) {
//       const input = clearBtn.previousElementSibling;
//       if (input && input.classList.contains('comment-input')) {
//         input.value = '';
//         // Save the empty comment immediately
//         const questionItem = clearBtn.closest('.question-item');
//         const questionId = questionItem.getAttribute('data-question-id');
//         const radios = questionItem.querySelectorAll('input[type="radio"]');
//         let response = '';
//         radios.forEach(r => { if (r.checked) response = r.value; });
//         saveAnswer(questionId, { questionId, response: response || undefined, comment: '' });
//       }
//     });
//   });
// }

// document.addEventListener('DOMContentLoaded', function() {
//   document.querySelectorAll('.save-all-category-btn').forEach(function(btn) {
//     btn.addEventListener('click', function() {
//       const categoryId = btn.getAttribute('data-category-id');
//       const questionItems = document.querySelectorAll(`.question-item[data-category-id='${categoryId}']`);
//       const savePromises = [];
//       questionItems.forEach(function(questionItem) {
//         const questionId = questionItem.getAttribute('data-question-id');
//         if (!questionId) return; // Skip if questionId is missing
//         const radios = questionItem.querySelectorAll('input[type="radio"]');
//         let response = '';
//         radios.forEach(r => { if (r.checked) response = r.value; });
//         let comment = questionItem.querySelector('.comment-input').value || '';
//         comment = comment.trim();
//         // Only send if response is selected or comment is non-empty after trimming
//         if (response || comment.length > 0) {
//           savePromises.push(
//             fetch('/api/answer', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({ questionId, response: response || undefined, comment })
//             })
//             .then(res => res.json())
//           );
//         }
//       });
//       Promise.all(savePromises).then(results => {
//         if (results.every(r => r.success)) {
//           alert('All answers in this category have been saved!');
//         } else {
//           alert('Some answers failed to save. Please try again.');
//         }
//       });
//     });
//   });
//   fetchAndPrefillAnswers();
//   setupCommentClearButtons();
//   // updateScores(); // Not needed, fetchAndPrefillAnswers triggers it
// });
