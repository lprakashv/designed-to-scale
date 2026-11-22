---
original: true
title: Design a URL Shortener
summary: Work from requirements and estimates to a redirect service, explaining each design choice.
nodes: [["Client","Creates and follows links"],["Load balancer","Distributes requests"],["API servers","Shortener API and redirect"],["Cache","Holds active mappings"],["Link store","Durable code mappings"],["Replicas","Copies across zones"],["ID allocator","Reserves unique ID blocks"],["Hash candidate","Truncated URL hash"],["Click queue","Buffers redirect events"],["Count store","Aggregated clicks"],["Rate limiter","Limits link creation"],["Safety checks","Validate destinations"]]
layout: [[0,0],[1,0],[2,0],[1,2],[2,2],[2,3],[1,1],[0,2],[1,3],[0,3],[0,1],[2,1]]
statusLabels: [Traffic, Codes, Storage, Read path]
---

## Define the brief

```step
active: [0,2]
links: [[0,2,"Create or open"],[2,0,"Link or redirect"]]
callouts: [[2,"Internal design undecided"]]
status: ["Estimate next","Undecided","Undecided","Undecided"]
visualNote: "The client creates a link or opens an existing short link. Internal components are not chosen yet."
```

Users need to:

- Submit a long URL and receive a **short link**.
- Open the short link and reach its destination.
- Set expiry and see click counts.

**Priority:** Keep redirects fast and available. Click counts can arrive later.

## Estimate the load

```step
active: [0,2]
links: [[0,2,"Estimate traffic"]]
callouts: [[2,"100 redirects per create"]]
status: ["40 writes/s · 4,000 reads/s","Undecided","6 billion links · 3 TB","Undecided"]
visualNote: "The estimate adds a read-heavy workload and five years of retained mappings to the design."
```

Use **30 days per month** and assume **100 million new links/month**, **100 redirects/link**, and **500 bytes/mapping**. Keep mappings for **five years**.

| Quantity | Estimate |
| --- | --- |
| Writes | 100M ÷ (30 × 86,400) ≈ **39/s**, round to 40/s |
| Reads | 40 × 100 ≈ **4,000/s**. At 3×, **12,000/s**. |
| Retained mappings | 100M × 12 × 5 = **6 billion links** |
| Logical storage | 6 billion × 500 B = **3 TB** before overhead |

These estimates make caching and partitioning worth evaluating.

## Build a first version

```step
active: [0,1,2,4]
links: [[0,1,"POST or GET"],[1,2,"Forward HTTP"],[2,4,"Read or write"],[4,2,"Return result"]]
callouts: [[2,"Stateless instances"]]
status: ["40 writes/s · 4,000 reads/s","Undecided","6 billion links · 3 TB","Direct store lookup"]
visualNote: "Stateless API servers sit behind a load balancer and read or write a mapping in the store."
```

| Endpoint | Purpose |
| --- | --- |
| `POST /links` | Create a mapping. |
| `GET /{code}` | Find the destination. |

Save the code, destination, creation time, and expiry. Return an error for a missing or expired code.

The load balancer routes requests to stateless API servers. The first version reads the store for every redirect.

## Try a truncated hash

```step
active: [2,4,7]
links: [[2,7,"Propose code"],[2,4,"Insert unique code"]]
callouts: [[7,"Candidate can collide"],[4,"Reject duplicate code"]]
status: ["40 writes/s · 4,000 reads/s","Truncated hash","6 billion links · 3 TB","Direct store lookup"]
visualNote: "The hash is a candidate design. The API checks its proposed code against the store."
```

A **truncated hash** gives a short code. Different URLs can produce the same code.

- Enforce uniqueness in the store.
- Retry with different input after a collision.
- Include extra input when the same URL needs different expiry or statistics.

> **Sizing note.** Seven base-62 characters give **62⁷ ≈ 3.52 trillion** codes. Under a uniform random model, the probability of at least one collision reaches about **50% after 2.2 million codes**.

## Allocate IDs and encode them

```step
active: [2,4,6]
links: [[2,6,"Reserve ID block"],[6,2,"Return ID block"],[2,4,"Store encoded key"]]
callouts: [[6,"Persist allocation before reply"],[7,"Candidate rejected"]]
status: ["40 writes/s · 4,000 reads/s","Unique ID · base 62","6 billion links · 3 TB","Direct store lookup"]
visualNote: "The allocator replaces the hash candidate. API servers reserve disjoint blocks before encoding."
```

1. Reserve ID blocks in a durable allocator. Each server gets a distinct block.
2. Encode an ID in **base 62**.
3. Write the code and destination to the store.

For example, **125 = 2 × 62 + 1**, which encodes as `21` with digits first. Seven characters give **3.52 trillion** values for the assumed **6 billion** links.

> **Warning.** Reserve blocks atomically. Never reuse a reserved block after a crash. Enforce uniqueness in the store, including for custom aliases.

## Reduce enumeration

```step
active: [2,4,6]
links: [[2,6,"Reserve IDs"],[2,4,"Write permuted code"]]
callouts: [[2,"Permute then encode in base 62"]]
status: ["40 writes/s · 4,000 reads/s","Permuted ID · base 62","6 billion links · 3 TB","Direct store lookup"]
visualNote: "A keyed permutation changes the order of IDs before encoding while retaining uniqueness within its domain."
```

Sequential IDs make nearby codes easy to guess. Use a **one-to-one keyed permutation** before encoding. The permutation works over a fixed ID range.

> **Warning.** Different keys can map different IDs to the same code. Use versioned code spaces or handle collisions during key rotation.

