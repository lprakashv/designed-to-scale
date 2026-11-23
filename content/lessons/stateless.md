---
title: Stateless Services
summary: Make requests portable across service instances.
data:
  original: true
---

## Keep requests independent

```step
diagram:
  type: svg
  alt: "Client (in focus): Browser or app. Service replicas (in focus): Interchangeable instances. Any healthy instance. Flow: Client to Service replicas: Send session ID."
  caption: A second request can go to a different server from the first.
  src: diagrams/stateless/1.svg
```

Send a **session ID** or a **signed token** with every request.

A healthy replica can handle the request without relying on an earlier request to the same process.

### Example state

| Item | State |
| --- | --- |
| Next request | Any healthy instance |
| Session data | Outside the instance |
| Replacement | Independent |

## Move shared state

```step
diagram:
  type: svg
  alt: "Client (context): Browser or app. Service replicas (in focus): Interchangeable instances. Shared store (added) (in focus): Sessions and durable data. Set session expiry. Flow: Service replicas to Shared store: Read session by ID."
  caption: Expire shared session records when the application no longer needs them.
  src: diagrams/stateless/2.svg
```

Some sessions need shared data that can change. Store it outside the service replicas.

- Set an **expiry** for session records.
- Give access only to the services that need it.

### Example state

| Item | State |
| --- | --- |
| Next request | Any healthy instance |
| Session data | **Shared store** |
| Replacement | **Store stays in place** |

## Scale and replace

```step
diagram:
  type: svg
  alt: "Client (in focus): Browser or app. Service replicas (in focus): Interchangeable instances. Replace a replica. Shared store (in focus): Sessions and durable data. Flow: Client to Service replicas: Send next request. Service replicas to Shared store: Load shared session."
  caption: Adding service replicas can increase load on the shared store.
  src: diagrams/stateless/3.svg
```

Restart one replica during a series of requests. Send the next request to another healthy replica.

> **Watch for a bottleneck.** More service replicas can put more load on the shared store.

### Example state

| Item | State |
| --- | --- |
| Next request | **New replica eligible** |
| Session data | Shared store |
| Replacement | **Replace a replica** |
