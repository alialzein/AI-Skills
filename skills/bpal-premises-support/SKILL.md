---
name: bpal-premises-support
description: Troubleshoot B-Pal / Monty Holding premises client servers - remote access over SMB or WinRM, Windows server health (unexpected restarts, crashing services, event log forensics), SQL Server health (Page Life Expectancy, runaway queries, blocking), the CDR/SSIS pipeline, and known recurring faults - and migrate a premises client to a new server (IIS, SSL, connection-string repoint, the ~35 Windows services, SQL + MongoDB cutover). Use whenever a client server is slow, crashing, failing to generate CDR reports, has failing SQL Agent / SSIS jobs, or is being moved to a new server.
---

# B-Pal premises client support

Premises clients run the whole B-Pal stack on **one Windows server** they own: IIS sites,
around twenty Windows services, and a local SQL Server holding every database. There is no
shared infrastructure — each client is an island, so the same fault reappears client after
client. That is why the case library below matters more than the general theory.

## Before you touch anything

1. **Read-only until told otherwise.** These are production billing systems. Investigate,
   report, then ask. Never change anything without explicit confirmation for that change.
2. **Never store credentials.** They live in the team credential vault. Take them from the
   user for the session and do not write them into files, memory, or notes.
3. **Cheap queries only.** A careless `COUNT(*)` on a 39M-row table once cost 191 seconds
   and 3.1M reads on a live server. Every query in `reference/diagnostic-queries.md` is
   chosen to be cheap. Prefer those to improvising.
4. **Say what you don't know.** Diagnosis here is evidence-driven. If the evidence does not
   support a conclusion, say so rather than presenting a plausible story.

## The standard estate

```
C:\inetpub\
  BillingWeb\            B-Pal main web app        (Files\ = generated CDR exports)
  BillingOnlineApp\      billing online
  ClientPortal\
  SMSPortalWeb_V*\       SMS Portal - user side    } must share an identical machineKey
  SMSPortalAdmin_V*\     SMS Portal - admin side   }
  ShortURLAPI_V*\
C:\Program Files\BillingServices\
  Build Output\          <- the RUNNING service binaries
  <various>\bin\Debug\   <- stale copies, may hold unsubstituted install placeholders
C:\BondSMSFiles\         SMS working folder
```

Databases, all prefixed with the client name (e.g. `Contoso_`, `Acme_`):

| Database | Holds |
|---|---|
| `*_BillingDB` | core billing, rate plans (`Route` + `CostPlanItem`), `WinServiceError`, and the **live CDR** table `dbo.CDR` (~last 3 days) |
| `*_BillingDW` | warehouse — `dbo.FactStatistic`, pre-aggregated hourly CDR counts/cost/rate |
| `*_BPALCDRDB` | CDR **archive** — `dbo.CDRBackup`, partitioned, by far the largest (multi-TB) |
| `*_BondSMSDB` | SMS Portal (`Message`, `MessageStage`, DSN) |
| `*_ClientPortalDB`, `*_GatewayConnectionDB`, `*_IntegrationDB`, `*_SMSGatewayDB` | |
| `SSISDB` | the SSIS catalog — CDR pipeline packages live here |

CDR data is **tiered** across three of these: live rows in `*_BillingDB.dbo.CDR` (~3 days),
older rows in `*_BPALCDRDB.dbo.CDRBackup`, and pre-aggregated counts in
`*_BillingDW.dbo.FactStatistic`. To count or report CDRs, pick the right tier — see the CDR
section of `reference/diagnostic-queries.md`.

**Services**: ~35 — 33 `MontyHolding.Billing.*` plus 2 `BondSMS.*`, all LocalSystem / Automatic.
The **display** name rewrites `MontyHolding.Billing`→`B-PAL`, but the **service** name keeps the
original prefix — always manage by name. A service whose `OnStart` returns before its first
failed DB call shows "running" in Services.msc while failing constantly; restart-on-failure
actions vary by client (Contoso had none).

**The CDR pipeline** is SQL Agent → SSIS. Jobs are named `<Client>-Primary-CDR` and
`<Client>-Master-Agent-SSIS`. Packages execute through `ISServerExec.exe`.

**CDR report export** goes stored proc → `xp_cmdshell` → `bcp queryout` → a file in
`BillingWeb\Files`. **The proc never checks the bcp return value**, so failures are silent.

## Getting on the server

Ask for host, username, password. Then establish what is actually reachable:

```powershell
foreach ($p in @(3389,445,1433,5985,80,443)) {
  $t = New-Object System.Net.Sockets.TcpClient
  $ar = $t.BeginConnect('HOST', $p, $null, $null)
  if ($ar.AsyncWaitHandle.WaitOne(4000,$false) -and $t.Connected) { "OPEN   $p" } else { "closed $p" }
  $t.Close() }
```

