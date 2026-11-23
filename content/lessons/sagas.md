---
title: Sagas & Distributed Tx
summary: Use a saga to coordinate a distributed transaction across services.
data:
  original: true
---

## Break work into steps

```step
diagram:
  type: svg
  alt: "Order workflow (in focus): Tracks local steps. Record each step result. Payment (in focus): Authorizes or refunds. Inventory (in focus): Reserves stock. Flow: Order workflow to Payment: Charge the payment. Order workflow to Inventory: Reserve stock."
  caption: Each service commits its own change. Keep the outcome of each step so a retry can continue safely.
  src: diagrams/sagas/1.svg
```

The order workflow charges the payment, then reserves stock. Each service commits its own change locally.

Record each result before you continue.

### Example state

| Item | State |
| --- | --- |
| Workflow | Order started |
| Local effect | Payment and inventory steps |
| Recovery | Record progress |

## Compensate failures

```step
diagram:
  type: svg
  alt: "Order workflow (in focus): Tracks local steps. Payment (in focus): Authorizes or refunds. Refund is a separate action. Inventory (in focus): Reserves stock. Flow: Inventory to Order workflow: Reservation failed. Order workflow to Payment: Request refund."
  caption: A refund is a new action with its own result. Record its success or failure.
  src: diagrams/sagas/2.svg
```

If the payment succeeds and the stock reservation fails, request a **refund**. This is a compensating action.

> **Warning.** The refund can also fail. Record its outcome for retry or manual follow-up.

### Example state

| Item | State |
| --- | --- |
| Workflow | **Reservation failed** |
| Local effect | **Payment already applied** |
| Recovery | **Refund when possible** |

## Make progress visible

```step
diagram:
  type: svg
  alt: "Order workflow (in focus): Tracks local steps. Persist saga progress. Payment (in focus): Authorizes or refunds. Inventory (in focus): Reserves stock. Flow: Order workflow to Payment: Resume payment. Order workflow to Inventory: Resume reservation."
  caption: Store the current step so an operator can tell which actions still need attention.
  src: diagrams/sagas/3.svg
```

Give each step a **stable ID**. Make each effect safe to repeat.

Store workflow state so a recovered worker can continue. Operators can use the same state to inspect a stuck order.

### Example state

| Item | State |
| --- | --- |
| Workflow | **Workflow tracked** |
| Local effect | **Duplicate events possible** |
| Recovery | **Resume or inspect** |
