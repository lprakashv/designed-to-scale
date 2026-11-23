---
title: SQL vs NoSQL
summary: Select a data model based on access patterns and guarantees.
data:
  original: true
  nodes: [["Application","Order workflow"],["SQL store","Tables and joins"],["NoSQL store","Model varies by product"]]
  layout: [[0,0.5],[1,0],[1,1]]
  statusLabels: ["Main decision","SQL example","NoSQL example"]
---

## Model the data

```step
data:
  active: [0,1,2]
  links: [[0,1,"Store order rows"],[0,2,"Store a document"]]
  callouts: [[2,"Embed items for one read"]]
  status: ["Order and items","Join related tables","Read one document"]
  visualNote: "Sketch how a single user operation reads or changes the data in each model."
```

Start with one query. How does the application load an order and its items?

| Model | Order lookup |
| --- | --- |
| Relational | Join the order and its line items. |
| Document | Read one document with embedded items. |

Also compare how each model handles updates.

## Compare guarantees

```step
data:
  active: [1,2]
  callouts: [[1,"Check transaction scope"],[2,"Check document limits"]]
  status: ["Guarantees","Check isolation","Check product behavior"]
  visualNote: "Compare the guarantees of the specific database and configuration."
```

Assume one operation must reserve inventory and record payment state together.

- Check which records each database can update in **one transaction**.
- Check what other readers or writers can see while that transaction runs.

## Start with queries

```step
data:
  active: [0,1]
  links: [[0,1,"Query open orders"]]
  callouts: [[0,"List reads and invariants"]]
  status: ["Query fit","Joins and constraints","Key-based lookup"]
  visualNote: "Start with the reads and writes you need most often."
```

Choose a store after you write down:

- Common queries and update rules
- Expected write rate and data growth
- Constraints the store must enforce

Use the **same access patterns** to test each candidate.
