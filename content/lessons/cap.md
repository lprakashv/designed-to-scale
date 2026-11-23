---
title: CAP & Consistency
summary: Understand availability and consistency during a network partition.
data:
  original: true
  nodes: [["Client","Requests reads and writes"],["Replica A","Reachable side A"],["Replica B","Reachable side B"]]
  layout: [[0.5,0],[0,1],[1,1]]
  statusLabels: ["Replica link","Request behavior","Data guarantee"]
---

## A partition occurs

```step
data:
  active: [0,1,2]
  links: [[0,1,"Reach replica A"],[0,2,"Reach replica B"]]
  callouts: [[1,"Cannot reach B"],[2,"Cannot reach A"]]
  status: ["Partitioned","Both sides reachable","Replication interrupted"]
  visualNote: "This example assumes requests can still reach both sides of the partition."
```

A network split separates **Replica A** from **Replica B**. Clients can still reach both sides.

The replicas cannot reliably exchange updates during the split.

## Choose behavior

```step
data:
  active: [0,1]
  links: [[0,1,"Write during split"]]
  callouts: [[1,"Accept or reject per contract"]]
  status: ["Partitioned","Reject some or respond","Depends on chosen behavior"]
  visualNote: "Set the failure behavior per operation. A stale response can be acceptable for some reads."
```

During the split, choose which guarantee a request needs.

| Goal | Behavior during the split |
| --- | --- |
| Answer on both sides | The answers can conflict. |
| Preserve linearizability | Some requests may have to wait or fail. |

With **linearizability**, operations appear to occur in one order that respects when they began and ended.

## Resolve changes

```step
data:
  active: [1,2]
  links: [[1,2,"Send changes"],[2,1,"Reconcile writes"]]
  callouts: [[2,"Apply conflict rule"]]
  status: ["Restored","Reconcile writes","Resolve conflicts"]
  visualNote: "State how to handle updates accepted on both sides before the link recovered."
```

If both sides accepted writes, reconcile them after the link returns.

> **Example.** One shopper removes an item while another device changes its quantity. Decide whether removal or the quantity update wins.
