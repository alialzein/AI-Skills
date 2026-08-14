# Case library — faults that repeat across premises clients

Each case: how it presents, how to confirm it, what fixes it, and the measured result where
one exists. All were diagnosed on live client servers during 2026.

---

## Case 1 — CDR reports "generated" but no file exists

**Presents as:** the web UI reports success, the service log contains
`ReportGeneratorService: location: C:\inetpub\BillingWeb\Files\<guid>.csv` — and the folder is
empty. Often traced back to one specific date when files simply stopped appearing.

**Mechanism.** `GenerateAccountLogReport` builds a `bcp` command and runs it through
`xp_cmdshell`:

```sql
select @sql = 'bcp "'+ @sp +'" queryout "' + @fileLoc + '" -c -t, -T -w'
exec master..xp_cmdshell @sql          -- return value NEVER checked
```

The return value is discarded, so any failure is swallowed and the service logs its success
line regardless. **That log line is not evidence the file was written.**

**Confirm:**

```sql
EXEC master..xp_cmdshell 'where bcp';
```

Path = healthy. `INFO: Could not find files...` = every report is failing silently.

**Two root causes seen:**

1. **The machine `PATH` was completely empty** (`LENGTH: 0`). `xp_cmdshell` therefore could
   not resolve `bcp.exe`. Check from PowerShell:
   ```powershell
   $p = [Environment]::GetEnvironmentVariable('Path','Machine')
   "LENGTH: $($p.Length)"
   ```
   Fix by restoring the standard entries plus SQL's tools:
   ```powershell
   $want = @('C:\Windows\system32','C:\Windows','C:\Windows\System32\Wbem',
     'C:\Windows\System32\WindowsPowerShell\v1.0',
     'C:\Program Files\Microsoft SQL Server\130\Tools\Binn',
     'C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\130\Tools\Binn',
     'C:\Program Files\Microsoft SQL Server\130\DTS\Binn',
     'C:\Program Files (x86)\Microsoft SQL Server\130\Tools\Binn')
   $cur = [Environment]::GetEnvironmentVariable('Path','Machine')
   $new = ((($cur -split ';' | Where-Object { $_ }) + $want) | Select-Object -Unique) -join ';'
   [Environment]::SetEnvironmentVariable('Path', $new, 'Machine')
   ```
   **Then restart the SQL Server service** — it inherits `PATH` at process start, so the fix
   does nothing until it restarts.

2. **`SQLFileLocation` pointed at a mapped drive** (`Z:\GeneratedCDRs`). Drive letters are
   per-session and invisible to a service account, so `bcp` wrote nowhere. Always a local path.

**Verify:** re-run the bcp by hand through `xp_cmdshell` and confirm `1 rows copied`, then
confirm the file exists on disk.

**Other things to rule out first** (all were ruled out in the real case): folder ACLs, disk
space, missing `bcp.exe` on disk, bcp login failure.

---

## Case 2 — whole instance slow, jobs degrading over weeks

**Presents as:** a job scheduled every minute takes 25 s, then 3 min, then 50 min. Users
report everything is slow, not one feature.

**Mechanism.** PLE of 18–30 s: the buffer pool is being flushed continuously, so every query
re-reads from disk. The cause was an **unindexed `COUNT(1)`** over a 38.9M-row
`WinServiceError` table costing 174 s CPU per execution and running constantly.

**Confirm:** PLE first (query pack §2), then top consumers **by rate** (§3). The offender will
not appear near the top of a naive `ORDER BY total_logical_reads`.

**Fix:**

```sql
CREATE NONCLUSTERED INDEX IX_WinServiceError_WinServiceId
ON dbo.WinServiceError (WinServiceId) WITH (SORT_IN_TEMPDB = ON, MAXDOP = 4);
```

**Measured:** 3,150,000 reads → **36**. 267,000 ms → **1 ms**. The CDR merge step went
178 s → 3 s and stayed at 2–5 s across 20 consecutive runs.

**Before proposing a purge of `WinServiceError`:** look inside it first. It is a service error
log; a 35M-row delete script for a table nobody has inspected is not a safe recommendation.
Index first — that alone may resolve it.

---

## Case 3 — SMS Portal I/O, queries returning zero rows

Two distinct faults in `*_BondSMSDB`, found in sequence. Fixing the first exposed the second.

### 3a — `GetDSNMessages`

Ran every ~7 seconds, **1.39M logical reads each**, returning **zero rows every time** —
roughly 70% of all instance I/O for nothing.

