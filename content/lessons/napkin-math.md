---
title: Napkin Math
summary: Turn explicit workload assumptions into traffic, bandwidth, and storage estimates.
data:
  original: true
---

## Define the example

```step
diagram:
  type: svg
  alt: "Users (in focus): Upload and view photos. Assume 1M daily users. Photo service (in focus): Handles reads and uploads. Flow: Users to Photo service: View or upload."
  caption: Users produce requests; the service must handle both normal and peak traffic.
  src: diagrams/napkin-math/1.svg
```

Assume a photo service has **1 million daily active users**. Each person:

- Views **20 photos** per day
- Uploads **one photo** per day

> **Units.** This example uses decimal sizes. **1 MB = 1,000,000 bytes**. **1 TB = 1,000 GB**.

### Example state

| Item | State |
| --- | --- |
| Input | 1M daily users |
| Estimate | Estimate next |
| Decision | State assumptions |

## Convert daily traffic to a rate

```step
diagram:
  type: svg
  alt: "Users (in focus): Upload and view photos. Photo service (in focus): Handles reads and uploads. 231 reads/s on average. Flow: Users to Photo service: 20M reads/day."
  caption: Divide daily requests by the number of seconds in a day.
  src: diagrams/napkin-math/2.svg
```

There are **86,400 seconds** in a day.

| Operation | Average rate |
| --- | --- |
| Read | 20 million/day ÷ 86,400 ≈ **231/s** |
| Upload | 1 million/day ÷ 86,400 ≈ **11.6/s** |

Keep these rates separate. Reads and uploads can use different resources.

### Example state

| Item | State |
| --- | --- |
| Input | **20 reads/user/day** |
| Estimate | **≈231 reads/s average** |
| Decision | **Separate reads and writes** |

## Allow for peak load

```step
diagram:
  type: svg
  alt: "Users (in focus): Upload and view photos. Photo service (in focus): Handles reads and uploads. 694 peak reads/s. Flow: Users to Photo service: Model the 3× peak."
  caption: A peak multiplier raises the capacity target above the daily average.
  src: diagrams/napkin-math/3.svg
```

Assume peak traffic is **3×** the daily average.

- **Reads:** 231.5 × 3 ≈ **694/s**
- **Uploads:** 11.6 × 3 ≈ **35/s**

> **Assumption.** Events, regions, and retries can change the peak. Use measured traffic when available.

### Example state

| Item | State |
| --- | --- |
| Input | **Assume 3× peak** |
| Estimate | **≈694 reads/s peak** |
| Decision | **Reserve headroom** |

## Calculate ingress bandwidth

```step
diagram:
  type: svg
  alt: "Users (in focus): Upload and view photos. Photo service (in focus): Handles reads and uploads. 23 MB/s average ingress. Object storage (added) (in focus): Holds original images. Flow: Users to Photo service: Upload a 2 MB image. Photo service to Object storage: Store the image."
  caption: Upload bytes cross the network before the service stores them.
  src: diagrams/napkin-math/4.svg
```

At **2 MB per upload**:

- **Average:** 11.6 uploads/s × 2 MB ≈ **23 MB/s**, or **185 Mb/s**.
- **3× peak:** About **69 MB/s**, before protocol overhead.

> **Warning.** Capital **B** means bytes. Lowercase **b** means bits. One byte has **8 bits**.

### Example state

| Item | State |
| --- | --- |
| Input | **2 MB/upload** |
| Estimate | **≈23 MB/s average** |
| Decision | **Size network and storage** |

## Calculate storage and replication

```step
diagram:
  type: svg
  alt: "Users (context): Upload and view photos. Photo service (in focus): Handles reads and uploads. Object storage (in focus): Holds original images. Replicas (added) (in focus): Additional copies. About 6 TB/day in all copies. Flow: Photo service to Object storage: Store 2 TB/day. Object storage to Replicas: Write two copies."
  caption: The logical image is stored and replicated; copies increase physical capacity.
  src: diagrams/napkin-math/5.svg
```

