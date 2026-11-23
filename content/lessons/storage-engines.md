---
title: Storage Engines
summary: Compare common read and write paths.
data:
  original: true
---

## B-tree storage

```step
diagram:
  type: svg
  alt: "Writes (in focus): Record changes. Storage engine (in focus): Organizes key-value data. Disk (in focus): Pages or sorted files. Ordered tree pages. Flow: Writes to Storage engine: Update a key. Storage engine to Disk: Write changed pages. Disk to Storage engine: Read ordered pages."
  caption: The engine reads pages from disk on a cache miss and writes modified pages back. The two arrows show these directions.
  src: diagrams/storage-engines/1.svg
```

A **B-tree** keeps keys in sorted pages.

- For one key, follow the tree to the matching page.
- For a range, scan nearby entries in order.
- A write can change one or more pages.

### Example state

| Item | State |
| --- | --- |
| Disk writes | Page updates |
| Point lookup | Walk the B-tree |
| Background work | Flush dirty pages |

## Log-structured storage

```step
diagram:
  type: svg
  alt: "Writes (in focus): Record changes. Storage engine (in focus): Organizes key-value data. Merge files in compaction. Disk (in focus): Pages or sorted files. Flow: Writes to Storage engine: Buffer writes. Storage engine to Disk: Flush a sorted file."
  caption: The arrow to Disk represents a batch of sorted records. Background compaction reads and writes more data as it merges files.
  src: diagrams/storage-engines/2.svg
```

A **log-structured merge tree (LSM tree)** buffers writes in memory. It later writes them to sorted files.

- A **write-ahead log** can make buffered writes recoverable.
- **Compaction** merges files and removes obsolete values.

### Example state

| Item | State |
| --- | --- |
| Disk writes | **Sorted runs** |
| Point lookup | **Check recent data and files** |
| Background work | **Merge sorted files** |

## Consider amplification

```step
diagram:
  type: svg
  alt: "Writes (context): Record changes. Storage engine (in focus): Organizes key-value data. Disk (in focus): Pages or sorted files. Measure bytes written. Flow: Storage engine to Disk: Measure write I/O. Disk to Storage engine: Measure read I/O."
  caption: Choose with the expected reads and writes. Measure extra I/O and disk space under that workload.
  src: diagrams/storage-engines/3.svg
```

Measure work per user operation:

- **Read amplification:** Bytes read to serve a request.
- **Write amplification:** Bytes written to store a change.

Also measure disk use, compaction load, and tail latency.

### Example state

| Item | State |
| --- | --- |
| Disk writes | **Compare write I/O** |
| Point lookup | **Measure lookup I/O** |
| Background work | **Track cleanup cost** |
