import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('month filtering and totals respect boundaries, other filters and pagination', async () => {
  const originalDir = process.cwd();
  const tempDir = mkdtempSync(join(tmpdir(), 'complaint-month-'));
  process.chdir(tempDir);
  const { default: db, initDatabase } = await import('../lib/db/schema');
  try {
    initDatabase();
    const { getComplaintsPaginated } = await import('../lib/db/queries');
    db.exec(`
      INSERT INTO users (id, name, role) VALUES (1, 'One', 'user'), (2, 'Two', 'user');
      INSERT INTO complaint_types (id, name_ar, priority) VALUES (1, 'Type', 1);
      INSERT INTO kiosks (id, unique_link) VALUES (1, 'kiosk');
    `);
    const insert = db.prepare(`
      INSERT INTO complaints (reference_number, client_phone, client_national_id, client_name,
        complaint_type_id, description, kiosk_id, priority, status, assigned_user_id, created_at)
      VALUES (?, 'phone', 'national-id', 'Client', 1, 'description', 1, 'high', ?, ?, ?)
    `);
    insert.run('before', 'new', 1, '2024-01-31 23:59:59');
    for (let i = 0; i < 21; i++) {
      insert.run(`match-${i}`, 'new', 1, i === 0 ? '2024-02-01 00:00:00' : '2024-02-29 23:59:59.999');
    }
    insert.run('other-status', 'closed', 1, '2024-02-15 12:00:00');
    insert.run('other-user', 'new', 2, '2024-02-15 12:00:00');
    insert.run('after', 'new', 1, '2024-03-01 00:00:00');
    insert.run('december', 'new', 1, '2024-12-31 23:59:59');
    insert.run('january', 'new', 1, '2025-01-01 00:00:00');

    const filters = { month: '2024-02', status: 'new', assigned_user_id: 1, pageSize: 20 };
    const first = getComplaintsPaginated(filters);
    const second = getComplaintsPaginated({ ...filters, page: 2 });
    assert.equal(first.total, 21);
    assert.equal(first.complaints.length, 20);
    assert.equal(second.total, 21);
    assert.equal(second.complaints.length, 1);
    assert.equal(getComplaintsPaginated({ month: '2024-02' }).total, 23);
    assert.equal(getComplaintsPaginated({ ...filters, search: 'Client', complaint_type_id: 1, priority: 'high' }).total, 21);
    assert.equal(getComplaintsPaginated({ ...filters, search: 'missing' }).total, 0);
    assert.equal(getComplaintsPaginated({ assigned_user_id: 2 }).total, 1);
    assert.equal(getComplaintsPaginated({ month: '2024-12' }).total, 1);
    assert.equal(getComplaintsPaginated({ month: '2024-04' }).total, 0);
    assert.throws(() => getComplaintsPaginated({ month: '2024-13' }), /Invalid month/);
  } finally {
    db.close();
    process.chdir(originalDir);
    rmSync(tempDir, { recursive: true, force: true });
  }
});
