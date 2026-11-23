---
title: REST, RPC & GraphQL
summary: Compare ways services expose operations and data.
data:
  original: true
---

## Choose a contract

```step
diagram:
  type: svg
  alt: "Client (in focus): API consumer. API (in focus): Public contract. Choose request and response. Service (in focus): Implements the operation. Flow: Client to API: GET /orders/42. API to Service: Load order 42."
  caption: Compare how a client would make the same request with each interface.
  src: diagrams/apis/1.svg
```

Compare three ways to return the same order:

| Interface | Example |
| --- | --- |
| Resource-oriented HTTP | Read `/orders/42`. |
| RPC | Call `GetOrder`. |
| GraphQL | Request the fields needed for order 42. |

Choose the contract that fits the clients.

### Example state

| Item | State |
| --- | --- |
| Contract | REST, RPC, or GraphQL |
| Design focus | Resources, operations, fields |
| Check | Match client needs |

## Plan evolution

```step
diagram:
  type: svg
  alt: "Client (in focus): API consumer. API (in focus): Public contract. Keep old clients compatible. Service (context): Implements the operation. Flow: Client to API: List with cursor."
  caption: Add a new field before you remove one that deployed clients still use.
  src: diagrams/apis/2.svg
```

Define the **schema**, **error responses**, and **pagination**.

Add a new field as optional first. Test the old client against the new API.

### Example state

| Item | State |
| --- | --- |
| Contract | **Versioned contract** |
| Design focus | **Compatible changes** |
| Check | **Test older clients** |

## Operate the API

```step
diagram:
  type: svg
  alt: "Client (context): API consumer. API (in focus): Public contract. Check caller and deadline. Service (in focus): Implements the operation. Flow: API to Service: Send with deadline."
  caption: Apply authentication and rate limits at the entry point and authorization where the action is enforced.
  src: diagrams/apis/3.svg
```

For each request:

1. Authenticate the caller.
2. Check access to the order.
3. Apply a deadline.
4. Record latency and outcome.

### Example state

| Item | State |
| --- | --- |
| Contract | **Running API** |
| Design focus | **Deadlines and limits** |
| Check | **Observe failures** |
