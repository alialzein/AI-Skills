# Migrating a premises client to a new server

Moving a client's whole stack from one Windows box to another. The **app tier can be fully
prepared before the DBA touches SQL** — IIS, certificate, connection strings and the Windows
services all go in first, then SQL + MongoDB are restored, then you cut over. Everything below
was verified during the Contoso migration (Aug 2026, `203.0.113.10` → `203.0.113.20`); treat
the client name, IPs and ports as examples and confirm each against *this* client's source box.

## Stage order

1. **IIS** — pools, sites, bindings (mirror the old server)
2. **SSL** — import the wildcard PFX, bind to `:443`
3. **Connection strings** — repoint every config from the old SQL host to the local instance
4. **Windows services** — register all ~35 (do this before *or* at cutover)
5. **SQL + MongoDB** — DBA/infra: install engine, restore DBs, restore Mongo *(the blockers)*
6. **Support folders** — create the ones the configs expect
7. **Cutover** — start services, smoke-test, repoint DNS

Deliver stages 1–4 and 6 as **ready on-box scripts on the new server's Desktop** that the user
double-clicks. This is not a preference — the safety classifier blocks writing OS-critical
system files remotely (see below), and on-box scripts run with full local rights, create
backups, and are reviewable and reversible.

## Working method (remote access during a migration)

Same SMB rules as the rest of the skill (`New-PSDrive` with a `PSCredential`; re-create it in
every tool call; scope `Get-ChildItem` or it times out — enumerate *paths* first, then read
only the files you need). Two migration-specific techniques:

- **`sc.exe` works remotely by reusing the SMB session.** Authenticate `New-PSDrive` to the
  target's `c$`, then `sc.exe \\HOST query|qc|qfailure|create|delete` piggybacks on that
  session's credentials — no WinRM needed. This is how you inventory the **old** server's
  services and (if you choose) create them on the new one.
  ```powershell
  New-PSDrive -Name O -PSProvider FileSystem -Root '\\OLDHOST\c$' -Credential $cred | Out-Null
  & sc.exe \\OLDHOST query state= all           # enumerate; filter SERVICE_NAME lines
  & sc.exe \\OLDHOST qc  <name>                 # BINARY_PATH_NAME / START_TYPE / SERVICE_START_NAME
  ```
  It is *slow* (~3-4s per call); querying 35 services one-by-one overruns a 2-minute tool
  timeout. Enumerate once with `query state= all`, then only `qc` the handful whose binPath
  might differ.

- **The classifier blocks remote writes to critical system files** (e.g.
  `applicationHost.config`) but **allows Desktop script files and ordinary app `.config`
  files.** So generate the change as a self-elevating `.cmd` + `.ps1` on the Desktop. Always
  `[System.Management.Automation.Language.Parser]::ParseFile()` the `.ps1` locally before
  copying it over — a parse error only discovered on the box wastes a round-trip.

- **Two servers, two drives.** Map the old box (`O:`) and the new box (`W:`) in the same call
  when you need to compare (service binPaths, machineKeys, folder presence).

## Stage 1 — IIS

Replicate the old server's `applicationHost.config` sites/pools/bindings exactly. Enumerate the
old server's config, then generate `New-WebAppPool` / `New-Website` / `New-WebBinding` /
`New-WebApplication` on the new box. What to capture: each **app pool's identity** (which are
`NetworkService` vs `LocalSystem`) and pipeline/runtime; every **binding** including
host-header HTTP and host-header HTTPS; and **sub-applications**.

Contoso example — 4 pools, 4 sites: B-PAL (`http *:81` + `https bpal.…`), SMS Portal
(`http *:80` across ~23 host-header domains + `*:85` + `https sms.…`) with an `/admin`
**sub-app** → the `SMSPortalAdmin` folder, Client Portal (`*:82` + `https client.…`), OnlineApp
(`*:99`). **ShortURLAPI is *not* an IIS site** here — do not create one for it.

## Stage 2 — SSL

