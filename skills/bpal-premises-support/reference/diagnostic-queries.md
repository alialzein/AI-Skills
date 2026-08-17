# SQL Server health — query pack

All queries here are cheap. On premises servers 1433 is normally closed to you, so the usual
mode is: hand the query to the user, they run it in SSMS, they paste results back.

**When 1433 *is* reachable** (a VPN, or — as on a freshly migrated box — an internet-exposed
instance), connect directly and run the pack yourself: `System.Data.SqlClient` with
`SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED` and a short timeout. **Gotcha:** the app
login (e.g. `Contoso`) is often *not* sysadmin and lacks `VIEW SERVER STATE`, which blocks
every server-level DMV below (IO, waits, PLE, requests, config). Check first —
`SELECT IS_SRVROLEMEMBER('sysadmin'), HAS_PERMS_BY_NAME(NULL,NULL,'VIEW SERVER STATE');` — and
if it's zero, ask for the grant. On premises the app login is normally sysadmin anyway (the
CDR export runs `xp_cmdshell`, which requires it), so restoring that is usually correct.

**Cost discipline.** These are live billing databases with multi-TB tables.

- Never `COUNT(*)` a large table casually — one such query cost 191 seconds and 3.1M reads.
- Never `SELECT MIN(x), MAX(x) FROM t` in one statement: it forces a full scan. Split it into
  two scalar subqueries and it becomes two instant index seeks.
- Prefer `sys.dm_db_partition_stats` over `COUNT(*)` for row counts.
- Add `WITH (NOLOCK)` on diagnostic reads against busy tables.
- For a read *tool* (not a one-off), set the whole session lock-free once instead of per-table
  hints, so it can never block the billing writers:
  `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SET LOCK_TIMEOUT 8000; SET DEADLOCK_PRIORITY LOW;`

---

## 1. Instance identity and edition

Edition decides what fixes are available — Standard cannot build indexes `ONLINE`.

```sql
SELECT SERVERPROPERTY('Edition')        AS edition,
       SERVERPROPERTY('ProductVersion') AS build,
       SERVERPROPERTY('ProductLevel')   AS level,
       (SELECT COUNT(*) FROM sys.dm_os_schedulers WHERE status='VISIBLE ONLINE' AND is_online=1) AS schedulers;
```

---

## 2. Page Life Expectancy — always start here

Seconds a data page survives in the buffer pool before eviction. **One row per NUMA node.**

```sql
SELECT [object_name], counter_name, cntr_value AS ple_seconds
FROM sys.dm_os_performance_counters
WHERE counter_name = 'Page life expectancy';
```

| PLE | Reading |
|---|---|
| under 60 | severe — the pool is being flushed constantly, *every* query is slow |
| 60–300 | unhealthy, worth chasing |
| 300+ | classic healthy threshold |
| 400–600+ | comfortable for a busy OLTP box |

PLE swings with load, so compare **same time of day**. It is a symptom: a low value means
something is scanning huge volumes — find that, don't tune around it.

> Reference: one server went 22/18/30 → 488/544/443 after three sequential offenders were
> removed. Expect the number to barely move until the *last* one is gone.

---

## 3. Top consumers by rate — not by total

`total_logical_reads` rewards whatever has been in cache longest. Normalise per second, or
you will miss a proc doing 1.4M reads every 7 seconds and returning nothing.

```sql
SELECT TOP 15
    qs.total_logical_reads / NULLIF(DATEDIFF(SECOND, qs.creation_time, qs.last_execution_time),0) AS reads_per_sec,
    qs.execution_count,
    qs.total_logical_reads / qs.execution_count AS avg_reads,
    qs.total_elapsed_time  / qs.execution_count / 1000 AS avg_ms,
    DB_NAME(t.dbid) AS db,
    OBJECT_NAME(t.objectid, t.dbid) AS object_name,
    LEFT(SUBSTRING(t.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(t.text)
            ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1), 160) AS stmt
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) t
WHERE qs.execution_count > 20
ORDER BY reads_per_sec DESC;
```

**`execution_count` is since the plan was cached, not per day.** Check `creation_time` before
you extrapolate — misreading this once turned 942 executions into a wrong daily figure.

**These DMVs reset on every SQL restart.** On a server that keeps rebooting the numbers are
meaningless; fix the restarts first and say so.

---

## 4. What is happening right now

