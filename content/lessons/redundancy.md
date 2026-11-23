---
title: Redundancy & Failover
summary: Reduce the effect of component failures.
data:
  original: true
---

## Remove single points

```step
diagram:
  type: svg
  alt: "Traffic (in focus): Incoming requests. Active (in focus): Serving in zone A. Standby (in focus): Ready in zone B. Separate failure domain. Flow: Traffic to Active: Serve requests. Active to Standby: Replicate state."
  caption: Place the standby where a failure of the primary is less likely to affect it.
  src: diagrams/redundancy/1.svg
```

Put the standby in a **separate zone**. Replicate the state it needs.

> **Warning.** Shared dependencies can still stop both copies. Check shared networks, services, and control systems.

### Example state

| Item | State |
| --- | --- |
| Serving path | Primary |
| Standby state | Ready in another zone |
| Recovery check | Independent failures |

## Detect and fail over

```step
diagram:
  type: svg
  alt: "Traffic (in focus): Incoming requests. Active (in focus): Serving in zone A. Stop routing to zone A. Standby (in focus): Ready in zone B. Promote in zone B. Flow: Traffic to Standby: Route to standby."
  caption: Separate failure detection time from the time it takes to route requests again.
  src: diagrams/redundancy/2.svg
```

1. Detect the failure with health checks.
2. Stop the old active instance from taking work.
3. Send requests to the standby.

Measure how long the change takes.

### Example state

| Item | State |
| --- | --- |
| Serving path | **Standby after switch** |
| Standby state | **Takes over** |
| Recovery check | **Detect and reroute** |

## Test recovery

```step
diagram:
  type: svg
  alt: "Traffic (in focus): Incoming requests. Active (context): Serving in zone A. Standby (in focus): Ready in zone B. Measure time and data loss. Flow: Traffic to Standby: Check recovery."
  caption: Run a failover exercise with a workload that resembles normal traffic.
  src: diagrams/redundancy/3.svg
```

During a failover drill, measure:

- **Recovery time:** How long before requests work again?
- **Data loss:** Which writes survived?

Compare both results with the recovery objectives.

### Example state

| Item | State |
| --- | --- |
| Serving path | **Test traffic** |
| Standby state | **Exercise the switch** |
| Recovery check | **Measure recovery time** |
