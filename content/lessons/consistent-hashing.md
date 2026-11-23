---
title: Consistent Hashing
summary: Reduce key movement when the number of nodes changes.
data:
  original: true
---

## Place keys on a ring

```step
diagram:
  type: svg
  alt: "Keys (in focus): Inputs to hash. Hash ring (in focus): Sorted token positions. Clockwise successor. Node A (in focus): Existing owner. Node B (in focus): Existing owner. Flow: Keys to Hash ring: Hash the key. Hash ring to Node A: Key at 40 maps to A. Hash ring to Node B: Key at 80 maps to B."
  caption: The same key maps to the same owner while the ring stays the same.
  src: diagrams/consistent-hashing/1.svg
```

Use a ring from **0 through 99**. Put A at **50** and B at **90**.

Assign each key to the next node clockwise. Wrap to 0 when you pass 99.

### Example state

| Item | State |
| --- | --- |
| Ownership | Next node clockwise |
| Membership | Stable |
| Skew | Depends on placement |

## Add a node

```step
diagram:
  type: svg
  alt: "Keys (context): Inputs to hash. Hash ring (in focus): Sorted token positions. Node A (context): Existing owner. Node B (in focus): Existing owner. Node C (added) (in focus): New owner. Insert at token 45. Flow: Hash ring to Node C: Key 40 moves to C. Hash ring to Node B: Key 80 stays on B."
  caption: Only keys in the new node’s acquired interval move under simple ring placement.
  src: diagrams/consistent-hashing/2.svg
```

Insert node C at **45**.

- Keys in the interval **(90, 45]** move from A to C. The interval wraps past 99.
- Key **80** stays on B.

### Example state

| Item | State |
| --- | --- |
| Ownership | **Split one interval** |
| Membership | **Node added** |
| Skew | **Partial movement** |

## Balance the load

```step
diagram:
  type: svg
  alt: "Keys (in focus): Inputs to hash. Hash ring (in focus): Sorted token positions. Multiple tokens per node. Node A (in focus): Existing owner. Node B (in focus): Existing owner. Node C (in focus): New owner. Flow: Keys to Hash ring: Hash each key. Hash ring to Node A: Route by token. Hash ring to Node B: Route by token. Hash ring to Node C: Route by token."
  caption: More positions can balance ownership without splitting requests for one popular key.
  src: diagrams/consistent-hashing/3.svg
```

Give each physical node several positions on the ring. These **virtual nodes** can reduce uneven ownership.

> **Note.** A very popular key still has one owner unless replication or another routing rule spreads its traffic.

### Example state

| Item | State |
| --- | --- |
| Ownership | **Virtual positions** |
| Membership | **Multiple per node** |
| Skew | **Hot keys remain possible** |