```sql
SELECT r.session_id, r.status, r.wait_type, r.wait_time, r.blocking_session_id,
       r.cpu_time, r.reads, r.writes, DB_NAME(r.database_id) AS db,
       s.login_name, s.host_name, s.program_name,
       SUBSTRING(t.text, (r.statement_start_offset/2)+1,
         ((CASE r.statement_end_offset WHEN -1 THEN DATALENGTH(t.text)
             ELSE r.statement_end_offset END - r.statement_start_offset)/2)+1) AS stmt
FROM sys.dm_exec_requests r
JOIN sys.dm_exec_sessions s ON s.session_id = r.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.session_id <> @@SPID AND s.is_user_process = 1
ORDER BY r.cpu_time DESC;
```

Wait types worth recognising:

| Wait | Means |
|---|---|
| `PAGEIOLATCH_*` | waiting on disk — usually memory starvation, not a slow disk |
| `LCK_M_*` | blocked by another session — follow `blocking_session_id` |
| `CXPACKET` / `CXCONSUMER` | parallelism; only interesting alongside something else |
| `RESOURCE_SEMAPHORE` | memory grant starvation |
| `WRITELOG` | log write latency |

---

## 5. Table sizes without scanning anything

```sql
SELECT TOP 25
    s.name + '.' + t.name AS table_name,
    SUM(CASE WHEN p.index_id IN (0,1) THEN p.row_count ELSE 0 END) AS rows,
    CAST(SUM(p.reserved_page_count) * 8.0 / 1024 / 1024 AS decimal(18,2)) AS gb
FROM sys.dm_db_partition_stats p
JOIN sys.tables t  ON t.object_id = p.object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
GROUP BY s.name, t.name
ORDER BY gb DESC;
```

---

## 6. Index inventory for one table

Use this before proposing an index — it may already exist.

```sql
SELECT i.name, i.type_desc, i.is_disabled, i.filter_definition,
       STUFF((SELECT ', ' + c.name FROM sys.index_columns ic
              JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
              WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=0
              ORDER BY ic.key_ordinal FOR XML PATH('')),1,2,'') AS key_cols,
       STUFF((SELECT ', ' + c.name FROM sys.index_columns ic
              JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
              WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=1
              FOR XML PATH('')),1,2,'') AS included_cols
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.TABLENAME');
```

Index-creation notes for this estate:

```sql
-- Standard Edition: no ONLINE. Enterprise: add WITH (ONLINE = ON).
CREATE NONCLUSTERED INDEX IX_Name ON dbo.Table (Col)
  WITH (SORT_IN_TEMPDB = ON, MAXDOP = 4);
```

Filtered indexes need `QUOTED_IDENTIFIER ON` and `ANSI_NULLS ON` **for every writer** to the
table, or inserts start failing. Confirm the application sets them before proposing one.

---

## 7. Cheap row and orphan counts

```sql
-- instant, no scan
SELECT SUM(row_count) FROM sys.dm_db_partition_stats
WHERE object_id = OBJECT_ID('dbo.TABLENAME') AND index_id IN (0,1);

-- min/max WITHOUT a full scan - two seeks, not one scan
SELECT (SELECT MIN(id) FROM dbo.TABLENAME) AS min_id,
       (SELECT MAX(id) FROM dbo.TABLENAME) AS max_id;

-- staging orphan check (see the MessageStage case)
SELECT (SELECT COUNT_BIG(*) FROM dbo.MessageStage WITH (NOLOCK)) AS staging_rows,
       (SELECT COUNT_BIG(*) FROM dbo.MessageStage s WITH (NOLOCK)
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Message m WITH (NOLOCK) WHERE m.id = s.id)) AS orphans;
```

---

## 8. SQL Agent jobs

```sql
-- recent failures. run_status: 0=failed 1=succeeded 2=retry 3=cancelled 4=in progress
SELECT TOP 40 j.name, h.run_date, h.run_time, h.run_status, h.run_duration, h.message
FROM msdb.dbo.sysjobhistory h
JOIN msdb.dbo.sysjobs j ON j.job_id = h.job_id
WHERE h.run_status <> 1 AND h.step_id > 0
ORDER BY h.run_date DESC, h.run_time DESC;

-- runtime trend for one job (run_duration is HHMMSS as an integer)
SELECT h.run_date, h.run_time, h.run_status, h.step_id, h.step_name, h.run_duration
FROM msdb.dbo.sysjobhistory h
JOIN msdb.dbo.sysjobs j ON j.job_id = h.job_id
WHERE j.name = '<Client>-Primary-CDR'
ORDER BY h.run_date DESC, h.run_time DESC;
```

