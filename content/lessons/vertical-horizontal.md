---
title: Vertical vs Horizontal
summary: Choose between a larger machine and more machines.
data:
  original: true
---

## Scale up

```step
diagram:
  type: svg
  alt: "Traffic (in focus): Incoming requests. Server A (in focus): First instance. 4 → 8 vCPUs. Flow: Traffic to Server A: Send all requests."
  caption: Add capacity to the existing server when the workload benefits from a larger machine.
  src: diagrams/vertical-horizontal/1.svg
```

**Scale up** by giving one machine more resources. The report service uses all **4 vCPUs** on Server A.

Give Server A **8 vCPUs**. Measure the report time again.

> **Note.** A report that uses one thread may gain little from more cores.

### Example state

| Item | State |
| --- | --- |
| Server capacity | More per server |
| Server count | 1 |
| Routing | One destination |

## Scale out

```step
diagram:
  type: svg
  alt: "Traffic (in focus): Incoming requests. Server A (in focus): First instance. Server B (added) (in focus): Second instance. Add a second instance. Flow: Traffic to Server A: Route first share. Traffic to Server B: Route second share."
  caption: Both instances need to be able to process the requests sent to them.
  src: diagrams/vertical-horizontal/2.svg
```

**Scale out** by adding machines. Run **two 4-vCPU instances** and split independent reports between them.

Each instance must be able to run the reports it receives.

### Example state

| Item | State |
| --- | --- |
| Server capacity | **Capacity per server unchanged** |
| Server count | **2** |
| Routing | **Split traffic** |

## Choose for the bottleneck

```step
diagram:
  type: svg
  alt: "Traffic (context): Incoming requests. Server A (in focus): First instance. Can A carry peak load alone?. Server B (in focus): Second instance. Test loss of one instance."
  caption: Compare the cost and recovery impact before you choose how to scale.
  src: diagrams/vertical-horizontal/3.svg
```

Test both options at peak load. Repeat with one instance unavailable.

- Measure **CPU** and **memory** use.
- Check whether the **database** limits throughput.
- Compare how long it takes to add capacity and recover from failure.

### Example state

| Item | State |
| --- | --- |
| Server capacity | **Find the limit** |
| Server count | **Workload dependent** |
| Routing | **Check failure capacity** |
