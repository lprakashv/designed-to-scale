---
title: Batch & Stream Processing
summary: Choose how and when to process incoming data.
data:
  original: true
---

## Process in batches

```step
diagram:
  type: svg
  alt: "Events (in focus): Input records. Processor (in focus): Aggregates results. Bounded input by day. Output (in focus): Published totals. Flow: Events to Processor: Read daily files. Processor to Output: Publish daily total."
  caption: Choose a batch when the result can wait until the next scheduled run.
  src: diagrams/batch-stream/1.svg
```

A batch job runs on a schedule. It reads yesterday's completed order files and publishes the **daily sales total**.

### Example state

| Item | State |
| --- | --- |
| Processing | Batch |
| Input boundary | Bounded input |
| Result | Scheduled output |

## Process a stream

```step
diagram:
  type: svg
  alt: "Events (in focus): Input records. Processor (in focus): Aggregates results. Define allowed lateness. Output (in focus): Published totals. Flow: Events to Processor: Stream orders. Processor to Output: Update window total."
  caption: Define how late events affect results that may already have been published.
  src: diagrams/batch-stream/2.svg
```

A stream updates sales totals as orders arrive.

Use the **event time**. Decide whether late orders can change totals that you have already published.

### Example state

| Item | State |
| --- | --- |
| Processing | **Stream** |
| Input boundary | **Arriving events** |
| Result | **Incremental updates** |

## Define correctness

```step
diagram:
  type: svg
  alt: "Events (in focus): Input records. Processor (in focus): Aggregates results. Output (in focus): Published totals. Upsert by window ID. Flow: Events to Processor: Replay checkpoint. Processor to Output: Idempotent write."
  caption: Test recovery with the same inputs to check whether it changes the result.
  src: diagrams/batch-stream/3.svg
```

Recover from a checkpoint and replay the same events.

Use event IDs or a stable output key to prevent a restart from counting an order twice.

### Example state

| Item | State |
| --- | --- |
| Processing | **Starts again after failure** |
| Input boundary | **Checkpoint or replay** |
| Result | **Verify duplicate handling** |
