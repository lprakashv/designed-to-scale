---
original: true
title: Testing
summary: Verify behavior at the right levels.
nodes: [["Unit","Checks focused logic"],["Integration","Checks real boundaries"],["System","Checks user-facing paths"]]
statusLabels: ["Scope","Example check","Feedback"]
---

## Test behavior

```step
active: [0,1]
links: [[0,1,"Check constraints"]]
callouts: [[0,"Cover discount rules"]]
status: ["Unit and integration","Logic and boundaries","Fast checks first"]
visualNote: "Verify behavior at the layer where a failure is easiest to reproduce."
```

| Test | Example |
| --- | --- |
| Unit | Check checkout price rules. |
| Integration | Verify the database constraint that prevents duplicate orders. |

## Test the system

```step
active: [1,2]
links: [[1,2,"Test checkout"]]
callouts: [[2,"Run with load and failures"]]
status: ["End to end","User path","More setup"]
visualNote: "Use load and failure tests when behavior depends on traffic or component outages."
```

Run a full purchase from the browser through storage.

Add a **load test** if peak traffic is a risk. Add a **failure test** if a dependency outage can change the outcome.

## Keep feedback useful

```step
active: [0,2]
callouts: [[0,"Fast feedback"],[2,"Cover critical user paths"]]
status: ["Risk-based suite","Critical paths","Reliable results"]
visualNote: "Keep a failing check actionable by making its cause clear and repeatable."
```

Use fast tests for many inputs. Use more expensive tests for a few critical paths across components.

Make failures **repeatable** and easy to diagnose.
