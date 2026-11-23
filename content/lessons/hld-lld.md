---
title: HLD & LLD
summary: Move from a system's requirements to components, contracts, capacity, and failure behavior.
data:
  original: true
---

## Start with the problem

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and reads notes. Requirements (in focus): Scope and targets. Private notes only. Flow: Client to Requirements: Identify needs."
  caption: Identify the users and operations before selecting components.
  src: diagrams/hld-lld/1.svg
```

| Level | What it describes |
| --- | --- |
| **High-level design (HLD)** | Major components and how information moves between them. |
| **Low-level design (LLD)** | Interfaces, data, and what happens during a failure. |

Design a service for **private notes**. Users can create, read, and list their own notes. Search and sharing are out of scope.

Ask about availability, retention, access, and latency before you choose a database.

### Example state

| Item | State |
| --- | --- |
| Stage | Requirements |
| Question | Who needs what? |
| Outcome | Define scope |

## Size the workload

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and reads notes. Requirements (in focus): Scope and targets. 347 peak reads/s. Flow: Client to Requirements: Estimate traffic."
  caption: The workload estimate gives the API and storage a starting capacity target.
  src: diagrams/hld-lld/2.svg
```

Assume **1 million users**. Each reads **10 notes per day**.

- **Average:** 10 million ÷ 86,400 ≈ **116 reads/s**.
- **Peak:** About **347 reads/s** at an assumed 3×.
- **Storage:** 1 million new notes/day × 2 KB × 365 ≈ **730 GB/year**, before copies and overhead.

> **Assumption.** Measure note sizes, bursts, and retention before committing to capacity.

### Example state

| Item | State |
| --- | --- |
| Stage | **Sizing** |
| Question | **10M reads/day** |
| Outcome | **347 peak reads/s** |

## Draw the high-level path

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and reads notes. Requirements (context): Scope and targets. Load balancer (added) (in focus): Routes requests. Note API (added) (in focus): Validates and handles notes. Stateless API instances. Note store (added) (in focus): Persists notes and owners. Flow: Client to Load balancer: Create or read. Load balancer to Note API: Route to API. Note API to Note store: Read or write note. Note store to Note API: Return store result. Note API to Load balancer: Return HTTP result. Load balancer to Client: Relay the response."
  caption: The load balancer routes requests to an API, which reads and writes the store.
  src: diagrams/hld-lld/3.svg
```

Trace a create and a read through the **client**, **load balancer**, **note API**, and **note store**.

- The balancer sends each request to a stateless API instance.
- The API checks the caller's identity and note ownership.
- The store saves the note and its owner.

Use this path for peak-load and failure tests.

### Example state

| Item | State |
| --- | --- |
| Stage | **HLD** |
| Question | **Where does a request go?** |
| Outcome | **Stateless API + store** |

## Specify the interface

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and reads notes. Requirements (context): Scope and targets. Load balancer (in focus): Routes requests. Note API (in focus): Validates and handles notes. Check caller and input. Note store (in focus): Persists notes and owners. Flow: Client to Load balancer: POST /notes. Load balancer to Note API: Forward create. Note API to Note store: Store note + owner. Note store to Note API: Return new ID. Note API to Load balancer: Return 201. Load balancer to Client: Relay note ID."
  caption: The API validates input and returns a clear result for each operation.
  src: diagrams/hld-lld/4.svg
```

| Endpoint | Result |
| --- | --- |
| `POST /notes` | Save the body and return the new ID. |
| `GET /notes/{id}` | Return the note only to its owner. |

Define size limits, authentication, errors, and retry behavior. If creates must be safe to retry, define the scope and lifetime of an **idempotency key**.

### Example state

| Item | State |
| --- | --- |
| Stage | **LLD** |
| Question | **What is the contract?** |
| Outcome | **Validated request + response** |

## Model data and indexes

