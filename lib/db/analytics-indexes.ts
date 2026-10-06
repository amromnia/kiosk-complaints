import type Database from 'better-sqlite3';

export function ensureAnalyticsIndexes(db: Database.Database) {
  // Cover the aggregate columns so analytics need not read complaint descriptions or client data.
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_complaints_employee_analytics
      ON complaints(assigned_user_id, status, is_reopened, created_at, closed_at);
    CREATE INDEX IF NOT EXISTS idx_complaints_kiosk_analytics
      ON complaints(kiosk_id, complaint_type_id, status);
  `);
}
