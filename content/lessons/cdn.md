---
title: Content Delivery
summary: Place static content closer to users.
data:
  original: true
---

## Serve from the edge

```step
diagram:
  type: svg
  alt: "User (in focus): Browser near the edge. Edge cache (in focus): Regional HTTP cache. Fresh copy nearby. Flow: User to Edge cache: Request logo. Edge cache to User: Return cached logo."
  caption: A fresh public asset can leave the edge without a trip to the origin.
  src: diagrams/cdn/1.svg
```

A browser requests a public logo. A nearby **edge cache** has a fresh copy.

The edge returns the logo without a trip to the origin server.

### Example state

| Item | State |
| --- | --- |
| Where served | Nearby edge |
| Edge state | Hit |
| Origin traffic | No read for this hit |

## Fetch on a miss

```step
diagram:
  type: svg
  alt: "User (in focus): Browser near the edge. Edge cache (in focus): Regional HTTP cache. Origin (added) (in focus): Source server. Origin handles the miss. Flow: User to Edge cache: Request image. Edge cache to Origin: Fetch from origin. Origin to Edge cache: Cacheable response. Edge cache to User: Serve image."
  caption: The edge can keep an eligible origin response for the next visitor.
  src: diagrams/cdn/2.svg
```

An edge cache receives a request for an image. It has no fresh copy.

1. Fetch the image from the **origin**.
2. Save it only if the cache policy allows it.
3. Return the image to the browser.

### Example state

| Item | State |
| --- | --- |
| Where served | **Origin via edge** |
| Edge state | **Miss** |
| Origin traffic | **Fetch in progress** |

## Control freshness

```step
diagram:
  type: svg
  alt: "User (context): Browser near the edge. Edge cache (in focus): Regional HTTP cache. Cache by versioned URL. Origin (in focus): Source server. Mark private responses. Flow: Origin to Edge cache: Cache headers."
  caption: A new versioned file name lets the previous cache entry expire on its own.
  src: diagrams/cdn/3.svg
```

Give a changed logo a **new URL**. Cache each version for a long period.

> **Warning.** Set the correct cache headers for private content. A shared cache must not serve one user's data to someone else.

### Example state

| Item | State |
| --- | --- |
| Where served | **Edge or origin** |
| Edge state | **Versioned or expired** |
| Origin traffic | **Fetch on miss** |