```sql
CREATE PROCEDURE [dbo].[GetDSNMessages] @Limit int = 1000 AS
select top(@limit) * from Message with (nolock index=[_dta_index_Message_status_receivedDate])
where ReceivedDate >= Dateadd(HH,-48,GETDATE()) and (status = 1 or status = 2)
  and HasDSN = 1 and IsDSNPosted = 0 and ClientApiId is not null
```

The DSN feature was entirely unused (`has_dsn = 0`, `via_api = 0` across the estate).

**Note on the index hint:** it is tempting to blame it. Tested both ways — unhinted 1,393,597
reads vs hinted 1,370,302. **Effectively identical.** No index covered the selective
predicates; the hint was not the problem.

**Fix:** a filtered index covering the real predicates, and remove the hint.
**Measured:** 1,396,555 reads / 2,193 ms → **0 reads / 0.70 ms**, and it left the top 10.

### 3b — `MessageStage` orphans

`UpdateMessageReceived` at 2,314,830 reads per execution, ~306,000 reads/sec, matching zero rows.

```sql
DECLARE @Updated table(id int);
if exists(select top 1 id from MessageStage)   -- permanently true
Begin
  update m set ... OUTPUT inserted.Id INTO @Updated
  from Message m inner join MessageStage t on m.id = t.id
```

Self-perpetuating: the guard is permanently true because orphans never clear, `@Updated` never
populates, so the cleanup `DELETE` never fires. 533,666 rows, **533,666 orphans — 100%**.
Origin was episodic (a two-day batch failure), not gradual.

**Confirm:** the orphan query in the query pack §7. A 100% orphan rate is the signature.

**Fix:** clear the orphans, then fix the batch path that leaves them. Watch whether the count
regrows — if it does, the root cause is still live.

**Scale matters.** Another client showed 8,000 rows / 8,000 orphans — same defect, caught
early, costing nothing yet. Worth fixing before it becomes 533K, but not an emergency.

### The overall arc

PLE across the whole engagement: `22/18/30` → (index) `44/43/45` → (GetDSNMessages) `26/24/27`
→ next morning `60/52/70` → (MessageStage) **`488/544/443`**. Roughly 21×.

**Expect this shape.** Removing one offender exposes the next, and PLE may look *worse*
immediately after a fix because the freed capacity is instantly consumed by the next-largest
consumer. Do not read a single reading as failure.

---

## Case 4 — every SSIS job fails in under two seconds

**Presents as:** `<Client>-Master-Agent-SSIS` and `<Client>-Primary-CDR` failing every
10–20 seconds, each run lasting 0.4–2.3 s, message *"Package execution on IS Server failed.
Execution Status: 6"*.

**Mechanism.** Status 6 is **"ended unexpectedly"** — the execution host process *died*.
In the Application log, `ISServerExec.exe` was crashing 130 times in 4 hours with access
violations in `clr.dll`.

Root cause was a **partially applied SQL Server patch**: the engine, Agent and `MsDtsSrvr.exe`
had been updated, but `ISServerExec.exe` and `DTExec.exe` were left on the previous build.

**Confirm — a 30-second check worth running on any new build:**

```powershell
Get-Item 'C:\Program Files\Microsoft SQL Server\130\DTS\Binn\ISServerExec.exe',
         'C:\Program Files\Microsoft SQL Server\130\DTS\Binn\DTExec.exe',
         'C:\Program Files\Microsoft SQL Server\MSSQL13.MSSQLSERVER\MSSQL\Binn\sqlservr.exe' |
  Select-Object Name, @{n='Version';e={$_.VersionInfo.FileVersion}}, LastWriteTime
```

Build numbers must match. A real example — note the two-year gap inside one folder:

| Binary | Version | Date |
|---|---|---|
| `sqlservr.exe` | 2015.0131.**6435**.01 | 2023-07-31 |
| `MsDtsSrvr.exe` | 13.0.**6435**.1 | 2023-07-31 |
| `ISServerExec.exe` | 13.0.**6300**.2 | **2021-08-07** |
| `DTExec.exe` | 2015.0131.**6300**.02 | **2021-08-07** |

Also compare against the catalog:

```sql
SELECT property_name, property_value FROM SSISDB.catalog.catalog_properties;  -- SCHEMA_BUILD
```

**Fix:** re-apply the SQL Server update so it covers Integration Services. If it reports
nothing to do, run **Repair** from SQL Server Setup for the Integration Services feature, then
re-apply. Verify the versions match afterwards.

**Before restarting the pipeline**, check the backlog — it may have been failing for weeks and
will try to catch up in one burst against a multi-TB database.

---

## Case 5 — System log flooded by DCOM 10016

**Presents as:** ~1,300 `DistributedCOM` 10016 events per hour, dead steady, unaffected by
load. The System log holds under a day of history as a result, which cripples any later
investigation.

