---
title: Timeouts & Retries
summary: Bound waiting and avoid amplifying failures.
data:
  original: true
  nodes: [["Caller","Client or upstream service"],["Service","Handles requests"],["Dependency","Downstream operation"]]
  statusLabels: ["Request budget","Attempt","Safety check"]
---

## Set a deadline

```step
data:
  active: [0,1,2]
  links: [[0,1,"800 ms deadline"],[1,2,"500 ms budget"]]
  callouts: [[1,"Reserve time for the response"]]
  status: ["Overall deadline","First attempt","Bound the wait"]
  visualNote: "Give downstream calls enough time to finish within the caller’s remaining deadline."
```

Give the full request a deadline of **800 ms**.

Allow up to **500 ms** for the downstream call. Keep **300 ms** for other work and the response.

## Retry carefully

```step
data:
  active: [0,1]
  links: [[0,1,"Retry if time left"]]
  callouts: [[0,"Back off with jitter"]]
  status: ["Remaining time","Backoff with jitter","Bounded retries"]
  visualNote: "Retry short-lived failures only while enough time remains for another attempt."
```

Retry only a suitable failure and only while time remains. Use backoff and jitter to spread retries over time.

> **Warning.** A timeout can occur after the server has completed the write.

## Prevent duplicate effects

```step
data:
  active: [0,1,2]
  links: [[0,1,"Reuse write key"],[1,2,"Apply once"]]
  callouts: [[1,"Keep the prior result"]]
  status: ["Shared deadline","Possible duplicate","Check idempotency key"]
  visualNote: "A timeout leaves the outcome uncertain. A stable key can let the server recognize another attempt at the same operation."
```

Reuse the **same idempotency key** for retries of a write.

- Store the result with the effect when possible.
- Reject the same key if the new payload differs.
