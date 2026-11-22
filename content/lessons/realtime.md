---
original: true
title: Real-time Updates
summary: Deliver changes to clients with an appropriate connection model.
nodes: [["Server","Source of updates"],["Connection","Persistent update stream"],["Client","Displays updates"]]
statusLabels: ["Connection","Update delivery","Recovery"]
---

## Poll for changes

```step
active: [0,2]
links: [[2,0,"Poll for changes"],[0,2,"Return latest state"]]
callouts: [[2,"One poll per interval"]]
status: ["Periodic requests","At next poll","Poll again"]
visualNote: "A shorter interval reduces wait time and increases request volume."
```

A dashboard can poll every **5 seconds**.

- Short intervals reduce the wait for updates.
- Short intervals also create more requests when there is no change.

## Keep a connection

```step
active: [0,1,2]
links: [[2,1,"Open stream"],[0,1,"Publish update"],[1,2,"Push update"]]
callouts: [[1,"SSE or WebSocket"]]
status: ["Long-lived","Push or duplex","Detect disconnect"]
visualNote: "Use a bidirectional connection when the client and server both need to send updates independently."
```

| Choose | When |
| --- | --- |
| Server-sent events | The server pushes one-way updates over HTTP. |
| WebSocket | The client and the server both send messages. |

## Recover after disconnect

```step
active: [0,1,2]
links: [[2,1,"Reconnect with ID"],[0,1,"Replay or snapshot"],[1,2,"Catch the client up"]]
callouts: [[2,"Resume from the last ID"]]
status: ["Reconnecting","Resume or resync","Sequence or snapshot"]
visualNote: "If missed updates are no longer available, fetch a fresh snapshot."
```

After a disconnect, send the **last processed sequence**. Ask the server for later updates.

Fetch a new snapshot if the server no longer keeps the required updates.
