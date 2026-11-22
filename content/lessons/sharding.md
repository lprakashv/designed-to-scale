---
original: true
title: Sharding
summary: Partition a dataset across multiple machines.
nodes: [["Request","Application operation"],["Router","Maps keys to shards"],["Shards","Owning data partitions"]]
statusLabels: ["Routing input","Partitions touched","Risk"]
---

## Choose a key

```step
active: [0,1,2]
links: [[0,1,"Read customer 42"],[1,2,"Select owning shard"]]
callouts: [[2,"Partition by customer ID"]]
status: ["Shard key","Usually one","Uneven key spread"]
visualNote: "Pick a key that sends common operations to a small set of partitions."
```

Assume most requests contain a customer ID. Use **customer ID** as the shard key.

The router can send each of these lookups to one shard.

## Route operations

```step
active: [0,1,2]
links: [[0,1,"List open orders"],[1,2,"Query all shards"]]
callouts: [[1,"Missing key needs fan-out"]]
status: ["Shard key or scatter","One or many","More work per query"]
visualNote: "If the router cannot derive the key, it may need to query several partitions."
```

Some requests do not contain the shard key. A list of all open orders is one example.

The router may need to query several shards and merge the results. Measure the cost of this **fan-out**.

## Handle hotspots

```step
active: [0,1,2]
links: [[0,1,"Hot customer"],[1,2,"Concentrated load"]]
callouts: [[2,"One hot customer can dominate"]]
status: ["Hot key","Busy shard","Load imbalance"]
visualNote: "Measure requests per shard. A few popular keys can overload one shard even with even data sizes."
```

One busy customer can overload one shard, even when data is evenly distributed.

- Measure requests and storage **per shard**.
- Consider splitting a busy tenant only if the benefits justify more costly reads and transactions.
