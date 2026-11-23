---
title: Design a URL Shortener
summary: Work from requirements and estimates to a redirect service, explaining each design choice.
data:
  original: true
---

## Define the brief

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and follows links. API servers (in focus): Shortener API and redirect. Internal design undecided. Flow: Client to API servers: Create or open. API servers to Client: Link or redirect."
  caption: The client creates a link or opens an existing short link. Internal components are not chosen yet.
  src: diagrams/design-url-shortener/1.svg
```

Users need to:

- Submit a long URL and receive a **short link**.
- Open the short link and reach its destination.
- Set expiry and see click counts.

**Priority:** Keep redirects fast and available. Click counts can arrive later.

### Example state

| Item | State |
| --- | --- |
| Traffic | Estimate next |
| Codes | Undecided |
| Storage | Undecided |
| Read path | Undecided |

## Estimate the load

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and follows links. API servers (in focus): Shortener API and redirect. 100 redirects per create. Flow: Client to API servers: Estimate traffic."
  caption: The estimate adds a read-heavy workload and five years of retained mappings to the design.
  src: diagrams/design-url-shortener/2.svg
```

Use **30 days per month** and assume **100 million new links/month**, **100 redirects/link**, and **500 bytes/mapping**. Keep mappings for **five years**.

| Quantity | Estimate |
| --- | --- |
| Writes | 100M ÷ (30 × 86,400) ≈ **39/s**, round to 40/s |
| Reads | 40 × 100 ≈ **4,000/s**. At 3×, **12,000/s**. |
| Retained mappings | 100M × 12 × 5 = **6 billion links** |
| Logical storage | 6 billion × 500 B = **3 TB** before overhead |

These estimates make caching and partitioning worth evaluating.

### Example state

| Item | State |
| --- | --- |
| Traffic | **40 writes/s · 4,000 reads/s** |
| Codes | Undecided |
| Storage | **6 billion links · 3 TB** |
| Read path | Undecided |

## Build a first version

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and follows links. Load balancer (added) (in focus): Distributes requests. API servers (in focus): Shortener API and redirect. Stateless instances. Link store (added) (in focus): Durable code mappings. Flow: Client to Load balancer: POST or GET. Load balancer to API servers: Forward HTTP. API servers to Link store: Read or write. Link store to API servers: Return result."
  caption: Stateless API servers sit behind a load balancer and read or write a mapping in the store.
  src: diagrams/design-url-shortener/3.svg
```

| Endpoint | Purpose |
| --- | --- |
| `POST /links` | Create a mapping. |
| `GET /{code}` | Find the destination. |

Save the code, destination, creation time, and expiry. Return an error for a missing or expired code.

The load balancer routes requests to stateless API servers. The first version reads the store for every redirect.

### Example state

| Item | State |
| --- | --- |
| Traffic | 40 writes/s · 4,000 reads/s |
| Codes | Undecided |
| Storage | 6 billion links · 3 TB |
| Read path | **Direct store lookup** |

## Try a truncated hash

```step
diagram:
  type: svg
  alt: "Client (context): Creates and follows links. Load balancer (context): Distributes requests. API servers (in focus): Shortener API and redirect. Link store (in focus): Durable code mappings. Reject duplicate code. Hash candidate (added) (in focus): Truncated URL hash. Candidate can collide. Flow: API servers to Hash candidate: Propose code. API servers to Link store: Insert unique code."
  caption: The hash is a candidate design. The API checks its proposed code against the store.
  src: diagrams/design-url-shortener/4.svg
```

A **truncated hash** gives a short code. Different URLs can produce the same code.

- Enforce uniqueness in the store.
- Retry with different input after a collision.
- Include extra input when the same URL needs different expiry or statistics.

> **Sizing note.** Seven base-62 characters give **62⁷ ≈ 3.52 trillion** codes. Under a uniform random model, the probability of at least one collision reaches about **50% after 2.2 million codes**.

### Example state

| Item | State |
| --- | --- |
| Traffic | 40 writes/s · 4,000 reads/s |
| Codes | **Truncated hash** |
| Storage | 6 billion links · 3 TB |
| Read path | Direct store lookup |

## Allocate IDs and encode them

```step
diagram:
  type: svg
  alt: "Client (context): Creates and follows links. Load balancer (context): Distributes requests. API servers (in focus): Shortener API and redirect. Link store (in focus): Durable code mappings. ID allocator (added) (in focus): Reserves unique ID blocks. Persist allocation before reply. Hash candidate (context): Truncated URL hash. Candidate rejected. Flow: API servers to ID allocator: Reserve ID block. ID allocator to API servers: Return ID block. API servers to Link store: Store encoded key."
  caption: The allocator replaces the hash candidate. API servers reserve disjoint blocks before encoding.
  src: diagrams/design-url-shortener/5.svg
