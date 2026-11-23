---
title: Pub/Sub & Events
summary: Send events to multiple independent consumers.
data:
  original: true
---

## Publish an event

```step
diagram:
  type: svg
  alt: "Publisher (in focus): Emits business events. Event broker (in focus): Routes and retains events. Consumers (in focus): Independent subscriptions. Email and analytics. Flow: Publisher to Event broker: Publish OrderPlaced. Event broker to Consumers: Deliver event."
  caption: Each subscriber can handle a different task triggered by the same event.
  src: diagrams/pubsub/1.svg
```

The order service publishes one **`OrderPlaced`** event.

The email and analytics subscriptions each receive a copy. Each processes it at its own pace.

### Example state

| Item | State |
| --- | --- |
| Event path | Broker fans out |
| Consumers | Independent subscribers |
| Design check | Producer can continue |

## Design the event

```step
diagram:
  type: svg
  alt: "Publisher (in focus): Emits business events. Include event version. Event broker (in focus): Routes and retains events. Consumers (context): Independent subscriptions. Flow: Publisher to Event broker: Event ID + version."
  caption: Avoid requiring every subscriber to upgrade when a publisher adds a field.
  src: diagrams/pubsub/2.svg
```

Include the **event ID**, **schema version**, and fields consumers need.

> **Warning.** Leave unnecessary personal data out of the event.

### Example state

| Item | State |
| --- | --- |
| Event path | **Versioned event** |
| Consumers | **Read supported fields** |
| Design check | **Stable event ID** |

## Expect duplicates

```step
diagram:
  type: svg
  alt: "Publisher (context): Emits business events. Event broker (in focus): Routes and retains events. Consumers (in focus): Independent subscriptions. Apply the event ID once. Flow: Event broker to Consumers: Repeat OrderPlaced."
  caption: Use event IDs and the broker’s ordering guarantees to handle repeated delivery.
  src: diagrams/pubsub/3.svg
```

Test redelivery to both subscriptions. Use the **event ID** to avoid repeating side effects.

Define ordering, replay behavior, and retention for each subscription.

### Example state

| Item | State |
| --- | --- |
| Event path | **Redelivery possible** |
| Consumers | **Deduplicate or replay** |
| Design check | **Check ordering scope** |
