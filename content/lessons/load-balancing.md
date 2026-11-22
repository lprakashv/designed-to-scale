---
original: true
title: Load Balancing
summary: Distribute requests across healthy instances.
nodes: [["Clients","Ticket buyers"],["Server A","Backend A"],["Server B","Backend B"],["Load balancer","Public service address"],["Standby balancer","Separate failure zone"]]
layout: [[0,0.5],[2,0],[2,1],[1,0],[1,1]]
statusLabels: ["Entry point","Policy","Serving backends"]
---

## Find the overloaded server

```step
active: [0,1]
links: [[0,1,"All requests"]]
callouts: [[1,"Queue builds"],[2,"Spare capacity"]]
status: ["Server A","Direct","A"]
visualNote: "Server B has spare capacity, but every client connects to Server A."
```

The ticket site has two servers. All clients use **Server A's address**.

- **Server A:** Requests arrive faster than it can finish them. A queue builds.
- **Server B:** It has spare capacity. Clients send it no requests.

## Give clients one service address

```step
active: [0,1,2,3]
links: [[0,3,"Use one address"],[3,1,"Forward to A"],[3,2,"Forward to B"]]
callouts: [[3,"Select a healthy backend"]]
status: ["Load balancer","Pool routing","A and B"]
note: "A backend pool is the group of servers to which the load balancer can send traffic."
visualNote: "Publish the balancer address so backend addresses can change independently."
```

Publish **one service address**. Clients send requests to the load balancer.

1. The balancer selects a backend.
2. It forwards the request.
3. It relays the response.

The service address stays the same when you add or replace a backend.

## Take turns with round robin

```step
active: [1,2,3]
links: [[3,1,"First request"],[3,2,"Next request"]]
callouts: [[3,"Repeat A → B → A"]]
status: ["Load balancer","Round robin","A and B"]
note: "This policy works best when servers have similar capacity and requests take a similar amount of work."
visualNote: "A and B take turns receiving new work when both are available."
```

**Round robin** takes turns across the available servers.

| Request | Server |
| --- | --- |
| First | A |
| Second | B |
| Third | A |

The cycle repeats while both servers are available.

## Compare short and long requests

```step
active: [1,2,3]
links: [[3,1,"Assign long report"],[3,2,"Short listing"]]
callouts: [[1,"Report holds resources longer"]]
status: ["Load balancer","Round robin","A and B, uneven load"]
visualNote: "Equal request counts can leave one server busier when request costs differ."
```

Opening a listing is fast. Generating a report takes longer.

Each counts as **one request**. The report holds resources for longer, so equal request counts can leave one server busier.

## Use the number of open connections

```step
active: [2,3]
links: [[3,2,"New connection"]]
callouts: [[1,"More open connections"],[2,"Fewer open connections"]]
status: ["Load balancer","Least connections","New traffic to B"]
note: "Open connections approximate load. One connection can carry multiple requests, so actual server load can differ."
visualNote: "The example favors Server B because it has fewer open connections."
```

**Least connections** sends a new connection to the server with the fewest open connections.

- **Server A:** Reports still hold connections open.
- **Server B:** It has fewer open connections. It receives the next one.

## Route around an unhealthy server

```step
active: [0,1,3]
links: [[0,3,"Send new work"],[3,1,"Route to healthy A"],[3,2,"Health check fails"]]
callouts: [[2,"Failed health threshold"]]
status: ["Load balancer","Health checks","A only"]
note: "The remaining servers need enough capacity to handle the traffic after a backend fails."
visualNote: "Remove Server B from rotation after it fails the health check threshold."
```

Health checks help the balancer decide which servers can take new work.

1. Server B fails enough checks to reach the configured threshold.
2. The balancer stops sending it **new requests**.
3. Later, successful checks can return it to the pool.

## Check what happens when the balancer fails

```step
active: [3]
callouts: [[3,"Public route unavailable"],[1,"Backend stays healthy"]]
status: ["Unavailable","No routing","Unreachable"]
visualNote: "Both backends can still be healthy while the public entry point is down."
```

One load balancer sits on every request path.

> **Warning.** If it fails, clients lose access even when both backend servers are healthy.

## Prepare a standby load balancer

```step
active: [0,1,2,3,4]
links: [[0,3,"Public address"],[3,1,"Forward new work"],[3,2,"Forward new work"],[4,3,"Probe primary"]]
callouts: [[3,"Primary restored"],[4,"Ready in a separate zone"]]
status: ["Primary + standby","Primary serves","A and B"]
visualNote: "The primary serves the public address. The new standby waits in a separate failure zone."
```

Restore the primary balancer. Give a standby the same routing rules and backend pool.

- **Primary:** Serves the public address.
- **Standby:** Checks the primary. It waits until needed.

Put the standby in a **separate failure domain** so a single host or network failure is less likely to stop both.

## Test the switch to standby

```step
active: [0,1,2,4]
links: [[0,4,"Fail over"],[4,1,"Forward to A"],[4,2,"Forward to B"]]
callouts: [[3,"Primary unavailable"],[4,"Now serving new connections"]]
status: ["Standby serves","Routing restored","A and B"]
note: "Measure the switch time and the effect on open connections. Some clients may need to reconnect."
visualNote: "Measure how long the public address takes to work again after failover."
```

The primary fails again. The standby takes over the service address, or a routing service directs traffic to it.

New requests can reach the same backends. Measure how long the switch takes and check whether existing connections survive.

## Route by HTTP path

```step
active: [0,1,2,4]
links: [[0,4,"Request ticket data"],[4,1,"Route /listings"],[4,2,"Route /reports"]]
callouts: [[1,"Listing pool"],[2,"Report pool"]]
status: ["Standby serves","HTTP path","Listing and report pools"]
visualNote: "Server A starts the listing pool and Server B starts the report pool in this example."
```

An HTTP load balancer can choose a backend pool by request path.

| Path | Backend pool |
| --- | --- |
| `/listings` | Listing pool, starting with Server A |
| `/reports` | Report pool, starting with Server B |

Size each pool for its own workload.

## Update one server at a time

```step
active: [0,1,4]
links: [[0,4,"Send new work"],[4,1,"Route new work to A"]]
callouts: [[2,"Drain existing requests"]]
status: ["Standby serves","Drain before update","A only"]
note: "Check that Server A has enough capacity before taking Server B out of rotation."
visualNote: "Both servers are back in one pool. New requests go to Server A while Server B drains."
```

Return to one shared backend pool. To update Server B:

1. Send new requests to Server A.
2. Let Server B finish its existing work.
3. Update Server B.
4. Return it to the pool after readiness checks pass.

## Review the request path

```step
active: [0,1,2,4]
links: [[0,4,"Public address"],[4,1,"Route to healthy A"],[4,2,"Route to healthy B"]]
callouts: [[4,"Serving after failover"],[3,"Recovered and ready"]]
status: ["Redundant entry point","Healthy destinations","A and B"]
visualNote: "The current active balancer has two healthy backends. The recovered primary is ready if needed."
```

Clients still use **one service address**. The standby serves it after failover. The recovered primary is ready if needed.

| Control | What it addresses |
| --- | --- |
| Backend health check | A backend cannot serve new work. |
| Redundant balancers | The public entry point fails. |
| Drain before update | A planned update interrupts active work. |