```

1. Reserve ID blocks in a durable allocator. Each server gets a distinct block.
2. Encode an ID in **base 62**.
3. Write the code and destination to the store.

For example, **125 = 2 × 62 + 1**, which encodes as `21` with digits first. Seven characters give **3.52 trillion** values for the assumed **6 billion** links.

> **Warning.** Reserve blocks atomically. Never reuse a reserved block after a crash. Enforce uniqueness in the store, including for custom aliases.

### Example state

| Item | State |
| --- | --- |
| Traffic | 40 writes/s · 4,000 reads/s |
| Codes | **Unique ID · base 62** |
| Storage | 6 billion links · 3 TB |
| Read path | Direct store lookup |

## Reduce enumeration

```step
diagram:
  type: svg
  alt: "Client (context): Creates and follows links. Load balancer (context): Distributes requests. API servers (in focus): Shortener API and redirect. Permute then encode in base 62. Link store (in focus): Durable code mappings. ID allocator (in focus): Reserves unique ID blocks. Hash candidate (context): Truncated URL hash. Flow: API servers to ID allocator: Reserve IDs. API servers to Link store: Write permuted code."
  caption: A keyed permutation changes the order of IDs before encoding while retaining uniqueness within its domain.
  src: diagrams/design-url-shortener/6.svg
```

Sequential IDs make nearby codes easy to guess. Use a **one-to-one keyed permutation** before encoding. The permutation works over a fixed ID range.

> **Warning.** Different keys can map different IDs to the same code. Use versioned code spaces or handle collisions during key rotation.

The permutation makes guessing harder. Use **authorization** to protect private destinations. Random codes also need collision handling and a large enough code space.

### Example state

| Item | State |
| --- | --- |
| Traffic | 40 writes/s · 4,000 reads/s |
| Codes | **Permuted ID · base 62** |
| Storage | 6 billion links · 3 TB |
| Read path | Direct store lookup |

## Cache popular mappings

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and follows links. Load balancer (in focus): Distributes requests. API servers (in focus): Shortener API and redirect. Cache (added) (in focus): Holds active mappings. Assume 90% hit rate. Link store (in focus): Durable code mappings. ID allocator (context): Reserves unique ID blocks. Hash candidate (context): Truncated URL hash. Flow: Client to Load balancer: Open a short link. Load balancer to API servers: Forward lookup. API servers to Cache: Look up cached code. API servers to Link store: Read on miss. Link store to API servers: Return mapping."
  caption: A cache hit returns the mapping; a miss reads the store and fills the cache.
  src: diagrams/design-url-shortener/7.svg
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

### Example state

| Item | State |
| --- | --- |
| Traffic | **4,000 reads/s average** |
| Codes | Permuted ID · base 62 |
| Storage | 6 billion links · 3 TB |
| Read path | **90% hit · 400 store reads/s** |

## Choose the redirect response

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and follows links. Load balancer (in focus): Distributes requests. API servers (in focus): Shortener API and redirect. Set explicit cache headers. Cache (in focus): Holds active mappings. Link store (context): Durable code mappings. ID allocator (context): Reserves unique ID blocks. Hash candidate (context): Truncated URL hash. Flow: Client to Load balancer: GET /code. Load balancer to API servers: Forward request. API servers to Cache: Look up code. API servers to Load balancer: 302 + Location. Load balancer to Client: Relay redirect."
  caption: The server returns a temporary redirect so later visits can still reach the service.
  src: diagrams/design-url-shortener/8.svg
```

| Status | Effect |
| --- | --- |
| **301** | A permanent redirect. Cached responses can skip later expiry checks, changes, and counts. |
| **302** | A temporary redirect. Use this when later visits must still reach the service. |

Set **`Cache-Control: no-store`** when each visit must go through the shortener. The server-side cache handles many of those requests.

### Example state

| Item | State |
| --- | --- |
| Traffic | 4,000 reads/s average |
| Codes | Permuted ID · base 62 |
| Storage | 6 billion links · 3 TB |
| Read path | **302 · cache first** |

## Partition and replicate storage

```step
diagram:
  type: svg
  alt: "Client (context): Creates and follows links. Load balancer (context): Distributes requests. API servers (in focus): Shortener API and redirect. Cache (context): Holds active mappings. Link store (in focus): Durable code mappings. Hash the code to a partition. Replicas (added) (in focus): Copies across zones. Three total copies. ID allocator (context): Reserves unique ID blocks. Hash candidate (context): Truncated URL hash. Flow: API servers to Link store: Read on miss. Link store to Replicas: Replicate by zone."
  caption: The store routes a code to a partition and keeps copies across failure zones.
  src: diagrams/design-url-shortener/9.svg
```

Use a key-value lookup by **code**. Hash the code to pick a partition. Keep copies in separate zones.

**3 TB × 3 copies = 9 TB**, before indexes, backups, and overhead.

> **Warning.** A viral link can still overload one key. Replicas improve resilience. Plan backups and consistency separately.

### Example state

