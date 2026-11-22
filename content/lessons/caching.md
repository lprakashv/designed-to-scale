---
original: true
title: Caching
summary: Serve repeated reads faster while managing stale data.
nodes: [["Service","Cache-aside caller"],["Cache","Temporary copies"],["Database","Source of truth"]]
layout: [[0,0.5],[1,0],[1,1]]
statusLabels: ["Lookup path","Freshness","Database load"]
---

## Read through a cache

```step
active: [0,1,2]
links: [[0,1,"Look up product"],[1,0,"Report the miss"],[0,2,"Read on miss"],[2,0,"Return product"]]
callouts: [[1,"Fill after source read"]]
status: ["Cache first","Per cached value","Misses reach DB"]
visualNote: "The service reads the database on a miss and fills the cache after the read."
```

Look up **product 42** in the cache.

- **Hit:** Return the cached value.
- **Miss:** Read the database. Save a copy with an expiry.

## Set freshness rules

```step
active: [0,1,2]
links: [[0,2,"Commit change"],[0,1,"Invalidate cache"]]
callouts: [[1,"Set a time to live"]]
status: ["Cache or database","TTL or invalidation","Refreshes reach DB"]
visualNote: "Set the lifetime from the amount of stale data a reader can accept."
```

Set a **time to live (TTL)** for each cached product. Invalidate its copy after a database update commits.

> **Warning.** A concurrent reader can put an old value back in the cache. Use a version check when needed. Otherwise, choose how long users can safely see stale data.

## Handle misses safely

```step
active: [0,1,2]
links: [[0,1,"Read expired key"],[0,2,"Share one read"]]
callouts: [[0,"Coalesce concurrent misses"]]
status: ["One fill per key","Stagger expiration","Fewer duplicate reads"]
visualNote: "Coalescing lets requests for the same missing key share one database query."
```

A popular key expires. Many requests now miss at the same time.

- **Coalesce requests:** One caller reads the database. Other callers share that result.
- **Add jitter:** Vary expiry times so many keys do not expire together.
