---
original: true
title: Authorization
summary: Decide which actions an identity may perform.
nodes: [["Identity","Known caller and action"],["Policy","Server-side decision"],["Resource","Protected order"]]
statusLabels: ["Identity","Policy scope","Outcome"]
---

## Check the action

```step
active: [0,1,2]
links: [[0,1,"Can edit order 42?"],[1,2,"Apply if allowed"]]
callouts: [[1,"Check action and owner"]]
status: ["Known caller","Action and resource","Allow or deny"]
visualNote: "A user who can update their own record may need separate permission to update someone else’s."
```

Before updating an order, check:

- **Who** is making the request?
- **Which action** are they asking to perform?
- **Who owns** the order?

## Apply least privilege

```step
active: [0,1]
links: [[0,1,"Check support role"]]
callouts: [[1,"Allow read, deny edits"]]
status: ["Role or attribute","Required permissions","Least privilege"]
visualNote: "Keep permissions limited to the actions a role needs."
```

Give support staff only the permissions they need.

A role can permit an action. The API still needs to check the tenant or owner for the specific order.

## Enforce on the server

```step
active: [0,1]
links: [[0,1,"Request update"]]
callouts: [[1,"Deny before touching order"]]
status: ["Server check","Every protected action","Reject if denied"]
visualNote: "Apply the policy at the trusted service before it reads or changes the resource."
```

Enforce authorization on the **server** for each protected request.

> **Test.** Change the order ID. The caller must be unable to read or change another tenant's order.
