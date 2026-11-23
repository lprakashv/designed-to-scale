---
title: Sagas & Distributed Tx
summary: Use a saga to coordinate a distributed transaction across services.
data:
  original: true
  nodes: [["Order workflow","Tracks local steps"],["Payment","Authorizes or refunds"],["Inventory","Reserves stock"]]
  layout: [[0,0.5],[1,0],[1,1]]
  statusLabels: ["Workflow","Local effect","Recovery"]
---

## Break work into steps

```step
data:
  active: [0,1,2]
  links: [[0,1,"Charge the payment"],[0,2,"Reserve stock"]]
  callouts: [[0,"Record each step result"]]
  status: ["Order started","Payment and inventory steps","Record progress"]
  visualNote: "Each service commits its own change. Keep the outcome of each step so a retry can continue safely."
```

The order workflow charges the payment, then reserves stock. Each service commits its own change locally.

Record each result before you continue.

## Compensate failures

```step
data:
  active: [0,1,2]
  links: [[2,0,"Reservation failed"],[0,1,"Request refund"]]
  callouts: [[1,"Refund is a separate action"]]
  status: ["Reservation failed","Payment already applied","Refund when possible"]
  visualNote: "A refund is a new action with its own result. Record its success or failure."
```

If the payment succeeds and the stock reservation fails, request a **refund**. This is a compensating action.

> **Warning.** The refund can also fail. Record its outcome for retry or manual follow-up.

## Make progress visible

```step
data:
  active: [0,1,2]
  links: [[0,1,"Resume payment"],[0,2,"Resume reservation"]]
  callouts: [[0,"Persist saga progress"]]
  status: ["Workflow tracked","Duplicate events possible","Resume or inspect"]
  visualNote: "Store the current step so an operator can tell which actions still need attention."
```

Give each step a **stable ID**. Make each effect safe to repeat.

Store workflow state so a recovered worker can continue. Operators can use the same state to inspect a stuck order.
