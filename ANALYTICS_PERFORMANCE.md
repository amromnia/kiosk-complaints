# Analytics performance

## Deployment

Run `npm run optimize-analytics` once against each existing database before starting the updated application. This creates two idempotent covering indexes and runs SQLite's optimizer maintenance. New databases get the indexes through `initDatabase()`.

The indexes add disk usage and work to complaint inserts/updates. Building them on an already large database can take time and temporarily delay other writes; schedule the migration accordingly. The local workspace database has already been updated.

## Query behavior

- The analytics endpoint fetches only the requested section: `?section=kiosks` or `?section=employees`.
- Employee detail views use `&employee_id=<id>`. Regular employees are always scoped to their authenticated ID, regardless of this parameter.
- Employee aggregates use an index covering assignment, status, reopen flag, and closure timestamps.
- Kiosk analytics scans a covering index once, groups by kiosk and leaf complaint type, then resolves category names for those groups. It returns one result per kiosk and subtype, not one result per complaint.
- Results are cached in each application process for up to 30 seconds, with a maximum of 102 entries. A database change invalidates the cache on its next use. `total_changes()` detects writes through this connection and `PRAGMA data_version` detects commits through other connections. Reads inside transactions bypass the cache.

## Verification

Tests passed for hierarchy filtering, totals, score boundaries, grouping multiple leaf types into one subtype, and cache invalidation after local writes, external writes, and rolled-back transactions.

Benchmarks were completed on isolated synthetic datasets of 100,000 and 1,000,000 complaints, with 100 employees, 50 kiosks, and 500-character complaint descriptions. Median timings were measured over seven samples, and SQLite query plans were inspected. No application records were changed. The temporary test and benchmark scripts were removed after verification.

Measured locally on 100,000 synthetic complaints:

| Operation | Original median | Optimized cache-miss median | Cached median |
| --- | ---: | ---: | ---: |
| All employee analytics | 136.48 ms | 26.71 ms | 0.01 ms |
| All kiosk analytics | 254.42 ms | 14.13 ms | 0.02 ms |
| One employee | 0.51 ms | 0.29 ms | 0.01 ms |

At 1,000,000 synthetic complaints with the same employee/kiosk counts, optimized cache-miss medians were 309.77 ms for all employees, 130.42 ms for all kiosks, and 2.54 ms for one employee. Cached medians were 0.01 ms. Query plans confirmed covering-index access for both aggregate queries.

These are query timings on a recently populated local database, with filesystem/database caches warmed. They exclude authentication, HTTP transport, JSON serialization, and browser rendering. They are not a concurrency test or a production latency guarantee.

## Growth limits

Cache misses still calculate all-time totals, so their cost grows with complaint count. The synchronous SQLite driver blocks its application process during those calculations. Frequent writes invalidate the cache, and separate processes maintain separate caches.

Responses and rendered charts also grow with the number of kiosks, employees, and complaint categories. For very large fleets, add server-side pagination for detail tables and separate aggregate chart endpoints.

For sustained high traffic, frequent writes, or aggregate durations that exceed the application's latency budget, move analytics to incrementally maintained summary tables or background-generated snapshots. Profile under the actual deployment's data distribution and concurrent read/write load before choosing that next step.
