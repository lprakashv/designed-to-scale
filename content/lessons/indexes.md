---
title: Indexes
summary: Trade write cost and storage for faster lookups.
data:
  original: true
  nodes: [["Query","Database statement"],["Index","Ordered keys or lookup"],["Rows","Table records"]]
  statusLabels: ["Lookup path","Extra work","Check"]
---

## Find rows

```step
data:
  active: [0,1,2]
  links: [[0,1,"Seek to customer 42"],[1,2,"Read matching rows"]]
  callouts: [[1,"Seek instead of scan"]]
  status: ["Index to rows","Maintain index","Compare with a scan"]
  visualNote: "An index can narrow the set of rows the database needs to examine."
```

The query filters on `customer_id = 42`. An index on `customer_id` lets the database find matching entries.

The database can then fetch the required rows.

## Match the query

```step
data:
  active: [0,1]
  links: [[0,1,"Filter and sort"]]
  callouts: [[1,"(customer_id, created_at)"]]
  status: ["Query-dependent","Key order matters","Inspect the plan"]
  visualNote: "Test with representative data. A planner can select a scan when a query matches many rows."
```

You need recent orders for one customer. Try an index on **`(customer_id, created_at)`**.

Compare the query plan and timings with a full scan. Use data that represents production.

## Pay the write cost

```step
data:
  active: [1,2]
  links: [[2,1,"Update index"]]
  callouts: [[2,"Each insert maintains indexes"]]
  status: ["Writes update index","More storage and I/O","Measure write cost"]
  visualNote: "Keep an index when the read benefit justifies its storage and write costs."
```

An insert or update must maintain the affected indexes.

> **Trade-off.** An index can speed up reads. It also uses storage and can slow writes. Measure both before keeping it.