**`run_status = 2` (retry) hides failures** — a job showing green may be retrying constantly.
Always look at step level (`step_id > 0`), because a job can report success while a step fails.

---

## 9. SSIS

```sql
-- status: 1 created  2 running  3 cancelled  4 FAILED  5 pending
--         6 ENDED UNEXPECTEDLY (host process died)  7 succeeded  9 completed
SELECT status, COUNT(*) AS runs
FROM SSISDB.catalog.executions
WHERE start_time > DATEADD(DAY,-1,SYSDATETIMEOFFSET())
GROUP BY status;

-- the actual error text. NOTE: event_messages joins on operation_id, NOT execution_id
SELECT TOP 50 e.execution_id, e.status, em.message_time, em.message
FROM SSISDB.catalog.executions e
JOIN SSISDB.catalog.event_messages em ON em.operation_id = e.execution_id
WHERE e.status IN (4,6)
ORDER BY e.execution_id DESC, em.message_time DESC;

-- what is deployed
SELECT f.name AS folder, p.name AS project, p.last_deployed_time,
       (SELECT COUNT(*) FROM SSISDB.catalog.packages k WHERE k.project_id = p.project_id) AS packages
FROM SSISDB.catalog.projects p
JOIN SSISDB.catalog.folders f ON f.folder_id = p.folder_id;
```

**Status 6 means the execution host died**, not that the package logic failed. Go to the
Application log and look for `ISServerExec.exe` crashes — then compare its file version to
`sqlservr.exe` (see the partial-patch case).

---

## 10. The bcp / CDR export check

The single most valuable check on any premises server. `GenerateAccountLogReport` never checks
`xp_cmdshell`'s return value, so a broken `bcp` produces a *successful-looking* log line and
no file.

```sql
SELECT value_in_use FROM sys.configurations WHERE name = 'xp_cmdshell';   -- expect 1
EXEC master..xp_cmdshell 'where bcp';
```

A path means healthy. `INFO: Could not find files...` means every CDR report is failing
silently. Fix the machine `PATH`, then **restart the SQL Server service** — it only reads
`PATH` at process start.

---

## 11. Database and login sanity

```sql
SELECT name, state_desc, recovery_model_desc, is_broker_enabled, is_trustworthy_on,
       SUSER_SNAME(owner_sid) AS owner
FROM sys.databases ORDER BY name;

-- sizes without touching data
SELECT DB_NAME(database_id) AS db,
       CAST(SUM(CASE WHEN type_desc='ROWS' THEN size END)*8.0/1024/1024 AS decimal(18,2)) AS data_gb,
       CAST(SUM(CASE WHEN type_desc='LOG'  THEN size END)*8.0/1024/1024 AS decimal(18,2)) AS log_gb
FROM sys.master_files GROUP BY database_id ORDER BY 2 DESC;

-- "Failed to open the explicitly specified database" = the login is not mapped here
SELECT COUNT(*) FROM [DBNAME].sys.database_principals WHERE name = 'LOGINNAME';
-- fix:
--   USE [DBNAME];
--   CREATE USER [LOGINNAME] FOR LOGIN [LOGINNAME];
--   ALTER ROLE db_owner ADD MEMBER [LOGINNAME];
-- orphaned after an attach (SID mismatch):
--   ALTER USER [LOGINNAME] WITH LOGIN = [LOGINNAME];
```

---

## 12. Proc source

```sql
SELECT OBJECT_NAME(object_id) AS proc_name, definition
FROM sys.sql_modules WHERE OBJECT_NAME(object_id) = 'PROCNAME';
```

Run it **in the right database** — `GetDSNMessages` and `UpdateMessageReceived` live in
`*_BondSMSDB`, not the billing DB. If a `sys.sql_modules` lookup returns nothing, check
`SELECT DB_NAME()` before concluding the proc does not exist.

