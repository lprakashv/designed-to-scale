---
title: CAP & Consistency
summary: Understand availability and consistency during a network partition.
data:
  original: true
---

## A partition occurs

```step
diagram:
  type: svg
  alt: "Client (in focus): Requests reads and writes. Replica A (in focus): Reachable side A. Cannot reach B. Replica B (in focus): Reachable side B. Cannot reach A. Flow: Client to Replica A: Reach replica A. Client to Replica B: Reach replica B."
  caption: This example assumes requests can still reach both sides of the partition.
  src: diagrams/cap/1.svg
```

A network split separates **Replica A** from **Replica B**. Clients can still reach both sides.

The replicas cannot reliably exchange updates during the split.

### Example state

| Item | State |
| --- | --- |
| Replica link | Partitioned |
| Request behavior | Both sides reachable |
| Data guarantee | Replication interrupted |

## Choose behavior

```step
diagram:
  type: svg
  alt: "Client (in focus): Requests reads and writes. Replica A (in focus): Reachable side A. Accept or reject per contract. Replica B (context): Reachable side B. Flow: Client to Replica A: Write during split."
  caption: Set the failure behavior per operation. A stale response can be acceptable for some reads.
  src: diagrams/cap/2.svg
```

During the split, choose which guarantee a request needs.

| Goal | Behavior during the split |
| --- | --- |
| Answer on both sides | The answers can conflict. |
| Preserve linearizability | Some requests may have to wait or fail. |

With **linearizability**, operations appear to occur in one order that respects when they began and ended.

### Example state

| Item | State |
| --- | --- |
| Replica link | Partitioned |
| Request behavior | **Reject some or respond** |
| Data guarantee | **Depends on chosen behavior** |

## Resolve changes

```step
diagram:
  type: svg
  alt: "Client (context): Requests reads and writes. Replica A (in focus): Reachable side A. Replica B (in focus): Reachable side B. Apply conflict rule. Flow: Replica A to Replica B: Send changes. Replica B to Replica A: Reconcile writes."
  caption: State how to handle updates accepted on both sides before the link recovered.
  src: diagrams/cap/3.svg
```

If both sides accepted writes, reconcile them after the link returns.

> **Example.** One shopper removes an item while another device changes its quantity. Decide whether removal or the quantity update wins.

### Example state

| Item | State |
| --- | --- |
| Replica link | **Restored** |
| Request behavior | **Reconcile writes** |
| Data guarantee | **Resolve conflicts** |
