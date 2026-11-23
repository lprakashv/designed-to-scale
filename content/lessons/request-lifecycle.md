---
title: How a Request Travels
summary: Follow a page load from the browser to the server and back.
data:
  original: true
  nodes: [["Browser","Opens the book page"],["DNS resolver","Finds the server address"],["Web server","Handles HTTP requests"],["Database","Stores book records"]]
  layout: [[0,0],[1,1],[1,0],[2,0]]
  statusLabels: ["DNS","Connection","Request"]
---

## Start with a page load

```step
data:
  active: [0]
  callouts: [[0,"Empty DNS cache"]]
  status: ["No cache entry","Closed","Waiting"]
  visualNote: "The first visit starts with an empty browser cache and no open connection."
```

You open a book page in an online store. The browser needs to:

1. Find the server.
2. Open a connection.
3. Request the page.

> **Assumption.** The browser has no cached DNS answer or open connection.

## Find the address

```step
data:
  active: [0,1]
  links: [[0,1,"Resolve domain"],[1,0,"Return IP address"]]
  callouts: [[1,"Cache the reply until expiry"]]
  status: ["Address found","Closed","Waiting"]
  note: "The time to live (TTL) tells a cache how long it can reuse a DNS answer."
  visualNote: "The DNS reply gives the browser an address. The resolver can answer from its own cache."
```

The browser needs an **IP address** for the store's domain.

1. Check the browser's cache.
2. If there is no valid answer, ask a **DNS resolver**.
3. The resolver checks its cache or queries other DNS servers.

## Open a secure connection

```step
data:
  active: [0,2]
  links: [[0,2,"Start TCP and TLS"],[2,0,"Finish handshake"]]
  callouts: [[0,"Verify the server certificate"]]
  status: ["Address known","TLS ready","Waiting"]
  note: "A round trip includes the time for a message to reach the server and for a reply to return."
  visualNote: "This example uses TCP and TLS. Connection setup comes before the HTTP request."
```

The browser opens a **TCP connection**. It then starts a **TLS handshake**.

During the handshake, the browser checks the server certificate. Both sides establish encryption keys.

> **Note.** Setup takes time before the first HTTP request. The browser can often reuse the connection.

## Send the HTTP request

```step
data:
  active: [0,2]
  links: [[0,2,"GET /books/42"]]
  callouts: [[2,"Route to the book handler"]]
  status: ["Address known","TLS ready","GET sent"]
  visualNote: "The request path tells the server which book page to build."
```

The browser sends **`GET /books/42`**.

The server reads the path. It sends the request to the product page handler.

## Read the product data

```step
data:
  active: [2,3]
  links: [[2,3,"Query book 42"],[3,2,"Title and stock"]]
  callouts: [[3,"One query on the critical path"]]
  status: ["Address known","TLS ready","Reading data"]
  visualNote: "The database sends the product record to the application."
```

The application asks the database for the book's **title**, **price**, and **stock status**.

The database returns the matching record. The application uses it to build the page.

## Receive the response

```step
data:
  active: [0,2]
  links: [[2,0,"Return 200 and HTML"]]
  callouts: [[0,"Parse the HTML"]]
  status: ["Address known","TLS ready","HTML arriving"]
  visualNote: "The response path runs from the application back to the browser."
```

The server sends:

- The **HTTP status**
- The **response headers**
- The **HTML**

The browser can start parsing the HTML before it receives the entire response.

## Load the other files

```step
data:
  active: [0,2]
  links: [[0,2,"Request assets"],[2,0,"Return assets"]]
  callouts: [[0,"Reuse the connection"]]
  status: ["Address known","Reused","Fetching files"]
  visualNote: "The browser can request several page resources over the existing connection."
```

The HTML points to more files. Examples include stylesheets, scripts, and the cover image.

- Use valid cached copies.
- Request the remaining files.

> **Note.** Some sites serve these files from a separate host.

## Diagnose a slow database query

```step
data:
  active: [2,3]
  links: [[2,3,"Query book 42"],[3,2,"Slow query result"]]
  callouts: [[3,"Inspect the query plan"]]
  status: ["Address known","Reused","Slow database read"]
  note: "An index on a frequently queried field can reduce lookup time. Check the query plan and measure the result."
  visualNote: "Inspect the database part of the trace before adding application servers."
```

The browser connects quickly. Most of the request time is in the book lookup.

| Use | To find |
| --- | --- |
| Server trace | The database call and its duration |
| Query plan | How the database searched for the row |

## Compare users in different regions

```step
data:
  active: [0,2]
  links: [[0,2,"Send request"],[2,0,"Delayed response"]]
  callouts: [[0,"Longer round-trip time"]]
  status: ["Address known","TLS ready","Longer network path"]
  visualNote: "A distant visitor pays the extra delay on each network round trip."
```

A distant visitor can wait longer even when the server does the same work. Each **network round trip** adds delay.

Compare timings from two regions. A **CDN** can serve eligible files closer to a visitor.

## Review the timing

```step
data:
  active: [0,1,2,3]
  links: [[0,1,"Resolve if needed"],[0,2,"Connect and request"],[2,3,"Look up book"],[3,2,"Return record"],[2,0,"Return the page"]]
  callouts: [[0,"Compare cold and repeat visits"]]
  status: ["Cacheable","Reusable","Page loaded"]
  note: "Repeat the measurement with a warm cache and an existing connection. The browser can skip some of the work from the first load."
  visualNote: "Compare a first visit with a repeat visit to see which work the browser can skip."
```

Compare browser timings for:

- DNS lookup and connection setup
- Time to the **first response byte**
- Download time

Use a server trace to see how much time the application and database spent.
