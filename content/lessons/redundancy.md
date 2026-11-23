---
title: Redundancy & Failover
summary: Reduce the effect of component failures.
data:
  original: true
  nodes: [["Traffic","Incoming requests"],["Active","Serving in zone A"],["Standby","Ready in zone B"]]
  layout: [[0,0.5],[1,0],[2,0.5]]
  statusLabels: ["Serving path","Standby state","Recovery check"]
---

## Remove single points

```step
data:
  active: [0,1,2]
  links: [[0,1,"Serve requests"],[1,2,"Replicate state"]]
  callouts: [[2,"Separate failure domain"]]
  status: ["Primary","Ready in another zone","Independent failures"]
  visualNote: "Place the standby where a failure of the primary is less likely to affect it."
```

Put the standby in a **separate zone**. Replicate the state it needs.

> **Warning.** Shared dependencies can still stop both copies. Check shared networks, services, and control systems.

## Detect and fail over

```step
data:
  active: [0,1,2]
  links: [[0,2,"Route to standby"]]
  callouts: [[1,"Stop routing to zone A"],[2,"Promote in zone B"]]
  status: ["Standby after switch","Takes over","Detect and reroute"]
  visualNote: "Separate failure detection time from the time it takes to route requests again."
```

1. Detect the failure with health checks.
2. Stop the old active instance from taking work.
3. Send requests to the standby.

Measure how long the change takes.

## Test recovery

```step
data:
  active: [0,2]
  links: [[0,2,"Check recovery"]]
  callouts: [[2,"Measure time and data loss"]]
  status: ["Test traffic","Exercise the switch","Measure recovery time"]
  visualNote: "Run a failover exercise with a workload that resembles normal traffic."
```

During a failover drill, measure:

- **Recovery time:** How long before requests work again?
- **Data loss:** Which writes survived?

Compare both results with the recovery objectives.
