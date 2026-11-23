---
title: Replication
summary: Keep copies of data to improve availability and read capacity.
data:
  original: true
---

## Copy writes

```step
diagram:
  type: svg
  alt: "Writer (in focus): Application client. Primary (in focus): Initial write owner. Replica (in focus): Copy and failover target. Apply writes in log order. Flow: Writer to Primary: Write version 18. Primary to Replica: Ship the change."
  caption: Each read needs a destination that meets its freshness requirement.
  src: diagrams/replication/1.svg
```

The **primary** accepts writes. It sends each change to the replica.

Serve reads from the replica if the application can accept its consistency guarantees.

### Example state

| Item | State |
| --- | --- |
| Write destination | Primary |
| Replica state | Receives changes |
| Read freshness | Depends on lag |

## Account for lag

```step
diagram:
  type: svg
  alt: "Writer (context): Application client. Primary (in focus): Initial write owner. Version 18. Replica (in focus): Copy and failover target. Version 17 until apply. Flow: Primary to Replica: Copy version 18."
  caption: Send a read that must see a recent write to a sufficiently up-to-date copy.
  src: diagrams/replication/2.svg
```

The primary confirms **version 18**. An asynchronous replica may still have **version 17**.

> **Warning.** Route reads to a suitable copy if users must see their own writes immediately.

### Example state

| Item | State |
| --- | --- |
| Write destination | Primary |
| Replica state | **Behind primary** |
| Read freshness | **May be stale** |

## Recover from failure

```step
diagram:
  type: svg
  alt: "Writer (in focus): Application client. Primary (in focus): Initial write owner. Fence former primary. Replica (in focus): Copy and failover target. Check last applied write. Flow: Writer to Replica: Write after failover."
  caption: Prevent the old primary from accepting new writes after the new primary takes over.
  src: diagrams/replication/3.svg
```

Prevent the old primary from accepting writes before you promote another copy. This step is called **fencing**.

> **Warning.** A promoted asynchronous replica can lose confirmed writes it has not received. Compare that risk with the recovery objective.

### Example state

| Item | State |
| --- | --- |
| Write destination | **New primary** |
| Replica state | **Promotion** |
| Read freshness | **Check recovered state** |
