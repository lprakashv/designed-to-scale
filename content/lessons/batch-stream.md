---
original: true
title: Batch & Stream Processing
summary: Choose how and when to process incoming data.
nodes: [["Events","Input records"],["Processor","Aggregates results"],["Output","Published totals"]]
statusLabels: ["Processing","Input boundary","Result"]
---

## Process in batches

```step
active: [0,1,2]
links: [[0,1,"Read daily files"],[1,2,"Publish daily total"]]
callouts: [[1,"Bounded input by day"]]
status: ["Batch","Bounded input","Scheduled output"]
visualNote: "Choose a batch when the result can wait until the next scheduled run."
```

A batch job runs on a schedule. It reads yesterday's completed order files and publishes the **daily sales total**.

## Process a stream

```step
active: [0,1,2]
links: [[0,1,"Stream orders"],[1,2,"Update window total"]]
callouts: [[1,"Define allowed lateness"]]
status: ["Stream","Arriving events","Incremental updates"]
visualNote: "Define how late events affect results that may already have been published."
```

A stream updates sales totals as orders arrive.

Use the **event time**. Decide whether late orders can change totals that you have already published.

## Define correctness

```step
active: [0,1,2]
links: [[0,1,"Replay checkpoint"],[1,2,"Idempotent write"]]
callouts: [[2,"Upsert by window ID"]]
status: ["Starts again after failure","Checkpoint or replay","Verify duplicate handling"]
visualNote: "Test recovery with the same inputs to check whether it changes the result."
```

Recover from a checkpoint and replay the same events.

Use event IDs or a stable output key to prevent a restart from counting an order twice.
