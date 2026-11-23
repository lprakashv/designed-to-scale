---
title: Consistent Hashing
summary: Reduce key movement when the number of nodes changes.
data:
  original: true
  nodes: [["Keys","Inputs to hash"],["Hash ring","Sorted token positions"],["Node A","Existing owner"],["Node B","Existing owner"],["Node C","New owner"]]
  layout: [[0,1],[1,1],[2,0],[2,1],[2,2]]
  statusLabels: ["Ownership","Membership","Skew"]
---

## Place keys on a ring

```step
data:
  active: [0,1,2,3]
  links: [[0,1,"Hash the key"],[1,2,"Key at 40 maps to A"],[1,3,"Key at 80 maps to B"]]
  callouts: [[1,"Clockwise successor"]]
  status: ["Next node clockwise","Stable","Depends on placement"]
  visualNote: "The same key maps to the same owner while the ring stays the same."
```

Use a ring from **0 through 99**. Put A at **50** and B at **90**.

Assign each key to the next node clockwise. Wrap to 0 when you pass 99.

## Add a node

```step
data:
  active: [1,3,4]
  links: [[1,4,"Key 40 moves to C"],[1,3,"Key 80 stays on B"]]
  callouts: [[4,"Insert at token 45"]]
  status: ["Split one interval","Node added","Partial movement"]
  visualNote: "Only keys in the new node’s acquired interval move under simple ring placement."
```

Insert node C at **45**.

- Keys in the interval **(90, 45]** move from A to C. The interval wraps past 99.
- Key **80** stays on B.

## Balance the load

```step
data:
  active: [0,1,2,3,4]
  links: [[0,1,"Hash each key"],[1,2,"Route by token"],[1,3,"Route by token"],[1,4,"Route by token"]]
  callouts: [[1,"Multiple tokens per node"]]
  status: ["Virtual positions","Multiple per node","Hot keys remain possible"]
  visualNote: "More positions can balance ownership without splitting requests for one popular key."
```

Give each physical node several positions on the ring. These **virtual nodes** can reduce uneven ownership.

> **Note.** A very popular key still has one owner unless replication or another routing rule spreads its traffic.
