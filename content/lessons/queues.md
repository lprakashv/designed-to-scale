---
original: true
title: Message Queues
summary: Decouple work from the request path.
nodes: [["Producer","Submits jobs"],["Queue","Buffers work"],["Worker","Processes jobs"],["Dead-letter queue","Holds failed jobs"]]
layout: [[0,0],[1,0],[2,0],[1,1]]
statusLabels: ["Work state","Worker action","Failure path"]
---

## Enqueue work

```step
active: [0,1,2]
links: [[0,1,"Enqueue email job"],[1,2,"Deliver when ready"]]
callouts: [[1,"Absorb a burst"]]
status: ["Queued","Claim available jobs","Delay during a burst"]
visualNote: "Track the oldest queued job to see when workers fall behind."
```

The order API places a confirmation email job on a **queue**. It can respond before a worker sends the email.

Measure how long jobs wait during a burst.

## Process reliably

```step
active: [1,2]
links: [[1,2,"Deliver or retry"],[2,1,"Acknowledge job"]]
callouts: [[2,"Deduplicate by job ID"]]
status: ["In progress","Acknowledge after success","Possible redelivery"]
visualNote: "Make the job safe to run again if the worker finishes but loses its acknowledgment."
```

**Acknowledge** a job after you record success.

> **Warning.** A lost acknowledgment can cause redelivery. Use a stable job ID and make the email operation safe to retry.

## Handle failures

```step
active: [1,2,3]
links: [[1,2,"Retry the job"],[2,1,"Report failure"],[1,3,"Move after retries"]]
callouts: [[3,"Keep error details"]]
status: ["Retried","Back off","Dead-letter after limit"]
visualNote: "Keep enough context to investigate a failed job before you replay it."
```

- Retry temporary failures with a **limit**.
- Move jobs that exceed the limit to a **dead-letter queue**.
- Inspect or replay these jobs with safeguards against duplicate effects.
