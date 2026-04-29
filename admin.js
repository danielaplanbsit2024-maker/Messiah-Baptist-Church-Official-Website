document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.protocol === 'file:'
        ? 'http://localhost:3002/api'
        : '/api';

    function apiFetch(path, options = {}) {
        return fetch(`${API_URL}${path}`, {
            credentials: 'include',
            ...options
        });
    }

    // --- AUTH CHECK ---
    async function checkAuth() {
        try {
            const response = await apiFetch('/auth/check');
            const data = await response.json();
            if (!data.authenticated) {
                window.location.href = window.location.protocol === 'file:'
                    ? 'http://localhost:3002/login.html'
                    : './login.html';
            } else {
                document.getElementById('admin-username-display').textContent = data.username;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
    checkAuth();


    // --- QUILL TOOLBARS ---
    const toolbarOptions = [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'header': [1, 2, 3, false] }],
        ['clean']
    ];

    // Registry of all active Quill instances keyed by their DOM editor div id
    const quillInstances = {};

    // Initialize Pastor Quote editor (static, always present)
    if (document.querySelector('#editor_pastor_quote')) {
        quillInstances['pastor_quote'] = new Quill('#editor_pastor_quote', { theme: 'snow', modules: { toolbar: toolbarOptions } });
        quillInstances['pastor_quote'].on('text-change', () => {
            document.getElementById('input_pastor_quote').value = quillInstances['pastor_quote'].root.innerHTML;
        });
    }

    // --- DYNAMIC BELIEF ROWS ---
    let beliefRowCounter = 0;

    window.addBeliefRow = function(title = '', content = '') {
        beliefRowCounter++;
        const id = `belief_row_${beliefRowCounter}`;
        const editorId = `editor_${id}`;
        const container = document.getElementById('beliefs-sections-container');

        const row = document.createElement('div');
        row.className = 'belief-row';
        row.dataset.rowId = id;
        row.innerHTML = `
            <div class="belief-row-header">
                <input type="text" class="belief-title-input" placeholder="Section Title (e.g. I. THE HOLY SCRIPTURES)" value="${title.replace(/"/g, '&quot;')}">
                <button type="button" class="btn-delete-belief" onclick="deleteBeliefRow('${id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
            <div id="${editorId}" style="height: 280px; background: white; color: black; border-radius: 0 0 4px 4px;"></div>
        `;
        container.appendChild(row);

        // Initialize Quill on the new div
        const quill = new Quill(`#${editorId}`, { theme: 'snow', modules: { toolbar: toolbarOptions } });
        quillInstances[id] = quill;

        // Populate with existing content if provided
        if (content) {
            quill.root.innerHTML = content;
        }
    };

    window.deleteBeliefRow = function(id) {
        if (!confirm('Delete this section? This cannot be undone until you save.')) return;
        const row = document.querySelector(`[data-row-id="${id}"]`);
        if (row) row.remove();
        delete quillInstances[id];
    };

    // Wire up the Add button
    const addBtn = document.getElementById('btn-add-belief-section');
    if (addBtn) {
        addBtn.addEventListener('click', () => window.addBeliefRow());
    }

    // Serialize all belief rows into a JSON array before saving
    function serializeBeliefs() {
        const rows = document.querySelectorAll('#beliefs-sections-container .belief-row');
        const beliefsArray = [];
        rows.forEach(row => {
            const rowId = row.dataset.rowId;
            const title = row.querySelector('.belief-title-input').value.trim();
            const content = quillInstances[rowId] ? quillInstances[rowId].root.innerHTML : '';
            beliefsArray.push({ title, content });
        });
        return JSON.stringify(beliefsArray);
    }

    // --- TAB NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.admin-sidebar a');
    const panels = document.querySelectorAll('.section-panel');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.getAttribute('data-target')).classList.add('active');
        });
    });

    // --- FILE UPLOAD LOGIC ---
    async function handleFileUpload(fileInput, hiddenInputId, previewId) {
        if (!fileInput.files || fileInput.files.length === 0) return;
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await apiFetch('/upload', { method: 'POST', body: formData });
            if (response.ok) {
                const data = await response.json();
                document.getElementById(hiddenInputId).value = data.url; // Save path
                const preview = document.getElementById(previewId);
                preview.style.backgroundImage = `url(${data.url})`;
                preview.textContent = '';
            } else {
                alert('File upload failed.');
            }
        } catch (err) {
            console.error('Upload error', err);
        }
    }

    document.getElementById('hero_image_file').addEventListener('change', (e) => handleFileUpload(e.target, 'hero_image_input', 'hero_image_preview'));
    document.getElementById('pastor_image_file').addEventListener('change', (e) => handleFileUpload(e.target, 'pastor_image_input', 'pastor_image_preview'));


    // --- DYNAMIC LIST LOGIC (Schedules & Cards) ---
    window.addScheduleRow = function(day = '', time = '') {
        const container = document.getElementById('schedules-editor');
        const row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = `
            <input type="text" placeholder="Day (e.g. Sunday School)" value="${day}" class="schedule-day" style="flex: 2">
            <input type="text" placeholder="Time (e.g. 9:00 AM)" value="${time}" class="schedule-time" style="flex: 1">
            <button type="button" class="btn-delete" onclick="this.parentElement.remove()">X</button>
        `;
        container.appendChild(row);
    };

    window.addMessageRow = function(icon = '', title = '', subtext = '', link = '#') {
        const container = document.getElementById('messages-editor');
        const row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = `
            <input type="text" placeholder="Emoji Icon" value="${icon}" class="msg-icon" style="flex: 0 0 50px; text-align: center;">
            <input type="text" placeholder="Title" value="${title}" class="msg-title" style="flex: 2">
            <input type="text" placeholder="Subtext" value="${subtext}" class="msg-subtext" style="flex: 2">
            <input type="text" placeholder="Link" value="${link}" class="msg-link" style="flex: 1">
            <button type="button" class="btn-delete" onclick="this.parentElement.remove()">X</button>
        `;
        container.appendChild(row);
    };

    function serializeLists() {
        // Serialize Schedules
        const scheduleRows = document.querySelectorAll('#schedules-editor .list-row');
        const schedules = [];
        scheduleRows.forEach(row => {
            schedules.push({
                day: row.querySelector('.schedule-day').value,
                time: row.querySelector('.schedule-time').value
            });
        });
        document.getElementById('schedules_json_input').value = JSON.stringify(schedules);

        // Serialize Messages
        const messageRows = document.querySelectorAll('#messages-editor .list-row');
        const messages = [];
        messageRows.forEach(row => {
            messages.push({
                icon: row.querySelector('.msg-icon').value,
                title: row.querySelector('.msg-title').value,
                subtext: row.querySelector('.msg-subtext').value,
                link: row.querySelector('.msg-link').value
            });
        });
        document.getElementById('messages_json_input').value = JSON.stringify(messages);
    }


    // --- PAGE CONTENT LOGIC ---
    async function loadPageContent(pageName) {
        try {
            const response = await apiFetch(`/content/${pageName}`);
            if (response.ok) {
                const data = await response.json();
                const form = document.getElementById(`form-${pageName}`);
                if (form) {
                    for (const [key, value] of Object.entries(data)) {
                        // --- Special handler: Dynamic Beliefs JSON ---
                        if (key === 'beliefs_json' && value) {
                            try {
                                const beliefs = JSON.parse(value);
                                document.getElementById('beliefs-sections-container').innerHTML = '';
                                beliefRowCounter = 0;
                                beliefs.forEach(b => window.addBeliefRow(b.title, b.content));
                            } catch(e) { console.error('Error parsing beliefs_json', e); }
                            continue; // skip normal input handling for this key
                        }

                        const input = form.querySelector(`[name="${key}"]`);
                        if (input) {
                            input.value = value;

                            // Specific handler for Quill editors (pastor_quote)
                            if (quillInstances[key]) {
                                quillInstances[key].root.innerHTML = value;
                            }
                            
                            // Specific handler for image previews
                            if (key === 'hero_image' && value) {
                                document.getElementById('hero_image_preview').style.backgroundImage = `url(${value})`;
                                document.getElementById('hero_image_preview').textContent = '';
                            }
                            if (key === 'pastor_image' && value) {
                                document.getElementById('pastor_image_preview').style.backgroundImage = `url(${value})`;
                                document.getElementById('pastor_image_preview').textContent = '';
                            }

                            // Specific handler for JSON lists
                            if (key === 'schedules_json' && value) {
                                const scheds = JSON.parse(value);
                                document.getElementById('schedules-editor').innerHTML = ''; // Clear
                                scheds.forEach(s => window.addScheduleRow(s.day, s.time));
                            }
                            if (key === 'messages_json' && value) {
                                const msgs = JSON.parse(value);
                                document.getElementById('messages-editor').innerHTML = ''; // Clear
                                msgs.forEach(m => window.addMessageRow(m.icon, m.title, m.subtext, m.link));
                            }
                        }
                    }
                }
            }
        } catch (error) { console.error('Error loading:', error); }
    }

    const contentForms = document.querySelectorAll('form[data-page]');
    contentForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pageName = form.getAttribute('data-page');
            
            // Serialize complex lists before saving if it's the home page
            if (pageName === 'home') {
                serializeLists();
            }

            // For beliefs page: build the JSON array from dynamic rows
            let updates = {};
            if (pageName === 'beliefs') {
                updates = { beliefs_json: serializeBeliefs() };
            } else {
                const formData = new FormData(form);
                for (let [key, value] of formData.entries()) {
                    updates[key] = value;
                }
            }

            try {
                const response = await apiFetch(`/content/${pageName}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                
                if (response.ok) {
                    const btn = form.querySelector('button[type="submit"]');
                    const originalText = btn.textContent;
                    btn.textContent = '✔ Saved Successfully!';
                    btn.style.background = '#4CAF50';
                    setTimeout(() => { btn.textContent = originalText; btn.style.background = ''; }, 2500);
                } else { alert('Error saving content.'); }
            } catch (error) { console.error(error); }
        });
    });

    loadPageContent('home');
    loadPageContent('global');
    loadPageContent('beliefs');

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await apiFetch('/auth/logout', { method: 'POST' });
            window.location.href = window.location.protocol === 'file:'
                ? 'http://localhost:3002/login.html'
                : './login.html';
        });
    }

    // --- BIBLE STUDIES (Existing logic stripped down for brevity) ---
    async function fetchStudies() {
        const response = await apiFetch('/bible-studies');
        const groupedStudies = await response.json();
        const tbody = document.getElementById('studies-table-body');
        tbody.innerHTML = '';
        for (const [cat, studies] of Object.entries(groupedStudies)) {
            studies.forEach(s => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${cat}</td><td><a href="${s.link}" target="_blank" style="color:white;">${s.title}</a></td><td><button class="btn-delete" data-id="${s.id}">Delete</button></td>`;
                tbody.appendChild(tr);
            });
        }
        document.querySelectorAll('#panel-biblestudies .btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Delete?')) {
                    await apiFetch(`/bible-studies/${e.currentTarget.dataset.id}`, { method: 'DELETE' });
                    fetchStudies();
                }
            });
        });
    }
    document.getElementById('add-study-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = JSON.stringify({ category: document.getElementById('category').value, title: document.getElementById('title').value, link: document.getElementById('link').value });
        await apiFetch('/bible-studies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        fetchStudies();
        e.target.reset();
    });
    fetchStudies();
});
