
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('FAILED to connect to database:', err.message);
        process.exit(1);
    }
    console.log('SUCCESS: Connected to database.sqlite');
});

db.serialize(() => {
    // Check tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) {
            console.error('Error fetching tables:', err.message);
            return;
        }
        console.log('Tables found:', rows.map(r => r.name).join(', '));
        
        const tables = rows.map(r => r.name);
        
        if (tables.includes('admins')) {
            db.get("SELECT COUNT(*) as count FROM admins", (err, row) => {
                if (err) console.error('Error counting admins:', err.message);
                else console.log(`- admins table: OK (${row.count} entries)`);
            });
        } else {
            console.log('- admins table: MISSING');
        }

        if (tables.includes('page_content')) {
            db.get("SELECT COUNT(*) as count FROM page_content", (err, row) => {
                if (err) console.error('Error counting page_content:', err.message);
                else console.log(`- page_content table: OK (${row.count} entries)`);
            });
        } else {
            console.log('- page_content table: MISSING');
        }

        if (tables.includes('bible_studies')) {
            db.get("SELECT COUNT(*) as count FROM bible_studies", (err, row) => {
                if (err) console.error('Error counting bible_studies:', err.message);
                else console.log(`- bible_studies table: OK (${row.count} entries)`);
            });
        } else {
            console.log('- bible_studies table: MISSING');
        }
    });
});

setTimeout(() => {
    db.close();
}, 1000);
