---
title: Replication
summary: Keep copies of data to improve availability and read capacity.
data:
  original: true
  nodes: [["Writer","Application client"],["Primary","Initial write owner"],["Replica","Copy and failover target"]]
  layout: [[0,0.5],[1,0],[2,0.5]]
  statusLabels: ["Write destination","Replica state","Read freshness"]
---

## Copy writes

```step
data:
  active: [0,1,2]
  links: [[0,1,"Write version 18"],[1,2,"Ship the change"]]
  callouts: [[2,"Apply writes in log order"]]
  status: ["Primary","Receives changes","Depends on lag"]
  visualNote: "Each read needs a destination that meets its freshness requirement."
```

The **primary** accepts writes. It sends each change to the replica.

Serve reads from the replica if the application can accept its consistency guarantees.

## Account for lag

```step
data:
  active: [1,2]
  links: [[1,2,"Copy version 18"]]
  callouts: [[1,"Version 18"],[2,"Version 17 until apply"]]
  status: ["Primary","Behind primary","May be stale"]
  visualNote: "Send a read that must see a recent write to a sufficiently up-to-date copy."
```

The primary confirms **version 18**. An asynchronous replica may still have **version 17**.

> **Warning.** Route reads to a suitable copy if users must see their own writes immediately.

## Recover from failure

```step
data:
  active: [0,1,2]
  links: [[0,2,"Write after failover"]]
  callouts: [[1,"Fence former primary"],[2,"Check last applied write"]]
  status: ["New primary","Promotion","Check recovered state"]
  visualNote: "Prevent the old primary from accepting new writes after the new primary takes over."
```

Prevent the old primary from accepting writes before you promote another copy. This step is called **fencing**.

> **Warning.** A promoted asynchronous replica can lose confirmed writes it has not received. Compare that risk with the recovery objective.
