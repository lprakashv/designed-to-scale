---
title: CI/CD & Deployments
summary: Deliver changes with repeatable checks and recovery.
data:
  original: true
---

## Build and verify

```step
diagram:
  type: svg
  alt: "Commit (in focus): Source revision. Pipeline (in focus): Build and checks. Record immutable artifact ID. Flow: Commit to Pipeline: Build and test."
  caption: Promote the artifact that passed the checks so later stages run the tested build.
  src: diagrams/cicd/1.svg
```

**Build once.** Test the artifact you built.

Save an immutable identifier so staging and production use the same artifact.

### Example state

| Item | State |
| --- | --- |
| Delivery stage | Build and test |
| Artifact | Create once |
| Gate | Checks pass |

## Release gradually

```step
diagram:
  type: svg
  alt: "Commit (context): Source revision. Pipeline (in focus): Build and checks. Production (added) (in focus): Live deployment. Watch errors and latency. Flow: Pipeline to Production: Deploy canary."
  caption: Start with a small rollout. Use defined health signals to continue or roll back.
  src: diagrams/cicd/2.svg
```

Start with a **canary**. Compare errors and latency with the previous version.

Expand the rollout only when the new version passes the health checks.

### Example state

| Item | State |
| --- | --- |
| Delivery stage | **Gradual rollout** |
| Artifact | **Same tested build** |
| Gate | **Watch health** |

## Manage compatibility

```step
diagram:
  type: svg
  alt: "Commit (context): Source revision. Pipeline (in focus): Build and checks. Production (in focus): Live deployment. Old and new run together. Flow: Pipeline to Production: Deploy compatibly."
  caption: Keep the database and API compatible with both versions until the rollout ends.
  src: diagrams/cicd/3.svg
```

Add a compatible database field before new code needs it. Keep the old and new versions working during the rollout.

> **Warning.** Remove the old field only after all readers and rollback paths no longer need it.

### Example state

| Item | State |
| --- | --- |
| Delivery stage | **Mixed versions** |
| Artifact | **Old and new** |
| Gate | **Verify compatibility** |
