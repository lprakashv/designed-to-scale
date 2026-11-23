---
title: Content Delivery
summary: Place static content closer to users.
data:
  original: true
  nodes: [["User","Browser near the edge"],["Edge cache","Regional HTTP cache"],["Origin","Source server"]]
  statusLabels: ["Where served","Edge state","Origin traffic"]
---

## Serve from the edge

```step
data:
  active: [0,1]
  links: [[0,1,"Request logo"],[1,0,"Return cached logo"]]
  callouts: [[1,"Fresh copy nearby"]]
  status: ["Nearby edge","Hit","No read for this hit"]
  visualNote: "A fresh public asset can leave the edge without a trip to the origin."
```

A browser requests a public logo. A nearby **edge cache** has a fresh copy.

The edge returns the logo without a trip to the origin server.

## Fetch on a miss

```step
data:
  active: [0,1,2]
  links: [[0,1,"Request image"],[1,2,"Fetch from origin"],[2,1,"Cacheable response"],[1,0,"Serve image"]]
  callouts: [[2,"Origin handles the miss"]]
  status: ["Origin via edge","Miss","Fetch in progress"]
  visualNote: "The edge can keep an eligible origin response for the next visitor."
```

An edge cache receives a request for an image. It has no fresh copy.

1. Fetch the image from the **origin**.
2. Save it only if the cache policy allows it.
3. Return the image to the browser.

## Control freshness

```step
data:
  active: [1,2]
  links: [[2,1,"Cache headers"]]
  callouts: [[1,"Cache by versioned URL"],[2,"Mark private responses"]]
  status: ["Edge or origin","Versioned or expired","Fetch on miss"]
  visualNote: "A new versioned file name lets the previous cache entry expire on its own."
```

Give a changed logo a **new URL**. Cache each version for a long period.

> **Warning.** Set the correct cache headers for private content. A shared cache must not serve one user's data to someone else.
