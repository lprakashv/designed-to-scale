---
title: How a Request Travels
summary: Follow a page load from the browser to the server and back.
data:
  original: true
---

## Start with a page load

```step
diagram:
  type: svg
  alt: "Browser (in focus): Opens the book page. Empty DNS cache."
  caption: The first visit starts with an empty browser cache and no open connection.
  src: diagrams/request-lifecycle/1.svg
```

You open a book page in an online store. The browser needs to:

1. Find the server.
2. Open a connection.
3. Request the page.

> **Assumption.** The browser has no cached DNS answer or open connection.

### Example state

| Item | State |
| --- | --- |
| DNS | No cache entry |
| Connection | Closed |
| Request | Waiting |

## Find the address

```step
diagram:
  type: svg
  alt: "Browser (in focus): Opens the book page. DNS resolver (added) (in focus): Finds the server address. Cache the reply until expiry. Flow: Browser to DNS resolver: Resolve domain. DNS resolver to Browser: Return IP address."
  caption: The DNS reply gives the browser an address. The resolver can answer from its own cache.
  src: diagrams/request-lifecycle/2.svg
```

The browser needs an **IP address** for the store's domain.

1. Check the browser's cache.
2. If there is no valid answer, ask a **DNS resolver**.
3. The resolver checks its cache or queries other DNS servers.

> **Key idea.** The time to live (TTL) tells a cache how long it can reuse a DNS answer.

### Example state

| Item | State |
| --- | --- |
| DNS | **Address found** |
| Connection | Closed |
| Request | Waiting |

## Open a secure connection

```step
diagram:
  type: svg
  alt: "Browser (in focus): Opens the book page. Verify the server certificate. DNS resolver (context): Finds the server address. Web server (added) (in focus): Handles HTTP requests. Flow: Browser to Web server: Start TCP and TLS. Web server to Browser: Finish handshake."
  caption: This example uses TCP and TLS. Connection setup comes before the HTTP request.
  src: diagrams/request-lifecycle/3.svg
```

The browser opens a **TCP connection**. It then starts a **TLS handshake**.

During the handshake, the browser checks the server certificate. Both sides establish encryption keys.

> **Note.** Setup takes time before the first HTTP request. The browser can often reuse the connection.

> **Key idea.** A round trip includes the time for a message to reach the server and for a reply to return.

### Example state

| Item | State |
| --- | --- |
| DNS | **Address known** |
| Connection | **TLS ready** |
| Request | Waiting |

## Send the HTTP request

```step
diagram:
  type: svg
  alt: "Browser (in focus): Opens the book page. DNS resolver (context): Finds the server address. Web server (in focus): Handles HTTP requests. Route to the book handler. Flow: Browser to Web server: GET /books/42."
  caption: The request path tells the server which book page to build.
  src: diagrams/request-lifecycle/4.svg
```

The browser sends **`GET /books/42`**.

The server reads the path. It sends the request to the product page handler.

### Example state

| Item | State |
| --- | --- |
| DNS | Address known |
| Connection | TLS ready |
| Request | **GET sent** |

## Read the product data

```step
diagram:
  type: svg
  alt: "Browser (context): Opens the book page. DNS resolver (context): Finds the server address. Web server (in focus): Handles HTTP requests. Database (added) (in focus): Stores book records. One query on the critical path. Flow: Web server to Database: Query book 42. Database to Web server: Title and stock."
  caption: The database sends the product record to the application.
  src: diagrams/request-lifecycle/5.svg
```

The application asks the database for the book's **title**, **price**, and **stock status**.

The database returns the matching record. The application uses it to build the page.

### Example state

| Item | State |
| --- | --- |
| DNS | Address known |
| Connection | TLS ready |
| Request | **Reading data** |

## Receive the response

