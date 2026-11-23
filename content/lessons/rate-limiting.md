---
title: Rate Limiting
summary: Protect finite capacity by controlling request rates.
data:
  original: true
---

## Set a limit

```step
diagram:
  type: svg
  alt: "Clients (in focus): Requests by identity. Limiter (in focus): Budget decision. Key the limit by user. Service (in focus): Protected endpoint. Flow: Clients to Limiter: Check user budget. Limiter to Service: Forward request."
  caption: Set the scope based on the resource to protect. A per-user limit and a service-wide limit protect different resources.
  src: diagrams/rate-limiting/1.svg
```

Choose how many reports each user can request. Use an **authenticated user ID** when available.

Set the rate to a level the service can handle.

### Example state

| Item | State |
| --- | --- |
| Scope | Per caller |
| Decision | Check allowance |
| Client signal | Permit within limit |

## Choose an algorithm

```step
diagram:
  type: svg
  alt: "Clients (in focus): Requests by identity. Limiter (in focus): Budget decision. Refill at 2 tokens per second. Service (context): Protected endpoint. Flow: Clients to Limiter: Burst requests."
  caption: A token bucket can allow a short burst when tokens have accumulated.
  src: diagrams/rate-limiting/2.svg
```

A bucket holds **10 tokens** and adds **2 tokens per second**. Each accepted request uses one token.

An idle user with a full bucket can send **10 requests** at once.

### Example state

| Item | State |
| --- | --- |
| Scope | **Bucket or window** |
| Decision | **Allow or reject** |
| Client signal | **Bursts depend on policy** |

## Return useful feedback

```step
diagram:
  type: svg
  alt: "Clients (in focus): Requests by identity. Limiter (in focus): Budget decision. Service receives no request. Service (context): Protected endpoint. Flow: Clients to Limiter: Send over limit. Limiter to Clients: 429 + Retry-After."
  caption: Return retry guidance when the service knows when the caller can try again.
  src: diagrams/rate-limiting/3.svg
```

Return **HTTP 429** when the budget runs out. Include retry guidance when you can calculate it.

> **Decision.** If several limiters share a budget, decide how they behave when the budget store is unavailable.

### Example state

| Item | State |
| --- | --- |
| Scope | **Caller over limit** |
| Decision | **Reject** |
| Client signal | **HTTP 429** |
