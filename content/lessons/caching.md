---
title: Caching
summary: Serve repeated reads faster while managing stale data.
data:
  original: true
---

## Read through a cache

```step
diagram:
  type: svg
  alt: "Service (in focus): Cache-aside caller. Cache (in focus): Temporary copies. Fill after source read. Database (in focus): Source of truth. Flow: Service to Cache: Look up product. Cache to Service: Report the miss. Service to Database: Read on miss. Database to Service: Return product."
  caption: The service reads the database on a miss and fills the cache after the read.
  src: diagrams/caching/1.svg
```

Look up **product 42** in the cache.

- **Hit:** Return the cached value.
- **Miss:** Read the database. Save a copy with an expiry.

### Example state

| Item | State |
| --- | --- |
| Lookup path | Cache first |
| Freshness | Per cached value |
| Database load | Misses reach DB |

## Set freshness rules

```step
diagram:
  type: svg
  alt: "Service (in focus): Cache-aside caller. Cache (in focus): Temporary copies. Set a time to live. Database (in focus): Source of truth. Flow: Service to Database: Commit change. Service to Cache: Invalidate cache."
  caption: Set the lifetime from the amount of stale data a reader can accept.
  src: diagrams/caching/2.svg
```

Set a **time to live (TTL)** for each cached product. Invalidate its copy after a database update commits.

> **Warning.** A concurrent reader can put an old value back in the cache. Use a version check when needed. Otherwise, choose how long users can safely see stale data.

### Example state

| Item | State |
| --- | --- |
| Lookup path | **Cache or database** |
| Freshness | **TTL or invalidation** |
| Database load | **Refreshes reach DB** |

## Handle misses safely

```step
diagram:
  type: svg
  alt: "Service (in focus): Cache-aside caller. Coalesce concurrent misses. Cache (in focus): Temporary copies. Database (in focus): Source of truth. Flow: Service to Cache: Read expired key. Service to Database: Share one read."
  caption: Coalescing lets requests for the same missing key share one database query.
  src: diagrams/caching/3.svg
```

A popular key expires. Many requests now miss at the same time.

- **Coalesce requests:** One caller reads the database. Other callers share that result.
- **Add jitter:** Vary expiry times so many keys do not expire together.

### Example state

| Item | State |
| --- | --- |
| Lookup path | **One fill per key** |
| Freshness | **Stagger expiration** |
| Database load | **Fewer duplicate reads** |