```step
diagram:
  type: svg
  alt: "Browser (in focus): Opens the book page. Parse the HTML. DNS resolver (context): Finds the server address. Web server (in focus): Handles HTTP requests. Database (context): Stores book records. Flow: Web server to Browser: Return 200 and HTML."
  caption: The response path runs from the application back to the browser.
  src: diagrams/request-lifecycle/6.svg
```

The server sends:

- The **HTTP status**
- The **response headers**
- The **HTML**

The browser can start parsing the HTML before it receives the entire response.

### Example state

| Item | State |
| --- | --- |
| DNS | Address known |
| Connection | TLS ready |
| Request | **HTML arriving** |

## Load the other files

```step
diagram:
  type: svg
  alt: "Browser (in focus): Opens the book page. Reuse the connection. DNS resolver (context): Finds the server address. Web server (in focus): Handles HTTP requests. Database (context): Stores book records. Flow: Browser to Web server: Request assets. Web server to Browser: Return assets."
  caption: The browser can request several page resources over the existing connection.
  src: diagrams/request-lifecycle/7.svg
```

The HTML points to more files. Examples include stylesheets, scripts, and the cover image.

- Use valid cached copies.
- Request the remaining files.

> **Note.** Some sites serve these files from a separate host.

### Example state

| Item | State |
| --- | --- |
| DNS | Address known |
| Connection | **Reused** |
| Request | **Fetching files** |

## Diagnose a slow database query

```step
diagram:
  type: svg
  alt: "Browser (context): Opens the book page. DNS resolver (context): Finds the server address. Web server (in focus): Handles HTTP requests. Database (in focus): Stores book records. Inspect the query plan. Flow: Web server to Database: Query book 42. Database to Web server: Slow query result."
  caption: Inspect the database part of the trace before adding application servers.
  src: diagrams/request-lifecycle/8.svg
```

The browser connects quickly. Most of the request time is in the book lookup.

| Use | To find |
| --- | --- |
| Server trace | The database call and its duration |
| Query plan | How the database searched for the row |

> **Key idea.** An index on a frequently queried field can reduce lookup time. Check the query plan and measure the result.

### Example state

| Item | State |
| --- | --- |
| DNS | Address known |
| Connection | Reused |
| Request | **Slow database read** |

## Compare users in different regions

```step
diagram:
  type: svg
  alt: "Browser (in focus): Opens the book page. Longer round-trip time. DNS resolver (context): Finds the server address. Web server (in focus): Handles HTTP requests. Database (context): Stores book records. Flow: Browser to Web server: Send request. Web server to Browser: Delayed response."
  caption: A distant visitor pays the extra delay on each network round trip.
  src: diagrams/request-lifecycle/9.svg
```

A distant visitor can wait longer even when the server does the same work. Each **network round trip** adds delay.

Compare timings from two regions. A **CDN** can serve eligible files closer to a visitor.

### Example state

| Item | State |
| --- | --- |
| DNS | Address known |
| Connection | **TLS ready** |
| Request | **Longer network path** |

## Review the timing

```step
diagram:
  type: svg
  alt: "Browser (in focus): Opens the book page. Compare cold and repeat visits. DNS resolver (in focus): Finds the server address. Web server (in focus): Handles HTTP requests. Database (in focus): Stores book records. Flow: Browser to DNS resolver: Resolve if needed. Browser to Web server: Connect and request. Web server to Database: Look up book. Database to Web server: Return record. Web server to Browser: Return the page."
  caption: Compare a first visit with a repeat visit to see which work the browser can skip.
  src: diagrams/request-lifecycle/10.svg
```

Compare browser timings for:

- DNS lookup and connection setup
- Time to the **first response byte**
- Download time

Use a server trace to see how much time the application and database spent.

> **Key idea.** Repeat the measurement with a warm cache and an existing connection. The browser can skip some of the work from the first load.

### Example state

| Item | State |
| --- | --- |
| DNS | **Cacheable** |
| Connection | **Reusable** |
| Request | **Page loaded** |