Offline fallback: the `.dacpac` files under `C:\Deployments\...\1-Database\` are zip archives —
proc bodies are inside `model.xml`.

---

## 13. CDR volume and counts — pick the right tier

CDRs live in three databases. Choose by date range:

| Tier | Database | Table | Use for |
|---|---|---|---|
| Live | `*_BillingDB` | `dbo.CDR` | today / last ~3 days |
| Archive | `*_BPALCDRDB` | `dbo.CDRBackup` (partitioned) | older raw rows |
| Aggregated | `*_BillingDW` | `dbo.FactStatistic` | historical counts — cheapest |

**Live `dbo.CDR`** — clustered on `CreatedDate`, plus `(CreatedDate, <dim>)` covering indexes.
Dimension keys are GUIDs (`ClientAccountId`, `VendorAccountId`, `DestinationCountryId` /
`DestinationOperatorId`, `SourceCountryId` / `SourceOperatorId`); measures `Cost`, `Rate`. Names
come from `*_BillingDB` `dbo.Account` (client **and** vendor), `dbo.Country`, `dbo.Operator`.
Always bound the date half-open so the clustered index seeks the day:

```sql
SELECT cl.Name AS Client, ctry.Name AS Country, op.Name AS Operator,
       COUNT_BIG(*) AS CDRCount, SUM(c.Cost) AS Cost, SUM(c.Rate) AS Rate
FROM dbo.CDR c
  LEFT JOIN dbo.Account  cl   ON cl.AccountId   = c.ClientAccountId
  LEFT JOIN dbo.Country  ctry ON ctry.CountryId = c.DestinationCountryId
  LEFT JOIN dbo.Operator op   ON op.OperatorId  = c.DestinationOperatorId
WHERE c.CreatedDate >= CAST(GETDATE() AS date)
  AND c.CreatedDate <  DATEADD(DAY,1,CAST(GETDATE() AS date))
GROUP BY cl.Name, ctry.Name, op.Name
ORDER BY CDRCount DESC;
```

**Warehouse `dbo.FactStatistic`** — clustered on `Date`, tens of millions of rows, already
aggregated with denormalised names (`ClientName`, `SupplierName` = vendor, `SourceCountryName`,
`SourceOperatorName`, `DestinationCountryName`, `destinationOperatorName`) and a `Count` measure
plus `Cost`/`Rate`/`Profit`. No joins — just `SUM([Count])` grouped by names on a `[Date]` range.
Best for older dates; **today usually isn't loaded yet**, so use the live table for today.

```sql
SELECT ClientName, SupplierName AS Vendor, DestinationCountryName AS Country,
       destinationOperatorName AS Operator,
       SUM(CONVERT(BIGINT,[Count])) AS CDRCount, SUM(Cost) AS Cost, SUM(Rate) AS Rate
FROM dbo.FactStatistic
WHERE [Date] >= @from AND [Date] < @toExcl
GROUP BY ClientName, SupplierName, DestinationCountryName, destinationOperatorName
ORDER BY CDRCount DESC;
```

**Cold-cache caveat.** The first live-CDR count of a day reads the wide rows from disk and can
take tens of seconds (measured 47s cold → 1.6s warm); it's I/O, not a bad plan. `Cost`/`Rate`
are in no narrow index, so the full rows must be read. A covering index
`dbo.CDR (CreatedDate) INCLUDE (ClientAccountId, VendorAccountId, DestinationCountryId,
DestinationOperatorId, SourceCountryId, SourceOperatorId, Cost, Rate)` fixes cold reads — but
`CDR` is high-insert, so weigh the write cost with the DBA before proposing it.

---

## 14. Route / rate-plan cost lookup

`*_BillingDB.dbo.Route` holds current routes; vendor cost is in `dbo.CostPlanItem`, keyed by
`AccountId` (vendor) + `OperatorId`, current row = `Active = 1`. On verified data only ~1% of
`CostPlanItem` is active, each vendor+operator has exactly one active row, and active rows have
`SourceOperatorId` NULL — so join cost with `OUTER APPLY … TOP 1 WHERE Active=1` (can't fan out).
`Route.Rate` (cost side) and `Route.ClientRate` (selling) are often equal on live rows;
`Route.Latest`/`Active` are NULL on live rows (history is in `RouteHistory` /
`RouteHistoryArchive`), so **don't filter on them**. Country is reached via the operator —
`Route` has no `CountryId`.

```sql
SELECT ctry.Name AS Country, op.Name AS Operator, vn.Name AS Vendor,
       r.Rate, cost.PlanCost AS Cost, CAST(r.Rate - cost.PlanCost AS decimal(18,6)) AS Margin
