---
title: CI/CD & Deployments
summary: Deliver changes with repeatable checks and recovery.
data:
  original: true
  nodes: [["Commit","Source revision"],["Pipeline","Build and checks"],["Production","Live deployment"]]
  statusLabels: ["Delivery stage","Artifact","Gate"]
---

## Build and verify

```step
data:
  active: [0,1]
  links: [[0,1,"Build and test"]]
  callouts: [[1,"Record immutable artifact ID"]]
  status: ["Build and test","Create once","Checks pass"]
  visualNote: "Promote the artifact that passed the checks so later stages run the tested build."
```

**Build once.** Test the artifact you built.

Save an immutable identifier so staging and production use the same artifact.

## Release gradually

```step
data:
  active: [1,2]
  links: [[1,2,"Deploy canary"]]
  callouts: [[2,"Watch errors and latency"]]
  status: ["Gradual rollout","Same tested build","Watch health"]
  visualNote: "Start with a small rollout. Use defined health signals to continue or roll back."
```

Start with a **canary**. Compare errors and latency with the previous version.

Expand the rollout only when the new version passes the health checks.

## Manage compatibility

```step
data:
  active: [1,2]
  links: [[1,2,"Deploy compatibly"]]
  callouts: [[2,"Old and new run together"]]
  status: ["Mixed versions","Old and new","Verify compatibility"]
  visualNote: "Keep the database and API compatible with both versions until the rollout ends."
```

Add a compatible database field before new code needs it. Keep the old and new versions working during the rollout.

> **Warning.** Remove the old field only after all readers and rollback paths no longer need it.
