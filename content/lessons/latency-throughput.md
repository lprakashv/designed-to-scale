---
title: Latency & Throughput
summary: Use latency, throughput, and concurrency to find and relieve bottlenecks.
data:
  original: true
  nodes: [["Clients","Send and time requests"],["Service","Processes requests"],["Database","Reads the source records"],["Queue","Holds waiting work"],["Cache","Serves repeated reads"]]
  layout: [[0,0],[1,0],[2,0],[2,1],[1,1]]
  statusLabels: [Load, Latency, Throughput]
---

## Measure a request

```step
data:
  active: [0,1,2]
  links: [[0,1,"Send one request"],[1,2,"Read source record"],[2,1,"Return after 70 ms"],[1,0,"Reply after 120 ms"]]
  callouts: [[1,"30 ms processing"]]
  status: ["One request","120 ms example","One completion"]
  visualNote: "Latency spans the time from request start until the client receives the response."
```

**Latency** is the elapsed time for one operation. Assume these steps run in order:

| Work | Time |
| --- | --- |
| Network travel | 20 ms |
| Service processing | 30 ms |
| Database call | 70 ms |
| **Total** | **120 ms** |

> **Note.** When branches run in parallel, add the longest branch to the work they share.

## Count completed work

```step
data:
  active: [0,1]
  links: [[0,1,"Parallel requests"],[1,0,"6,000 completions"]]
  callouts: [[0,"Count over 60 seconds"]]
  status: ["6,000 completions/min","Varies per request","100 requests/s"]
  visualNote: "Throughput counts completed operations in a time interval."
```

**Throughput** is completed work per unit of time.

**6,000 completions ÷ 60 seconds = 100 requests/s.**

Requests can run at the same time even when each takes a long time. Count failures separately. When the queue grows, arrivals outpace completions.

## Read the tail

```step
data:
  active: [0,1]
  links: [[0,1,"Send 100 requests"],[1,0,"Collect timings"]]
  callouts: [[0,"p95 is about 120 ms"]]
  status: ["100 requests","p95 = 120 ms","Measure the tail"]
  visualNote: "The percentile describes a distribution, not the duration of every request."
```

A **p95 of 120 ms** means roughly 95% of requests finished within 120 ms. The result depends on the percentile method. The slowest requests can take much longer.

Record the workload and time window. Report **p99** and errors as well as the mean.

> **Warning.** Combine samples or histogram buckets across instances. Averaging each instance's percentile generally gives the wrong result.

## Relate latency and concurrency

```step
data:
  active: [0,1]
  links: [[0,1,"Send concurrently"],[1,0,"Complete 100/s"]]
  callouts: [[1,"12 requests in flight on average"]]
  status: ["100 requests/s","0.12 s average","12 requests in flight"]
  visualNote: "Requests overlap while the system processes them."
```

In a stable system:

**Average requests in flight = throughput × average latency.**

At **100 completions/s** and **0.12 s** average latency, about **12 requests** are in flight.

> **Note.** Use the same system boundary and time units. This average does not predict the worst burst.

## Find the queue

```step
data:
  active: [0,1,2,3]
  links: [[0,1,"Arrival: 120/s"],[1,3,"Queue work"],[3,2,"Drain: 100/s"]]
  callouts: [[3,"Backlog grows by 20/s"]]
  status: ["Arrival exceeds capacity","Tail latency rises","Backlog grows"]
  visualNote: "Work waits in the queue when the database completes requests more slowly than they arrive."
```

The system receives **120 requests/s**. The database finishes **100/s**.

If all requests stay in the queue, the backlog grows by **20 requests/s**. That is **1,200** more requests after one minute.

Measure queue depth and wait time. Longer timeouts do not increase database capacity.

## Change the bottleneck

```step
data:
  active: [0,1,2,4]
  links: [[0,1,"Arrive: 120 reads/s"],[1,4,"Look up cache"],[1,2,"Read on a miss"]]
  callouts: [[4,"Assume 50% hit rate"],[2,"60 reads/s on misses"]]
  status: ["120 requests/s","Measure after change","60 database reads/s"]
  visualNote: "With the assumed hit rate, half of the requests avoid a database read."
```

Assume a cache serves **50% of 120 reads/s**. Only **60 reads/s** reach the database. Its assumed capacity is **100/s**.

Measure p95, p99, cache hit rate, and database saturation after the change.

> **Warning.** A cold cache or a burst of misses can overload the database. If writes are the bottleneck, a read cache may help little.

## Recap: interpret the numbers

```step
data:
  active: [0,1,2,3,4]
  links: [[0,1,"Measure arrivals"],[1,4,"Measure hit rate"],[1,2,"Measure store reads"],[1,0,"Count completions"],[1,3,"Observe backlog"]]
  callouts: [[0,"Record p95 and p99"],[3,"Watch for backlog under load"]]
  status: ["Compare arrival and completion","Track percentiles","Verify under load"]
  visualNote: "Measure each component and the end-to-end path to locate waiting and saturation."
```

| Measure | Example and use |
| --- | --- |
| Latency | **120 ms** for one request. Find where it spends time. |
| Throughput | **6,000/min = 100/s**. Count completed requests. |
| Concurrency | **100/s × 0.12 s = 12** in flight on average. |
| Backlog | **120/s − 100/s = 20/s** more queued. |
| Cache | **120/s × 50% misses = 60/s** store reads. |

> **Check.** State the workload and time window. Test under realistic load and check the tail, even if average latency improves.
