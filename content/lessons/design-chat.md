---
title: Design a Chat System
summary: Design messaging from the delivery contract through persistence, reconnects, and scale.
data:
  original: true
---

## Define the contract

```step
diagram:
  type: svg
  alt: "Sender (in focus): Submits or retries messages. Recipient (in focus): Reads new and missed messages. May be offline. Chat service (in focus): Orders writes. Flow: Sender to Chat service: Send a message. Chat service to Recipient: Deliver when online."
  caption: A sender submits a message; the recipient may be online or offline.
  src: diagrams/design-chat/1.svg
```

Support **one-to-one text messages**, online delivery, and catch-up after reconnect.

- Keep messages for **one year**.
- Define an order within each conversation.
- Acknowledge acceptance only after the server saves the message.

Use authorization and transport encryption. End-to-end encryption and exactly-once delivery are outside this example.

### Example state

| Item | State |
| --- | --- |
| Traffic | Estimate next |
| Delivery | Persist then deliver |
| Ordering | Per conversation |

## Estimate load and storage

```step
diagram:
  type: svg
  alt: "Sender (in focus): Submits or retries messages. Recipient (context): Reads new and missed messages. Chat service (in focus): Orders writes. Message store (added) (in focus): Durable history. Assume 1 KB per message. Flow: Sender to Chat service: Submit a message. Chat service to Message store: Persist the message."
  caption: Each accepted message is stored before delivery is attempted.
  src: diagrams/design-chat/2.svg
```

Assume **10 million daily active users**. Each sends **100 messages/day**.

| Quantity | Estimate |
| --- | --- |
| Message rate | 1 billion/day ÷ 86,400 ≈ **11,574/s** |
| 3× peak | About **34,722/s** |
| Logical storage | 1 billion/day × 365 × 1 KB = **365 TB** |
| Three copies | About **1.1 PB** |

> **Assumption.** Each stored message uses 1 KB. Add indexes, backups, and storage overhead. Attachments are out of scope.

### Example state

| Item | State |
| --- | --- |
| Traffic | **≈11,574 messages/s** |
| Delivery | Persist then deliver |
| Ordering | Per conversation |

## Keep an online connection

```step
diagram:
  type: svg
  alt: "Sender (in focus): Submits or retries messages. Gateway (added) (in focus): Holds client connections. Size for 2M connections. Recipient (in focus): Reads new and missed messages. Chat service (in focus): Orders writes. Message store (context): Durable history. Flow: Sender to Gateway: Open WebSocket. Gateway to Chat service: Forward send. Gateway to Recipient: Keep connection."
  caption: Gateways maintain client connections and forward messages to the service.
  src: diagrams/design-chat/3.svg
```

Use a persistent connection such as **WebSocket**. The gateway authenticates clients and holds sender and recipient connections. Revalidate sessions when required. The chat service can scale separately.

**2 million connections ÷ 50,000 per gateway = 40 gateways** before headroom.

Allow for failures and uneven load. Test memory, file descriptors, network use, and heartbeat costs.

### Example state

| Item | State |
| --- | --- |
| Traffic | **11,574 messages/s average** |
| Delivery | **Persistent connections** |
| Ordering | Per conversation |

## Persist before acknowledging

```step
diagram:
  type: svg
  alt: "Sender (in focus): Submits or retries messages. Gateway (in focus): Holds client connections. Recipient (context): Reads new and missed messages. Chat service (in focus): Orders writes. Message store (in focus): Durable history. Unique sender message ID. Flow: Sender to Gateway: Send with ID. Gateway to Chat service: Forward the send. Chat service to Message store: Write ID + sequence. Message store to Chat service: Confirm write. Chat service to Gateway: Return accepted. Gateway to Sender: Acknowledge sender."
  caption: The server writes the message and then acknowledges the sender; recipient delivery follows separately.
  src: diagrams/design-chat/4.svg
```

The client sends a **message ID**, **conversation ID**, and **body**.

1. Check conversation membership.
2. Assign a sequence and persist the message.
3. Acknowledge acceptance after the durable write.

Use a unique key for the sender and client message ID. A retry with the same payload returns the prior result and sequence. Define how long to keep the key.

> **Note.** Acceptance means the server saved the message. The recipient may still be offline.

### Example state

| Item | State |
| --- | --- |
| Traffic | **11,574 writes/s average** |
| Delivery | **Durable acceptance** |
| Ordering | **Assign sequence** |

## Route to online recipients

```step
diagram:
  type: svg
  alt: "Sender (context): Submits or retries messages. Gateway (in focus): Holds client connections. Recipient (in focus): Reads new and missed messages. Chat service (in focus): Orders writes. Message store (context): Durable history. Delivery queue (added) (in focus): Durable delivery events. Delivery worker (added) (in focus): Routes stored messages. Use current directory entry. Connection directory (added) (in focus): Finds live gateways. Expire stale entries. Flow: Chat service to Delivery queue: Publish event. Delivery queue to Delivery worker: Consume event. Delivery worker to Connection directory: Find gateway. Delivery worker to Gateway: Send to gateway. Gateway to Recipient: Push the message."
  caption: A worker consumes a stored delivery event and uses the directory to find the recipient gateway.
  src: diagrams/design-chat/5.svg
```

1. Save the message and its **outbox record** in one transaction.
2. A relay publishes an event to the delivery queue.
3. A worker looks up the recipient's current gateway.
4. The gateway pushes the message.

> **Warning.** A connection can disappear between lookup and send. Retry when useful. Clients can recover from durable history. Consumers must handle repeated events after a relay failure.

