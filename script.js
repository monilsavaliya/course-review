document.addEventListener('DOMContentLoaded', () => {
    fetch('new.csv')
        .then(response => response.text())
        .then(data => {
            const courses = parseCSV(data);
            populateFilters(courses);
            generateCourseCards(courses);
            addFilterHandlers();
            addSearchHandler();
        })
        .catch(error => console.error('Error loading CSV:', error));
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
function generateCourseCards(courses) {
  const grid = document.querySelector('.course-grid');
  grid.innerHTML = '';
  Object.values(courses).forEach(course => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.dataset.code = course.code;
    card.dataset.professor = course.professor;

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
        <div class="rating">Avg: ${avg(course.overall)}</div>
      </div>
      <div class="course-content">
        <div class="metrics-grid">
          <div class="metric-item">Workload: <span class="rating">${avg(course.workload)}</span></div>
          <div class="metric-item">Grading: <span class="rating">${avg(course.grading)}</span></div>
          <div class="metric-item">Attendance: <span class="rating">${avg(course.attendance)}</span></div>
          <div class="metric-item">Overall: <span class="rating">${avg(course.overall)}</span></div>
        </div>
        <div class="reviews-section">
          <h4>Reviews:</h4>
          ${reviewsHtml}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
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