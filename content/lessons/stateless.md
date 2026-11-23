---
title: Stateless Services
summary: Make requests portable across service instances.
data:
  original: true
  nodes: [["Client","Browser or app"],["Service replicas","Interchangeable instances"],["Shared store","Sessions and durable data"]]
  statusLabels: ["Next request","Session data","Replacement"]
---

## Keep requests independent

```step
data:
  active: [0,1]
  links: [[0,1,"Send session ID"]]
  callouts: [[1,"Any healthy instance"]]
  status: ["Any healthy instance","Outside the instance","Independent"]
  visualNote: "A second request can go to a different server from the first."
```

Send a **session ID** or a **signed token** with every request.

A healthy replica can handle the request without relying on an earlier request to the same process.

## Move shared state

```step
data:
  active: [1,2]
  links: [[1,2,"Read session by ID"]]
  callouts: [[2,"Set session expiry"]]
  status: ["Any healthy instance","Shared store","Store stays in place"]
  visualNote: "Expire shared session records when the application no longer needs them."
```

Some sessions need shared data that can change. Store it outside the service replicas.

- Set an **expiry** for session records.
- Give access only to the services that need it.

## Scale and replace

```step
data:
  active: [0,1,2]
  links: [[0,1,"Send next request"],[1,2,"Load shared session"]]
  callouts: [[1,"Replace a replica"]]
  status: ["New replica eligible","Shared store","Replace a replica"]
  visualNote: "Adding service replicas can increase load on the shared store."
```

Restart one replica during a series of requests. Send the next request to another healthy replica.

> **Watch for a bottleneck.** More service replicas can put more load on the shared store.
