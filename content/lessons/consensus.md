---
title: Consensus & Leaders
summary: Coordinate a replicated state machine across failures.
data:
  original: true
---

## Elect a leader

```step
diagram:
  type: svg
  alt: "Leader (in focus): Coordinates the log. New term. Followers (in focus): Voting replicas. Flow: Followers to Leader: Grant votes. Leader to Followers: Leader heartbeat."
  caption: A majority requirement prevents two disjoint groups from electing different leaders for the same term.
  src: diagrams/consensus/1.svg
```

In a **three-member Raft cluster**, a candidate needs **two votes** to become leader.

The leader sends heartbeats to maintain its role.

### Example state

| Item | State |
| --- | --- |
| Leader state | Election |
| Agreement | Majority vote |
| Progress | Wait for leader |

## Commit a change

```step
diagram:
  type: svg
  alt: "Client (added) (in focus): Submits writes. Leader (in focus): Coordinates the log. Current term + majority. Followers (in focus): Voting replicas. Flow: Client to Leader: Propose change. Leader to Followers: Append log entry. Followers to Leader: Acknowledge append."
  caption: The leader waits for the required replicas before it reports a committed change.
  src: diagrams/consensus/2.svg
```

The leader can commit an entry from its current term once a **majority** stores that entry.

In a three-member cluster, copies on the leader and one follower are enough.

### Example state

| Item | State |
| --- | --- |
| Leader state | **Leader available** |
| Agreement | **Quorum replication** |
| Progress | **Commit per protocol** |

## Handle failure

```step
diagram:
  type: svg
  alt: "Client (context): Submits writes. Leader (in focus): Coordinates the log. Followers (in focus): Voting replicas. Requires two of three votes. Flow: Followers to Leader: Elect a replacement."
  caption: If too few replicas remain reachable, operations that need agreement must wait.
  src: diagrams/consensus/3.svg
```

- **Two members can communicate:** They can elect a replacement if the candidate's log meets the protocol rules.
- **Only one member is reachable:** It cannot elect a leader or commit a new entry.

### Example state

| Item | State |
| --- | --- |
| Leader state | **Leader failed** |
| Agreement | **Needs a quorum** |
| Progress | **Restarts after election** |