```step
diagram:
  type: svg
  alt: "Client (context): Creates and reads notes. Requirements (context): Scope and targets. Load balancer (context): Routes requests. Note API (in focus): Validates and handles notes. Note store (in focus): Persists notes and owners. Owner index (added) (in focus): Lists notes by owner. Stable order for pagination. Flow: Note API to Note store: List owner's notes. Note store to Owner index: Seek owner + time."
  caption: An ID identifies a note; an owner index supports listing a user's notes.
  src: diagrams/hld-lld/5.svg
```

A note stores an **ID**, **owner ID**, **body**, and **timestamps**.

- Use the primary key for lookup by note ID.
- Use an index on owner and creation time for an ordered list.
- Use a stable cursor when notes can arrive between pages.

Check ownership on each request. Measure the index's write and storage costs.

### Example state

| Item | State |
| --- | --- |
| Stage | LLD |
| Question | **How is data accessed?** |
| Outcome | **ID key + owner index** |

## Examine a failure

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and reads notes. Requirements (context): Scope and targets. Load balancer (in focus): Routes requests. Note API (in focus): Validates and handles notes. Note store (in focus): Persists notes and owners. Write and key commit together. Owner index (context): Lists notes by owner. Flow: Client to Load balancer: Retry with same key. Load balancer to Note API: Forward retry. Note API to Note store: Check prior outcome."
  caption: A timeout can leave the client unsure whether the write succeeded.
  src: diagrams/hld-lld/6.svg
```

The store can time out after it saves a note. The API may have received no result.

> **Warning.** A blind retry can create a duplicate. Save the idempotency key and result in the same transaction as the note. Return the prior result on retry.

Set a deadline. Limit retries and add backoff. Return a clear error during an outage. Test recovery from a backup.

### Example state

| Item | State |
| --- | --- |
| Stage | **Failure** |
| Question | **What if the store times out?** |
| Outcome | **Bounded retry + idempotency** |

## Check the design against the goal

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and reads notes. Requirements (context): Scope and targets. Load balancer (in focus): Routes requests. Note API (in focus): Validates and handles notes. Note store (in focus): Persists notes and owners. Owner index (context): Lists notes by owner. Monitoring (added) (in focus): Checks targets and failures. Measure p95 and p99. Flow: Client to Load balancer: Send peak load. Load balancer to Note API: Distribute requests. Note API to Note store: Test store paths. Note API to Monitoring: Report telemetry."
  caption: Measurements connect the high-level design and low-level choices to the original requirements.
  src: diagrams/hld-lld/7.svg
```

Run the full path at and above the estimated peak.

- Measure p95, p99, errors, queue wait, and store saturation.
- Fail one API instance. Restore data from a backup.
- Record which assumptions the tests cover.

If the store is slow, measure its access patterns before adding an index or cache. Set freshness and invalidation rules for any cache.

### Example state

| Item | State |
| --- | --- |
| Stage | **Validation** |
| Question | **Does the design meet the target?** |
| Outcome | **Load and failure tests** |

## Recap: connect HLD and LLD

```step
diagram:
  type: svg
  alt: "Client (in focus): Creates and reads notes. Requirements (in focus): Scope and targets. Tie choices to requirements. Load balancer (in focus): Routes requests. Note API (in focus): Validates and handles notes. Note store (in focus): Persists notes and owners. Owner index (in focus): Lists notes by owner. Monitoring (in focus): Checks targets and failures. Flow: Client to Load balancer: Submit request. Load balancer to Note API: Route to API. Note API to Note store: Validate and save. Note store to Owner index: Use the owner index. Note API to Monitoring: Check targets. Client to Requirements: Define needs."
  caption: The same board ties the private-note requirements to the API, store, index, and tests.
  src: diagrams/hld-lld/8.svg
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

### Example state

| Item | State |
| --- | --- |
| Stage | **Recap** |
| Question | **Requirements → evidence** |
| Outcome | **Revisit assumptions** |
