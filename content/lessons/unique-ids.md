---
title: Unique IDs at Scale
summary: Generate identifiers without a single bottleneck.
data:
  original: true
  nodes: [["Service A","Creates records"],["ID generator","Allocation or local generation"],["Service B","Creates records"]]
  layout: [[1,0],[0,0.5],[1,1]]
  statusLabels: ["Decision","Candidate","Property to check"]
---

## Define requirements

```step
data:
  active: [0,1,2]
  links: [[1,0,"Allocate ID"],[1,2,"Allocate another ID"]]
  callouts: [[1,"Choose uniqueness scope"]]
  status: ["Required properties","Define first","Sortable or opaque"]
  visualNote: "Decide whether the identifier will appear in a user-facing URL or stay internal."
```

The two services create records independently. Decide what the IDs need to support:

- **Uniqueness** across services
- **Ordering** by time
- **Short or hard-to-guess** values

## Generate IDs

```step
data:
  active: [1]
  callouts: [[1,"UUIDv4 or time-ordered IDs"]]
  status: ["Generation","Random or time-based","Clock and collision handling"]
  visualNote: "Time-based formats need a design for clock changes and concurrent writers."
```

Use **random UUIDv4** values when sorting by time is unimportant. Each service can generate them locally.

For ordered IDs, check the design of the clock and the source of randomness.

## Check the trade-offs

```step
data:
  active: [0]
  callouts: [[0,"Authorize by record ownership"]]
  status: ["Storage and access","Check key shape","Index locality"]
  visualNote: "Authorize each request independently of whether a client can guess the ID."
```

Measure index writes with the chosen ID format.

> **Warning.** A hard-to-guess ID does not grant access. Check whether the caller can use the record on every request.
