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

// performance optimizations
db.pragma('journal_mode = WAL');
db.pragma('synchronous = FULL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = DEFAULT');
db.pragma('wal_autocheckpoint = 1000'); // checkpoint after every 1000 writes to keep WAL file from growing too large
db.pragma('busy_timeout = 10000'); // wait up to 10 seconds if database is locked before throwing an error


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

  // ==================== INDEXES FOR PERFORMANCE ====================
  
  // Complaints table indexes - most frequently queried table
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_assigned_user_id ON complaints(assigned_user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_complaint_type_id ON complaints(complaint_type_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_kiosk_id ON complaints(kiosk_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_closed_at ON complaints(closed_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority)`);
  
  // Composite indexes for common query patterns and filtering
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_status_assigned_user ON complaints(status, assigned_user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_status_created_at ON complaints(status, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_assigned_user_status ON complaints(assigned_user_id, status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_assigned_user_created_at ON complaints(assigned_user_id, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_complaint_type_created_at ON complaints(complaint_type_id, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_priority_created_at ON complaints(priority, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_status_assigned_created ON complaints(status, assigned_user_id, created_at DESC)`);
  
  // Search indexes for complaints
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_client_phone ON complaints(client_phone)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_client_national_id ON complaints(client_national_id)`);
  
  // Users table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)`);
  
  // Complaint Types table indexes - for hierarchical queries
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaint_types_parent_id ON complaint_types(parent_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaint_types_level ON complaint_types(level)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaint_types_level_display_order ON complaint_types(level, display_order)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_complaint_types_parent_level ON complaint_types(parent_id, level)`);
  
  // Kiosks table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kiosks_is_disabled ON kiosks(is_disabled)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kiosks_location ON kiosks(location)`);
  
  // Attachments table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_complaint_id ON attachments(complaint_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_complaint_upload_date ON attachments(complaint_id, upload_date DESC)`);
  
  // Comments table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_comments_complaint_id ON comments(complaint_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_comments_complaint_created ON comments(complaint_id, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_comments_is_internal ON comments(is_internal)`);
  
  // Status History table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_status_history_complaint_id ON status_history(complaint_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_status_history_complaint_created ON status_history(complaint_id, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_status_history_user_id ON status_history(user_id)`);
  
  // Auto Assignment Rules table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_auto_assignment_complaint_type_id ON auto_assignment_rules(complaint_type_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_auto_assignment_user_id ON auto_assignment_rules(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_auto_assignment_is_active ON auto_assignment_rules(is_active)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_auto_assignment_complaint_type_active ON auto_assignment_rules(complaint_type_id, is_active)`);
  
  // Notifications table indexes - critical for user experience
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_complaint_id ON notifications(complaint_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC)`);
  
  // Registration Links table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_registration_links_expires_at ON registration_links(expires_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_registration_links_is_used ON registration_links(is_used)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_registration_links_user_id ON registration_links(user_id)`);
  
  // User Devices table indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_devices_device_fingerprint ON user_devices(device_fingerprint)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_devices_is_active ON user_devices(is_active)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_devices_user_fingerprint_active ON user_devices(user_id, device_fingerprint, is_active)`);

  console.log('✅ Database schema initialized successfully');
  console.log('✅ Performance indexes created');
};

export default db;
