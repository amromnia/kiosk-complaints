import db from '../lib/db/schema';
import { ensureAnalyticsIndexes } from '../lib/db/analytics-indexes';

try {
  ensureAnalyticsIndexes(db);
  db.pragma('optimize');
  console.log('Analytics indexes are ready.');
} finally {
  db.close();
}