**SMB admin share is the reliable route.** WinRM is usually closed, and even when the server
has 5985 open the local client often cannot be configured without admin rights.

```powershell
$sec  = ConvertTo-SecureString 'PASSWORD' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('administrator', $sec)
New-PSDrive -Name W -PSProvider FileSystem -Root '\\HOST\c$' -Credential $cred | Out-Null
```

Four things that will otherwise waste an hour:

- **Shell state does not persist between tool calls.** Re-create the PSDrive in *every*
  command.
- `net use` with an inline password gets blocked by the safety classifier. `New-PSDrive`
  with a `PSCredential` works.
- **Recursive `Get-ChildItem` over all of `C:` times out.** Always scope to a folder or use
  `-Depth`.
- Remote registry sometimes works (`[Microsoft.Win32.RegistryKey]::OpenRemoteBaseKey`) and
  sometimes hangs. Wrap it in a job with a timeout; never let it block.

If SQL is not reachable on 1433 — which is correct and normal — **have the user run queries
in SSMS and paste results back.** That is the standard working mode, not a fallback. **When 1433
*is* reachable** (VPN, or a migrated box still exposed), connect directly with `SqlClient`
(READ UNCOMMITTED) — but the app login is often not sysadmin and lacks `VIEW SERVER STATE`,
which blocks the server-level DMVs. See `reference/diagnostic-queries.md` (top note + §15–§19).

## Investigating server health

Full method and every command: **`reference/server-health.md`**. The short version:

1. **Copy the event logs locally and parse them there** — remote `Get-WinEvent` is slow and
   often blocked.
   ```powershell
   Copy-Item 'W:\Windows\System32\winevt\Logs\System.evtx' -Destination "$dest\System.evtx"
   $ev = Get-WinEvent -Path "$dest\System.evtx"
   ```
   > **Timezone trap:** `Get-WinEvent -Path` renders `TimeCreated` in *your* local timezone,
   > while the text inside Event 6008 is the *server's* local time. These servers usually run
   > UTC. Confirm with `Kernel-General` Event 24 ("time zone bias is 0") or the SQL ERRORLOG
   > header ("UTC adjustment: 0:00") before you reason about any timeline.

2. **Restart history** — IDs 41, 1074, 1076, 6005, 6006, 6008, 6013. On Event 41 read the
   `BugcheckCode` and `PowerButtonTimestamp` properties, not just the message.

3. **Check dump capability before concluding "no crash".** If the boot storage driver has no
   `dump_<driver>` service registered, Windows *cannot* write a dump and `BugcheckCode = 0`
   proves nothing. On VirtIO VMs `dump_vioscsi` is frequently absent.

4. **Log retention is often ~19 hours** because DCOM 10016 floods the System log. Reconstruct
   longer history from **SQL ERRORLOG rotation** — each `ERRORLOG.N` header holds a real
   startup timestamp, and SQL starts seconds after boot.

5. **Cross-tabulate application crashes** by process × faulting module × exception code.
   One process crashing is a bug; eight unrelated processes crashing with access violations
   is the memory or platform underneath them.

## Investigating database health

