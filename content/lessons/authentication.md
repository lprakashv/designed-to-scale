---
title: Authentication
summary: Verify who is making a request.
data:
  original: true
---

## Verify identity

```step
diagram:
  type: svg
  alt: "User (in focus): Person with a browser. Identity provider (in focus): Verifies identity. Verify credentials or passkey. Flow: User to Identity provider: Authenticate."
  caption: An application can delegate login to an identity provider and verify its response.
  src: diagrams/authentication/1.svg
```

Use a standard protocol such as **OpenID Connect** and a maintained client library.

The identity provider verifies the user's sign-in.

### Example state

| Item | State |
| --- | --- |
| Identity check | Credentials or provider |
| Request state | Unverified to verified |
| Defense | Validate proof |

## Maintain a session

```step
diagram:
  type: svg
  alt: "User (in focus): Person with a browser. Identity provider (in focus): Verifies identity. Application (added) (in focus): Creates its own session. Validate proof and expiry. Flow: Identity provider to Application: Identity result. Application to User: Set session cookie."
  caption: Set a lifetime that matches the amount of time a session remains useful.
  src: diagrams/authentication/2.svg
```

Validate the identity result before you create a session. Use a secure session cookie when appropriate.

Define **expiry**, **revocation**, and what happens when the user signs out.

### Example state

| Item | State |
| --- | --- |
| Identity check | **Session or token** |
| Request state | **Authenticated** |
| Defense | **Expire or revoke** |

## Defend the entry point

```step
diagram:
  type: svg
  alt: "User (in focus): Person with a browser. Identity provider (in focus): Verifies identity. Limit repeated attempts. Application (context): Creates its own session. Flow: User to Identity provider: Use passkey."
  caption: Use multiple factors where appropriate to limit the impact of a stolen password.
  src: diagrams/authentication/3.svg
```

Use rate limits and strong authentication where the risk calls for them.

> **Test both paths.** Account recovery must protect the account as carefully as sign-in.

### Example state

| Item | State |
| --- | --- |
| Identity check | **Login entry point** |
| Request state | **May reject attempts** |
| Defense | **MFA and rate limits** |
