# Reference Number Implementation - Security Enhancement

## Overview

This update replaces sequential complaint IDs with **non-sequential UUID-based reference numbers** to prevent enumeration attacks and enhance security.

## Security Issue Resolved

**Previous Implementation:**
- Complaints used sequential IDs (1, 2, 3, etc.)
- Attackers could easily enumerate and access complaints by guessing IDs
- Potential exposure of sensitive citizen data

**New Implementation:**
- Each complaint gets a unique UUID v4 reference number
- Format: `550e8400-e29b-41d4-a716-446655440000`
- 2^128 possible combinations (340 undecillion)
- Cryptographically secure randomness
- No collision risk or enumeration possibility

## Changes Made

### 1. Database Schema (`lib/db/schema.ts`)
- Added `reference_number TEXT UNIQUE NOT NULL` column to `complaints` table
- Added index on `reference_number` for fast lookups

### 2. Reference Number Generator (`lib/utils/constants.ts`)
- New `generateReferenceNumber()` function using UUID v4
- Uses `crypto.randomUUID()` (Node 16+) with fallback

### 3. Database Queries (`lib/db/queries.ts`)
- Updated `stmtCreateComplaint` to include reference_number
- Added `getComplaintByReferenceNumber()` query
- Added `checkReferenceNumberExists()` for validation
- Modified all notification messages to use reference numbers
- Updated transaction functions to return both ID and reference number

### 4. API Endpoints
Updated to use reference numbers:
- `app/api/complaints/submit/route.ts` - Returns reference_number instead of complaint_id
- `app/api/complaints/[id]/assign/route.ts` - Uses reference in notifications
- `app/api/complaints/[id]/status/route.ts` - Uses reference in notifications
- `app/api/complaints/[id]/comments/route.ts` - Uses reference in notifications

### 5. UI Components
Updated to display reference numbers:
- `components/ComplaintCard.tsx` - Shows reference_number
- `app/complaint/[kiosk]/page.tsx` - Displays reference after submission
- `app/dashboard/user/complaints/[id]/page.tsx` - Shows reference in header
- `app/dashboard/admin/complaints/[id]/page.tsx` - Shows reference in header

### 6. Migration Script (`scripts/migrate-reference-numbers.ts`)
- Adds reference numbers to existing complaints in the database
- Safe transaction-based migration
- Progress tracking and error handling

## Deployment Steps

### 1. Backup Database
```powershell
# Create a backup of your database
Copy-Item "data\kiosk-complaints.db" "data\kiosk-complaints.backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').db"
```

### 2. Deploy Code Changes
```powershell
# Pull the latest code
git pull origin master
```

### 3. Update Database Schema
The schema will be automatically updated when the application starts (if using the initDatabase() function).

**OR** manually update the schema:
```sql
-- Add reference_number column
ALTER TABLE complaints ADD COLUMN reference_number TEXT;

-- Create unique constraint
CREATE UNIQUE INDEX idx_complaints_reference_number_unique ON complaints(reference_number);

-- Create index for fast lookups
CREATE INDEX idx_complaints_reference_number ON complaints(reference_number);
```

### 4. Run Migration Script
```powershell
# Migrate existing complaints to have reference numbers
npx tsx scripts/migrate-reference-numbers.ts
```

Expected output:
```
🚀 Starting migration: Adding reference numbers to existing complaints...

📊 Found 150 complaints without reference numbers.

⏳ Progress: 100/150 complaints updated...

✅ Migration completed successfully!
   - Updated: 150 complaints
```

### 5. Verify Migration
```powershell
# Check database
sqlite3 data/kiosk-complaints.db "SELECT COUNT(*) as total, COUNT(reference_number) as with_ref FROM complaints;"
```

Both counts should be equal.

### 6. Restart Application
```powershell
# Restart the application
npm run dev
# or
npm run start
```

## Testing

### Test New Complaint Submission
1. Go to a kiosk complaint form
2. Submit a new complaint
3. Verify the success page shows a UUID reference number (e.g., `#550e8400-e29b-41d4-a716-446655440000`)

### Test Complaint Display
1. Login as admin or user
2. View complaints list
3. Verify each complaint shows a UUID reference number
4. Click on a complaint
5. Verify the detail page shows the reference number in the header

### Test Security
1. Try to access a complaint by ID: `/dashboard/admin/complaints/1`
   - ✅ Still works (internal IDs still exist for relationships)
2. Note that reference numbers are now displayed everywhere instead of IDs
3. Attacker cannot enumerate complaints because UUIDs are unpredictable

## Important Notes

### Internal ID vs Reference Number
- **Internal ID** (integer): Still used for database relationships, joins, and internal operations
- **Reference Number** (UUID): Used for display, communication with citizens, and external references

### API Compatibility
- The API endpoint URLs still use `/complaints/[id]` with numeric IDs
- This is intentional for internal routing
- Reference numbers are displayed in the UI and returned in responses
- Future enhancement: Could also support lookup by reference number

### No Breaking Changes
- Existing complaints will work after migration
- Database relationships remain intact
- Internal IDs preserved for foreign keys

## Rollback Plan (If Needed)

If you need to rollback:

1. **Restore Database:**
   ```powershell
   Copy-Item "data\kiosk-complaints.backup-YYYY-MM-DD-HHmmss.db" "data\kiosk-complaints.db"
   ```

2. **Revert Code:**
   ```powershell
   git revert HEAD
   ```

3. **Restart Application**

## Benefits

✅ **Security**: Prevents enumeration attacks  
✅ **Privacy**: Protects citizen data from unauthorized access  
✅ **Scalability**: UUIDs are globally unique, no coordination needed  
✅ **Compliance**: Better alignment with data protection best practices  
✅ **Future-Proof**: Can integrate with external systems using UUIDs  

## Support

If you encounter any issues during deployment:
1. Check the migration script output for errors
2. Verify database backup was created
3. Check application logs for any errors
4. Verify all complaints have reference numbers using SQL query above
