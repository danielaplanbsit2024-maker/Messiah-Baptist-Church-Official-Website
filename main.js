// Toggle Mobile Menu
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');

if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
}

// Update Time
function updateTime() {
    const timeDisplay = document.getElementById('current-time-header');
    if (timeDisplay) {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        timeDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Highlight Active Menu Item
function highlightActiveMenuItem() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a');

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Remove existing active class
        link.classList.remove('active');

        // Add active class if paths match
        if (linkHref === currentPath || (currentPath === 'index.html' && (linkHref === './' || linkHref === '/' || linkHref === 'index.html'))) {
            link.classList.add('active');
        }
    });
}

setInterval(updateTime, 1000);
updateTime();
highlightActiveMenuItem();

// Dynamic Data Fetching
async function fetchBibleStudies() {
    const container = document.getElementById('bible-studies-container');
    if (!container) return; // Only run on the bible studies page

    try {
        const response = await fetch('http://localhost:3001/api/bible-studies');
        if (!response.ok) throw new Error('Failed to fetch studies');
        const groupedStudies = await response.json();
        
        container.innerHTML = ''; // Clear loading text
        
        for (const [category, studies] of Object.entries(groupedStudies)) {
            const categorySection = document.createElement('div');
            categorySection.classList.add('bible-study-category');
            categorySection.style.marginBottom = '30px';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category;
            categoryTitle.style.color = '#d4af37';
            categoryTitle.style.borderBottom = '1px solid #333';
            categoryTitle.style.paddingBottom = '10px';
            categoryTitle.style.marginBottom = '15px';
            
            const list = document.createElement('ul');
            list.style.listStyleType = 'none';
            list.style.padding = '0';
            
            studies.forEach(study => {
                const listItem = document.createElement('li');
                listItem.style.marginBottom = '10px';
                listItem.innerHTML = `<a href="${study.link}" target="_blank" style="color: #fff; text-decoration: none; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-book-bible" style="color: #d4af37;"></i>
                    <span class="hover-effect">${study.title}</span>
                </a>`;
                list.appendChild(listItem);
            });
            
            categorySection.appendChild(categoryTitle);
            categorySection.appendChild(list);
            container.appendChild(categorySection);
        }
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p>Sorry, could not load Bible Studies at this time. Please make sure the backend server is running.</p>';
    }
}

// Dynamic Page Content Injection
async function injectDynamicContent() {
    const dynamicElements = document.querySelectorAll('[data-content-id], [data-bg-id]');
    const beliefsContainer = document.getElementById('beliefs-container');
    
    // Determine which pages we need to fetch
    const pagesToFetch = new Set();
    dynamicElements.forEach(el => pagesToFetch.add(el.getAttribute('data-page')));
    if (beliefsContainer) pagesToFetch.add('beliefs');
    
    if (pagesToFetch.size === 0) return;

    for (const pageName of pagesToFetch) {
        try {
            const response = await fetch(`http://localhost:3001/api/content/${pageName}`);
            if (response.ok) {
                const contentData = await response.json();

                // --- Handle beliefs_json: build accordion dynamically ---
                if (pageName === 'beliefs' && beliefsContainer && contentData['beliefs_json']) {
                    try {
                        const beliefs = JSON.parse(contentData['beliefs_json']);
                        beliefsContainer.innerHTML = '';
                        beliefs.forEach((belief, index) => {
                            const item = document.createElement('div');
                            item.className = 'accordion-item';
                            item.innerHTML = `
                                <div class="accordion-header">
                                    <h3>${belief.title}</h3>
                                    <span class="accordion-icon"><i class="fa-solid fa-chevron-down"></i></span>
                                </div>
                                <div class="accordion-content">
                                    <div style="line-height: 1.8;">${belief.content}</div>
                                </div>
                            `;
                            // Attach click listener immediately
                            item.querySelector('.accordion-header').addEventListener('click', () => {
                                item.classList.toggle('active');
                            });
                            beliefsContainer.appendChild(item);
                        });
                    } catch(e) {
                        beliefsContainer.innerHTML = '<p>Error loading beliefs content.</p>';
                        console.error('Error parsing beliefs_json:', e);
                    }
                    continue; // Done with beliefs page
                }

                // --- Inject standard content and background images ---
                dynamicElements.forEach(el => {
                    if (el.getAttribute('data-page') === pageName) {
                        
                        // Handle Background Images
                        if (el.hasAttribute('data-bg-id')) {
                            const key = el.getAttribute('data-bg-id');
                            if (contentData[key]) {
                                el.style.backgroundImage = `url('${contentData[key]}')`;
                            }
                        }
                        
                        // Handle Standard Content
                        if (el.hasAttribute('data-content-id')) {
                            const key = el.getAttribute('data-content-id');
                            if (contentData[key] !== undefined) {
                                if (el.tagName.toLowerCase() === 'img') {
                                    el.src = contentData[key];
                                } else {
                                    el.innerHTML = contentData[key];
                                }
                            }
                        }
                    }
                });

                // --- Handle complex lists for the home page ---
                if (pageName === 'home') {
                    // Service Schedules
                    if (contentData['schedules_json']) {
                        const schedules = JSON.parse(contentData['schedules_json']);
                        const container = document.getElementById('schedules-container');
                        if (container) {
                            container.innerHTML = '';
                            schedules.forEach(sched => {
                                container.innerHTML += `
                                    <div class="schedule-item">
                                        <span class="day">${sched.day}</span>
                                        <span class="time">${sched.time}</span>
                                    </div>
                                `;
                            });
                        }
                    }

                    // Recent Messages Cards
                    if (contentData['messages_json']) {
                        const messages = JSON.parse(contentData['messages_json']);
                        const container = document.getElementById('messages-container');
                        if (container) {
                            container.innerHTML = '';
                            messages.forEach(msg => {
                                container.innerHTML += `
                                    <div class="card">
                                        <div class="card-icon">${msg.icon}</div>
                                        <h3>${msg.title}</h3>
                                        <p class="subtext">${msg.subtext}</p>
                                        <a href="${msg.link}" class="btn-outline">Read More</a>
                                    </div>
                                `;
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error loading dynamic content for ${pageName}:`, error);
        }
    }
}

// Call on load
fetchBibleStudies();
injectDynamicContent();

// NOTE: Static accordion click listeners removed.
// Accordion items for Beliefs page are bound dynamically inside injectDynamicContent().
// For any other static accordions on other pages, add listeners here:
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('active');
        });
    });
});
