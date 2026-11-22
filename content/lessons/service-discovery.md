---
original: true
title: Service Discovery
summary: Find healthy service instances as they change.
nodes: [["Caller","Service or proxy"],["Registry","Current endpoint list"],["Instances","Available service endpoints"]]
layout: [[0,0.5],[1,0],[2,0.5]]
statusLabels: ["Registry","Caller view","Risk"]
---

## Register instances

```step
active: [1,2]
links: [[2,1,"Register endpoint"]]
callouts: [[1,"Expire stale entries"]]
status: ["Instances register","Addresses become known","Stale entries"]
visualNote: "Remove instances that can no longer serve traffic."
```

An instance registers its address when it starts.

The **registry** removes the entry when the instance stops or fails health checks.

## Resolve a destination

```step
active: [0,1,2]
links: [[0,1,"Find payment API"],[1,0,"Healthy endpoints"],[0,2,"Call instance"]]
callouts: [[0,"Pick an available endpoint"]]
status: ["Lookup","Select a listed address","Endpoint can change"]
visualNote: "The caller or proxy selects a healthy endpoint from the available addresses."
```

1. Look up the service name.
2. Select one listed endpoint.
3. Send the request.

## Handle stale results

```step
active: [0,1]
links: [[0,1,"Refresh on failure"],[1,0,"Return endpoints"]]
callouts: [[0,"Retry within the deadline"]]
status: ["Cached lookup","Entry may be stale","Retry with fresh data"]
visualNote: "Refresh the list when a selected endpoint no longer accepts connections."
```

A cached address can point to an instance that is gone. Refresh the list when the entry is stale.

Retry only when the operation is safe to repeat and the deadline leaves enough time.
