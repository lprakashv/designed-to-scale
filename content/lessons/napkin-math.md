---
original: true
title: Napkin Math
summary: Turn explicit workload assumptions into traffic, bandwidth, and storage estimates.
nodes: [["Users","Upload and view photos"],["Photo service","Handles reads and uploads"],["Object storage","Holds original images"],["Replicas","Additional copies"],["Cache","Serves repeated views"],["Load balancer","Distributes requests"]]
layout: [[0,0],[1,0],[2,0],[2,1],[1,1],[0,1]]
statusLabels: [Input, Estimate, Decision]
---

## Define the example

```step
active: [0,1]
links: [[0,1,"View or upload"]]
callouts: [[0,"Assume 1M daily users"]]
status: ["1M daily users","Estimate next","State assumptions"]
visualNote: "Users produce requests; the service must handle both normal and peak traffic."
```

Assume a photo service has **1 million daily active users**. Each person:

- Views **20 photos** per day
- Uploads **one photo** per day

> **Units.** This example uses decimal sizes. **1 MB = 1,000,000 bytes**. **1 TB = 1,000 GB**.

## Convert daily traffic to a rate

```step
active: [0,1]
links: [[0,1,"20M reads/day"]]
callouts: [[1,"231 reads/s on average"]]
status: ["20 reads/user/day","≈231 reads/s average","Separate reads and writes"]
visualNote: "Divide daily requests by the number of seconds in a day."
```

There are **86,400 seconds** in a day.

| Operation | Average rate |
| --- | --- |
| Read | 20 million/day ÷ 86,400 ≈ **231/s** |
| Upload | 1 million/day ÷ 86,400 ≈ **11.6/s** |

Keep these rates separate. Reads and uploads can use different resources.

## Allow for peak load

```step
active: [0,1]
links: [[0,1,"Model the 3× peak"]]
callouts: [[1,"694 peak reads/s"]]
status: ["Assume 3× peak","≈694 reads/s peak","Reserve headroom"]
visualNote: "A peak multiplier raises the capacity target above the daily average."
```

Assume peak traffic is **3×** the daily average.

- **Reads:** 231.5 × 3 ≈ **694/s**
- **Uploads:** 11.6 × 3 ≈ **35/s**

> **Assumption.** Events, regions, and retries can change the peak. Use measured traffic when available.

## Calculate ingress bandwidth

```step
active: [0,1,2]
links: [[0,1,"Upload a 2 MB image"],[1,2,"Store the image"]]
callouts: [[1,"23 MB/s average ingress"]]
status: ["2 MB/upload","≈23 MB/s average","Size network and storage"]
visualNote: "Upload bytes cross the network before the service stores them."
```

At **2 MB per upload**:

- **Average:** 11.6 uploads/s × 2 MB ≈ **23 MB/s**, or **185 Mb/s**.
- **3× peak:** About **69 MB/s**, before protocol overhead.

> **Warning.** Capital **B** means bytes. Lowercase **b** means bits. One byte has **8 bits**.

## Calculate storage and replication

```step
active: [1,2,3]
links: [[1,2,"Store 2 TB/day"],[2,3,"Write two copies"]]
callouts: [[3,"About 6 TB/day in all copies"]]
status: ["1M uploads/day · 2 MB","2 TB/day logical","3 copies ≈ 6 TB/day"]
visualNote: "The logical image is stored and replicated; copies increase physical capacity."
```

Each day brings **1 million uploads × 2 MB = 2 TB** of logical data.

| Copies | Capacity for 365 days |
| --- | --- |
| One | **730 TB** |
| Three | **2,190 TB**, or **2.19 PB** |

This estimate excludes backups, indexes, other image sizes, and storage overhead. Count backups separately from replicas.

## Estimate outgoing traffic and caching

```step
active: [0,2,4]
links: [[0,4,"Request a photo"],[4,2,"Fetch on miss"],[2,4,"Return original"],[4,0,"Serve the photo"]]
callouts: [[4,"90% byte hit rate"]]
status: ["20M reads/day · 2 MB","40 TB/day delivered","90% hit → 4 TB origin"]
visualNote: "The cache serves hits; misses still read from origin storage."
```

Clients read **20 million photos/day × 2 MB = 40 TB/day**.

If caches serve **90% of the bytes**, the origin serves **4 TB/day**.

> **Note.** The byte hit rate can differ from the request hit rate. A few large misses can account for most of the bytes.

## Test a capacity choice

```step
active: [0,1,5]
links: [[0,5,"Send peak reads"],[5,1,"Route to replicas"]]
callouts: [[1,"Four serving + one spare"]]
status: ["694 peak reads/s","200 reads/s per replica","5 replicas with one spare"]
visualNote: "The load balancer distributes requests among service replicas."
```

Assume one replica can serve **200 reads/s** at the target latency.

1. Divide peak load by capacity. **694 ÷ 200 = 3.47**.
2. Round up to **4 replicas**.
3. Use **5 replicas** to keep four serving if one fails.

> **Check.** Verify latency under concurrent load. Test uneven routing and downstream failures.

## Recap: a repeatable method

```step
active: [0,1,2,3,4,5]
links: [[0,5,"Send reads"],[5,1,"Distribute requests"],[1,4,"Read from cache"],[4,2,"Fetch on miss"],[2,3,"Replicate uploads"]]
callouts: [[1,"Verify peak capacity"],[2,"730 TB/year logical"]]
status: ["Assumptions stated","694 peak reads/s · 730 TB/year","Measure and revise"]
visualNote: "The estimates inform capacity for the service, cache, network, and storage."
```

| Quantity | Estimate and implication |
| --- | --- |
| Average reads | **231/s** from 20M reads/day. |
| Peak reads | **694/s** at 3×. Add headroom. |
| Logical storage | **730 TB/year**. Add copies and overhead. |
| Origin traffic | **4 TB/day** when caches serve 90% of bytes. |

Write down units and assumptions before sizing. Compare the estimates with measured load.
