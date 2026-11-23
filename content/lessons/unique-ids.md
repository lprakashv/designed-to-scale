---
title: Unique IDs at Scale
summary: Generate identifiers without a single bottleneck.
data:
  original: true
---

## Define requirements

```step
diagram:
  type: svg
  alt: "Service A (in focus): Creates records. ID generator (in focus): Allocation or local generation. Choose uniqueness scope. Service B (in focus): Creates records. Flow: ID generator to Service A: Allocate ID. ID generator to Service B: Allocate another ID."
  caption: Decide whether the identifier will appear in a user-facing URL or stay internal.
  src: diagrams/unique-ids/1.svg
```

The two services create records independently. Decide what the IDs need to support:

- **Uniqueness** across services
- **Ordering** by time
- **Short or hard-to-guess** values

### Example state

| Item | State |
| --- | --- |
| Decision | Required properties |
| Candidate | Define first |
| Property to check | Sortable or opaque |

## Generate IDs

```step
diagram:
  type: svg
  alt: "Service A (context): Creates records. ID generator (in focus): Allocation or local generation. UUIDv4 or time-ordered IDs. Service B (context): Creates records."
  caption: Time-based formats need a design for clock changes and concurrent writers.
  src: diagrams/unique-ids/2.svg
```

Use **random UUIDv4** values when sorting by time is unimportant. Each service can generate them locally.

For ordered IDs, check the design of the clock and the source of randomness.

### Example state

| Item | State |
| --- | --- |
| Decision | **Generation** |
| Candidate | **Random or time-based** |
| Property to check | **Clock and collision handling** |

## Check the trade-offs

```step
diagram:
  type: svg
  alt: "Service A (in focus): Creates records. Authorize by record ownership. ID generator (context): Allocation or local generation. Service B (context): Creates records."
  caption: Authorize each request independently of whether a client can guess the ID.
  src: diagrams/unique-ids/3.svg
```

Measure index writes with the chosen ID format.

> **Warning.** A hard-to-guess ID does not grant access. Check whether the caller can use the record on every request.

### Example state

| Item | State |
| --- | --- |
| Decision | **Storage and access** |
| Candidate | **Check key shape** |
| Property to check | **Index locality** |
