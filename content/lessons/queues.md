---
title: Message Queues
summary: Decouple work from the request path.
data:
  original: true
---

## Enqueue work

```step
diagram:
  type: svg
  alt: "Producer (in focus): Submits jobs. Queue (in focus): Buffers work. Absorb a burst. Worker (in focus): Processes jobs. Flow: Producer to Queue: Enqueue email job. Queue to Worker: Deliver when ready."
  caption: Track the oldest queued job to see when workers fall behind.
  src: diagrams/queues/1.svg
```

The order API places a confirmation email job on a **queue**. It can respond before a worker sends the email.

Measure how long jobs wait during a burst.

### Example state

| Item | State |
| --- | --- |
| Work state | Queued |
| Worker action | Claim available jobs |
| Failure path | Delay during a burst |

## Process reliably

```step
diagram:
  type: svg
  alt: "Producer (context): Submits jobs. Queue (in focus): Buffers work. Worker (in focus): Processes jobs. Deduplicate by job ID. Flow: Queue to Worker: Deliver or retry. Worker to Queue: Acknowledge job."
  caption: Make the job safe to run again if the worker finishes but loses its acknowledgment.
  src: diagrams/queues/2.svg
```

**Acknowledge** a job after you record success.

> **Warning.** A lost acknowledgment can cause redelivery. Use a stable job ID and make the email operation safe to retry.

### Example state

| Item | State |
| --- | --- |
| Work state | **In progress** |
| Worker action | **Acknowledge after success** |
| Failure path | **Possible redelivery** |

## Handle failures

```step
diagram:
  type: svg
  alt: "Producer (context): Submits jobs. Queue (in focus): Buffers work. Worker (in focus): Processes jobs. Dead-letter queue (added) (in focus): Holds failed jobs. Keep error details. Flow: Queue to Worker: Retry the job. Worker to Queue: Report failure. Queue to Dead-letter queue: Move after retries."
  caption: Keep enough context to investigate a failed job before you replay it.
  src: diagrams/queues/3.svg
```

- Retry temporary failures with a **limit**.
- Move jobs that exceed the limit to a **dead-letter queue**.
- Inspect or replay these jobs with safeguards against duplicate effects.

### Example state

| Item | State |
| --- | --- |
| Work state | **Retried** |
| Worker action | **Back off** |
| Failure path | **Dead-letter after limit** |
