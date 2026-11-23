---
title: Latency & Throughput
summary: Use latency, throughput, and concurrency to find and relieve bottlenecks.
data:
  original: true
---

## Measure a request

```step
diagram:
  type: svg
  alt: "Clients (in focus): Send and time requests. Service (in focus): Processes requests. 30 ms processing. Database (in focus): Reads the source records. Flow: Clients to Service: Send one request. Service to Database: Read source record. Database to Service: Return after 70 ms. Service to Clients: Reply after 120 ms."
  caption: Latency spans the time from request start until the client receives the response.
  src: diagrams/latency-throughput/1.svg
```

**Latency** is the elapsed time for one operation. Assume these steps run in order:

| Work | Time |
| --- | --- |
| Network travel | 20 ms |
| Service processing | 30 ms |
| Database call | 70 ms |
| **Total** | **120 ms** |

> **Note.** When branches run in parallel, add the longest branch to the work they share.

### Example state

| Item | State |
| --- | --- |
| Load | One request |
| Latency | 120 ms example |
| Throughput | One completion |

## Count completed work

```step
diagram:
  type: svg
  alt: "Clients (in focus): Send and time requests. Count over 60 seconds. Service (in focus): Processes requests. Database (context): Reads the source records. Flow: Clients to Service: Parallel requests. Service to Clients: 6,000 completions."
  caption: Throughput counts completed operations in a time interval.
  src: diagrams/latency-throughput/2.svg
```

**Throughput** is completed work per unit of time.

**6,000 completions ÷ 60 seconds = 100 requests/s.**

Requests can run at the same time even when each takes a long time. Count failures separately. When the queue grows, arrivals outpace completions.

### Example state

| Item | State |
| --- | --- |
| Load | **6,000 completions/min** |
| Latency | **Varies per request** |
| Throughput | **100 requests/s** |

## Read the tail

```step
diagram:
  type: svg
  alt: "Clients (in focus): Send and time requests. p95 is about 120 ms. Service (in focus): Processes requests. Database (context): Reads the source records. Flow: Clients to Service: Send 100 requests. Service to Clients: Collect timings."
  caption: The percentile describes a distribution, not the duration of every request.
  src: diagrams/latency-throughput/3.svg
```

A **p95 of 120 ms** means roughly 95% of requests finished within 120 ms. The result depends on the percentile method. The slowest requests can take much longer.

Record the workload and time window. Report **p99** and errors as well as the mean.

> **Warning.** Combine samples or histogram buckets across instances. Averaging each instance's percentile generally gives the wrong result.

### Example state

| Item | State |
| --- | --- |
| Load | **100 requests** |
| Latency | **p95 = 120 ms** |
| Throughput | **Measure the tail** |

## Relate latency and concurrency

```step
diagram:
  type: svg
  alt: "Clients (in focus): Send and time requests. Service (in focus): Processes requests. 12 requests in flight on average. Database (context): Reads the source records. Flow: Clients to Service: Send concurrently. Service to Clients: Complete 100/s."
  caption: Requests overlap while the system processes them.
  src: diagrams/latency-throughput/4.svg
```

In a stable system:

**Average requests in flight = throughput × average latency.**

At **100 completions/s** and **0.12 s** average latency, about **12 requests** are in flight.

> **Note.** Use the same system boundary and time units. This average does not predict the worst burst.

### Example state

| Item | State |
| --- | --- |
| Load | **100 requests/s** |
| Latency | **0.12 s average** |
| Throughput | **12 requests in flight** |

## Find the queue

```step
diagram:
  type: svg
  alt: "Clients (in focus): Send and time requests. Service (in focus): Processes requests. Database (in focus): Reads the source records. Queue (added) (in focus): Holds waiting work. Backlog grows by 20/s. Flow: Clients to Service: Arrival: 120/s. Service to Queue: Queue work. Queue to Database: Drain: 100/s."
  caption: Work waits in the queue when the database completes requests more slowly than they arrive.
  src: diagrams/latency-throughput/5.svg
```

The system receives **120 requests/s**. The database finishes **100/s**.

If all requests stay in the queue, the backlog grows by **20 requests/s**. That is **1,200** more requests after one minute.

Measure queue depth and wait time. Longer timeouts do not increase database capacity.

### Example state

| Item | State |
| --- | --- |
| Load | **Arrival exceeds capacity** |
| Latency | **Tail latency rises** |
| Throughput | **Backlog grows** |

## Change the bottleneck

```step
diagram:
  type: svg
  alt: "Clients (in focus): Send and time requests. Service (in focus): Processes requests. Database (in focus): Reads the source records. 60 reads/s on misses. Queue (context): Holds waiting work. Cache (added) (in focus): Serves repeated reads. Assume 50% hit rate. Flow: Clients to Service: Arrive: 120 reads/s. Service to Cache: Look up cache. Service to Database: Read on a miss."
  caption: With the assumed hit rate, half of the requests avoid a database read.
  src: diagrams/latency-throughput/6.svg
```

Assume a cache serves **50% of 120 reads/s**. Only **60 reads/s** reach the database. Its assumed capacity is **100/s**.

Measure p95, p99, cache hit rate, and database saturation after the change.

> **Warning.** A cold cache or a burst of misses can overload the database. If writes are the bottleneck, a read cache may help little.

### Example state

| Item | State |
| --- | --- |
| Load | **120 requests/s** |
| Latency | **Measure after change** |
| Throughput | **60 database reads/s** |

## Recap: interpret the numbers

```step
diagram:
  type: svg
  alt: "Clients (in focus): Send and time requests. Record p95 and p99. Service (in focus): Processes requests. Database (in focus): Reads the source records. Queue (in focus): Holds waiting work. Watch for backlog under load. Cache (in focus): Serves repeated reads. Flow: Clients to Service: Measure arrivals. Service to Cache: Measure hit rate. Service to Database: Measure store reads. Service to Clients: Count completions. Service to Queue: Observe backlog."
  caption: Measure each component and the end-to-end path to locate waiting and saturation.
  src: diagrams/latency-throughput/7.svg
```

| Measure | Example and use |
| --- | --- |
| Latency | **120 ms** for one request. Find where it spends time. |
| Throughput | **6,000/min = 100/s**. Count completed requests. |
| Concurrency | **100/s × 0.12 s = 12** in flight on average. |
| Backlog | **120/s − 100/s = 20/s** more queued. |
| Cache | **120/s × 50% misses = 60/s** store reads. |

> **Check.** State the workload and time window. Test under realistic load and check the tail, even if average latency improves.

### Example state

| Item | State |
| --- | --- |
| Load | **Compare arrival and completion** |
| Latency | **Track percentiles** |
| Throughput | **Verify under load** |
