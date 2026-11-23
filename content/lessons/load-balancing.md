---
title: Load Balancing
summary: Distribute requests across healthy instances.
data:
  original: true
---

## Find the overloaded server

```step
diagram:
  type: svg
  alt: "Clients (in focus): Ticket buyers. Server A (in focus): Backend A. Queue builds. Server B (context): Backend B. Spare capacity. Flow: Clients to Server A: All requests."
  caption: Server B has spare capacity, but every client connects to Server A.
  src: diagrams/load-balancing/1.svg
```

The ticket site has two servers. All clients use **Server A's address**.

- **Server A:** Requests arrive faster than it can finish them. A queue builds.
- **Server B:** It has spare capacity. Clients send it no requests.

### Example state

| Item | State |
| --- | --- |
| Entry point | Server A |
| Policy | Direct |
| Serving backends | A |

## Give clients one service address

```step
diagram:
  type: svg
  alt: "Clients (in focus): Ticket buyers. Server A (in focus): Backend A. Server B (in focus): Backend B. Load balancer (added) (in focus): Public service address. Select a healthy backend. Flow: Clients to Load balancer: Use one address. Load balancer to Server A: Forward to A. Load balancer to Server B: Forward to B."
  caption: Publish the balancer address so backend addresses can change independently.
  src: diagrams/load-balancing/2.svg
```

Publish **one service address**. Clients send requests to the load balancer.

1. The balancer selects a backend.
2. It forwards the request.
3. It relays the response.

The service address stays the same when you add or replace a backend.

> **Key idea.** A backend pool is the group of servers to which the load balancer can send traffic.

### Example state

| Item | State |
| --- | --- |
| Entry point | **Load balancer** |
| Policy | **Pool routing** |
| Serving backends | **A and B** |

## Take turns with round robin

```step
diagram:
  type: svg
  alt: "Clients (context): Ticket buyers. Server A (in focus): Backend A. Server B (in focus): Backend B. Load balancer (in focus): Public service address. Repeat A → B → A. Flow: Load balancer to Server A: First request. Load balancer to Server B: Next request."
  caption: A and B take turns receiving new work when both are available.
  src: diagrams/load-balancing/3.svg
```

**Round robin** takes turns across the available servers.

| Request | Server |
| --- | --- |
| First | A |
| Second | B |
| Third | A |

The cycle repeats while both servers are available.

> **Key idea.** This policy works best when servers have similar capacity and requests take a similar amount of work.

### Example state

| Item | State |
| --- | --- |
| Entry point | Load balancer |
| Policy | **Round robin** |
| Serving backends | A and B |

## Compare short and long requests

```step
diagram:
  type: svg
  alt: "Clients (context): Ticket buyers. Server A (in focus): Backend A. Report holds resources longer. Server B (in focus): Backend B. Load balancer (in focus): Public service address. Flow: Load balancer to Server A: Assign long report. Load balancer to Server B: Short listing."
  caption: Equal request counts can leave one server busier when request costs differ.
  src: diagrams/load-balancing/4.svg
```

Opening a listing is fast. Generating a report takes longer.

Each counts as **one request**. The report holds resources for longer, so equal request counts can leave one server busier.

### Example state

| Item | State |
| --- | --- |
| Entry point | Load balancer |
| Policy | Round robin |
| Serving backends | **A and B, uneven load** |

## Use the number of open connections

```step
diagram:
  type: svg
  alt: "Clients (context): Ticket buyers. Server A (context): Backend A. More open connections. Server B (in focus): Backend B. Fewer open connections. Load balancer (in focus): Public service address. Flow: Load balancer to Server B: New connection."
  caption: The example favors Server B because it has fewer open connections.
  src: diagrams/load-balancing/5.svg
```

**Least connections** sends a new connection to the server with the fewest open connections.

- **Server A:** Reports still hold connections open.
- **Server B:** It has fewer open connections. It receives the next one.

> **Key idea.** Open connections approximate load. One connection can carry multiple requests, so actual server load can differ.

### Example state

| Item | State |
| --- | --- |
| Entry point | Load balancer |
| Policy | **Least connections** |
| Serving backends | **New traffic to B** |

## Route around an unhealthy server

```step
diagram:
  type: svg
  alt: "Clients (in focus): Ticket buyers. Server A (in focus): Backend A. Server B (context): Backend B. Failed health threshold. Load balancer (in focus): Public service address. Flow: Clients to Load balancer: Send new work. Load balancer to Server A: Route to healthy A. Load balancer to Server B: Health check fails."
  caption: Remove Server B from rotation after it fails the health check threshold.
  src: diagrams/load-balancing/6.svg
```

Health checks help the balancer decide which servers can take new work.

1. Server B fails enough checks to reach the configured threshold.
2. The balancer stops sending it **new requests**.
3. Later, successful checks can return it to the pool.

> **Key idea.** The remaining servers need enough capacity to handle the traffic after a backend fails.

### Example state

| Item | State |
| --- | --- |
| Entry point | Load balancer |
| Policy | **Health checks** |
| Serving backends | **A only** |

## Check what happens when the balancer fails

```step
diagram:
  type: svg
  alt: "Clients (context): Ticket buyers. Server A (context): Backend A. Backend stays healthy. Server B (context): Backend B. Load balancer (in focus): Public service address. Public route unavailable."
  caption: Both backends can still be healthy while the public entry point is down.
  src: diagrams/load-balancing/7.svg
```

