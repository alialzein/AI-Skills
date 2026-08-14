# Windows server health — method and commands

Every command here is read-only. Substitute `HOST` and mount the admin share first.

```powershell
$sec  = ConvertTo-SecureString 'PASSWORD' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('administrator', $sec)
New-PSDrive -Name W -PSProvider FileSystem -Root '\\HOST\c$' -Credential $cred | Out-Null
```

Re-create that mount in **every** tool call — shell state does not persist between them.

---

## 1. Pull the event logs and parse locally

Remote `Get-WinEvent -ComputerName` needs WinRM/RPC, which is usually closed. Copy and parse
locally instead:

```powershell
$dest = '<scratch>'
Copy-Item 'W:\Windows\System32\winevt\Logs\System.evtx'      -Destination "$dest\System.evtx" -Force
Copy-Item 'W:\Windows\System32\winevt\Logs\Application.evtx' -Destination "$dest\Application.evtx" -Force
$ev = Get-WinEvent -Path "$dest\System.evtx"
"$($ev.Count) events   $(($ev|Select -Last 1).TimeCreated) -> $(($ev|Select -First 1).TimeCreated)"
```

### The timezone trap — resolve this before reasoning about any timeline

`Get-WinEvent -Path` renders `TimeCreated` in **the parsing machine's** timezone. The
timestamp *inside* an Event 6008 message is the **server's** local time. Get this wrong and
downtime looks like hours instead of minutes.

Confirm the server's timezone:

```powershell
$ev | Where-Object { $_.Id -eq 24 -and $_.ProviderName -like '*Kernel-General*' } |
  Select-Object -First 1 -ExpandProperty Message      # "Current time zone bias is 0" = UTC
```

Or read the SQL ERRORLOG header — it prints `UTC adjustment: 0:00`.

---

## 2. Restart and shutdown history

```powershell
$ids = 41,1074,1076,6005,6006,6008,6013,1001,109
$ev | Where-Object { $ids -contains $_.Id } |
  Sort-Object TimeCreated -Descending |
  Select-Object TimeCreated, Id, ProviderName, @{n='M';e={($_.Message -split "`r?`n")[0]}} |
  Format-Table -AutoSize -Wrap
```

| ID | Meaning |
|---|---|
| 41 | rebooted without cleanly shutting down |
| 1074 | **clean** shutdown, names the initiating process/user |
| 1076 | reason supplied afterwards (i.e. someone logged in and dismissed the dialog) |
| 6005 / 6006 | event log service started / stopped |
| 6008 | previous shutdown was unexpected — **timestamp is server-local** |
| 6013 | uptime at log service start |
| 1001 | bugcheck report (Application log) |

**Absence of 1074 means it was not an OS- or user-initiated shutdown.**

### Read Event 41's properties, not its message

```powershell
$ev | Where-Object { $_.Id -eq 41 } | ForEach-Object {
  $x = [xml]$_.ToXml()
  "--- $($_.TimeCreated) ---"
  $x.Event.EventData.Data | ForEach-Object { "   {0,-28} = {1}" -f $_.Name, $_.'#text' } }
```

- `BugcheckCode = 0` **and** `PowerButtonTimestamp = 0` → the machine stopped without Windows
  recording anything. On a VM that points at the hypervisor/host; on metal at power or hardware.
- `BugcheckCode` non-zero → a real bugcheck; look for the dump.
- `PowerButtonTimestamp` non-zero → someone or something pressed power.
- `ConnectedStandbyInProgress` varies between otherwise identical crashes — **do not read
  anything into it** on a server.

---

## 3. Can this machine even write a dump?

Do this **before** concluding "Windows did not crash". If dumps are impossible,
`BugcheckCode = 0` is not evidence of anything.

```powershell
# volmgr complains loudly when dump init fails
$ev | Where-Object { $_.ProviderName -eq 'volmgr' } | Group-Object Id | ForEach-Object {
  "ID $($_.Name) x$($_.Count) : $(($_.Group[0].Message -split "`r?`n")[0])" }
```