Each day brings **1 million uploads × 2 MB = 2 TB** of logical data.

| Copies | Capacity for 365 days |
| --- | --- |
| One | **730 TB** |
| Three | **2,190 TB**, or **2.19 PB** |

This estimate excludes backups, indexes, other image sizes, and storage overhead. Count backups separately from replicas.

### Example state

| Item | State |
| --- | --- |
| Input | **1M uploads/day · 2 MB** |
| Estimate | **2 TB/day logical** |
| Decision | **3 copies ≈ 6 TB/day** |

## Estimate outgoing traffic and caching

```step
diagram:
  type: svg
  alt: "Users (in focus): Upload and view photos. Photo service (context): Handles reads and uploads. Object storage (in focus): Holds original images. Replicas (context): Additional copies. Cache (added) (in focus): Serves repeated views. 90% byte hit rate. Flow: Users to Cache: Request a photo. Cache to Object storage: Fetch on miss. Object storage to Cache: Return original. Cache to Users: Serve the photo."
  caption: The cache serves hits; misses still read from origin storage.
  src: diagrams/napkin-math/6.svg
```

Clients read **20 million photos/day × 2 MB = 40 TB/day**.

If caches serve **90% of the bytes**, the origin serves **4 TB/day**.

> **Note.** The byte hit rate can differ from the request hit rate. A few large misses can account for most of the bytes.

### Example state

| Item | State |
| --- | --- |
| Input | **20M reads/day · 2 MB** |
| Estimate | **40 TB/day delivered** |
| Decision | **90% hit → 4 TB origin** |

## Test a capacity choice

```step
diagram:
  type: svg
  alt: "Users (in focus): Upload and view photos. Photo service (in focus): Handles reads and uploads. Four serving + one spare. Object storage (context): Holds original images. Replicas (context): Additional copies. Cache (context): Serves repeated views. Load balancer (added) (in focus): Distributes requests. Flow: Users to Load balancer: Send peak reads. Load balancer to Photo service: Route to replicas."
  caption: The load balancer distributes requests among service replicas.
  src: diagrams/napkin-math/7.svg
```

Assume one replica can serve **200 reads/s** at the target latency.

1. Divide peak load by capacity. **694 ÷ 200 = 3.47**.
2. Round up to **4 replicas**.
3. Use **5 replicas** to keep four serving if one fails.

> **Check.** Verify latency under concurrent load. Test uneven routing and downstream failures.

### Example state

| Item | State |
| --- | --- |
| Input | **694 peak reads/s** |
| Estimate | **200 reads/s per replica** |
| Decision | **5 replicas with one spare** |

## Recap: a repeatable method

```step
diagram:
  type: svg
  alt: "Users (in focus): Upload and view photos. Photo service (in focus): Handles reads and uploads. Verify peak capacity. Object storage (in focus): Holds original images. 730 TB/year logical. Replicas (in focus): Additional copies. Cache (in focus): Serves repeated views. Load balancer (in focus): Distributes requests. Flow: Users to Load balancer: Send reads. Load balancer to Photo service: Distribute requests. Photo service to Cache: Read from cache. Cache to Object storage: Fetch on miss. Object storage to Replicas: Replicate uploads."
  caption: The estimates inform capacity for the service, cache, network, and storage.
  src: diagrams/napkin-math/8.svg
```

| Quantity | Estimate and implication |
| --- | --- |
| Average reads | **231/s** from 20M reads/day. |
| Peak reads | **694/s** at 3×. Add headroom. |
| Logical storage | **730 TB/year**. Add copies and overhead. |
| Origin traffic | **4 TB/day** when caches serve 90% of bytes. |

Write down units and assumptions before sizing. Compare the estimates with measured load.

### Example state

| Item | State |
| --- | --- |
| Input | **Assumptions stated** |
| Estimate | **694 peak reads/s · 730 TB/year** |
| Decision | **Measure and revise** |
