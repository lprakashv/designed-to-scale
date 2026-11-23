---
title: Files & Media
summary: Store large objects separately from application metadata.
data:
  original: true
  nodes: [["Client","Uploads and downloads"],["Object storage","File bytes"],["Metadata DB","Ownership and object key"],["File API","Authorizes file access"]]
  layout: [[0,0],[1,0],[2,1],[1,1]]
  statusLabels: ["Bytes path","Metadata","Access state"]
---

## Upload a file

```step
data:
  active: [0,1,2,3]
  links: [[0,3,"Request an upload"],[3,2,"Record pending file"],[0,1,"Signed upload"]]
  callouts: [[3,"Authorize before signing"]]
  status: ["Upload to object store","Save file reference","Upload in progress"]
  visualNote: "The API provides signed upload access. The file bytes go directly to object storage."
```

1. The API checks access and records the pending upload.
2. It returns a **short-lived signed URL**.
3. The client uploads the bytes directly to object storage.

## Serve the file

```step
data:
  active: [0,1,2,3]
  links: [[0,3,"Request a download"],[3,2,"Check ownership"],[1,0,"Signed download"]]
  callouts: [[3,"Sign only after access check"]]
  status: ["Edge or object store","Resolve file reference","Public or authorized"]
  visualNote: "Check authorization before you issue a link to a private file."
```

- **Private file:** Check access first. Issue a short-lived download URL.
- **Public file:** Use a CDN if the cache policy permits it.

## Process safely

```step
data:
  active: [0,1,2,3]
  links: [[0,1,"Upload file"],[3,2,"Mark file ready"]]
  callouts: [[2,"Pending → ready after checks"]]
  status: ["Validation and worker","Track processing state","Ready after checks"]
  visualNote: "The metadata record becomes ready only after validation completes."
```

Check file size and content before marking the upload **ready**.

Process large files in the background. Clean up unfinished uploads after a defined period.
