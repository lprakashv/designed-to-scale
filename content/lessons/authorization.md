---
title: Authorization
summary: Decide which actions an identity may perform.
data:
  original: true
---

## Check the action

```step
diagram:
  type: svg
  alt: "Identity (in focus): Known caller and action. Policy (in focus): Server-side decision. Check action and owner. Resource (in focus): Protected order. Flow: Identity to Policy: Can edit order 42?. Policy to Resource: Apply if allowed."
  caption: A user who can update their own record may need separate permission to update someone else’s.
  src: diagrams/authorization/1.svg
```

Before updating an order, check:

- **Who** is making the request?
- **Which action** are they asking to perform?
- **Who owns** the order?

### Example state

| Item | State |
| --- | --- |
| Identity | Known caller |
| Policy scope | Action and resource |
| Outcome | Allow or deny |

## Apply least privilege

```step
diagram:
  type: svg
  alt: "Identity (in focus): Known caller and action. Policy (in focus): Server-side decision. Allow read, deny edits. Resource (context): Protected order. Flow: Identity to Policy: Check support role."
  caption: Keep permissions limited to the actions a role needs.
  src: diagrams/authorization/2.svg
```

Give support staff only the permissions they need.

A role can permit an action. The API still needs to check the tenant or owner for the specific order.

### Example state

| Item | State |
| --- | --- |
| Identity | **Role or attribute** |
| Policy scope | **Required permissions** |
| Outcome | **Least privilege** |

## Enforce on the server

```step
diagram:
  type: svg
  alt: "Identity (in focus): Known caller and action. Policy (in focus): Server-side decision. Deny before touching order. Resource (context): Protected order. Flow: Identity to Policy: Request update."
  caption: Apply the policy at the trusted service before it reads or changes the resource.
  src: diagrams/authorization/3.svg
```

Enforce authorization on the **server** for each protected request.

> **Test.** Change the order ID. The caller must be unable to read or change another tenant's order.

### Example state

| Item | State |
| --- | --- |
| Identity | **Server check** |
| Policy scope | **Every protected action** |
| Outcome | **Reject if denied** |
