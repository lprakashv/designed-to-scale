---
title: Encryption & Secrets
summary: Protect data and manage keys separately from code.
data:
  original: true
---

## Protect data in transit

```step
diagram:
  type: svg
  alt: "Client (in focus): Caller verifies the peer. Verify server identity. Service (in focus): Processes protected data. Flow: Client to Service: Verified TLS."
  caption: Use TLS on connections that carry sensitive data and verify the endpoint identity.
  src: diagrams/encryption/1.svg
```

Use **TLS** when a connection carries sensitive data. Verify the certificate and the endpoint identity.

Choose encryption at rest based on who can access the stored data and how sensitive it is.

### Example state

| Item | State |
| --- | --- |
| Protection | In transit |
| Material | Certificates and keys |
| Check | Verify peer |

## Manage secrets

```step
diagram:
  type: svg
  alt: "Client (context): Caller verifies the peer. Service (in focus): Processes protected data. Secret store (added) (in focus): Controls credentials and keys. Grant access to service identity. Flow: Service to Secret store: Get scoped secret. Secret store to Service: Return credential."
  caption: The service can retrieve its credential at runtime. Keep credential values out of logs and code.
  src: diagrams/encryption/2.svg
```

The service retrieves secrets with a **scoped identity**. Grant access only to the secrets that service needs.

> **Warning.** Keep credentials out of code and logs.

### Example state

| Item | State |
| --- | --- |
| Protection | **Stored credentials** |
| Material | **Managed secret** |
| Check | **Restrict retrieval** |

## Rotate and audit

```step
diagram:
  type: svg
  alt: "Client (context): Caller verifies the peer. Service (in focus): Processes protected data. Switch before retiring old key. Secret store (in focus): Controls credentials and keys. Flow: Service to Secret store: Get new key."
  caption: Verify that services can switch to a new key before you retire the old one.
  src: diagrams/encryption/3.svg
```

1. Create the replacement credential.
2. Verify that the service can use it.
3. Revoke the old credential.

Record retrievals so you can investigate unexpected access.

### Example state

| Item | State |
| --- | --- |
| Protection | **Key lifecycle** |
| Material | **Rotate and revoke** |
| Check | **Audit access** |
