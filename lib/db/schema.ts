import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(process.cwd(), 'data', 'kiosk-complaints.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export const initDatabase = () => {
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'user')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Complaint Types Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaint_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ar TEXT NOT NULL,
      parent_id INTEGER,
      level INTEGER NOT NULL DEFAULT 1 CHECK(level BETWEEN 1 AND 3),
      priority INTEGER NOT NULL CHECK(priority BETWEEN 1 AND 3),
      requires_image BOOLEAN NOT NULL DEFAULT 0,
      auto_assignment_enabled BOOLEAN NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES complaint_types(id) ON DELETE CASCADE
    )
  `);

  // Kiosks Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS kiosks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unique_link TEXT UNIQUE NOT NULL,
      location TEXT,
      is_disabled BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Complaints Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_phone TEXT NOT NULL,
      client_national_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      complaint_type_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      kiosk_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened')),
      priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
      assigned_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      is_satisfied BOOLEAN,
      is_reopened BOOLEAN DEFAULT 0,
      FOREIGN KEY (complaint_type_id) REFERENCES complaint_types(id),
      FOREIGN KEY (kiosk_id) REFERENCES kiosks(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id)
    )
  `);

  // Attachments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      uploaded_by TEXT NOT NULL CHECK(uploaded_by IN ('client', 'user', 'admin')),
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    )
  `);

  // Comments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment_text TEXT NOT NULL,
      is_internal BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Status History Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      change_description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Auto Assignment Rules Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS auto_assignment_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_type_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_type_id) REFERENCES complaint_types(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Registration Links Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS registration_links (
      token TEXT PRIMARY KEY,
      user_id INTEGER,
      device_fingerprint TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('superadmin', 'admin', 'user')),
      expires_at DATETIME NOT NULL,
      is_used BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      complaint_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('new_complaint', 'status_change', 'comment', 'assignment')),
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    )
  `);

  // Device Registration Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_fingerprint TEXT NOT NULL,
      registration_token TEXT UNIQUE NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, device_fingerprint)
    )
  `);

  console.log('✅ Database schema initialized successfully');
};

export default db;
