
import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';

async function test() {
  try {
    const hash = await bcrypt.hash('test', 10);
    console.log('Bcrypt OK');
    const db = new sqlite3.Database(':memory:');
    console.log('Sqlite3 OK');
    db.close();
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}
test();