The permutation makes guessing harder. Use **authorization** to protect private destinations. Random codes also need collision handling and a large enough code space.

## Cache popular mappings

```step
active: [0,1,2,3,4]
links: [[0,1,"Open a short link"],[1,2,"Forward lookup"],[2,3,"Look up cached code"],[2,4,"Read on miss"],[4,2,"Return mapping"]]
callouts: [[3,"Assume 90% hit rate"]]
status: ["4,000 reads/s average","Permuted ID · base 62","6 billion links · 3 TB","90% hit · 400 store reads/s"]
visualNote: "A cache hit returns the mapping; a miss reads the store and fills the cache."
```

Assume the cache serves **90%** of reads.

| Redirect rate | Store reads |
| --- | --- |
| **4,000/s** average | 4,000 × 10% = **400/s** |
| **12,000/s** peak | 12,000 × 10% = **1,200/s** |

1. Look up the code in the cache.
2. On a miss, read the store.
3. Cache the destination and its expiry.

> **Warning.** Do not serve expired entries. Invalidate disabled links or bound their cache lifetime. If you cache a missing code, use a short lifetime and invalidate it when an alias is created.

## Choose the redirect response

```step
active: [0,1,2,3]
links: [[0,1,"GET /code"],[1,2,"Forward request"],[2,3,"Look up code"],[2,1,"302 + Location"],[1,0,"Relay redirect"]]
callouts: [[2,"Set explicit cache headers"]]
status: ["4,000 reads/s average","Permuted ID · base 62","6 billion links · 3 TB","302 · cache first"]
visualNote: "The server returns a temporary redirect so later visits can still reach the service."
```

| Status | Effect |
| --- | --- |
| **301** | A permanent redirect. Cached responses can skip later expiry checks, changes, and counts. |
| **302** | A temporary redirect. Use this when later visits must still reach the service. |

Set **`Cache-Control: no-store`** when each visit must go through the shortener. The server-side cache handles many of those requests.

## Partition and replicate storage

```step
active: [2,4,5]
links: [[2,4,"Read on miss"],[4,5,"Replicate by zone"]]
callouts: [[4,"Hash the code to a partition"],[5,"Three total copies"]]
status: ["400 store reads/s average","Permuted ID · base 62","3 TB logical · 3 copies","302 · cache first"]
visualNote: "The store routes a code to a partition and keeps copies across failure zones."
```

Use a key-value lookup by **code**. Hash the code to pick a partition. Keep copies in separate zones.

**3 TB × 3 copies = 9 TB**, before indexes, backups, and overhead.

> **Warning.** A viral link can still overload one key. Replicas improve resilience. Plan backups and consistency separately.

## Move click counting off the response path

```step
active: [0,1,2,8,9]
links: [[2,1,"Return 302 promptly"],[1,0,"Relay redirect"],[2,8,"Publish click event"],[8,9,"Aggregate by code"]]
callouts: [[8,"Stable event ID for deduplication"]]
status: ["4,000 redirects/s average","Permuted ID · base 62","Partitioned · 3 copies","302 · asynchronous counts"]
visualNote: "Redirects return from the API; click events travel through a separate aggregation path."
```

Return the redirect without updating a counter on the request path. Send a click event to a queue. A worker aggregates counts later.

- **Average:** About **4,000 events/s**.
- **Peak:** About **12,000 events/s** at the assumed peak.

> **Trade-off.** Best-effort events can lose counts. Durable delivery can add latency or need buffering. Use event IDs to avoid double counting on retry.

## Limit abuse

```step
active: [0,1,2,10,11]
links: [[0,1,"Submit a long URL"],[1,10,"Check create limit"],[10,2,"Forward create"],[2,11,"Check destination"]]
callouts: [[10,"Limit creates by account"],[11,"Support disable and expiry"]]
status: ["Creation rate limited","Permuted ID · base 62","Partitioned · 3 copies","302 · asynchronous counts"]
visualNote: "Creation passes through rate limits and destination checks; existing links also need a disable path."
```

- Limit creation by **account** and **IP**.
- Check URL schemes and destinations. Recheck as threat information changes.
- Set expiry and allow links to be disabled.
- Invalidate cached mappings when you disable a link.

> **Warning.** Define what happens if the checker is unavailable. Protect the service against server-side request forgery before it fetches a user-supplied URL.

## Recap: explain the design

```step
active: [0,1,2,3,4,6,8,9]
links: [[0,1,"Open a short link"],[1,2,"Forward request"],[2,3,"Look up cache"],[2,4,"Read on miss"],[2,1,"302 to destination"],[1,0,"Relay redirect"],[2,6,"IDs on create"],[2,8,"Publish click event"],[8,9,"Aggregate by code"]]
callouts: [[6,"Unique IDs on create"],[8,"Counts update asynchronously"]]
status: ["40 writes/s · 4,000 reads/s","Permuted ID · base 62","3 TB logical · 3 copies","302 · cache · async counts"]
visualNote: "Trace the redirect through the balancer and API. The ID allocator serves creation. The queue and count store handle click counts."
```

| Decision | Benefit and cost |
| --- | --- |
| Allocate, permute, and encode IDs | Unique codes. Requires durable allocation and key management. |
| Cache mappings and return 302 | Reduce store reads. Manage stale entries. |
| Partition and replicate | Scale lookups and tolerate zone failures. Plan for hot keys and copies. |
| Count clicks asynchronously | Keep writes off the redirect path. Counts lag and can repeat. |
| Limit and check creation | Reduce abuse. Define expiry and checker outage behavior. |

State the contract and load first. Start with a simple path. Measure which constraint justifies the next change.
