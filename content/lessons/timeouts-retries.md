---
title: Timeouts & Retries
summary: Bound waiting and avoid amplifying failures.
data:
  original: true
---

## Set a deadline

```step
diagram:
  type: svg
  alt: "Caller (in focus): Client or upstream service. Service (in focus): Handles requests. Reserve time for the response. Dependency (in focus): Downstream operation. Flow: Caller to Service: 800 ms deadline. Service to Dependency: 500 ms budget."
  caption: Give downstream calls enough time to finish within the caller’s remaining deadline.
  src: diagrams/timeouts-retries/1.svg
```

Give the full request a deadline of **800 ms**.

Allow up to **500 ms** for the downstream call. Keep **300 ms** for other work and the response.

### Example state

| Item | State |
| --- | --- |
| Request budget | Overall deadline |
| Attempt | First attempt |
| Safety check | Bound the wait |

## Retry carefully

```step
diagram:
  type: svg
  alt: "Caller (in focus): Client or upstream service. Back off with jitter. Service (in focus): Handles requests. Dependency (context): Downstream operation. Flow: Caller to Service: Retry if time left."
  caption: Retry short-lived failures only while enough time remains for another attempt.
  src: diagrams/timeouts-retries/2.svg
```

Retry only a suitable failure and only while time remains. Use backoff and jitter to spread retries over time.

> **Warning.** A timeout can occur after the server has completed the write.

### Example state

| Item | State |
| --- | --- |
| Request budget | **Remaining time** |
| Attempt | **Backoff with jitter** |
| Safety check | **Bounded retries** |

## Prevent duplicate effects

```step
diagram:
  type: svg
  alt: "Caller (in focus): Client or upstream service. Service (in focus): Handles requests. Keep the prior result. Dependency (in focus): Downstream operation. Flow: Caller to Service: Reuse write key. Service to Dependency: Apply once."
  caption: A timeout leaves the outcome uncertain. A stable key can let the server recognize another attempt at the same operation.
  src: diagrams/timeouts-retries/3.svg
```

Reuse the **same idempotency key** for retries of a write.

- Store the result with the effect when possible.
- Reject the same key if the new payload differs.

### Example state

| Item | State |
| --- | --- |
| Request budget | **Shared deadline** |
| Attempt | **Possible duplicate** |
| Safety check | **Check idempotency key** |
