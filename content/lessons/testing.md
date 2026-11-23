---
title: Testing
summary: Verify behavior at the right levels.
data:
  original: true
---

## Test behavior

```step
diagram:
  type: svg
  alt: "Unit (in focus): Checks focused logic. Cover discount rules. Integration (in focus): Checks real boundaries. Flow: Unit to Integration: Check constraints."
  caption: Verify behavior at the layer where a failure is easiest to reproduce.
  src: diagrams/testing/1.svg
```

| Test | Example |
| --- | --- |
| Unit | Check checkout price rules. |
| Integration | Verify the database constraint that prevents duplicate orders. |

### Example state

| Item | State |
| --- | --- |
| Scope | Unit and integration |
| Example check | Logic and boundaries |
| Feedback | Fast checks first |

## Test the system

```step
diagram:
  type: svg
  alt: "Unit (context): Checks focused logic. Integration (in focus): Checks real boundaries. System (added) (in focus): Checks user-facing paths. Run with load and failures. Flow: Integration to System: Test checkout."
  caption: Use load and failure tests when behavior depends on traffic or component outages.
  src: diagrams/testing/2.svg
```

Run a full purchase from the browser through storage.

Add a **load test** if peak traffic is a risk. Add a **failure test** if a dependency outage can change the outcome.

### Example state

| Item | State |
| --- | --- |
| Scope | **End to end** |
| Example check | **User path** |
| Feedback | **More setup** |

## Keep feedback useful

```step
diagram:
  type: svg
  alt: "Unit (in focus): Checks focused logic. Fast feedback. Integration (context): Checks real boundaries. System (in focus): Checks user-facing paths. Cover critical user paths."
  caption: Keep a failing check actionable by making its cause clear and repeatable.
  src: diagrams/testing/3.svg
```

Use fast tests for many inputs. Use more expensive tests for a few critical paths across components.

Make failures **repeatable** and easy to diagnose.

### Example state

| Item | State |
| --- | --- |
| Scope | **Risk-based suite** |
| Example check | **Critical paths** |
| Feedback | **Reliable results** |