`volmgr` **45** ("could not load the crash dump driver") and **46** ("Crash dump initialization
failed") mean no dump will ever be written.

Then check the storage driver has a dump-mode counterpart registered:

```powershell
$k  = [Microsoft.Win32.RegistryKey]::OpenRemoteBaseKey('LocalMachine','HOST')
$sv = $k.OpenSubKey('SYSTEM\CurrentControlSet\Services')
foreach ($n in @('vioscsi','viostor','storahci','dump_vioscsi','dump_viostor','dump_storahci')) {
  $s = $sv.OpenSubKey($n)
  if ($s) { "$n : Start=$($s.GetValue('Start'))" } else { "$n : ABSENT" } }
```

A boot driver present with **no matching `dump_*`** = dumps impossible. Common on VirtIO
(KVM/Hetzner) guests. Also confirm a pagefile exists — but note `Get-Item pagefile.sys` over
SMB returns nothing even when the file is there; enumerate instead:

```powershell
Get-ChildItem 'W:\' -Force | Where-Object { $_.Name -eq 'pagefile.sys' } |
  Select-Object Name, @{n='GB';e={[math]::Round($_.Length/1GB,2)}}
```

---

## 4. Physical or virtual?

Changes who you escalate to. VirtIO drivers mean KVM (Hetzner Cloud and similar).

```powershell
foreach ($d in @('vioscsi.sys','viostor.sys','netkvm.sys','vmbus.sys','vmxnet3.sys','pvscsi.sys','VBoxGuest.sys')) {
  if (Test-Path "W:\Windows\System32\drivers\$d") { "PRESENT: $d" } }
```

`vmbus.sys` ships with Windows, so it alone proves nothing. `vioscsi`/`viostor`/`netkvm` are
installed deliberately for KVM guests.

---

## 5. What is flooding the log, and how much history is left

```powershell
$ev | Group-Object ProviderName, Id | Sort-Object Count -Descending |
  Select-Object -First 15 Count, Name | Format-Table -AutoSize
```

Tens of thousands of `DistributedCOM 10016` in a day is normal-looking but destroys forensic
history — a 20 MB log can hold under a day. Resolve the CLSID rather than dismissing it:

```powershell
$k  = [Microsoft.Win32.RegistryKey]::OpenRemoteBaseKey('LocalMachine','HOST')
$cl = $k.OpenSubKey('SOFTWARE\Classes\CLSID\{GUID-FROM-THE-EVENT}')
"CLSID : " + $cl.GetValue('')
$ap = $k.OpenSubKey('SOFTWARE\Classes\AppID\{APPID-FROM-THE-EVENT}')
"APPID : " + $ap.GetValue('')
```

Raise the log size so the next incident is diagnosable (takes effect at next EventLog start):

```powershell
$w = $k.OpenSubKey('SYSTEM\CurrentControlSet\Services\EventLog\System', $true)
$w.SetValue('MaxSize', 268435456, [Microsoft.Win32.RegistryValueKind]::DWord)   # 256 MB
```

Locally, `wevtutil sl System /ms:268435456` applies immediately.

---

## 6. Longer restart history than the event log holds

SQL ERRORLOG rotates on every SQL service start, and SQL starts seconds after boot. Seven
archives typically reach back much further than a flooded System log.

```powershell
$lg = 'W:\Program Files\Microsoft SQL Server\MSSQL13.MSSQLSERVER\MSSQL\Log'
Get-ChildItem $lg | Where-Object { $_.Name -like 'ERRORLOG*' } | Sort-Object Name |
  ForEach-Object { "{0,-12} {1}" -f $_.Name, (Get-Content $_.FullName -TotalCount 1) }
```

Read the **header line inside each file** — its timestamp is the real start time.
`LastWriteTime` is when the log was last *written*, which is a different thing.

---

## 7. Crashing services and applications

```powershell
# which services are dying
$ev | Where-Object { $_.ProviderName -eq 'Service Control Manager' -and $_.Id -in @(7031,7034,7000,7009,7024) } |
  Select-Object TimeCreated, Id, @{n='M';e={($_.Message -split "`r?`n")[0]}} |
  Sort-Object TimeCreated -Descending | Format-Table -AutoSize -Wrap
```

Then cross-tabulate the Application log — **this table is the diagnosis**:

```powershell
$app = Get-WinEvent -Path "$dest\Application.evtx"
$app | Where-Object { $_.Id -eq 1000 -and $_.ProviderName -eq 'Application Error' } | ForEach-Object {
  $m = $_.Message -replace "`r?`n",' '
  $a = if ($m -match 'Faulting application name:\s*([^,]+)') { $matches[1].Trim() } else { '?' }
  $mod = if ($m -match 'faulting module name:\s*([^,]+)')    { $matches[1].Trim() } else { '?' }
  $c = if ($m -match 'exception code:\s*(0x[0-9a-fA-F]+)')   { $matches[1] } else { '?' }
  "{0,-52} {1,-18} {2}" -f $a, $mod, $c
} | Group-Object | Sort-Object Count -Descending | Select-Object Count, Name | Format-Table -AutoSize -Wrap
```

Exception codes worth knowing:

| Code | Meaning |
|---|---|
| `0xc0000005` | access violation |
| `0xc0000374` | **heap corruption** |
| `0xc0000409` | stack buffer overrun / fail-fast |
| `0xc000001d` | **illegal instruction** — the CPU was handed an invalid opcode |
| `0xe0434352` | unhandled .NET exception (ordinary application bug) |

**How to read the table.** Crashes concentrated in *one* process, especially with a version
mismatch against the engine, are a software fault — see the partial-patch case. Crashes spread
across *many unrelated* processes — particularly if Microsoft's own binaries (`MsMpEng.exe`
/ `mpengine.dll`) are among them, with heap corruption or illegal instructions — point at the
memory or platform underneath. Weigh by **breadth of distinct processes**, not raw count: a
single component in a crash loop can dominate the total while meaning nothing.

