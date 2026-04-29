
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database_v2.sqlite');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('FAILED to connect to database_v2.sqlite:', err.message);
        process.exit(1);
    }
    console.log('SUCCESS: Connected to database_v2.sqlite');
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) {
            console.error('Error fetching tables:', err.message);
            return;
        }
        console.log('Tables found:', rows.map(r => r.name).join(', '));
    });
});

setTimeout(() => {
    db.close();
}, 1000);
