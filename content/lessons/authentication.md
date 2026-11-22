---
original: true
title: Authentication
summary: Verify who is making a request.
nodes: [["User","Person with a browser"],["Identity provider","Verifies identity"],["Application","Creates its own session"]]
layout: [[0,0.5],[1,0],[2,0.5]]
statusLabels: ["Identity check","Request state","Defense"]
---

## Verify identity

```step
active: [0,1]
links: [[0,1,"Authenticate"]]
callouts: [[1,"Verify credentials or passkey"]]
status: ["Credentials or provider","Unverified to verified","Validate proof"]
visualNote: "An application can delegate login to an identity provider and verify its response."
```

Use a standard protocol such as **OpenID Connect** and a maintained client library.

The identity provider verifies the user's sign-in.

## Maintain a session

```step
active: [0,1,2]
links: [[1,2,"Identity result"],[2,0,"Set session cookie"]]
callouts: [[2,"Validate proof and expiry"]]
status: ["Session or token","Authenticated","Expire or revoke"]
visualNote: "Set a lifetime that matches the amount of time a session remains useful."
```

Validate the identity result before you create a session. Use a secure session cookie when appropriate.

Define **expiry**, **revocation**, and what happens when the user signs out.

## Defend the entry point

```step
active: [0,1]
links: [[0,1,"Use passkey"]]
callouts: [[1,"Limit repeated attempts"]]
status: ["Login entry point","May reject attempts","MFA and rate limits"]
visualNote: "Use multiple factors where appropriate to limit the impact of a stolen password."
```

Use rate limits and strong authentication where the risk calls for them.

> **Test both paths.** Account recovery must protect the account as carefully as sign-in.
