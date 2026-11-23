---
title: Pub/Sub & Events
summary: Send events to multiple independent consumers.
data:
  original: true
  nodes: [["Publisher","Emits business events"],["Event broker","Routes and retains events"],["Consumers","Independent subscriptions"]]
  statusLabels: ["Event path","Consumers","Design check"]
---

## Publish an event

```step
data:
  active: [0,1,2]
  links: [[0,1,"Publish OrderPlaced"],[1,2,"Deliver event"]]
  callouts: [[2,"Email and analytics"]]
  status: ["Broker fans out","Independent subscribers","Producer can continue"]
  visualNote: "Each subscriber can handle a different task triggered by the same event."
```

The order service publishes one **`OrderPlaced`** event.

The email and analytics subscriptions each receive a copy. Each processes it at its own pace.

## Design the event

```step
data:
  active: [0,1]
  links: [[0,1,"Event ID + version"]]
  callouts: [[0,"Include event version"]]
  status: ["Versioned event","Read supported fields","Stable event ID"]
  visualNote: "Avoid requiring every subscriber to upgrade when a publisher adds a field."
```

Include the **event ID**, **schema version**, and fields consumers need.

> **Warning.** Leave unnecessary personal data out of the event.

## Expect duplicates

```step
data:
  active: [1,2]
  links: [[1,2,"Repeat OrderPlaced"]]
  callouts: [[2,"Apply the event ID once"]]
  status: ["Redelivery possible","Deduplicate or replay","Check ordering scope"]
  visualNote: "Use event IDs and the broker’s ordering guarantees to handle repeated delivery."
```

Test redelivery to both subscriptions. Use the **event ID** to avoid repeating side effects.

Define ordering, replay behavior, and retention for each subscription.
