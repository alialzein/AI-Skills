# AI-Skills

A personal collection of [Claude Code Agent Skills](https://code.claude.com/docs/en/skills),
packaged so they can be installed on any machine and shared with others.

The repo is set up three ways at once, so you can install however you like:

1. As a **Claude Code plugin marketplace** (best for using across machines & all projects).
2. As a **symlink/copy install** via `install.sh` (simple, no plugin system needed).
3. As an optional **SessionStart hook** that auto-installs the skills in ephemeral
   environments such as Claude Code on the web.

---

## Skills in this repo

| Skill   | Invoke   | What it does |
|---------|----------|--------------|
| `teach` | `/teach` | Turns the current directory into a stateful teaching workspace and teaches you a topic over multiple sessions — missions, lessons (beautiful HTML), reference sheets, spaced-repetition learning records. |

> `teach` is vendored from [mattpocock/skills](https://github.com/mattpocock/skills)
> (`skills/productivity/teach`). See [Attribution](#attribution).

---

## Repo layout

```
AI-Skills/
├── .claude-plugin/
│   ├── plugin.json          # makes this repo an installable plugin
│   └── marketplace.json     # ...and a marketplace that lists that plugin
├── skills/
│   └── teach/
│       ├── SKILL.md         # the skill definition (frontmatter + instructions)
│       ├── MISSION-FORMAT.md
│       ├── RESOURCES-FORMAT.md
│       ├── LEARNING-RECORD-FORMAT.md
│       └── GLOSSARY-FORMAT.md
├── install.sh               # symlink/copy skills into ~/.claude/skills
├── .claude/
│   ├── hooks/install-skills.sh   # SessionStart hook (auto-install in web/ephemeral)
│   └── settings.json.example     # opt-in: enables the hook above
├── .gitignore
├── LICENSE
└── README.md
```

---

## Install

### Option 1 — As a plugin (recommended for cross-machine use)

Inside Claude Code:

```
/plugin marketplace add alialzein/ai-skills
/plugin install ai-skills@ai-skills
```

This makes the skills available in **every** project on that machine, with proper
versioning. Update later with `/plugin marketplace update ai-skills`.

### Option 2 — Symlink into your personal skills (single machine)

```bash
git clone https://github.com/alialzein/ai-skills.git
cd ai-skills
./install.sh           # symlinks each skill into ~/.claude/skills/<name>
# or: ./install.sh --copy   (copy instead of symlink; for ephemeral/CI environments)
```

`install.sh` links **each skill folder individually** into `~/.claude/skills/`
(symlinking the whole `~/.claude/skills` directory is not supported by Claude Code).
Re-running it is safe and idempotent; `git pull` keeps symlinked skills up to date.

### Option 3 — Auto-install in Claude Code on the web (ephemeral containers)

In web/ephemeral sessions, `~/.claude/skills` is wiped between sessions. To
re-install the skills automatically at the start of every session in this repo:

```bash
cp .claude/settings.json.example .claude/settings.json
```

That activates the `SessionStart` hook in `.claude/hooks/install-skills.sh`, which
copies the skills into `~/.claude/skills` and asks Claude Code to reload them.
`.claude/settings.json` is gitignored, so this stays a local, opt-in choice.

---

## Using the `teach` skill

`teach` is **user-invoked** (it sets `disable-model-invocation: true`), so you call it
explicitly. It treats your **current directory** as a persistent learning workspace.

```bash
mkdir ~/learn-spanish && cd ~/learn-spanish
# then, in Claude Code:
/teach Spanish for ordering food while travelling in Mexico
```

What happens:

- It first asks **why** you want to learn this and writes a `MISSION.md` to ground everything.
- It curates trusted sources into `RESOURCES.md` (it won't rely on guesswork).
- It produces short, beautiful **lessons** as self-contained HTML in `./lessons/`.
- It keeps reference sheets in `./reference/`, a `GLOSSARY.md`, and `learning-records/`
  that track what you've learned so later sessions pick up where you left off.

Because all state lives in that directory, keep using the **same folder** each session
(commit it to its own git repo if you want history). Run `/teach` again any time to
continue, and answer its questions to steer what it teaches next.

---

## Examples

See [`examples/teach-leadership/`](./examples/teach-leadership) for a real, worked
`teach` workspace ("How to be a strong leader") — mission, a curated resource list,
an interactive HTML lesson, and a printable reference card. Its
[README](./examples/teach-leadership/README.md) has one-click links to view the
rendered lessons.

---

## Adding a new skill

1. Create `skills/<your-skill>/SKILL.md` with frontmatter:
   ```markdown
   ---
   name: your-skill
   description: One line on what it does AND when Claude should use it.
   ---

   Instructions for the skill go here.
   ```
   (`name` must be lowercase, match the folder, and be ≤64 chars. Add
   `disable-model-invocation: true` for a user-only `/your-skill` command.)
2. Add a row to the [Skills table](#skills-in-this-repo) above.
3. Re-run `./install.sh` (or `/plugin marketplace update ai-skills` for plugin users).

---

## Attribution

The `teach` skill is authored by **Matt Pocock** and vendored from
[mattpocock/skills](https://github.com/mattpocock/skills). All credit for it goes to
the original author; it is included here per that repository's license. Everything
else in this repo (packaging, install tooling) is MIT-licensed — see [LICENSE](./LICENSE).