Import the wildcard PFX into `LocalMachine\My`, then bind by thumbprint to each `:443`
host-header binding (`AddSslCertificate($thumb,'My')`). The **PFX export password is a separate
secret** from the SQL/admin credentials and is *not* recoverable from the file. If it is lost,
re-export from the **old server's** cert store: `certlm.msc` → Personal → the `*.<domain>` cert
→ All Tasks → Export → *with private key* → set a new password. (Verify the cert is marked
exportable first.)

## Stage 3 — Connection strings (repoint to local SQL)

Goal: `Data Source=<old-SQL-host>` → `Data Source=.`. Keep the user id, password and database
names exactly as-is. `.` assumes SQL is the **default instance** (so it resolves locally); a
named instance means `.\INSTANCENAME`.

**`configSource` fans out for you.** Each web app's `Web.config` and every service's
`<exe>.config` point their `<connectionStrings>` at a sibling file
(`ConnectionStrings.config` / `connections.config`). Repoint those few source files and you
have covered ~30 services and every site. In Contoso there were three service-side
`ConnectionStrings.config` (Build Output, `Email Repository Service`, `email repository 17-5`)
plus the per-app `connections.config` — 14 files, 46 strings total.

**Scope the replace to `Data Source=` — the old IP wears three different hats:**

| Where the old IP appears | Do |
|---|---|
| `Data Source=<ip>` in a connection string | **repoint** → `.` |
| `\\<ip>\c$\...` UNC file path (e.g. ReportGenerator `FileLocation`) | **repoint** → local `C:\...` |
| `http://<ip>:8780/8781` API endpoints (content-translation / DND refresh) | **leave** — shared external infra; instead **verify the new server can reach it** (often a private `192.168.*` IP) |

A blind global IP replace breaks the UNC path (`\\<ip>\c$` → `\\.\c$`) and would wreck the HTTP
endpoints. Match `(?i)(data\s+source\s*=\s*)<ip>` and replace `${1}.`; handle the UNC as a
separate `\\<ip>\c$` → `C:` rule.

**Leave alone:** `(LocalDb)\MSSQLLocalDB` aspnet-membership strings; and stale foreign
credentials in `bin\*.dll.config` — those are **build artifacts .NET never loads at runtime**
(a web app reads `Web.config`, a service reads `<exe>.config`). Harmonise them for tidiness if
asked, but scope strictly to their SQL `connectionString` values.

**Placeholders:** freshly-copied apps sometimes still carry install tokens like
`Data Source=$$DBIP$$;Initial Catalog=$$DBN$$_BondSMSDb;user id=$$LOGIN$$;password=$$PASS$$`
(seen in `ShortURLAPI\connections.config`). Fill them (`.` / client-prefix / login / password)
only if that app is actually hosted.

**Credentials:** never hardcode the SQL password in the script. It already sits in the configs
in plaintext — read it off the box from a known-good Contoso string and reuse it for any
placeholder/foreign-string fills. Back up every file before rewriting and make the script
idempotent (skip files with no old-host reference). Core of the repoint:

