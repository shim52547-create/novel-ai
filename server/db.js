const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'novels.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT,
    setting TEXT,
    synopsis TEXT,
    world_rules TEXT,
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    name TEXT NOT NULL,
    age INTEGER,
    appearance TEXT,
    personality TEXT,
    relationships TEXT,
    backstory TEXT,
    status TEXT DEFAULT 'alive',
    first_appearance INTEGER,
    notes TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    chapter_number INTEGER,
    title TEXT,
    content TEXT,
    summary TEXT,
    draft TEXT,
    status TEXT DEFAULT 'draft',
    consistency_score REAL,
    ai_smell_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS plot_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    chapter_number INTEGER,
    event TEXT,
    status TEXT DEFAULT 'planned',
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS story_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    chapter_number INTEGER,
    event_type TEXT,
    description TEXT,
    character_involved TEXT,
    location TEXT,
    importance TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS world_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    entity_type TEXT,
    entity_name TEXT,
    state_key TEXT,
    state_value TEXT,
    updated_chapter INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    chapter_number INTEGER,
    agent_name TEXT,
    input_summary TEXT,
    output_summary TEXT,
    duration_ms INTEGER,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );
`);

// Di trú cho database cũ (đã tồn tại trước khi có đăng nhập): thêm cột owner_id
// nếu chưa có. Nếu đã có (cài mới) thì lệnh này sẽ báo lỗi "duplicate column" và
// bị bỏ qua an toàn.
try {
  db.exec('ALTER TABLE books ADD COLUMN owner_id INTEGER');
} catch (err) {
  if (!/duplicate column/i.test(err.message)) throw err;
}

module.exports = db;