---

## 8. Resource exhaustion, disk, hardware

```powershell
# low-memory conditions (absence rules OOM out)
$ev | Where-Object { $_.ProviderName -like '*Resource-Exhaustion*' -or $_.Id -in @(2002,2003,2004) }

# hardware errors reported to Windows (often absent on VMs - absence is not exoneration)
$ev | Where-Object { $_.ProviderName -like '*WHEA*' }

# NTFS / disk
$ev | Where-Object { $_.ProviderName -like '*Ntfs*' -or $_.ProviderName -eq 'disk' } |
  Select-Object -First 20 TimeCreated, Id, @{n='M';e={($_.Message -split "`r?`n")[0]}}
```

Free space over SMB needs P/Invoke — `Get-PSDrive` reports zero on a UNC root:

```powershell
$sig = '[DllImport("kernel32.dll", CharSet=CharSet.Auto, SetLastError=true)]
public static extern bool GetDiskFreeSpaceEx(string p, out ulong a, out ulong b, out ulong c);'
$t = Add-Type -MemberDefinition $sig -Name Q -Namespace W32 -PassThru
foreach ($d in @('c','d','s')) {
  [uint64]$a=0;[uint64]$b=0;[uint64]$c=0
  if ($t::GetDiskFreeSpaceEx("\\HOST\$d`$\", [ref]$a, [ref]$b, [ref]$c)) {
    "{0}: {1,8:N0} GB free of {2,8:N0} GB" -f $d.ToUpper(), ($c/1GB), ($b/1GB) } }
```

---

## 9. Security posture — check even when not asked

Premises servers are frequently internet-exposed. Report it as a separate finding.

```powershell
# brute force against SQL shows up in the SQL ERRORLOG
Get-Content "$lg\ERRORLOG" | Select-String 'Login failed' | Select-Object -Last 40
```

Also worth noting: 1433 or 3389 reachable from the internet, `sa` login failures from many
distinct IPs, `NT AUTHORITY\ANONYMOUS LOGON` probing, and packet-capture or disk-wiping tools
installed on a billing server.

The **Security.evtx** log is large and slow to parse — bound the work or it will time out.

---

## 10. Writing it up

State the restart timeline in **server-local time**, with downtime per event. Say explicitly
what you ruled out (memory, disk, thermal, OS-initiated shutdown) and what you *could not*
rule out, and why — for example, "a bugcheck cannot be excluded because this VM has no dump
driver registered". For a hosting provider, ask them to check host-side events at your exact
UTC timestamps and request a migration to a different host node: that is cheap for them and
is the fastest discriminator between guest and platform.
