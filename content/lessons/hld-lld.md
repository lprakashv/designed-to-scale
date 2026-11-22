---
original: true
title: HLD & LLD
summary: Move from a system's requirements to components, contracts, capacity, and failure behavior.
nodes: [["Client","Creates and reads notes"],["Requirements","Scope and targets"],["Load balancer","Routes requests"],["Note API","Validates and handles notes"],["Note store","Persists notes and owners"],["Owner index","Lists notes by owner"],["Monitoring","Checks targets and failures"]]
layout: [[0,0],[0,1],[1,0],[2,0],[1,1],[2,1],[0,2]]
statusLabels: [Stage, Question, Outcome]
---

## Start with the problem

```step
active: [0,1]
links: [[0,1,"Identify needs"]]
callouts: [[1,"Private notes only"]]
status: ["Requirements","Who needs what?","Define scope"]
visualNote: "Identify the users and operations before selecting components."
```

| Level | What it describes |
| --- | --- |
| **High-level design (HLD)** | Major components and how information moves between them. |
| **Low-level design (LLD)** | Interfaces, data, and what happens during a failure. |

Design a service for **private notes**. Users can create, read, and list their own notes. Search and sharing are out of scope.

Ask about availability, retention, access, and latency before you choose a database.

## Size the workload

```step
active: [0,1]
links: [[0,1,"Estimate traffic"]]
callouts: [[1,"347 peak reads/s"]]
status: ["Sizing","10M reads/day","347 peak reads/s"]
visualNote: "The workload estimate gives the API and storage a starting capacity target."
```

Assume **1 million users**. Each reads **10 notes per day**.

- **Average:** 10 million ÷ 86,400 ≈ **116 reads/s**.
- **Peak:** About **347 reads/s** at an assumed 3×.
- **Storage:** 1 million new notes/day × 2 KB × 365 ≈ **730 GB/year**, before copies and overhead.

> **Assumption.** Measure note sizes, bursts, and retention before committing to capacity.

## Draw the high-level path

```step
active: [0,2,3,4]
links: [[0,2,"Create or read"],[2,3,"Route to API"],[3,4,"Read or write note"],[4,3,"Return store result"],[3,2,"Return HTTP result"],[2,0,"Relay the response"]]
callouts: [[3,"Stateless API instances"]]
status: ["HLD","Where does a request go?","Stateless API + store"]
visualNote: "The load balancer routes requests to an API, which reads and writes the store."
```

Trace a create and a read through the **client**, **load balancer**, **note API**, and **note store**.

- The balancer sends each request to a stateless API instance.
- The API checks the caller's identity and note ownership.
- The store saves the note and its owner.

Use this path for peak-load and failure tests.

## Specify the interface

```step
active: [0,2,3,4]
links: [[0,2,"POST /notes"],[2,3,"Forward create"],[3,4,"Store note + owner"],[4,3,"Return new ID"],[3,2,"Return 201"],[2,0,"Relay note ID"]]
callouts: [[3,"Check caller and input"]]
status: ["LLD","What is the contract?","Validated request + response"]
visualNote: "The API validates input and returns a clear result for each operation."
```

| Endpoint | Result |
| --- | --- |
| `POST /notes` | Save the body and return the new ID. |
| `GET /notes/{id}` | Return the note only to its owner. |

Define size limits, authentication, errors, and retry behavior. If creates must be safe to retry, define the scope and lifetime of an **idempotency key**.

## Model data and indexes

```step
active: [3,4,5]
links: [[3,4,"List owner's notes"],[4,5,"Seek owner + time"]]
callouts: [[5,"Stable order for pagination"]]
status: ["LLD","How is data accessed?","ID key + owner index"]
visualNote: "An ID identifies a note; an owner index supports listing a user's notes."
```

A note stores an **ID**, **owner ID**, **body**, and **timestamps**.

- Use the primary key for lookup by note ID.
- Use an index on owner and creation time for an ordered list.
- Use a stable cursor when notes can arrive between pages.

Check ownership on each request. Measure the index's write and storage costs.

## Examine a failure

```step
active: [0,2,3,4]
links: [[0,2,"Retry with same key"],[2,3,"Forward retry"],[3,4,"Check prior outcome"]]
callouts: [[4,"Write and key commit together"]]
status: ["Failure","What if the store times out?","Bounded retry + idempotency"]
visualNote: "A timeout can leave the client unsure whether the write succeeded."
```

The store can time out after it saves a note. The API may have received no result.

> **Warning.** A blind retry can create a duplicate. Save the idempotency key and result in the same transaction as the note. Return the prior result on retry.

Set a deadline. Limit retries and add backoff. Return a clear error during an outage. Test recovery from a backup.

## Check the design against the goal

```step
active: [0,2,3,4,6]
links: [[0,2,"Send peak load"],[2,3,"Distribute requests"],[3,4,"Test store paths"],[3,6,"Report telemetry"]]
callouts: [[6,"Measure p95 and p99"]]
status: ["Validation","Does the design meet the target?","Load and failure tests"]
visualNote: "Measurements connect the high-level design and low-level choices to the original requirements."
```

Run the full path at and above the estimated peak.

- Measure p95, p99, errors, queue wait, and store saturation.
- Fail one API instance. Restore data from a backup.
- Record which assumptions the tests cover.

If the store is slow, measure its access patterns before adding an index or cache. Set freshness and invalidation rules for any cache.

## Recap: connect HLD and LLD

```step
active: [0,1,2,3,4,5,6]
links: [[0,2,"Submit request"],[2,3,"Route to API"],[3,4,"Validate and save"],[4,5,"Use the owner index"],[3,6,"Check targets"],[0,1,"Define needs"]]
callouts: [[1,"Tie choices to requirements"]]
status: ["Recap","Requirements → evidence","Revisit assumptions"]
visualNote: "The same board ties the private-note requirements to the API, store, index, and tests."
```

| Decision | Why it matters |
| --- | --- |
| Limit scope to private notes | Keep the core workflow clear. Confirm exclusions. |
| Use stateless API instances | Scale the request tier. Test instance loss. |
| Store note ownership | Enforce access. Test an unauthorized request. |
| Index owner and time | List in order. Measure write and storage costs. |
| Make creation idempotent | Retry safely. Define key expiry and atomicity. |
| Test load and recovery | Check the design against its targets. |

**HLD** chooses the major paths. **LLD** makes them specific enough to build, test, and operate.
