---
title: Service Discovery
summary: Find healthy service instances as they change.
data:
  original: true
---

## Register instances

```step
diagram:
  type: svg
  alt: "Registry (in focus): Current endpoint list. Expire stale entries. Instances (in focus): Available service endpoints. Flow: Instances to Registry: Register endpoint."
  caption: Remove instances that can no longer serve traffic.
  src: diagrams/service-discovery/1.svg
```

An instance registers its address when it starts.

The **registry** removes the entry when the instance stops or fails health checks.

### Example state

| Item | State |
| --- | --- |
| Registry | Instances register |
| Caller view | Addresses become known |
| Risk | Stale entries |

## Resolve a destination

```step
diagram:
  type: svg
  alt: "Caller (added) (in focus): Service or proxy. Pick an available endpoint. Registry (in focus): Current endpoint list. Instances (in focus): Available service endpoints. Flow: Caller to Registry: Find payment API. Registry to Caller: Healthy endpoints. Caller to Instances: Call instance."
  caption: The caller or proxy selects a healthy endpoint from the available addresses.
  src: diagrams/service-discovery/2.svg
```

1. Look up the service name.
2. Select one listed endpoint.
3. Send the request.

### Example state

| Item | State |
| --- | --- |
| Registry | **Lookup** |
| Caller view | **Select a listed address** |
| Risk | **Endpoint can change** |

## Handle stale results

```step
diagram:
  type: svg
  alt: "Caller (in focus): Service or proxy. Retry within the deadline. Registry (in focus): Current endpoint list. Instances (context): Available service endpoints. Flow: Caller to Registry: Refresh on failure. Registry to Caller: Return endpoints."
  caption: Refresh the list when a selected endpoint no longer accepts connections.
  src: diagrams/service-discovery/3.svg
```

A cached address can point to an instance that is gone. Refresh the list when the entry is stale.

Retry only when the operation is safe to repeat and the deadline leaves enough time.

### Example state

| Item | State |
| --- | --- |
| Registry | **Cached lookup** |
| Caller view | **Entry may be stale** |
| Risk | **Retry with fresh data** |
