---
title: SQL vs NoSQL
summary: Select a data model based on access patterns and guarantees.
data:
  original: true
---

## Model the data

```step
diagram:
  type: svg
  alt: "Application (in focus): Order workflow. SQL store (in focus): Tables and joins. NoSQL store (in focus): Model varies by product. Embed items for one read. Flow: Application to SQL store: Store order rows. Application to NoSQL store: Store a document."
  caption: Sketch how a single user operation reads or changes the data in each model.
  src: diagrams/sql-nosql/1.svg
```

Start with one query. How does the application load an order and its items?

| Model | Order lookup |
| --- | --- |
| Relational | Join the order and its line items. |
| Document | Read one document with embedded items. |

Also compare how each model handles updates.

### Example state

| Item | State |
| --- | --- |
| Main decision | Order and items |
| SQL example | Join related tables |
| NoSQL example | Read one document |

## Compare guarantees

```step
diagram:
  type: svg
  alt: "Application (context): Order workflow. SQL store (in focus): Tables and joins. Check transaction scope. NoSQL store (in focus): Model varies by product. Check document limits."
  caption: Compare the guarantees of the specific database and configuration.
  src: diagrams/sql-nosql/2.svg
```

Assume one operation must reserve inventory and record payment state together.

- Check which records each database can update in **one transaction**.
- Check what other readers or writers can see while that transaction runs.

### Example state

| Item | State |
| --- | --- |
| Main decision | **Guarantees** |
| SQL example | **Check isolation** |
| NoSQL example | **Check product behavior** |

## Start with queries

```step
diagram:
  type: svg
  alt: "Application (in focus): Order workflow. List reads and invariants. SQL store (in focus): Tables and joins. NoSQL store (context): Model varies by product. Flow: Application to SQL store: Query open orders."
  caption: Start with the reads and writes you need most often.
  src: diagrams/sql-nosql/3.svg
```

Choose a store after you write down:

- Common queries and update rules
- Expected write rate and data growth
- Constraints the store must enforce

Use the **same access patterns** to test each candidate.

### Example state

| Item | State |
| --- | --- |
| Main decision | **Query fit** |
| SQL example | **Joins and constraints** |
| NoSQL example | **Key-based lookup** |
