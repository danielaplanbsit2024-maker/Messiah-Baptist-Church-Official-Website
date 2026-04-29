import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.sqlite');

const app = express();
const port = process.env.PORT || 3000;

// Setup Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads statically from the backend so images load anywhere
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API Endpoints

// Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the full backend URL so it works even if Vite is closed or user uses file:// protocol
  const fullUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  res.json({ url: fullUrl });
});


// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  }
});

// API Endpoints

// Get all Bible Studies
app.get('/api/bible-studies', (req, res) => {
  db.all('SELECT * FROM bible_studies ORDER BY category, title', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Group by category to make it easier for the frontend
    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = [];
      }
      acc[row.category].push({ id: row.id, title: row.title, link: row.link });
      return acc;
    }, {});
    
    res.json(grouped);
  });
});

// Add a new Bible Study
app.post('/api/bible-studies', (req, res) => {
  const { category, title, link } = req.body;
  if (!category || !title || !link) {
    return res.status(400).json({ error: 'Please provide category, title, and link' });
  }

  db.run(
    'INSERT INTO bible_studies (category, title, link) VALUES (?, ?, ?)',
    [category, title, link],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, category, title, link });
    }
  );
});

// Delete a Bible Study
app.delete('/api/bible-studies/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM bible_studies WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Deleted successfully', changes: this.changes });
  });
});

// Get content for a specific page (or global)
app.get('/api/content/:page_name', (req, res) => {
  const pageName = req.params.page_name;
  db.all('SELECT content_key, content_value FROM page_content WHERE page_name = ?', [pageName], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Return as key-value pairs
    const content = rows.reduce((acc, row) => {
      acc[row.content_key] = row.content_value;
      return acc;
    }, {});
    res.json(content);
  });
});

// Update content for a specific page
app.post('/api/content/:page_name', (req, res) => {
  const pageName = req.params.page_name;
  const updates = req.body; // Expecting { key: value, key2: value2 }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid update data' });
  }

  // To handle multiple updates efficiently, we use a transaction-like approach
  db.serialize(() => {
    const stmt = db.prepare('INSERT OR REPLACE INTO page_content (id, page_name, content_key, content_value) VALUES ((SELECT id FROM page_content WHERE page_name = ? AND content_key = ?), ?, ?, ?)');
    
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(pageName, key, pageName, key, value);
    }
    
    stmt.finalize((err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Content updated successfully' });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
