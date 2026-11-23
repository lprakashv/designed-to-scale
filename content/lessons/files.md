---
title: Files & Media
summary: Store large objects separately from application metadata.
data:
  original: true
---

## Upload a file

```step
diagram:
  type: svg
  alt: "Client (in focus): Uploads and downloads. Object storage (in focus): File bytes. Metadata DB (in focus): Ownership and object key. File API (in focus): Authorizes file access. Authorize before signing. Flow: Client to File API: Request an upload. File API to Metadata DB: Record pending file. Client to Object storage: Signed upload."
  caption: The API provides signed upload access. The file bytes go directly to object storage.
  src: diagrams/files/1.svg
```

1. The API checks access and records the pending upload.
2. It returns a **short-lived signed URL**.
3. The client uploads the bytes directly to object storage.

### Example state

| Item | State |
| --- | --- |
| Bytes path | Upload to object store |
| Metadata | Save file reference |
| Access state | Upload in progress |

## Serve the file

```step
diagram:
  type: svg
  alt: "Client (in focus): Uploads and downloads. Object storage (in focus): File bytes. Metadata DB (in focus): Ownership and object key. File API (in focus): Authorizes file access. Sign only after access check. Flow: Client to File API: Request a download. File API to Metadata DB: Check ownership. Object storage to Client: Signed download."
  caption: Check authorization before you issue a link to a private file.
  src: diagrams/files/2.svg
```

- **Private file:** Check access first. Issue a short-lived download URL.
- **Public file:** Use a CDN if the cache policy permits it.

### Example state

| Item | State |
| --- | --- |
| Bytes path | **Edge or object store** |
| Metadata | **Resolve file reference** |
| Access state | **Public or authorized** |

## Process safely

```step
diagram:
  type: svg
  alt: "Client (in focus): Uploads and downloads. Object storage (in focus): File bytes. Metadata DB (in focus): Ownership and object key. Pending → ready after checks. File API (in focus): Authorizes file access. Flow: Client to Object storage: Upload file. File API to Metadata DB: Mark file ready."
  caption: The metadata record becomes ready only after validation completes.
  src: diagrams/files/3.svg
```

Check file size and content before marking the upload **ready**.

Process large files in the background. Clean up unfinished uploads after a defined period.

### Example state

| Item | State |
| --- | --- |
| Bytes path | **Validation and worker** |
| Metadata | **Track processing state** |
| Access state | **Ready after checks** |
