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
