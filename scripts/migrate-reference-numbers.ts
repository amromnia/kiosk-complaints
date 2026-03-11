/**
 * Migration Script: Add Reference Numbers to Existing Complaints
 * 
 * This script updates existing complaints to have unique reference numbers.
 * Run this after deploying the database schema changes.
 * 
 * Usage: npx tsx scripts/migrate-reference-numbers.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import { generateReferenceNumber } from '../lib/utils/constants';

const dbPath = path.join(process.cwd(), 'data', 'kiosk-complaints.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function migrateReferenceNumbers() {
  console.log('🚀 Starting migration: Adding reference numbers to existing complaints...\n');

  // Start transaction
  const migrate = db.transaction(() => {
    // Check if reference_number column exists
    const tableInfo = db.prepare("PRAGMA table_info(complaints)").all() as any[];
    const hasReferenceNumber = tableInfo.some((col: any) => col.name === 'reference_number');

    if (!hasReferenceNumber) {
      console.log('❌ ERROR: reference_number column does not exist in complaints table.');
      console.log('Please update the database schema first by running the application.\n');
      return;
    }

    // Get all complaints without reference numbers
    const complaints = db.prepare(`
      SELECT id FROM complaints 
      WHERE reference_number IS NULL OR reference_number = ''
    `).all() as Array<{ id: number }>;

    if (complaints.length === 0) {
      console.log('✅ All complaints already have reference numbers. Nothing to migrate.\n');
      return;
    }

    console.log(`📊 Found ${complaints.length} complaints without reference numbers.\n`);

    // Prepare update statement
    const updateStmt = db.prepare('UPDATE complaints SET reference_number = ? WHERE id = ?');
    const checkExistsStmt = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE reference_number = ?');

    let successCount = 0;
    let errorCount = 0;

    // Update each complaint with a unique reference number
    for (const complaint of complaints) {
      let referenceNumber: string;
      let attempts = 0;
      const maxAttempts = 10;

      // Generate unique reference number
      do {
        referenceNumber = generateReferenceNumber();
        const result = checkExistsStmt.get(referenceNumber) as { count: number };
        if (result.count === 0) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        console.log(`❌ Failed to generate unique reference number for complaint ID ${complaint.id}`);
        errorCount++;
        continue;
      }

      try {
        updateStmt.run(referenceNumber, complaint.id);
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`⏳ Progress: ${successCount}/${complaints.length} complaints updated...`);
        }
      } catch (error) {
        console.log(`❌ Error updating complaint ID ${complaint.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   - Updated: ${successCount} complaints`);
    if (errorCount > 0) {
      console.log(`   - Errors: ${errorCount} complaints`);
    }
    console.log('');
  });

  try {
    migrate();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migration
migrateReferenceNumbers();
