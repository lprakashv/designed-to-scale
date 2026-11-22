---
original: true
title: Transactions & Isolation
summary: Keep related changes correct under concurrent access.
nodes: [["Transaction A","First transfer"],["Database","Balances and ledger"],["Transaction B","Concurrent transfer"]]
layout: [[0,0],[1,0.5],[0,1]]
statusLabels: ["Unit of work","Concurrent access","Result"]
---

## Group changes

```step
active: [0,1]
links: [[0,1,"Debit and credit"]]
callouts: [[1,"Commit both or roll back"]]
status: ["Transaction","Changes grouped","Commit or rollback"]
visualNote: "Use one transaction for changes that must take effect together."
```

Put these actions in **one database transaction**:

1. Debit the source account.
2. Credit the destination.
3. Write the ledger entry.

They commit together or roll back together.

## Control concurrency

```step
active: [0,1,2]
links: [[0,1,"Read and debit"],[2,1,"Debit same account"]]
callouts: [[1,"Protect the balance invariant"]]
status: ["Transaction","Isolation rules apply","Anomalies depend on level"]
visualNote: "Repeat the same read inside two concurrent transactions to test the visible behavior."
```

Two transfers try to debit the same account.

> **Test the invariant.** Choose isolation and write rules that prevent both transfers from spending the same available balance.

## Choose and test

```step
active: [1,2]
links: [[2,1,"Retry transaction"]]
callouts: [[1,"Test both transfers together"]]
status: ["Transaction + constraints","Conflicts possible","Retry when appropriate"]
visualNote: "On a serialization failure, retry the whole transaction with a bound."
```

Use a database constraint or an atomic update when it can enforce the rule. Test two concurrent transfers.

If a serialization failure permits a retry, retry the **whole transaction**.
