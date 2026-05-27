# Colony Self-Verification Report
Date: 2026-03-24T22:44:36.873Z
Node: sovereign

## Results: 10/10 passed

- **[PASS]** PID Registry Health: 2 active, 28 history
- **[PASS]** Agent Roles: 10 roles
- **[PASS]** IX Type Canonicality: all canonical
- **[PASS]** IX Frontmatter Completeness: 391 files, 0 missing frontmatter
- **[PASS]** Skills Coverage: 59 skill folders, 40 IX skill entries
- **[PASS]** Connector PID Wiring: 9/9 wired
- **[PASS]** Event File Size: 3 MB
- **[PASS]** Despawn Protocol in Briefings: present
- **[PASS]** Catalog Sync Module: 26 catalogs, 579 entries
- **[PASS]** Route Files: 38 route files

## Details
```json
[
  {
    "id": "pid_registry",
    "name": "PID Registry Health",
    "pass": true,
    "summary": "2 active, 28 history",
    "active": 2,
    "history": 28
  },
  {
    "id": "agent_roles",
    "name": "Agent Roles",
    "pass": true,
    "summary": "10 roles",
    "roles": [
      "helm",
      "sentinel",
      "vector",
      "falcon",
      "rook",
      "forge",
      "omnispindle-control",
      "omnispindle-bridge",
      "omnispindle-scout",
      "watchdog"
    ]
  },
  {
    "id": "ix_types",
    "name": "IX Type Canonicality",
    "pass": true,
    "summary": "all canonical",
    "nonCanonical": []
  },
  {
    "id": "ix_frontmatter",
    "name": "IX Frontmatter Completeness",
    "pass": true,
    "summary": "391 files, 0 missing frontmatter",
    "total": 391,
    "missing": 0,
    "incomplete": []
  },
  {
    "id": "skills_coverage",
    "name": "Skills Coverage",
    "pass": true,
    "summary": "59 skill folders, 40 IX skill entries",
    "skillFolders": 59,
    "ixEntries": 40
  },
  {
    "id": "connector_pid",
    "name": "Connector PID Wiring",
    "pass": true,
    "summary": "9/9 wired",
    "wired": 9,
    "total": 9,
    "missing": []
  },
  {
    "id": "event_file",
    "name": "Event File Size",
    "pass": true,
    "summary": "3 MB"
  },
  {
    "id": "despawn_protocol",
    "name": "Despawn Protocol in Briefings",
    "pass": true,
    "summary": "present"
  },
  {
    "id": "catalog_sync",
    "name": "Catalog Sync Module",
    "pass": true,
    "summary": "26 catalogs, 579 entries"
  },
  {
    "id": "routes",
    "name": "Route Files",
    "pass": true,
    "summary": "38 route files"
  }
]
```