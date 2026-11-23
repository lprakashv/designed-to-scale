---
title: Transactions & Isolation
summary: Keep related changes correct under concurrent access.
data:
  original: true
---

## Group changes

```step
diagram:
  type: svg
  alt: "Transaction A (in focus): First transfer. Database (in focus): Balances and ledger. Commit both or roll back. Flow: Transaction A to Database: Debit and credit."
  caption: Use one transaction for changes that must take effect together.
  src: diagrams/transactions/1.svg
```

Put these actions in **one database transaction**:

1. Debit the source account.
2. Credit the destination.
3. Write the ledger entry.

They commit together or roll back together.

### Example state

| Item | State |
| --- | --- |
| Unit of work | Transaction |
| Concurrent access | Changes grouped |
| Result | Commit or rollback |

## Control concurrency

```step
diagram:
  type: svg
  alt: "Transaction A (in focus): First transfer. Database (in focus): Balances and ledger. Protect the balance invariant. Transaction B (added) (in focus): Concurrent transfer. Flow: Transaction A to Database: Read and debit. Transaction B to Database: Debit same account."
  caption: Repeat the same read inside two concurrent transactions to test the visible behavior.
  src: diagrams/transactions/2.svg
```

Two transfers try to debit the same account.

> **Test the invariant.** Choose isolation and write rules that prevent both transfers from spending the same available balance.

### Example state

| Item | State |
| --- | --- |
| Unit of work | Transaction |
| Concurrent access | **Isolation rules apply** |
| Result | **Anomalies depend on level** |

## Choose and test

```step
diagram:
  type: svg
  alt: "Transaction A (context): First transfer. Database (in focus): Balances and ledger. Test both transfers together. Transaction B (in focus): Concurrent transfer. Flow: Transaction B to Database: Retry transaction."
  caption: On a serialization failure, retry the whole transaction with a bound.
  src: diagrams/transactions/3.svg
```

Use a database constraint or an atomic update when it can enforce the rule. Test two concurrent transfers.

If a serialization failure permits a retry, retry the **whole transaction**.

### Example state

| Item | State |
| --- | --- |
| Unit of work | **Transaction + constraints** |
| Concurrent access | **Conflicts possible** |
| Result | **Retry when appropriate** |