### Example state

| Item | State |
| --- | --- |
| Traffic | **11,574 events/s average** |
| Delivery | **Async online delivery** |
| Ordering | **Per conversation** |

## Recover after reconnect

```step
diagram:
  type: svg
  alt: "Sender (context): Submits or retries messages. Gateway (in focus): Holds client connections. Recipient (in focus): Reads new and missed messages. Advance only past contiguous data. Chat service (in focus): Orders writes. Message store (in focus): Durable history. Delivery queue (context): Durable delivery events. Delivery worker (context): Routes stored messages. Connection directory (context): Finds live gateways. Flow: Recipient to Gateway: Reconnect + cursor. Gateway to Chat service: Request catch-up. Chat service to Message store: Read after cursor. Message store to Chat service: Return ordered page. Chat service to Gateway: Send history page. Gateway to Recipient: Send missed messages."
  caption: The client requests messages after its last confirmed sequence and removes duplicates by message ID.
  src: diagrams/design-chat/6.svg
```

On reconnect, the client sends the last **contiguous sequence** it saved. The service returns later messages in pages.

- Deduplicate by **message ID**.
- Advance the cursor only after saving a contiguous range.
- Report a gap if retention removed messages in that range.

A lost acknowledgment can cause delivery of the same message again.

### Example state

| Item | State |
| --- | --- |
| Traffic | **Reconnect and catch up** |
| Delivery | **At-least-once delivery** |
| Ordering | **Cursor per conversation** |

## Preserve conversation order

```step
diagram:
  type: svg
  alt: "Sender (in focus): Submits or retries messages. Gateway (in focus): Holds client connections. Recipient (context): Reads new and missed messages. Chat service (in focus): Orders writes. Assign sequence atomically. Message store (in focus): Durable history. Delivery queue (context): Durable delivery events. Delivery worker (context): Routes stored messages. Connection directory (context): Finds live gateways. Flow: Sender to Gateway: Concurrent sends. Gateway to Chat service: Forward both sends. Chat service to Message store: Write in order."
  caption: A conversation's writes receive a stable order before clients consume them.
  src: diagrams/design-chat/7.svg
```

Two users can send at the same time. Assign increasing sequences **per conversation**. Use one owner or an atomic storage operation.

Order messages by that sequence. Coordinate sequence assignment with the write so failures leave a clear result.

> **Note.** A busy group can overload its own partition. Measure that load before changing how the system assigns ownership.

### Example state

| Item | State |
| --- | --- |
| Traffic | **Concurrent sends** |
| Delivery | **Durable acceptance** |
| Ordering | **Sequence per conversation** |

## Secure and operate the service

```step
diagram:
  type: svg
  alt: "Sender (in focus): Submits or retries messages. Gateway (in focus): Holds client connections. Recipient (context): Reads new and missed messages. Chat service (in focus): Orders writes. Check membership. Message store (in focus): Durable history. Delivery queue (context): Durable delivery events. Delivery worker (context): Routes stored messages. Connection directory (context): Finds live gateways. Flow: Sender to Gateway: Authenticate + send. Gateway to Chat service: Forward request. Chat service to Message store: Read if allowed."
  caption: The service checks conversation membership on send and on history retrieval.
  src: diagrams/design-chat/8.svg
```

- Encrypt traffic in transit and protect stored data.
- Authorize every send and history request.
- Limit abusive traffic and expire messages on schedule.

> **Warning.** A removed member must stop receiving new messages, even on an existing connection.

Monitor write latency, queue age, delivery lag, connection churn, and reconnect errors. Test both gateway and store outages.

### Example state

| Item | State |
| --- | --- |
| Traffic | **Rate limits · monitoring** |
| Delivery | **Membership checked** |
| Ordering | **Per conversation** |

## Recap: the chat design

```step
diagram:
  type: svg
  alt: "Sender (in focus): Submits or retries messages. Gateway (in focus): Holds client connections. Recipient (in focus): Reads new and missed messages. Chat service (in focus): Orders writes. Message store (in focus): Durable history. History backs reconnects. Delivery queue (in focus): Durable delivery events. Delivery worker (in focus): Routes stored messages. Connection directory (in focus): Finds live gateways. Find live gateway. Flow: Sender to Gateway: Send message. Gateway to Chat service: Forward send. Chat service to Message store: Store + sequence. Chat service to Delivery queue: Emit delivery event. Delivery queue to Delivery worker: Consume event. Delivery worker to Connection directory: Find gateway. Delivery worker to Gateway: Send to gateway. Gateway to Recipient: Push online update."
  caption: The send path persists messages before delivery. The same store supports reconnect and catch-up.
  src: diagrams/design-chat/9.svg
```

| Decision | Benefit and cost |
| --- | --- |
| Persistent gateway connections | Deliver quickly to online users. Manage open connections. |
| Save before accepting | Recover messages after failure. Adds write latency. |
| Make retries safe | Handle lost acknowledgments. Keep duplicate-check state. |
| Sequence per conversation | Give clients a stable order. Watch for busy partitions. |
| Resume with a cursor | Recover missed messages. Handle retention gaps. |
| Check membership | Protect sends and reads. Adds a policy check. |

Measure message size, concurrency, retention, and recovery behavior before sizing the service.

### Example state

| Item | State |
| --- | --- |
| Traffic | **≈11,574 messages/s average** |
| Delivery | **Persist · deliver · catch up** |
| Ordering | **Sequence per conversation** |