FROM dbo.Route r
  INNER JOIN dbo.Operator op   ON op.OperatorId  = r.OperatorId
  INNER JOIN dbo.Country  ctry ON ctry.CountryId = op.CountryId
  LEFT  JOIN dbo.Account  vn   ON vn.AccountId   = r.VendorAccountId
  OUTER APPLY (SELECT TOP 1 cpi.Cost AS PlanCost FROM dbo.CostPlanItem cpi
               WHERE cpi.AccountId=r.VendorAccountId AND cpi.OperatorId=r.OperatorId AND cpi.Active=1
               ORDER BY cpi.EffectiveDate DESC) cost
WHERE ctry.Name = @country AND ISNULL(r.RouteDeleted,0) = 0;
```

---

## 15. Disk IO — which file, and what is hitting it *right now*

`dm_io_virtual_file_stats` is cumulative since startup, so on a freshly migrated box it is
dominated by the one-time **restore** writes. For live IO, take a **delta**:

```sql
SELECT database_id,file_id,num_of_bytes_read rb,num_of_bytes_written wb,io_stall io
INTO #a FROM sys.dm_io_virtual_file_stats(NULL,NULL);
WAITFOR DELAY '00:00:18';
SELECT TOP 15 DB_NAME(b.database_id) db, mf.type_desc ftype,
   CAST((b.num_of_bytes_read   -a.rb)/1048576.0 AS decimal(18,1)) MB_read,
   CAST((b.num_of_bytes_written-a.wb)/1048576.0 AS decimal(18,1)) MB_written,
   (b.io_stall-a.io) stall_ms
FROM sys.dm_io_virtual_file_stats(NULL,NULL) b
JOIN #a a ON a.database_id=b.database_id AND a.file_id=b.file_id
JOIN sys.master_files mf ON mf.database_id=b.database_id AND mf.file_id=b.file_id
WHERE (b.num_of_bytes_read-a.rb)+(b.num_of_bytes_written-a.wb) > 0
ORDER BY (b.num_of_bytes_read-a.rb)+(b.num_of_bytes_written-a.wb) DESC;  DROP TABLE #a;
```

If **`tempdb` is the top consumer with roughly equal read+write across all its files**, that is
**spill** — sorts/hashes overflowing to disk — and the real cause is almost always parallelism
(see §17), not tempdb itself. Volume free space and per-DB used/allocated:

```sql
SELECT DISTINCT vs.volume_mount_point, CAST(vs.total_bytes/1073741824.0 AS decimal(18,1)) total_GB,
       CAST(vs.available_bytes/1073741824.0 AS decimal(18,1)) free_GB
FROM sys.master_files mf CROSS APPLY sys.dm_os_volume_stats(mf.database_id,mf.file_id) vs ORDER BY 1;
```

---

## 16. Wait profile since startup

```sql
SELECT TOP 12 wait_type, waiting_tasks_count tasks,
   CAST(wait_time_ms/1000.0 AS decimal(18,1)) wait_s,
   CAST(wait_time_ms*1.0/NULLIF(waiting_tasks_count,0) AS decimal(18,1)) avg_ms
FROM sys.dm_os_wait_stats
WHERE waiting_tasks_count>0 AND wait_type NOT IN (
 'CLR_SEMAPHORE','LAZYWRITER_SLEEP','RESOURCE_QUEUE','SLEEP_TASK','SLEEP_SYSTEMTASK','WAITFOR',
 'SQLTRACE_BUFFER_FLUSH','LOGMGR_QUEUE','CHECKPOINT_QUEUE','REQUEST_FOR_DEADLOCK_SEARCH','XE_TIMER_EVENT',
 'BROKER_TO_FLUSH','BROKER_TASK_STOP','CLR_MANUAL_EVENT','CLR_AUTO_EVENT','DISPATCHER_QUEUE_SEMAPHORE',
 'FT_IFTS_SCHEDULER_IDLE_WAIT','XE_DISPATCHER_WAIT','XE_DISPATCHER_JOIN','ONDEMAND_TASK_QUEUE',
 'BROKER_EVENTHANDLER','SLEEP_BPOOL_FLUSH','DIRTY_PAGE_POLL','SP_SERVER_DIAGNOSTICS_SLEEP',
 'QDS_PERSIST_TASK_MAIN_LOOP_SLEEP','QDS_CLEANUP_STALE_QUERIES_TASK_MAIN_LOOP_SLEEP','QDS_SHUTDOWN_QUEUE',
 'SQLTRACE_INCREMENTAL_FLUSH_SLEEP','HADR_FILESTREAM_IOMGR_IOCOMPLETION')
