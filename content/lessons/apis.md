---
title: REST, RPC & GraphQL
summary: Compare ways services expose operations and data.
data:
  original: true
  nodes: [["Client","API consumer"],["API","Public contract"],["Service","Implements the operation"]]
  statusLabels: ["Contract","Design focus","Check"]
---

## Choose a contract

```step
data:
  active: [0,1,2]
  links: [[0,1,"GET /orders/42"],[1,2,"Load order 42"]]
  callouts: [[1,"Choose request and response"]]
  status: ["REST, RPC, or GraphQL","Resources, operations, fields","Match client needs"]
  visualNote: "Compare how a client would make the same request with each interface."
```

Compare three ways to return the same order:

| Interface | Example |
| --- | --- |
| Resource-oriented HTTP | Read `/orders/42`. |
| RPC | Call `GetOrder`. |
| GraphQL | Request the fields needed for order 42. |

Choose the contract that fits the clients.

## Plan evolution

```step
data:
  active: [0,1]
  links: [[0,1,"List with cursor"]]
  callouts: [[1,"Keep old clients compatible"]]
  status: ["Versioned contract","Compatible changes","Test older clients"]
  visualNote: "Add a new field before you remove one that deployed clients still use."
```

Define the **schema**, **error responses**, and **pagination**.

Add a new field as optional first. Test the old client against the new API.

## Operate the API

```step
data:
  active: [1,2]
  links: [[1,2,"Send with deadline"]]
  callouts: [[1,"Check caller and deadline"]]
  status: ["Running API","Deadlines and limits","Observe failures"]
  visualNote: "Apply authentication and rate limits at the entry point and authorization where the action is enforced."
```

For each request:

1. Authenticate the caller.
2. Check access to the order.
3. Apply a deadline.
4. Record latency and outcome.
