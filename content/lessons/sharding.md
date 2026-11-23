---
title: Sharding
summary: Partition a dataset across multiple machines.
data:
  original: true
---

## Choose a key

```step
diagram:
  type: svg
  alt: "Request (in focus): Application operation. Router (in focus): Maps keys to shards. Shards (in focus): Owning data partitions. Partition by customer ID. Flow: Request to Router: Read customer 42. Router to Shards: Select owning shard."
  caption: Pick a key that sends common operations to a small set of partitions.
  src: diagrams/sharding/1.svg
```

Assume most requests contain a customer ID. Use **customer ID** as the shard key.

The router can send each of these lookups to one shard.

### Example state

| Item | State |
| --- | --- |
| Routing input | Shard key |
| Partitions touched | Usually one |
| Risk | Uneven key spread |

## Route operations

```step
diagram:
  type: svg
  alt: "Request (in focus): Application operation. Router (in focus): Maps keys to shards. Missing key needs fan-out. Shards (in focus): Owning data partitions. Flow: Request to Router: List open orders. Router to Shards: Query all shards."
  caption: If the router cannot derive the key, it may need to query several partitions.
  src: diagrams/sharding/2.svg
```

Some requests do not contain the shard key. A list of all open orders is one example.

The router may need to query several shards and merge the results. Measure the cost of this **fan-out**.

### Example state

| Item | State |
| --- | --- |
| Routing input | **Shard key or scatter** |
| Partitions touched | **One or many** |
| Risk | **More work per query** |

## Handle hotspots

```step
diagram:
  type: svg
  alt: "Request (in focus): Application operation. Router (in focus): Maps keys to shards. Shards (in focus): Owning data partitions. One hot customer can dominate. Flow: Request to Router: Hot customer. Router to Shards: Concentrated load."
  caption: Measure requests per shard. A few popular keys can overload one shard even with even data sizes.
  src: diagrams/sharding/3.svg
```

One busy customer can overload one shard, even when data is evenly distributed.

- Measure requests and storage **per shard**.
- Consider splitting a busy tenant only if the benefits justify more costly reads and transactions.

### Example state

| Item | State |
| --- | --- |
| Routing input | **Hot key** |
| Partitions touched | **Busy shard** |
| Risk | **Load imbalance** |