ORDER BY wait_time_ms DESC;
```

| Dominant wait | Reading |
|---|---|
| `CXPACKET` / `CXCONSUMER` / `LATCH_EX` at the top | **parallelism storm** — too many queries going parallel (see §17). This was *the* top wait on the Contoso box (tens of thousands of seconds each). |
| `PAGEIOLATCH_SH` with high `avg_ms` (40 ms+) | slow reads under load / memory pressure — chase the scanning query (§3) |
| `WRITELOG` high | log write latency; check log disk |
| `RESOURCE_SEMAPHORE` | memory-grant starvation |

---

## 17. Instance configuration — the parallelism & memory trap

Freshly built premises SQL instances ship with defaults that hurt a co-hosted billing box:

```sql
SELECT (SELECT cpu_count FROM sys.dm_os_sys_info) cpus,
       (SELECT COUNT(DISTINCT memory_node_id) FROM sys.dm_os_memory_nodes WHERE memory_node_id<64) numa,
       (SELECT CAST(value_in_use AS int)    FROM sys.configurations WHERE name='max degree of parallelism')      maxdop,
       (SELECT CAST(value_in_use AS int)    FROM sys.configurations WHERE name='cost threshold for parallelism') cost_thresh,
       (SELECT CAST(value_in_use AS bigint) FROM sys.configurations WHERE name='max server memory (MB)')         maxmem_mb;
```

- **`max degree of parallelism = 0`** (unlimited) + **`cost threshold for parallelism = 5`** on a
  many-core box → even trivial rating queries fan out to every core, producing the CXPACKET/
  CXCONSUMER/LATCH_EX storm and tempdb spill. Fix: **MAXDOP = 8** (Microsoft's guide for >8 cores,
  single NUMA), **cost threshold = 50**.
- **`max server memory` unlimited** (2147483647) → SQL takes all RAM, but this one box *also* runs
  IIS, ~35 services and SSIS/DTExec. **Cap it**, leaving ~30 GB for the OS + everything else.
- **`xp_cmdshell = 0`** → CDR export and the `HealthMonitor` job fail (see §10). Enable it.

```sql
EXEC sp_configure 'max server memory (MB)', 98304; RECONFIGURE;      -- e.g. ~96 GB on a 128 GB box
EXEC sp_configure 'max degree of parallelism', 8; RECONFIGURE;
EXEC sp_configure 'cost threshold for parallelism', 50; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
```

---

## 18. Missing indexes — read as candidates, not commands

```sql
SELECT TOP 15 DB_NAME(mid.database_id) db, OBJECT_NAME(mid.object_id,mid.database_id) tbl,
   CAST(migs.avg_user_impact AS int) pct, (migs.user_seeks+migs.user_scans) uses,
   CAST(migs.avg_total_user_cost AS decimal(18,1)) avg_cost,
   CAST(migs.avg_total_user_cost*migs.avg_user_impact/100.0*(migs.user_seeks+migs.user_scans) AS decimal(18,0)) score,
   mid.equality_columns, mid.inequality_columns, mid.included_columns
FROM sys.dm_db_missing_index_group_stats migs
JOIN sys.dm_db_missing_index_groups mig ON migs.group_handle=mig.index_group_handle
JOIN sys.dm_db_missing_index_details mid ON mig.index_handle=mid.index_handle
ORDER BY score DESC;
```

- **These reset on restart** and reflect only the workload since — on a migrated box, the SSIS
  jobs (not the app) drive them until the services start.
- **The DMV over-includes.** On the Contoso box the top real hit was `BillingDB.CDR` on
  `(Status, CreditStage, CreatedDate, ClientAccountId)` — but with a ~40-column `INCLUDE` that
  would nearly duplicate a hot, high-insert table. Create the **key-only** index, measure, add a
  couple of includes only if lookups remain. Always check §6 for existing indexes first.
- **Ignore recommendations on `SSISDB.internal.*`** — they are a symptom of bloat (§19), and
  indexing Microsoft-owned catalog tables is unsupported. Fix the bloat instead.

---

## 19. SSISDB bloat

SSISDB is restored *whole* in a migration and is frequently **hundreds of GB** — not packages,
but **execution-logging history** the cleanup never keeps up with. On Contoso it was 459 GB
used, with `internal.execution_parameter_values` at **4.26 billion rows** and 21 M operations
(even a `COUNT` on it timed out).

```sql
-- run in SSISDB: space used vs allocated, biggest tables, retention
SELECT name, CAST(size*8/1048576.0 AS decimal(18,1)) alloc_GB,
       CAST(FILEPROPERTY(name,'SpaceUsed')*8/1048576.0 AS decimal(18,1)) used_GB FROM sys.database_files;