| Item | State |
| --- | --- |
| Traffic | **400 store reads/s average** |
| Codes | Permuted ID · base 62 |
| Storage | **3 TB logical · 3 copies** |
| Read path | 302 · cache first |

## Move click counting off the response path

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and follows links. Load balancer (in focus): Distributes requests. API servers (in focus): Shortener API and redirect. Cache (context): Holds active mappings. Link store (context): Durable code mappings. Replicas (context): Copies across zones. ID allocator (context): Reserves unique ID blocks. Hash candidate (context): Truncated URL hash. Click queue (added) (in focus): Buffers redirect events. Stable event ID for deduplication. Count store (added) (in focus): Aggregated clicks. Flow: API servers to Load balancer: Return 302 promptly. Load balancer to Client: Relay redirect. API servers to Click queue: Publish click event. Click queue to Count store: Aggregate by code."
  caption: Redirects return from the API; click events travel through a separate aggregation path.
  src: diagrams/design-url-shortener/10.svg
```

Return the redirect without updating a counter on the request path. Send a click event to a queue. A worker aggregates counts later.

- **Average:** About **4,000 events/s**.
- **Peak:** About **12,000 events/s** at the assumed peak.

> **Trade-off.** Best-effort events can lose counts. Durable delivery can add latency or need buffering. Use event IDs to avoid double counting on retry.

### Example state

| Item | State |
| --- | --- |
| Traffic | **4,000 redirects/s average** |
| Codes | Permuted ID · base 62 |
| Storage | **Partitioned · 3 copies** |
| Read path | **302 · asynchronous counts** |

## Limit abuse

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and follows links. Load balancer (in focus): Distributes requests. API servers (in focus): Shortener API and redirect. Cache (context): Holds active mappings. Link store (context): Durable code mappings. Replicas (context): Copies across zones. ID allocator (context): Reserves unique ID blocks. Hash candidate (context): Truncated URL hash. Click queue (context): Buffers redirect events. Count store (context): Aggregated clicks. Rate limiter (added) (in focus): Limits link creation. Limit creates by account. Safety checks (added) (in focus): Validate destinations. Support disable and expiry. Flow: Client to Load balancer: Submit a long URL. Load balancer to Rate limiter: Check create limit. Rate limiter to API servers: Forward create. API servers to Safety checks: Check destination."
  caption: Creation passes through rate limits and destination checks; existing links also need a disable path.
  src: diagrams/design-url-shortener/11.svg
```

- Limit creation by **account** and **IP**.
- Check URL schemes and destinations. Recheck as threat information changes.
- Set expiry and allow links to be disabled.
- Invalidate cached mappings when you disable a link.

> **Warning.** Define what happens if the checker is unavailable. Protect the service against server-side request forgery before it fetches a user-supplied URL.

### Example state

| Item | State |
| --- | --- |
| Traffic | **Creation rate limited** |
| Codes | Permuted ID · base 62 |
| Storage | Partitioned · 3 copies |
| Read path | 302 · asynchronous counts |

## Recap: explain the design

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and follows links. Load balancer (in focus): Distributes requests. API servers (in focus): Shortener API and redirect. Cache (in focus): Holds active mappings. Link store (in focus): Durable code mappings. Replicas (context): Copies across zones. ID allocator (in focus): Reserves unique ID blocks. Unique IDs on create. Hash candidate (context): Truncated URL hash. Click queue (in focus): Buffers redirect events. Counts update asynchronously. Count store (in focus): Aggregated clicks. Rate limiter (context): Limits link creation. Safety checks (context): Validate destinations. Flow: Client to Load balancer: Open a short link. Load balancer to API servers: Forward request. API servers to Cache: Look up cache. API servers to Link store: Read on miss. API servers to Load balancer: 302 to destination. Load balancer to Client: Relay redirect. API servers to ID allocator: IDs on create. API servers to Click queue: Publish click event. Click queue to Count store: Aggregate by code."
  caption: Trace the redirect through the balancer and API. The ID allocator serves creation. The queue and count store handle click counts.
  src: diagrams/design-url-shortener/12.svg
```

| Decision | Benefit and cost |
| --- | --- |
| Allocate, permute, and encode IDs | Unique codes. Requires durable allocation and key management. |
| Cache mappings and return 302 | Reduce store reads. Manage stale entries. |
| Partition and replicate | Scale lookups and tolerate zone failures. Plan for hot keys and copies. |
| Count clicks asynchronously | Keep writes off the redirect path. Counts lag and can repeat. |
| Limit and check creation | Reduce abuse. Define expiry and checker outage behavior. |

State the contract and load first. Start with a simple path. Measure which constraint justifies the next change.

### Example state

| Item | State |
| --- | --- |
| Traffic | **40 writes/s · 4,000 reads/s** |
| Codes | Permuted ID · base 62 |
| Storage | **3 TB logical · 3 copies** |
| Read path | **302 · cache · async counts** |
