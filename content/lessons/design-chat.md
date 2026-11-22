---
original: true
title: Design a Chat System
summary: Design messaging from the delivery contract through persistence, reconnects, and scale.
nodes: [["Sender","Submits or retries messages"],["Gateway","Holds client connections"],["Recipient","Reads new and missed messages"],["Chat service","Orders writes"],["Message store","Durable history"],["Delivery queue","Durable delivery events"],["Delivery worker","Routes stored messages"],["Connection directory","Finds live gateways"]]
layout: [[0,0],[1,0],[2,0],[1,1],[2,1],[1,2],[0,2],[0,1]]
statusLabels: [Traffic, Delivery, Ordering]
---

## Define the contract

```step
active: [0,2,3]
links: [[0,3,"Send a message"],[3,2,"Deliver when online"]]
callouts: [[2,"May be offline"]]
status: ["Estimate next","Persist then deliver","Per conversation"]
visualNote: "A sender submits a message; the recipient may be online or offline."
```

Support **one-to-one text messages**, online delivery, and catch-up after reconnect.

- Keep messages for **one year**.
- Define an order within each conversation.
- Acknowledge acceptance only after the server saves the message.

Use authorization and transport encryption. End-to-end encryption and exactly-once delivery are outside this example.

## Estimate load and storage

```step
active: [0,3,4]
links: [[0,3,"Submit a message"],[3,4,"Persist the message"]]
callouts: [[4,"Assume 1 KB per message"]]
status: ["≈11,574 messages/s","Persist then deliver","Per conversation"]
visualNote: "Each accepted message is stored before delivery is attempted."
```

Assume **10 million daily active users**. Each sends **100 messages/day**.

| Quantity | Estimate |
| --- | --- |
| Message rate | 1 billion/day ÷ 86,400 ≈ **11,574/s** |
| 3× peak | About **34,722/s** |
| Logical storage | 1 billion/day × 365 × 1 KB = **365 TB** |
| Three copies | About **1.1 PB** |

> **Assumption.** Each stored message uses 1 KB. Add indexes, backups, and storage overhead. Attachments are out of scope.

## Keep an online connection

```step
active: [0,1,2,3]
links: [[0,1,"Open WebSocket"],[1,3,"Forward send"],[1,2,"Keep connection"]]
callouts: [[1,"Size for 2M connections"]]
status: ["11,574 messages/s average","Persistent connections","Per conversation"]
visualNote: "Gateways maintain client connections and forward messages to the service."
```

Use a persistent connection such as **WebSocket**. The gateway authenticates clients and holds sender and recipient connections. Revalidate sessions when required. The chat service can scale separately.

**2 million connections ÷ 50,000 per gateway = 40 gateways** before headroom.

Allow for failures and uneven load. Test memory, file descriptors, network use, and heartbeat costs.

## Persist before acknowledging

```step
active: [0,1,3,4]
links: [[0,1,"Send with ID"],[1,3,"Forward the send"],[3,4,"Write ID + sequence"],[4,3,"Confirm write"],[3,1,"Return accepted"],[1,0,"Acknowledge sender"]]
callouts: [[4,"Unique sender message ID"]]
status: ["11,574 writes/s average","Durable acceptance","Assign sequence"]
visualNote: "The server writes the message and then acknowledges the sender; recipient delivery follows separately."
```

The client sends a **message ID**, **conversation ID**, and **body**.

1. Check conversation membership.
2. Assign a sequence and persist the message.
3. Acknowledge acceptance after the durable write.

Use a unique key for the sender and client message ID. A retry with the same payload returns the prior result and sequence. Define how long to keep the key.

> **Note.** Acceptance means the server saved the message. The recipient may still be offline.

## Route to online recipients

```step
active: [1,2,3,5,6,7]
links: [[3,5,"Publish event"],[5,6,"Consume event"],[6,7,"Find gateway"],[6,1,"Send to gateway"],[1,2,"Push the message"]]
callouts: [[7,"Expire stale entries"],[6,"Use current directory entry"]]
status: ["11,574 events/s average","Async online delivery","Per conversation"]
visualNote: "A worker consumes a stored delivery event and uses the directory to find the recipient gateway."
```

1. Save the message and its **outbox record** in one transaction.
2. A relay publishes an event to the delivery queue.
3. A worker looks up the recipient's current gateway.
4. The gateway pushes the message.

> **Warning.** A connection can disappear between lookup and send. Retry when useful. Clients can recover from durable history. Consumers must handle repeated events after a relay failure.

## Recover after reconnect

```step
active: [1,2,3,4]
links: [[2,1,"Reconnect + cursor"],[1,3,"Request catch-up"],[3,4,"Read after cursor"],[4,3,"Return ordered page"],[3,1,"Send history page"],[1,2,"Send missed messages"]]
callouts: [[2,"Advance only past contiguous data"]]
status: ["Reconnect and catch up","At-least-once delivery","Cursor per conversation"]
visualNote: "The client requests messages after its last confirmed sequence and removes duplicates by message ID."
```

On reconnect, the client sends the last **contiguous sequence** it saved. The service returns later messages in pages.

- Deduplicate by **message ID**.
- Advance the cursor only after saving a contiguous range.
- Report a gap if retention removed messages in that range.

A lost acknowledgment can cause delivery of the same message again.

## Preserve conversation order

```step
active: [0,1,3,4]
links: [[0,1,"Concurrent sends"],[1,3,"Forward both sends"],[3,4,"Write in order"]]
callouts: [[3,"Assign sequence atomically"]]
status: ["Concurrent sends","Durable acceptance","Sequence per conversation"]
visualNote: "A conversation's writes receive a stable order before clients consume them."
```

Two users can send at the same time. Assign increasing sequences **per conversation**. Use one owner or an atomic storage operation.

Order messages by that sequence. Coordinate sequence assignment with the write so failures leave a clear result.

> **Note.** A busy group can overload its own partition. Measure that load before changing how the system assigns ownership.

## Secure and operate the service

```step
active: [0,1,3,4]
links: [[0,1,"Authenticate + send"],[1,3,"Forward request"],[3,4,"Read if allowed"]]
callouts: [[3,"Check membership"]]
status: ["Rate limits · monitoring","Membership checked","Per conversation"]
visualNote: "The service checks conversation membership on send and on history retrieval."
```

- Encrypt traffic in transit and protect stored data.
- Authorize every send and history request.
- Limit abusive traffic and expire messages on schedule.

> **Warning.** A removed member must stop receiving new messages, even on an existing connection.

Monitor write latency, queue age, delivery lag, connection churn, and reconnect errors. Test both gateway and store outages.

## Recap: the chat design

```step
active: [0,1,2,3,4,5,6,7]
links: [[0,1,"Send message"],[1,3,"Forward send"],[3,4,"Store + sequence"],[3,5,"Emit delivery event"],[5,6,"Consume event"],[6,7,"Find gateway"],[6,1,"Send to gateway"],[1,2,"Push online update"]]
callouts: [[4,"History backs reconnects"],[7,"Find live gateway"]]
status: ["≈11,574 messages/s average","Persist · deliver · catch up","Sequence per conversation"]
visualNote: "The send path persists messages before delivery. The same store supports reconnect and catch-up."
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