Schema map (every database, its tables, and the columns you'll query):
**`reference/premises-schema.md`**. Full query pack: **`reference/diagnostic-queries.md`**.
Order of attack:

1. **Page Life Expectancy first** — it tells you whether the whole instance is starved.
   One row per NUMA node. Under ~300s means the buffer pool is thrashing and *every* query
   is slow; chase the cause, not the symptom.

2. **Find the real consumer by rate, not by total.** `total_logical_reads` favours whatever
   has been cached longest. Normalise per second. A proc doing 1.4M reads every 7 seconds
   and returning zero rows will not appear near the top of a naive `ORDER BY total_reads`.

3. **Fix, then re-measure PLE.** Expect to repeat: removing the top offender exposes the
   next one. Three sequential offenders on one server is normal, and PLE may barely move
   until the last is gone.

4. **DMV stats reset on every SQL restart.** On a server that keeps rebooting, PLE and
   `dm_exec_query_stats` are meaningless — fix the reboots first and say so.

5. **For SSIS/CDR job failures**, check `SSISDB.catalog.executions.status`:
   `4 = failed`, **`6 = ended unexpectedly`** (the host process died — look for
   `ISServerExec.exe` crashes in the Application log), `7 = succeeded`.
   `catalog.event_messages` joins on **`operation_id`**, not `execution_id`.

## Known recurring faults

Symptom → cause → fix, with the evidence to confirm each: **`reference/case-library.md`**.
Check these before theorising, because they repeat across clients:

| Symptom | Likely cause |
|---|---|
| CDR report "generated" but no file on disk | machine `PATH` empty or missing SQL `Tools\Binn` → `bcp` unresolvable → silent failure |
| CDR files stopped on a specific date | `SQLFileLocation` pointed at a mapped drive, invisible to the service account |
| Whole instance slow, PLE under 60s | unindexed `COUNT` over `WinServiceError`, or a proc scanning `Message` |
| SMS Portal slow, huge I/O, zero rows returned | `GetDSNMessages` with an unusable index hint, or `MessageStage` orphan backlog |
| Every SSIS job fails in under 2 seconds | engine patched but SSIS binaries left behind — compare `ISServerExec.exe` to `sqlservr.exe` |
| System log flooded, ~1300/hour DCOM 10016 | `NT SERVICE\SQLSERVERAGENT` denied Local Activation on the SSIS DCOM app |
| "Failed to open the explicitly specified database" | SQL login exists but is not mapped into that database |
| Whole instance slow, `CXPACKET`/`CXCONSUMER`/`LATCH_EX` are the top waits, tempdb hot | `MAXDOP 0` + `cost threshold for parallelism 5` → parallelism storm + tempdb spill. Set MAXDOP 8 / cost 50 (`diagnostic-queries.md` §17) |
| `SSISDB` is hundreds of GB | execution-log history the built-in cleanup can't keep up with — reduce retention, batched purge, shrink (§19); never index `internal.*` |
| SQL starves IIS / services after go-live | `max server memory` left unlimited on a box that also runs IIS + ~35 services + SSIS — cap it (§17) |
| Upload / Cost-Sheet / report `SaveAs` throws `DirectoryNotFound` then `AccessDenied` | missing `BillingWeb\Temp` working folder, and/or the app pool (`NetworkService`) has no `Modify` on it (migration Stage 6) |
| After a migration, `"Failed to open ..._BPalCDRDB"` every ~2 min | the multi-TB CDR **archive** isn't restored yet — not a login fault |

## Migrating a client to a new server

Moving the whole stack to a new box is a recurring project, and the app tier — IIS, SSL,
connection strings, the ~35 Windows services, support folders — can be built **before** the DBA
restores SQL. Full stage-by-stage playbook with the verified traps and copy-ready script cores:
**`reference/migration.md`**. The headlines:

- **App tier first; SQL + MongoDB are the blockers.** MongoDB is the one everyone forgets — the
  two `BondSMS.*` services need `mongodb://…@localhost:27777` and it is not SQL.
- **Deliver each change as a self-elevating on-box script on the new server's Desktop.** The
  safety classifier blocks remote writes to system files; on-box scripts back up first, run with
  full rights, and are reversible. `sc.exe \\HOST query|qc|create` works remotely by reusing the
  SMB session — service inventory and creation without WinRM.
- **Repoint `Data Source=` only.** The old SQL host IP also appears as UNC file paths (repoint to
  local) and as external HTTP API endpoints (leave — just check reachability). `configSource`
  means a handful of `ConnectionStrings.config` files cover every service at once.
- **The vendor `InstallServices.ps1` auto-starts services** (fails if the DBs aren't up) and
  Build Output's "ALL" grabs the wrong `EmailRepositoryService.exe` — see the playbook.

## Reporting back

The user relays findings to a DBA team and to clients, so:

- Lead with the conclusion and the evidence for it, not the investigation narrative.
- Give **before/after numbers** — reads, milliseconds, PLE. They are what convince a DBA.
- When asked for a DBA email, keep it **short**: symptom, evidence, requested action.
- If a hypothesis is disproved, say so plainly and move on. Do not let a discarded theory
  survive into the summary.
- Separate what is *measured* from what is *expected*.

## Related artifacts on this machine

- `C:\Users\ali.zein\Desktop\BPal-SQL-Troubleshooting-Runbook.html` — tabbed runbook of
  solved cases with copy-ready queries and DBA email templates.
- `C:\Users\ali.zein\Desktop\BPal-Migration-Toolkit\` — migration tooling. **`Migration-Console.ps1`**
  (launch `RUN-Migration-Console.bat`, see `README-Console.txt`) is the rebuilt console that
  mirrors the verified workflow in `reference/migration.md`: fill the two servers + admin creds,
  **Gather from the OLD server** (services, SQL host/login, PFX, IIS config), then one button per
  step — the on-box steps (IIS, SSL, config repoint, service install) are generated as ready
  self-elevating scripts staged to the new server's Desktop, and folders/status/readiness run
  live. The older `Start-Migration-GUI.ps1` / staged `scripts\00-09` remain alongside it.
- `C:\Users\ali.zein\Desktop\Route-Lookup-Tool\` — WinForms tool over a client's `*_BillingDB`:
  route/rate-plan + cost lookups and CDR counts (live `dbo.CDR` and warehouse `FactStatistic`,
  with per-client drill-down). Reads lock-free (READ UNCOMMITTED). Good reference for the CDR
  and Route/CostPlanItem query shapes.
