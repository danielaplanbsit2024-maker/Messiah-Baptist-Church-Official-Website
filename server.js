import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import multer from 'multer';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, process.env.DB_NAME || 'database.sqlite');
const fallbackDbPath = path.join(__dirname, 'database_v2.sqlite');

const htmlPages = new Set([
  'index.html',
  'beliefs.html',
  'bible-studies.html',
  'contact.html',
  'gallery.html',
  'institute.html',
  'ministries.html',
  'missionaries.html',
  'pastor.html',
  'saved.html',
  'sermons.html',
  'staff.html',
  'login.html',
  'admin.html'
]);

const assetFiles = new Set(['style.css', 'main.js', 'admin.js']);

const app = express();
const port = process.env.PORT || 3002;
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'null'
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

function runStatement(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(this);
    });
  });
}

function getRows(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
}

function closeDatabase(database) {
  return new Promise((resolve, reject) => {
    database.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

app.use(session({
  name: 'mbc_sid',
  secret: 'mbc-website-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const requireAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    next();
    return;
  }

  res.status(401).json({ error: 'Unauthorized' });
};

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'images')));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  }
});

async function syncFallbackData() {
  const canSyncFallback = fs.existsSync(fallbackDbPath) && path.resolve(fallbackDbPath) !== path.resolve(dbPath);
  if (!canSyncFallback) {
    return;
  }

  const fallbackDb = new sqlite3.Database(fallbackDbPath);

  try {
    const fallbackPageContent = await getRows(
      fallbackDb,
      'SELECT page_name, content_key, content_value FROM page_content'
    );

    for (const row of fallbackPageContent) {
      await runStatement(
        db,
        'INSERT OR IGNORE INTO page_content (page_name, content_key, content_value) VALUES (?, ?, ?)',
        [row.page_name, row.content_key, row.content_value]
      );
    }

    const existingStudies = await getRows(db, 'SELECT category, title, link FROM bible_studies');
    const existingStudyKeys = new Set(
      existingStudies.map((study) => `${study.category}::${study.title}::${study.link}`)
    );
    const fallbackStudies = await getRows(
      fallbackDb,
      'SELECT category, title, link FROM bible_studies ORDER BY id'
    );

    for (const study of fallbackStudies) {
      const studyKey = `${study.category}::${study.title}::${study.link}`;
      if (existingStudyKeys.has(studyKey)) {
        continue;
      }

      await runStatement(
        db,
        'INSERT INTO bible_studies (category, title, link) VALUES (?, ?, ?)',
        [study.category, study.title, study.link]
      );
      existingStudyKeys.add(studyKey);
    }
  } finally {
    await closeDatabase(fallbackDb);
  }
}

async function ensureDatabaseReady() {
  await runStatement(db, `
    CREATE TABLE IF NOT EXISTS bible_studies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT NOT NULL
    )
  `);

  await runStatement(db, `
    CREATE TABLE IF NOT EXISTS page_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_name TEXT NOT NULL,
      content_key TEXT NOT NULL,
      content_value TEXT NOT NULL,
      UNIQUE(page_name, content_key)
    )
  `);

  await runStatement(db, `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  await runStatement(
    db,
    'INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)',
    ['admin', '$2b$10$Vpeyxl6kx2aJYFKCuB2ae.rtdF8MmFLcnWUYOm36iGXn/JHc8Gai2']
  );

  await syncFallbackData();
}

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fullUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  res.json({ url: fullUrl });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for: ${username}`);

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.regenerate((regenError) => {
      if (regenError) {
        console.error('Session regeneration failed:', regenError);
        return res.status(500).json({ error: 'Could not start session' });
      }

      req.session.adminId = admin.id;
      req.session.username = admin.username;

      req.session.save((saveError) => {
        if (saveError) {
          console.error('Session save failed:', saveError);
          return res.status(500).json({ error: 'Could not save session' });
        }

        res.json({ message: 'Logged in successfully', username: admin.username });
      });
    });
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }

    res.clearCookie('mbc_sid');
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/check', (req, res) => {
  console.log(`Checking session for: ${req.session.username || 'guest'}`);
  if (req.session && req.session.adminId) {
    res.json({ authenticated: true, username: req.session.username });
    return;
  }

  res.json({ authenticated: false });
});

app.get('/api/bible-studies', (req, res) => {
  db.all('SELECT * FROM bible_studies ORDER BY category, title', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

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

app.post('/api/bible-studies', requireAuth, (req, res) => {
  const { category, title, link } = req.body;
  if (!category || !title || !link) {
    return res.status(400).json({ error: 'Please provide category, title, and link' });
  }

  db.run(
    'INSERT INTO bible_studies (category, title, link) VALUES (?, ?, ?)',
    [category, title, link],
    function onInsert(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, category, title, link });
    }
  );
});

app.delete('/api/bible-studies/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM bible_studies WHERE id = ?', id, function onDelete(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Deleted successfully', changes: this.changes });
  });
});

app.get('/api/content/:page_name', (req, res) => {
  const pageName = req.params.page_name;
  db.all('SELECT content_key, content_value FROM page_content WHERE page_name = ?', [pageName], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const content = rows.reduce((acc, row) => {
      acc[row.content_key] = row.content_value;
      return acc;
    }, {});
    res.json(content);
  });
});

app.post('/api/content/:page_name', requireAuth, (req, res) => {
  const pageName = req.params.page_name;
  const updates = req.body;

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid update data' });
  }

  db.serialize(() => {
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO page_content (id, page_name, content_key, content_value) VALUES ((SELECT id FROM page_content WHERE page_name = ? AND content_key = ?), ?, ?, ?)'
    );

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:fileName', (req, res, next) => {
  const { fileName } = req.params;
  if (!htmlPages.has(fileName) && !assetFiles.has(fileName)) {
    next();
    return;
  }

  res.sendFile(path.join(__dirname, fileName));
});

ensureDatabaseReady()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
