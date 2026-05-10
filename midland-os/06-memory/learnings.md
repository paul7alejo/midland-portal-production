# learnings.md
# Project learnings — technical, operational, commercial
# Midland OS v3.1 | May 10, 2026 | paul@oneofzero.co.nz

## Format
```
[LEARNING-NNN] Date | Category | Title
```
Categories: TECHNICAL | OPERATIONAL | COMMERCIAL | COMPLIANCE | PROCESS | SCOPE

### LEARNING-001 | May 2026 | OPERATIONAL
**Import quality is always worse than test data suggests**
Dry-run validation must be the first thing admin sees. Document skipped/failed honestly.

### LEARNING-002 | May 2026 | SCOPE
**"Small additions" before a deadline are scope grenades**
Answer: "It is on the roadmap — after Phase 1 is stable."

### LEARNING-003 | May 2026 | COMPLIANCE
**HIPC compliance needs a named Privacy Officer before go-live**
Raise early. Hard dependency, not a checkbox.

### LEARNING-004 | May 2026 | PROCESS
**Canonical status files prevent AI tool drift**
Always paste Section B at session start. Local files win when tools disagree.

### LEARNING-005 | May 2026 | TECHNICAL
**Fake fallback data is a safety problem, not just a UX problem**
Show "Not recorded" and flag for staff follow-up. Never invent clinical data.

### LEARNING-006 | May 2026 | COMMERCIAL
**The value story is operational reliability, not feature count**
Build for boring reliability. The retainer justifies itself.

### LEARNING-007 | May 2026 | OPERATIONAL
**Operating layer needs export to be real**
Without export + backup visibility, admins email Paul for everything. v3.1 fixes this.

### LEARNING-008 | May 2026 | COMPLIANCE
**NHI default-exclude is the only safe export rule**
Every export drifts toward NHI. Make exclusion default; inclusion the high-friction exception.
