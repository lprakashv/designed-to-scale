---
original: true
title: Consensus & Leaders
summary: Coordinate a replicated state machine across failures.
nodes: [["Client","Submits writes"],["Leader","Coordinates the log"],["Followers","Voting replicas"]]
statusLabels: ["Leader state","Agreement","Progress"]
---

## Elect a leader

```step
active: [1,2]
links: [[2,1,"Grant votes"],[1,2,"Leader heartbeat"]]
callouts: [[1,"New term"]]
status: ["Election","Majority vote","Wait for leader"]
visualNote: "A majority requirement prevents two disjoint groups from electing different leaders for the same term."
```

In a **three-member Raft cluster**, a candidate needs **two votes** to become leader.

The leader sends heartbeats to maintain its role.

## Commit a change

```step
active: [0,1,2]
links: [[0,1,"Propose change"],[1,2,"Append log entry"],[2,1,"Acknowledge append"]]
callouts: [[1,"Current term + majority"]]
status: ["Leader available","Quorum replication","Commit per protocol"]
visualNote: "The leader waits for the required replicas before it reports a committed change."
```

The leader can commit an entry from its current term once a **majority** stores that entry.

In a three-member cluster, copies on the leader and one follower are enough.

## Handle failure

```step
active: [1,2]
links: [[2,1,"Elect a replacement"]]
callouts: [[2,"Requires two of three votes"]]
status: ["Leader failed","Needs a quorum","Restarts after election"]
visualNote: "If too few replicas remain reachable, operations that need agreement must wait."
```

- **Two members can communicate:** They can elect a replacement if the candidate's log meets the protocol rules.
- **Only one member is reachable:** It cannot elect a leader or commit a new entry.
