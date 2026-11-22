---
original: true
title: Storage Engines
summary: Compare common read and write paths.
nodes: [["Writes","Record changes"],["Storage engine","Organizes key-value data"],["Disk","Pages or sorted files"]]
statusLabels: ["Disk writes","Point lookup","Background work"]
---

## B-tree storage

```step
active: [0,1,2]
links: [[0,1,"Update a key"],[1,2,"Write changed pages"],[2,1,"Read ordered pages"]]
callouts: [[2,"Ordered tree pages"]]
status: ["Page updates","Walk the B-tree","Flush dirty pages"]
visualNote: "The engine reads pages from disk on a cache miss and writes modified pages back. The two arrows show these directions."
```

A **B-tree** keeps keys in sorted pages.

- For one key, follow the tree to the matching page.
- For a range, scan nearby entries in order.
- A write can change one or more pages.

## Log-structured storage

```step
active: [0,1,2]
links: [[0,1,"Buffer writes"],[1,2,"Flush a sorted file"]]
callouts: [[1,"Merge files in compaction"]]
status: ["Sorted runs","Check recent data and files","Merge sorted files"]
visualNote: "The arrow to Disk represents a batch of sorted records. Background compaction reads and writes more data as it merges files."
```

A **log-structured merge tree (LSM tree)** buffers writes in memory. It later writes them to sorted files.

- A **write-ahead log** can make buffered writes recoverable.
- **Compaction** merges files and removes obsolete values.

## Consider amplification

```step
active: [1,2]
links: [[1,2,"Measure write I/O"],[2,1,"Measure read I/O"]]
callouts: [[2,"Measure bytes written"]]
status: ["Compare write I/O","Measure lookup I/O","Track cleanup cost"]
visualNote: "Choose with the expected reads and writes. Measure extra I/O and disk space under that workload."
```

Measure work per user operation:

- **Read amplification:** Bytes read to serve a request.
- **Write amplification:** Bytes written to store a change.

Also measure disk use, compaction load, and tail latency.