One load balancer sits on every request path.

> **Warning.** If it fails, clients lose access even when both backend servers are healthy.

### Example state

| Item | State |
| --- | --- |
| Entry point | **Unavailable** |
| Policy | **No routing** |
| Serving backends | **Unreachable** |

## Prepare a standby load balancer

```step
diagram:
  type: svg
  alt: "Clients (in focus): Ticket buyers. Server A (in focus): Backend A. Server B (in focus): Backend B. Load balancer (in focus): Public service address. Primary restored. Standby balancer (added) (in focus): Separate failure zone. Ready in a separate zone. Flow: Clients to Load balancer: Public address. Load balancer to Server A: Forward new work. Load balancer to Server B: Forward new work. Standby balancer to Load balancer: Probe primary."
  caption: The primary serves the public address. The new standby waits in a separate failure zone.
  src: diagrams/load-balancing/8.svg
```

Restore the primary balancer. Give a standby the same routing rules and backend pool.

- **Primary:** Serves the public address.
- **Standby:** Checks the primary. It waits until needed.

Put the standby in a **separate failure domain** so a single host or network failure is less likely to stop both.

### Example state

| Item | State |
| --- | --- |
| Entry point | **Primary + standby** |
| Policy | **Primary serves** |
| Serving backends | **A and B** |

## Test the switch to standby

```step
diagram:
  type: svg
  alt: "Clients (in focus): Ticket buyers. Server A (in focus): Backend A. Server B (in focus): Backend B. Load balancer (context): Public service address. Primary unavailable. Standby balancer (in focus): Separate failure zone. Now serving new connections. Flow: Clients to Standby balancer: Fail over. Standby balancer to Server A: Forward to A. Standby balancer to Server B: Forward to B."
  caption: Measure how long the public address takes to work again after failover.
  src: diagrams/load-balancing/9.svg
```

The primary fails again. The standby takes over the service address, or a routing service directs traffic to it.

New requests can reach the same backends. Measure how long the switch takes and check whether existing connections survive.

> **Key idea.** Measure the switch time and the effect on open connections. Some clients may need to reconnect.

### Example state

| Item | State |
| --- | --- |
| Entry point | **Standby serves** |
| Policy | **Routing restored** |
| Serving backends | A and B |

## Route by HTTP path

```step
diagram:
  type: svg
  alt: "Clients (in focus): Ticket buyers. Server A (in focus): Backend A. Listing pool. Server B (in focus): Backend B. Report pool. Load balancer (context): Public service address. Standby balancer (in focus): Separate failure zone. Flow: Clients to Standby balancer: Request ticket data. Standby balancer to Server A: Route /listings. Standby balancer to Server B: Route /reports."
  caption: Server A starts the listing pool and Server B starts the report pool in this example.
  src: diagrams/load-balancing/10.svg
```

An HTTP load balancer can choose a backend pool by request path.

| Path | Backend pool |
| --- | --- |
| `/listings` | Listing pool, starting with Server A |
| `/reports` | Report pool, starting with Server B |

Size each pool for its own workload.

### Example state

| Item | State |
| --- | --- |
| Entry point | Standby serves |
| Policy | **HTTP path** |
| Serving backends | **Listing and report pools** |

## Update one server at a time

```step
diagram:
  type: svg
  alt: "Clients (in focus): Ticket buyers. Server A (in focus): Backend A. Server B (context): Backend B. Drain existing requests. Load balancer (context): Public service address. Standby balancer (in focus): Separate failure zone. Flow: Clients to Standby balancer: Send new work. Standby balancer to Server A: Route new work to A."
  caption: Both servers are back in one pool. New requests go to Server A while Server B drains.
  src: diagrams/load-balancing/11.svg
```

Return to one shared backend pool. To update Server B:

1. Send new requests to Server A.
2. Let Server B finish its existing work.
3. Update Server B.
4. Return it to the pool after readiness checks pass.

> **Key idea.** Check that Server A has enough capacity before taking Server B out of rotation.

### Example state

| Item | State |
| --- | --- |
| Entry point | Standby serves |
| Policy | **Drain before update** |
| Serving backends | **A only** |

## Review the request path

```step
diagram:
  type: svg
  alt: "Clients (in focus): Ticket buyers. Server A (in focus): Backend A. Server B (in focus): Backend B. Load balancer (context): Public service address. Recovered and ready. Standby balancer (in focus): Separate failure zone. Serving after failover. Flow: Clients to Standby balancer: Public address. Standby balancer to Server A: Route to healthy A. Standby balancer to Server B: Route to healthy B."
  caption: The current active balancer has two healthy backends. The recovered primary is ready if needed.
  src: diagrams/load-balancing/12.svg
```

Clients still use **one service address**. The standby serves it after failover. The recovered primary is ready if needed.

| Control | What it addresses |
| --- | --- |
| Backend health check | A backend cannot serve new work. |
| Redundant balancers | The public entry point fails. |
| Drain before update | A planned update interrupts active work. |

### Example state

| Item | State |
| --- | --- |
| Entry point | **Redundant entry point** |
| Policy | **Healthy destinations** |
| Serving backends | **A and B** |
