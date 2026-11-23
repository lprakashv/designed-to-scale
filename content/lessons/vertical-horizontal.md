---
title: Vertical vs Horizontal
summary: Choose between a larger machine and more machines.
data:
  original: true
  nodes: [["Traffic","Incoming requests"],["Server A","First instance"],["Server B","Second instance"]]
  layout: [[0,0.5],[1,0],[1,1]]
  statusLabels: ["Server capacity","Server count","Routing"]
---

## Scale up

```step
data:
  active: [0,1]
  links: [[0,1,"Send all requests"]]
  callouts: [[1,"4 → 8 vCPUs"]]
  status: ["More per server","1","One destination"]
  visualNote: "Add capacity to the existing server when the workload benefits from a larger machine."
```

**Scale up** by giving one machine more resources. The report service uses all **4 vCPUs** on Server A.

Give Server A **8 vCPUs**. Measure the report time again.

> **Note.** A report that uses one thread may gain little from more cores.

## Scale out

```step
data:
  active: [0,1,2]
  links: [[0,1,"Route first share"],[0,2,"Route second share"]]
  callouts: [[2,"Add a second instance"]]
  status: ["Capacity per server unchanged","2","Split traffic"]
  visualNote: "Both instances need to be able to process the requests sent to them."
```

**Scale out** by adding machines. Run **two 4-vCPU instances** and split independent reports between them.

Each instance must be able to run the reports it receives.

## Choose for the bottleneck

```step
data:
  active: [1,2]
  callouts: [[1,"Can A carry peak load alone?"],[2,"Test loss of one instance"]]
  status: ["Find the limit","Workload dependent","Check failure capacity"]
  visualNote: "Compare the cost and recovery impact before you choose how to scale."
```

Test both options at peak load. Repeat with one instance unavailable.

- Measure **CPU** and **memory** use.
- Check whether the **database** limits throughput.
- Compare how long it takes to add capacity and recover from failure.