**Do not dismiss it as known-benign noise without resolving the CLSID.** In the real case it
resolved to:

- CLSID → `Microsoft.SqlServer.Dts.Server.DtsServer`
- APPID → `Microsoft SQL Server Integration Services 13.0`
- Denied account → **`NT SERVICE\SQLSERVERAGENT`**

i.e. SQL Agent being refused Local Activation on SSIS, ~22 times a minute.

**Resolve any CLSID:**

```powershell
$k  = [Microsoft.Win32.RegistryKey]::OpenRemoteBaseKey('LocalMachine','HOST')
$k.OpenSubKey('SOFTWARE\Classes\CLSID\{GUID}').GetValue('')
$k.OpenSubKey('SOFTWARE\Classes\AppID\{APPID}').GetValue('')
```

**Fix** (documented Microsoft procedure): `dcomcnfg` → Component Services → DCOM Config →
*Microsoft SQL Server Integration Services 13.0* → Properties → Security → **Launch and
Activation Permissions** → Edit → add `NT SERVICE\SQLSERVERAGENT` with **Local Launch** +
**Local Activation**. The AppID key is usually owned by `BUILTIN\Administrators`, so no
ownership takeover is needed — check with:

```powershell
$ap = $k.OpenSubKey('SOFTWARE\Classes\AppID\{DB336D8E-32E5-42B9-B14B-58AAA87CEB06}')
$sd = New-Object System.Security.AccessControl.RawSecurityDescriptor($ap.GetValue('LaunchPermission'),0)
$sd.GetSddlForm('All')      # O:BA = owner is Administrators, editable
```

**Be honest about what this fixes.** It stops the log flood. It does **not** necessarily fix
the package failures — if executions are reaching status 6, they are already starting and then
dying, which is Case 4, a separate problem sharing a component.

Also raise the log size so the next incident is diagnosable (server-health §5).

---

## Case 6 — "Failed to open the explicitly specified database"

**Presents as:** bursts of `Login failed for user 'X'. Reason: Failed to open the explicitly
specified database 'Y'` in the SQL ERRORLOG, usually just after a restart or a migration.

**Two different causes:**

1. **Transient** — services connect before databases finish recovery after a restart. Noise;
   ignore unless persistent.
2. **Persistent** — the login exists at server level but is **not mapped into that database**.
   Standard post-migration failure. Query and fix in the query pack §11.

After an attach, the login SID may differ even when names match — that is an *orphaned user*:

```sql
ALTER USER [LOGINNAME] WITH LOGIN = [LOGINNAME];
```

---

## Case 7 — unexplained hard resets on a VM

**Presents as:** repeated `Kernel-Power` Event 41, `BugcheckCode = 0`,
`PowerButtonTimestamp = 0`, no dump, 2–3 minutes of downtime, no `Event 1074`.

**Method:** server-health §2–4. The decisive questions, in order:

1. Can this machine write a dump at all? If `dump_<driver>` is absent, `BugcheckCode = 0`
   proves nothing and you must say so.
2. Is it a VM? VirtIO drivers mean KVM — the reset is likely host-side.
3. Is the recovery time *consistent* (~2–3 min)? That indicates an **automatic** restart by
   the host, not a human at a console. It also means the provider has a record of every event.
4. Do crashes cluster across *many unrelated* processes, or concentrate in one?

**A correction worth remembering.** In the real case the initial read was "eight unrelated
processes crashing with memory-corruption faults, therefore bad host RAM". Further work showed
**130 of 147 crashes were one component** (`ISServerExec.exe`, Case 4), which undercut most of
that evidence. The honest final position was: the resets remain unexplained at OS level,
Windows records nothing, so the platform is the leading candidate — but the hardware claim was
not supportable.

**Weigh crash evidence by breadth of distinct processes, not raw count.** A single component in
a crash loop dominates totals while meaning nothing about the platform.

**Escalation that works:** give the provider exact UTC timestamps, state what you ruled out
inside the guest, state that dumps are impossible and why, and **request migration to a
different host node** — cheap for them, and the fastest discriminator between guest and host.

---

## Security findings — report separately, always check

Seen on a premises billing server, all at once: 1433 and 3389 exposed to the internet; 571
failed `sa` logins in 90 minutes from ~200 IPs; `NT AUTHORITY\ANONYMOUS LOGON` probing; SMTP
authentication broken so **no alert email had been delivered at all**; two services with no
heartbeat for two months; and BleachBit, Wireshark and Npcap installed on the box.

Check for these even when investigating something else, and report them as a distinct finding
with its own severity — do not bury them inside a performance write-up.
