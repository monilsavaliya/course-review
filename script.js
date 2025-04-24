document.addEventListener('DOMContentLoaded', () => {
  // Initialize dark mode from localStorage or prefer-color-scheme
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = localStorage.getItem('theme');
  
  if (currentTheme === 'dark' || (!currentTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  
  // Load course data
  fetch('new.csv')
      .then(response => response.text())
      .then(data => {
          const courses = parseCSV(data);
          populateFilters(courses);
          generateCourseCards(courses);
          addFilterHandlers();
          addSearchHandler();
          addSortHandler(courses);
      })
      .catch(error => console.error('Error loading CSV:', error));
  
  // Dark mode toggle
  darkModeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'dark') {
          document.documentElement.removeAttribute('data-theme');
          darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
          localStorage.setItem('theme', 'light');
      } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
          localStorage.setItem('theme', 'dark');
      }
  });
  
  // Star rating functionality
  document.querySelectorAll('.star-rating').forEach(ratingContainer => {
      const stars = ratingContainer.querySelectorAll('i');
      const hiddenInput = ratingContainer.querySelector('input[type="hidden"]');
      
      stars.forEach(star => {
          star.addEventListener('click', () => {
              const rating = parseInt(star.getAttribute('data-rating'));
              hiddenInput.value = rating;
              
              stars.forEach((s, index) => {
                  if (index < rating) {
                      s.classList.add('active');
                      s.classList.remove('far');
                      s.classList.add('fas');
                  } else {
                      s.classList.remove('active');
                      s.classList.remove('fas');
                      s.classList.add('far');
                  }
              });
          });
      });
  });
  
  // Review form submission
  document.getElementById('review-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const courseCode = document.getElementById('course-code').value;
      const professor = document.getElementById('professor').value;
      const workload = document.getElementById('workload-rating').value;
      const grading = document.getElementById('grading-rating').value;
      const attendance = document.getElementById('attendance-rating').value;
      const overall = document.getElementById('overall-rating').value;
      const reviewText = document.getElementById('review-text').value;
      
      // In a real app, you would send this data to a server
      alert(`Review submitted for ${courseCode} with ${professor}!\nThis would be saved in a real application.`);
      
      // Reset form
      e.target.reset();
      document.querySelectorAll('.star-rating i').forEach(star => {
          star.classList.remove('active', 'fas');
          star.classList.add('far');
      });
  });
});

function parseCSV(csvData) {
  const rows = csvData.split('\n').filter(row => row.trim() !== '');
  const header = rows[0].split(',');
  const courses = {};
  
  for (let i = 1; i < rows.length; i++) {
      let row = rows[i];
      // Handle quoted fields with commas
      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      // Skip rows that don't have enough columns or missing course code
      if (cols.length < 11 || !cols[3]?.trim()) continue;
      
      const courseCode = cols[3].trim();
      const professor = cols[4]?.trim() || 'Unknown Professor';
      const key = `${courseCode}||${professor}`;
      
      if (!courses[key]) {
          courses[key] = {
              code: courseCode,
              professor: professor,
              workload: [],
              grading: [],
              attendance: [],
              overall: [],
              reviews: []
          };
      }
      
      // Parse ratings (handle empty values)
      const workload = parseRating(cols[6]);
      const grading = parseRating(cols[7]);
      const attendance = parseRating(cols[8]);
      const overall = parseRating(cols[9]);
      const review = cols[10]?.replace(/"/g, '').trim() || 'No review provided';
      
      if (workload !== null) courses[key].workload.push(workload);
      if (grading !== null) courses[key].grading.push(grading);
      if (attendance !== null) courses[key].attendance.push(attendance);
      if (overall !== null) courses[key].overall.push(overall);
      courses[key].reviews.push(review);
  }
  return courses;
}

function parseRating(value) {
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function avg(arr) {
  if (!arr.length) return '-';
  const sum = arr.reduce((a, b) => a + b, 0);
  return (sum / arr.length).toFixed(1);
}

function generateCourseCards(courses, sortBy = 'overall') {
  const grid = document.querySelector('.course-grid');
  grid.innerHTML = '';
  
  // Convert courses object to array and sort
  const coursesArray = Object.values(courses);
  
  if (sortBy) {
      coursesArray.sort((a, b) => {
          const avgA = a[sortBy].length ? avg(a[sortBy]) : 0;
          const avgB = b[sortBy].length ? avg(b[sortBy]) : 0;
          return avgB - avgA;
      });
  }
  
  coursesArray.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.dataset.code = course.code;
      card.dataset.professor = course.professor;
      
      // Generate star ratings
      const overallRating = avg(course.overall);
      const starsHtml = overallRating !== '-' ? generateStars(overallRating) : 'No ratings';
      
      // Generate reviews HTML
      const reviewsHtml = course.reviews.map((review, idx) => `
          <div class="review-card">
              <div><strong>Review ${idx + 1}:</strong> ${review}</div>
          </div>
      `).join('');
      
      card.innerHTML = `
          <div class="course-header">
              <div>
                  <h3>${course.code}</h3>
                  <p>${course.professor}</p>
              </div>
              <div class="rating">${overallRating !== '-' ? `${overallRating} ${starsHtml}` : 'No ratings'}</div>
          </div>
          <div class="course-content">
              <div class="metrics-grid">
                  <div class="metric-item">Workload: <span class="rating">${avg(course.workload)} ${generateStars(avg(course.workload))}</span></div>
                  <div class="metric-item">Grading: <span class="rating">${avg(course.grading)} ${generateStars(avg(course.grading))}</span></div>
                  <div class="metric-item">Attendance: <span class="rating">${avg(course.attendance)} ${generateStars(avg(course.attendance))}</span></div>
                  <div class="metric-item">Overall: <span class="rating">${avg(course.overall)} ${generateStars(avg(course.overall))}</span></div>
              </div>
              <div class="reviews-section">
                  <h4>Reviews (${course.reviews.length}):</h4>
                  ${reviewsHtml}
              </div>
          </div>
      `;
      
      // Add toggle logic to expand/collapse
      card.querySelector('.course-header').addEventListener('click', () => {
          const content = card.querySelector('.course-content');
          content.classList.toggle('active');
      });
      
      grid.appendChild(card);
  });
}

function generateStars(rating) {
  if (rating === '-') return '';
  const num = parseFloat(rating);
  const fullStars = Math.floor(num);
  const halfStar = num % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let starsHtml = '';
  for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
  }
  if (halfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
  }
  return starsHtml;
}

function populateFilters(courses) {
  const filterContainer = document.querySelector('.filter-buttons');
  const seen = new Set();
  Object.values(courses).forEach(course => {
      if (!seen.has(course.code)) {
          const btn = document.createElement('button');
          btn.className = 'filter-btn';
          btn.dataset.filter = `code:${course.code}`;
          btn.textContent = course.code;
          filterContainer.appendChild(btn);
          seen.add(course.code);
      }
  });
}

function addFilterHandlers() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.dataset.filter;
          if (filter === 'all') {
              document.querySelectorAll('.course-card').forEach(card => card.style.display = 'block');
          } else {
              const [key, value] = filter.split(':');
              document.querySelectorAll('.course-card').forEach(card => {
                  card.style.display = card.dataset[key] === value ? 'block' : 'none';
              });
          }
      });
  });
}

function addSearchHandler() {
  document.querySelector('.search-input').addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.course-card').forEach(card => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(term) ? 'block' : 'none';
      });
  });
}

function addSortHandler(courses) {
  document.getElementById('sort-by').addEventListener('change', (e) => {
      generateCourseCards(courses, e.target.value);
  });
}