SELECT TOP 10 s.name+'.'+t.name tbl, SUM(p.rows) rows_, CAST(SUM(a.total_pages)*8/1024.0 AS decimal(18,1)) MB
FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN(0,1)
JOIN sys.allocation_units a ON a.container_id=p.partition_id
GROUP BY s.name,t.name ORDER BY SUM(a.total_pages) DESC;
SELECT property_name, property_value FROM catalog.catalog_properties;   -- RETENTION_WINDOW, OPERATION_CLEANUP_ENABLED
```

Fix (DBA): drop `RETENTION_WINDOW` (`catalog.configure_catalog N'RETENTION_WINDOW', N'14'`),
then **purge `internal.operations` oldest-first in small batches** in a maintenance window (the
built-in `SSIS Server Maintenance Job` times out at this size), then `DBCC SHRINKFILE`. The
deployed packages themselves are tiny — the history is disposable.

## 20. Refresh SQL Agent schedules after a timezone change

Change the server timezone and **SQL Agent jobs quietly stop firing.** The Agent caches each
schedule's `next_run_date`/`next_run_time` and will not move a *future* cached value **backward** —
restarting the Agent does **not** fix it. Force a recompute against the new clock by toggling every
enabled schedule off then on:

```sql
DECLARE @sid int;
DECLARE c CURSOR LOCAL FAST_FORWARD FOR
  SELECT DISTINCT s.schedule_id
  FROM msdb.dbo.sysschedules s
  JOIN msdb.dbo.sysjobschedules js ON js.schedule_id = s.schedule_id
  WHERE s.enabled = 1;
OPEN c; FETCH NEXT FROM c INTO @sid;
WHILE @@FETCH_STATUS = 0
BEGIN
  EXEC msdb.dbo.sp_update_schedule @schedule_id=@sid, @enabled=0;
  EXEC msdb.dbo.sp_update_schedule @schedule_id=@sid, @enabled=1;
  FETCH NEXT FROM c INTO @sid;
END
CLOSE c; DEALLOCATE c;
```

Confirm the box's **own** clock first — `tzutil /g` and `echo %TIME%` via `xp_cmdshell` **on the
box**, not `net time \\host` (which returns a *domain* time source and will invent a phantom
offset). There was never a SQL-vs-OS gap on Contoso; `net time` manufactured a false 3-hour one.
The timezone is cached independently by the OS, the SQL engine, and **each .NET process** — so a
running IIS `w3wp` or Windows service keeps the old offset until it is recycled/restarted, even
after the OS is already on the new zone.

---

## 21. Premises user inventory without authentication secrets

Run this in `<Client>_BillingDB`. A Windows administrator credential that grants SMB access does
**not** authorize reading an application connection string or reusing its embedded SQL login.
Use SQL access explicitly supplied or approved by the operator. If SQL is not reachable, hand the
query to the operator to run in SSMS.

Confirm the database and table before reading rows:

```sql
SELECT DB_NAME() AS current_database;

SELECT s.name AS schema_name, t.name AS table_name
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE t.name = 'User';
```

Return operational fields only. Deliberately exclude `Password`, `Token`, authenticator secrets,
password-reset keys, device identifiers, and `Photo`:

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SET LOCK_TIMEOUT 8000;

SELECT u.UserId, u.Name, u.Username, u.AccountId, u.RoleId,
       u.Active, u.Locked, u.TwoFactorEnabled,
       u.LastLogin, u.CreatedDate, u.LastPasswordChange
FROM dbo.[User] u WITH (NOLOCK)
ORDER BY u.Username;
```

For the common support question "which active users are locked?", use the same safe projection:

```sql
SELECT u.UserId, u.Name, u.Username, u.AccountId, u.RoleId,
       u.Active, u.Locked, u.TwoFactorEnabled,
       u.LastLogin, u.CreatedDate, u.LastPasswordChange
FROM dbo.[User] u WITH (NOLOCK)
WHERE u.Active = 1 AND u.Locked = 1
ORDER BY u.Username;
```

An empty result means there are currently no locked active application users. It says nothing
about SQL-login lockout or Windows-account state; those are separate identity stores.
