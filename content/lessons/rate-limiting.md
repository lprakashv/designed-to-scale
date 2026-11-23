---
title: Rate Limiting
summary: Protect finite capacity by controlling request rates.
data:
  original: true
  nodes: [["Clients","Requests by identity"],["Limiter","Budget decision"],["Service","Protected endpoint"]]
  statusLabels: ["Scope","Decision","Client signal"]
---

## Set a limit

```step
data:
  active: [0,1,2]
  links: [[0,1,"Check user budget"],[1,2,"Forward request"]]
  callouts: [[1,"Key the limit by user"]]
  status: ["Per caller","Check allowance","Permit within limit"]
  visualNote: "Set the scope based on the resource to protect. A per-user limit and a service-wide limit protect different resources."
```

Choose how many reports each user can request. Use an **authenticated user ID** when available.

Set the rate to a level the service can handle.

## Choose an algorithm

```step
data:
  active: [0,1]
  links: [[0,1,"Burst requests"]]
  callouts: [[1,"Refill at 2 tokens per second"]]
  status: ["Bucket or window","Allow or reject","Bursts depend on policy"]
  visualNote: "A token bucket can allow a short burst when tokens have accumulated."
```

A bucket holds **10 tokens** and adds **2 tokens per second**. Each accepted request uses one token.

An idle user with a full bucket can send **10 requests** at once.

## Return useful feedback

```step
data:
  active: [0,1]
  links: [[0,1,"Send over limit"],[1,0,"429 + Retry-After"]]
  callouts: [[1,"Service receives no request"]]
  status: ["Caller over limit","Reject","HTTP 429"]
  visualNote: "Return retry guidance when the service knows when the caller can try again."
```

Return **HTTP 429** when the budget runs out. Include retry guidance when you can calculate it.

> **Decision.** If several limiters share a budget, decide how they behave when the budget store is unavailable.
