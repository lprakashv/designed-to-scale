---
title: Indexes
summary: Trade write cost and storage for faster lookups.
data:
  original: true
---

## Find rows

```step
diagram:
  type: svg
  alt: "Query (in focus): Database statement. Index (in focus): Ordered keys or lookup. Seek instead of scan. Rows (in focus): Table records. Flow: Query to Index: Seek to customer 42. Index to Rows: Read matching rows."
  caption: An index can narrow the set of rows the database needs to examine.
  src: diagrams/indexes/1.svg
```

The query filters on `customer_id = 42`. An index on `customer_id` lets the database find matching entries.

The database can then fetch the required rows.

### Example state

| Item | State |
| --- | --- |
| Lookup path | Index to rows |
| Extra work | Maintain index |
| Check | Compare with a scan |

## Match the query

```step
diagram:
  type: svg
  alt: "Query (in focus): Database statement. Index (in focus): Ordered keys or lookup. (customer_id, created_at). Rows (context): Table records. Flow: Query to Index: Filter and sort."
  caption: Test with representative data. A planner can select a scan when a query matches many rows.
  src: diagrams/indexes/2.svg
```

You need recent orders for one customer. Try an index on **`(customer_id, created_at)`**.

Compare the query plan and timings with a full scan. Use data that represents production.

### Example state

| Item | State |
| --- | --- |
| Lookup path | **Query-dependent** |
| Extra work | **Key order matters** |
| Check | **Inspect the plan** |

## Pay the write cost

```step
diagram:
  type: svg
  alt: "Query (context): Database statement. Index (in focus): Ordered keys or lookup. Rows (in focus): Table records. Each insert maintains indexes. Flow: Rows to Index: Update index."
  caption: Keep an index when the read benefit justifies its storage and write costs.
  src: diagrams/indexes/3.svg
```

An insert or update must maintain the affected indexes.

> **Trade-off.** An index can speed up reads. It also uses storage and can slow writes. Measure both before keeping it.

### Example state

| Item | State |
| --- | --- |
| Lookup path | **Writes update index** |
| Extra work | **More storage and I/O** |
| Check | **Measure write cost** |
