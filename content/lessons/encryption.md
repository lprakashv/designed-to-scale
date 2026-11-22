---
original: true
title: Encryption & Secrets
summary: Protect data and manage keys separately from code.
nodes: [["Client","Caller verifies the peer"],["Service","Processes protected data"],["Secret store","Controls credentials and keys"]]
statusLabels: ["Protection","Material","Check"]
---

## Protect data in transit

```step
active: [0,1]
links: [[0,1,"Verified TLS"]]
callouts: [[0,"Verify server identity"]]
status: ["In transit","Certificates and keys","Verify peer"]
visualNote: "Use TLS on connections that carry sensitive data and verify the endpoint identity."
```

Use **TLS** when a connection carries sensitive data. Verify the certificate and the endpoint identity.

Choose encryption at rest based on who can access the stored data and how sensitive it is.

## Manage secrets

```step
active: [1,2]
links: [[1,2,"Get scoped secret"],[2,1,"Return credential"]]
callouts: [[2,"Grant access to service identity"]]
status: ["Stored credentials","Managed secret","Restrict retrieval"]
visualNote: "The service can retrieve its credential at runtime. Keep credential values out of logs and code."
```

The service retrieves secrets with a **scoped identity**. Grant access only to the secrets that service needs.

> **Warning.** Keep credentials out of code and logs.

## Rotate and audit

```step
active: [1,2]
links: [[1,2,"Get new key"]]
callouts: [[1,"Switch before retiring old key"]]
status: ["Key lifecycle","Rotate and revoke","Audit access"]
visualNote: "Verify that services can switch to a new key before you retire the old one."
```

1. Create the replacement credential.
2. Verify that the service can use it.
3. Revoke the old credential.

Record retrievals so you can investigate unexpected access.
