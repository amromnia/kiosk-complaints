import db from './schema';

const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 102;
const cache = new Map<string, { expiresAt: number; value: EmployeeAnalytics[] | KioskAnalytics[] }>();
let databaseRevision = '';
// total_changes tracks this connection's writes; data_version tracks commits from other connections.
function cachedAnalytics<T extends EmployeeAnalytics[] | KioskAnalytics[]>(key: string, compute: () => T): T {
  // Never publish uncommitted results into the process cache.
  if (db.inTransaction) return compute();
  const localChanges = (db.prepare('SELECT total_changes() AS count').get() as { count: number }).count;
  const revision = `${localChanges}:${db.pragma('data_version', { simple: true })}`;
  if (revision !== databaseRevision) {
    cache.clear();
    databaseRevision = revision;
  }
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    cache.delete(key);
    cache.set(key, existing);
    return existing.value as T;
  }
  const value = compute();
  cache.delete(key);
  if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export type EmployeeAnalytics = {
  id: number; name: string; total: number; closed: number; reopened: number;
  avgHoursToClose: number | null; closureRate: number; reopenRate: number;
  performanceScore: number | null;
};

// A simple indicator, calculated from complaints currently assigned to the employee.
// Speed earns full credit at <=24 hours and decreases proportionally thereafter.
export function scoreEmployee(row: {
  total: number; closed: number; reopened: number; avgHoursToClose: number | null;
}) {
  const closureRate = row.total ? row.closed / row.total : 0;
  const reopenRate = row.total ? row.reopened / row.total : 0;
  const speed = row.avgHoursToClose === null ? 0 : Math.min(1, 24 / Math.max(24, row.avgHoursToClose));
  return {
    closureRate: Math.round(closureRate * 100),
    reopenRate: Math.round(reopenRate * 100),
    performanceScore: row.total === 0 ? null : Math.round(60 * closureRate + 25 * speed + 15 * (1 - reopenRate)),
  };
}

export function getEmployeeAnalytics(userId?: number): EmployeeAnalytics[] {
  if (userId !== undefined && (!Number.isSafeInteger(userId) || userId < 1)) throw new Error('Invalid user ID');
  return cachedAnalytics(`employee:${userId ?? 'all'}`, () => {
    const rows = db.prepare(`
      SELECT u.id, u.name, COUNT(c.id) AS total,
        SUM(CASE WHEN c.status = 'closed' THEN 1 ELSE 0 END) AS closed,
        SUM(CASE WHEN c.is_reopened = 1 THEN 1 ELSE 0 END) AS reopened,
        AVG(CASE WHEN c.status = 'closed' AND c.closed_at >= c.created_at
          THEN (julianday(c.closed_at) - julianday(c.created_at)) * 24 END) AS avgHoursToClose
      FROM users u LEFT JOIN complaints c ON c.assigned_user_id = u.id
      WHERE ${userId === undefined ? "u.role = 'user'" : 'u.id = ?'}
      GROUP BY u.id ORDER BY total DESC, u.id
    `).all(...(userId === undefined ? [] : [userId])) as Omit<EmployeeAnalytics, 'closureRate' | 'reopenRate' | 'performanceScore'>[];
    return rows.map(row => ({ ...row, ...scoreEmployee(row) }));
  });
}

export type KioskAnalytics = {
  id: number; location: string | null; total: number; open: number; closed: number;
  types: { category: string; subtype: string | null; count: number }[];
};

export function getKioskAnalytics(): KioskAnalytics[] {
  return cachedAnalytics('kiosks', () => {
    // Aggregate once by leaf type before resolving its hierarchy. Name joins then operate
    // on kiosk/type groups rather than on every complaint.
    const rows = db.prepare(`
      WITH counts AS (
        SELECT kiosk_id, complaint_type_id, COUNT(*) AS total,
          SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS open,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed
        FROM complaints GROUP BY kiosk_id, complaint_type_id
      )
      SELECT k.id, k.location, COALESCE(c.total, 0) AS total,
        COALESCE(c.open, 0) AS open, COALESCE(c.closed, 0) AS closed,
        COALESCE(g.id, p.id, ct.id) AS category_id,
        COALESCE(g.name_ar, p.name_ar, ct.name_ar) AS category,
        CASE WHEN g.id IS NOT NULL THEN p.id WHEN p.id IS NOT NULL THEN ct.id END AS subtype_id,
        CASE WHEN g.id IS NOT NULL THEN p.name_ar WHEN p.id IS NOT NULL THEN ct.name_ar END AS subtype,
        c.total AS count
      FROM kiosks k LEFT JOIN counts c ON c.kiosk_id = k.id
      LEFT JOIN complaint_types ct ON c.complaint_type_id = ct.id
      LEFT JOIN complaint_types p ON ct.parent_id = p.id
      LEFT JOIN complaint_types g ON p.parent_id = g.id
    `).all() as (Omit<KioskAnalytics, 'types'> & {
      category_id: number | null; category: string | null;
      subtype_id: number | null; subtype: string | null; count: number | null;
    })[];
    const byKiosk = new Map<number, { kiosk: KioskAnalytics; types: Map<string, KioskAnalytics['types'][number]> }>();
    for (const row of rows) {
      let entry = byKiosk.get(row.id);
      if (!entry) {
        entry = { kiosk: { id: row.id, location: row.location, total: 0, open: 0, closed: 0, types: [] }, types: new Map() };
        byKiosk.set(row.id, entry);
      }
      entry.kiosk.total += row.total;
      entry.kiosk.open += row.open;
      entry.kiosk.closed += row.closed;
      if (row.count && row.category) {
        const key = `${row.category_id}:${row.subtype_id}`;
        const type = entry.types.get(key) || { category: row.category, subtype: row.subtype, count: 0 };
        type.count += row.count;
        entry.types.set(key, type);
      }
    }
    return Array.from(byKiosk.values(), ({ kiosk, types }) => ({
      ...kiosk, types: Array.from(types.values()).sort((a, b) => b.count - a.count),
    })).sort((a, b) => b.total - a.total || a.id - b.id);
  });
}
