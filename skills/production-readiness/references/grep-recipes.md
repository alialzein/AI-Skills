# Grep recipes — find the smells fast

Copy-paste `rg` (ripgrep) commands to locate common production gaps. Adapt paths/extensions
to the stack. A *hit* isn't automatically a bug and an *absence* isn't automatically a gap —
read the surrounding code and apply judgment. Run from the repo root.

> Prefer `rg`; if unavailable, `grep -rn` works. Add `-g '!**/node_modules/**'` etc. to skip
> vendored code.

## CI present?
```bash
ls -la .github/workflows 2>/dev/null || ls -la .gitlab-ci.yml .circleci 2>/dev/null
```
No workflow dir → see detailed checklist §3.

## Untested seams
Find the seam files, then check the test dir mentions them by name.
```bash
# candidate seam files
rg -l -i 'webhook|orchestrat|sync|refresh|token|server.?action|mutation' --glob '!**/*test*'
# are any referenced from tests?
rg -l -i 'webhook|orchestrat|sync|refresh|token' --glob '**/*{test,spec}*'
```
Seam files exist but none appear in tests → the glue is untested (§2).

## No backoff / retry on external calls
```bash
rg -n -i 'retry-after|backoff|exponential|jitter|429|503' src
rg -n -i 'fetch\(|axios|httpx|requests\.|http\.client' src   # call sites — do they wrap retries?
```
Call sites but zero backoff/429 handling → §5.

## Bare timeouts missing
```bash
rg -n -i 'fetch\(|axios\.|new Request|http\.get' src
rg -n -i 'timeout|abortcontroller|signal:' src                # should appear near call sites
```

## Non-atomic multi-step writes
```bash
rg -n -i 'delete .*\n.*insert|truncate|deleteMany|\.delete\(' -U src    # delete-then-insert windows
rg -n -i 'transaction|begin;|\.rpc\(|BEGIN|COMMIT' src                   # are writes wrapped?
```
Delete-then-insert with no surrounding transaction → §6.

## No concurrency lock on overlapping jobs
```bash
rg -n -i 'advisory_lock|pg_try_advisory|FOR UPDATE|SELECT .* LOCK|mutex|redlock' .
rg -n -i 'cron|schedule|setInterval|run.?now|trigger' src                # overlapping triggers?
```
Cron + manual "run now" but no lock → race (§6).

## Uncapped spend
```bash
rg -n -i 'openai|anthropic|embedding|completion|whisper|realtime|tts|stt' src
rg -n -i 'cap|budget|limit|ledger|cost|spend|quota|throttle' src
```
Cost recorded but never checked against a cap before spending → §7/§8.

## Hardcoded config that should be settings
```bash
rg -n -i 'gpt-4|claude-|o[0-9]-|text-embedding|model\s*[:=]\s*["'\'']' src   # hardcoded model IDs
rg -n -i '\$\d|price|0\.0\d|per_token' src                                   # hardcoded prices
rg -n -i '@[a-z0-9.-]+\.(com|org|io)' src                                    # hardcoded emails/tenants
```

## Silent failure swallowing
```bash
rg -n -i 'catch\s*\(?\s*\)?\s*\{\s*\}' -U src           # empty catch {}
rg -n -i 'catch\s*\(\s*\w*\s*\)\s*\{\s*\}' -U src        # catch (e) {}
rg -n -i 'except\s*:\s*\n\s*pass' -U src                 # python bare except: pass
```

## Secrets at risk
```bash
rg -n -i 'console\.log|logger\.|print\(' src | rg -i 'token|secret|key|password|authorization'
rg -n -i 'process\.env|os\.environ|getenv' src           # then confirm .env.example lists each name
```
A secret name appearing in a log/return line → §4.

## Theme leaks (web UI)
```bash
rg -n -i '#[0-9a-f]{3,6}\b|rgb\(|rgba\(' --glob '**/*.{tsx,jsx,css,scss,vue,svelte}' src
```
Hardcoded colors in components that should use theme tokens → §9.

## Missing loading/skeleton states (Next.js-style example)
```bash
rg -l 'await ' --glob '**/app/**/page.*'                 # server-fetching routes
fd -t f 'loading.*' app 2>/dev/null || rg -l 'Skeleton|Suspense' src   # do they have a loading UI?
```

## Dependency hygiene
```bash
ls package-lock.json yarn.lock pnpm-lock.yaml poetry.lock Cargo.lock 2>/dev/null   # lockfile committed?
rg -n -i 'npm audit|pip-audit|cargo audit|dependabot|renovate' .github . 2>/dev/null
```

## Config validated at boot
```bash
rg -n -i 'zod|envalid|joi|pydantic.*Settings|valibot|env\.parse|required.*env' src
```
No boot-time env validation → app can start half-configured (§1).
