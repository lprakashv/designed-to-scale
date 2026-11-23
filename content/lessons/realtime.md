---
title: Real-time Updates
summary: Deliver changes to clients with an appropriate connection model.
data:
  original: true
---

## Poll for changes

```step
diagram:
  type: svg
  alt: "Server (in focus): Source of updates. Client (in focus): Displays updates. One poll per interval. Flow: Client to Server: Poll for changes. Server to Client: Return latest state."
  caption: A shorter interval reduces wait time and increases request volume.
  src: diagrams/realtime/1.svg
```

A dashboard can poll every **5 seconds**.

- Short intervals reduce the wait for updates.
- Short intervals also create more requests when there is no change.

### Example state

| Item | State |
| --- | --- |
| Connection | Periodic requests |
| Update delivery | At next poll |
| Recovery | Poll again |

## Keep a connection

```step
diagram:
  type: svg
  alt: "Server (in focus): Source of updates. Connection (added) (in focus): Persistent update stream. SSE or WebSocket. Client (in focus): Displays updates. Flow: Client to Connection: Open stream. Server to Connection: Publish update. Connection to Client: Push update."
  caption: Use a bidirectional connection when the client and server both need to send updates independently.
  src: diagrams/realtime/2.svg
```

| Choose | When |
| --- | --- |
| Server-sent events | The server pushes one-way updates over HTTP. |
| WebSocket | The client and the server both send messages. |

### Example state

| Item | State |
| --- | --- |
| Connection | **Long-lived** |
| Update delivery | **Push or duplex** |
| Recovery | **Detect disconnect** |

## Recover after disconnect

```step
diagram:
  type: svg
  alt: "Server (in focus): Source of updates. Connection (in focus): Persistent update stream. Client (in focus): Displays updates. Resume from the last ID. Flow: Client to Connection: Reconnect with ID. Server to Connection: Replay or snapshot. Connection to Client: Catch the client up."
  caption: If missed updates are no longer available, fetch a fresh snapshot.
  src: diagrams/realtime/3.svg
```

After a disconnect, send the **last processed sequence**. Ask the server for later updates.

Fetch a new snapshot if the server no longer keeps the required updates.

### Example state

| Item | State |
| --- | --- |
| Connection | **Reconnecting** |
| Update delivery | **Resume or resync** |
| Recovery | **Sequence or snapshot** |