```powershell
$rx = [regex]'(?i)(data\s+source\s*=\s*)46\.4\.53\.106'      # one per old host
Get-ChildItem 'C:\inetpub','C:\Program Files\BillingServices','C:\Program Files\BondSMSServices' `
  -Recurse -Filter *.config -File | ForEach-Object {
    $sr = New-Object IO.StreamReader($_.FullName,$true); $t=$sr.ReadToEnd(); $enc=$sr.CurrentEncoding; $sr.Close()
    $n = $rx.Replace($t,'${1}.')                              # + a \\ip\c$ -> C: rule
    if ($n -ne $t) { <# backup then #> [IO.File]::WriteAllText($_.FullName,$n,$enc) }
  }
```

## Stage 4 — Windows services

~35 services: 33 `MontyHolding.Billing.*` + 2 `BondSMS.*`. On the source box all run as
**LocalSystem, Automatic, no failure/restart actions**. Get the authoritative list and binPaths
from the old server (`sc query` / `sc qc`). Verify each `.exe` actually exists on the new box at
that path before creating the service — a service pointing at a missing exe is a broken service.

**binPaths are almost uniform but not entirely:**
- 32 billing services → `C:\Program Files\BillingServices\Build Output\<name>.exe`
- `EmailRepositoryService` → `C:\Program Files\BillingServices\email repository 17-5\...exe`
  — a **newer EWS/OAuth build**, *not* the copy that also sits in `Build Output`.
- `BondSMS.CampaignService` / `BondSMS.SMSService` → their `*_V4.5.1` folders.
- `OperatorManagementTool` *is* installed as a service despite the name.

**Vendor installers ship in each folder** and are the authoritative method:
`InstallServices.ps1 ALL` / `RemoveServices.ps1 ALL` (Build Output and each email-repo folder),
`InstallService.ps1` / `RemoveService.ps1` (each BondSMS folder). They do `New-Service`
(StartupType Automatic; DisplayName rewrites `MontyHolding.Billing` → `B-PAL`, so services show
as `B-PAL.*` but the **service name** stays `MontyHolding.Billing.*` — manage by name) and then
**auto-start** each one. Traps:

- **They auto-start.** If SQL/Mongo aren't up yet, every service fails to start — noise, and any
  reboot during SQL setup re-triggers it. To install *before* the DBs are ready, register with
  the same `New-Service` call but **skip the StartService step** (Automatic + Stopped), then
  start at cutover.
- **`Get-ChildItem $check` uses the current directory, not `$PSScriptRoot`.** You must `cd` into
  the folder before running, or it finds nothing / the wrong exes.
- **Build Output's "ALL" installs *every* `*.exe`, including `EmailRepositoryService.exe`** — the
  wrong copy. Exclude it there and install `EmailRepositoryService` from `email repository 17-5`.

Install-only registration (mirrors the vendor result, minus the premature start):

```powershell
New-Service -Name $svc -DisplayName ($svc -replace 'MontyHolding\.Billing','B-PAL') `
            -BinaryPathName ('"'+$exe+'"') -StartupType Automatic     # default account = LocalSystem
```

Start/stop/restart later by name across the whole set:
`Get-Service 'MontyHolding.Billing.*','BondSMS.*' | Restart-Service -Force`.

## Stage 5 — SQL + MongoDB (the real blockers; DBA/infra)

- **SQL Server:** install as the **default instance** (so `Data Source=.` resolves), enable
  **mixed-mode auth**, recreate the SQL login with the **same name and password as the source**
  and map it into each DB, restore all `<client>_*` databases, restore `SSISDB` and recreate the
  `<Client>-Primary-CDR` / `<Client>-Master-Agent-SSIS` Agent jobs, and enable `xp_cmdshell`
  with SQL `Tools\Binn` on the machine PATH (or CDR `bcp` export fails **silently** — see
  `case-library.md`). Confirm the engine is truly installed: a `C:\Program Files\Microsoft SQL
  Server\` folder holding only version numbers (80/90/100/110/130) and *no* `MSSQL*.MSSQLSERVER`
  instance folder means only shared components are present — the engine is **not** installed.
- **MongoDB:** the BondSMS Campaign + SMS services connect to
  `mongodb://admin:...@localhost:27777`. Mongo must be installed **locally** on that port with
  that credential and its `SMSClientDb` restored. **Easy to miss because it isn't SQL** — the two
  BondSMS services cannot run without it.

**Verify the SQL side — files can lie.** Database *files* on disk do not tell you the database
*name* or *state*. On Contoso the `SMSGatewayDB` files were named `..._backup_...` but the
attached database was correctly `Contoso_SMSGatewayDB`; databases were also split across two
data drives (`G:` system + a `D:\Data`/`D:\DataLog` pair). Two ways to get the truth:

- **From the box, over SMB (no SQL needed):** derive the DATA folder from the engine's binPath
  (`sc \\host qc MSSQLSERVER` → `<drive>\...\MSSQL\DATA`), and read the **ERRORLOG**
  (`...\MSSQL\Log\ERRORLOG`) — the `Starting up database '<name>'` lines are the real attached
  names, and restore/recovery errors show there too.
- **Once 1433 is reachable:** `SELECT name, state_desc FROM sys.databases` (all should be
  `ONLINE`), plus the login/auth/xp_cmdshell checks in `diagnostic-queries.md` §17.

Two things that recur on a freshly restored box:
- **The CDR archive `*_BPALCDRDB` is usually restored *last* (it's the multi-TB one).** Until it
  is, a SQL Agent job fails every ~1–2 min with *"Failed to open the explicitly specified database
  '..._BPalCDRDB'"* — that is the missing archive, not a broken login.
- **`SSISDB` comes over bloated** (hundreds of GB of execution history) and the fresh instance
  ships with **`xp_cmdshell` off**, **`max server memory` unlimited**, and **MAXDOP 0 /
  cost-threshold 5** — all of which bite once the app starts. Run the `diagnostic-queries.md`
  performance pack (§15–§19) right after restore and hand the DBA the config + SSISDB fixes.
- **Security:** these boxes often come up with **1433 exposed to the internet** and `sa` already
  under brute-force in the ERRORLOG. Flag it — firewall 1433, harden/disable `sa`.

## Stage 6 — Support folders

App configs reference folders that a plain file-copy may not recreate — and a copied web app
brings its *content* folders but not its empty **working** folders. Create any missing ones:
`C:\cdrs` (CDR export/compress — `directory`/`compressPath`), `C:\GatewayLogs`
(`BaseFolderGatewayMonitor`), `C:\inetpub\BillingWeb\Uploads\DndUpload` (DNDMoveFile),
`C:\BondSMSFiles`, `BillingWeb\Files`, `ClientPortal\Files`, and **`BillingWeb\Temp` /
`ClientPortal\Temp`** (upload staging — the Cost Sheet import `SaveAs`-es here; a missing folder
throws `DirectoryNotFoundException`).

Also **`C:\TempEmails`** — the Email Repository service's attachment staging folder. Miss it and the
service marks *every* emailed rate file Rejected with zero attachments (`DirectoryNotFoundException`,
Case 8). It needs its **schema files** too, or files then download and convert but fail "Schema
Validation Failed" on a missing `CostPlanItem.xsd` — copy them in alongside creating the folder:
`copy /Y "C:\inetpub\BillingWeb\Models\*.xsd" "C:\TempEmails\"`.

**Write permission is the other half.** A newly-created folder inherits only SYSTEM/Admins, so
the app pool (B-PAL / SMS Portal / Client Portal all run as **NetworkService**) still can't write
— the *next* error is `UnauthorizedAccessException`. The estate's working folders are made
writable with a broad ACE (`BillingWeb\Files` carries `Everyone: FullControl`); the least-
privilege equivalent is to grant the pool identity `Modify`:

```powershell
$acl = Get-Acl $folder
foreach($who in 'IIS_IUSRS','NT AUTHORITY\NETWORK SERVICE'){
  $acl.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
    $who,'Modify','ContainerInherit,ObjectInherit','None','Allow'))) }
Set-Acl $folder $acl
```

## Stage 7 — Cutover

With SQL + Mongo up: start the services (`RUN-Start-Services.cmd` / the `Get-Service … |
Start-Service` one-liner, or reboot since they're Automatic), browse each site and test a login,
then **repoint DNS** — every app domain **and** all the SMS host-header domains — to the new
server. Keep the old box intact until the new one is proven.

## Verified gotchas (don't relearn these)

- **machineKey between SMS Portal Web and Admin is per-client, not universal.** The main skill
  says they "must share an identical machineKey" — Contoso runs *different* keys on the two,
  and the **old server had the same mismatch and worked**. Verify against the source box before
  "fixing" a mismatch; a faithful copy is correct.
- **The old SQL host IP appears in three roles** (SQL Data Source / UNC file path / HTTP API) —
  only the first two get repointed.
- **`bin\*.dll.config` are inert** — never loaded at runtime; foreign creds in them are harmless.
- **Service name ≠ display name** (`MontyHolding.Billing.*` vs `B-PAL.*`); target by name.
- **Confirm the exe exists on the new box** at the old server's binPath before creating a service.
