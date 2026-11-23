---
title: Design a News Feed
summary: Design a feed by estimating fan-out, choosing when to do work, and handling freshness and access.
data:
  original: true
---

## Define the product

```step
diagram:
  type: svg
  alt: "Author (in focus): Publishes posts. Post service (in focus): Writes source posts. Reader (in focus): Reads a page of posts. Feed service (in focus): Builds and filters pages. Start with chronological order. Flow: Author to Post service: Publish a post. Reader to Feed service: Request a feed page. Feed service to Reader: Return allowed posts."
  caption: Authors publish posts; readers request a feed of permitted posts.
  src: diagrams/design-news-feed/1.svg
```

Build a **chronological feed** of posts from followed accounts.

- People can publish, read, and page through posts.
- A post can become private or be deleted.
- New posts should appear within **seconds**. A short delay is acceptable.

Ranking, ads, and media storage are out of scope. Keep the read path available. Show only posts whose access you can verify.

### Example state

| Item | State |
| --- | --- |
| Workload | Estimate next |
| Feed strategy | Undecided |
| Freshness | Undecided |

## Estimate requests and fan-out

```step
diagram:
  type: svg
  alt: "Author (in focus): Publishes posts. Post service (in focus): Writes source posts. 116 posts/s average. Reader (in focus): Reads a page of posts. Feed service (in focus): Builds and filters pages. 1,157 reads/s average. Flow: Author to Post service: Submit new posts. Reader to Feed service: Read feed pages."
  caption: Reads exceed posts, but each post can produce many feed updates.
  src: diagrams/design-news-feed/2.svg
```

Assume **10 million posts** and **100 million feed reads** per day. A day has **86,400 seconds**.

| Work | Average and 3× peak |
| --- | --- |
| Publish | **116/s** average, about 348/s peak |
| Read | **1,157/s** average, about 3,471/s peak |

With **200 followers per post**, fan-out creates **2 billion feed insertions/day**, about **23,148/s**. Measure the follower distribution before sizing workers.

### Example state

| Item | State |
| --- | --- |
| Workload | **116 posts/s · 1,157 reads/s** |
| Feed strategy | Undecided |
| Freshness | **Seconds target** |

## Start with a read-time merge

```step
diagram:
  type: svg
  alt: "Author (context): Publishes posts. Post service (context): Writes source posts. Post store (added) (in focus): Source posts and timelines. Reader (in focus): Reads a page of posts. Feed service (in focus): Builds and filters pages. Merge at read time. Follow store (added) (in focus): Follower relationships. Flow: Reader to Feed service: Open feed. Feed service to Follow store: Read follows. Feed service to Post store: Fetch recent posts. Feed service to Reader: Merged page."
  caption: Each request finds followed authors, then merges their recent posts.
  src: diagrams/design-news-feed/3.svg
```

Store posts by author. Keep a record of who follows whom.

1. Fetch recent posts from followed authors.
2. Merge by creation time and a stable tie-breaker.
3. Return a page.

**Trade-off:** Publishing stays simple. Readers who follow many accounts make more work at read time. Indexes and batches help reduce lookup cost.

### Example state

| Item | State |
| --- | --- |
| Workload | **1,157 reads/s average** |
| Feed strategy | **Fan-out on read** |
| Freshness | **Fresh at read** |

## Measure read amplification

```step
diagram:
  type: svg
  alt: "Author (context): Publishes posts. Post service (context): Writes source posts. Post store (in focus): Source posts and timelines. Measure reads per request. Reader (context): Reads a page of posts. Feed service (in focus): Builds and filters pages. Follow store (in focus): Follower relationships. Flow: Feed service to Follow store: Read 200 follows. Feed service to Post store: Read timelines."
  caption: The feed service reads from many author timelines for each feed request.
  src: diagrams/design-news-feed/4.svg
```

Assume each read looks up **200 author timelines**.

**1,157 reads/s × 200 ≈ 231,400 timeline lookups/s** before caching or batching.

> **Note.** This counts logical lookups. A batch can serve more than one lookup in a single database call. For ordinary authors, consider doing the merge work when they publish.

### Example state

| Item | State |
| --- | --- |
| Workload | **1,157 reads/s × 200 authors** |
| Feed strategy | Fan-out on read |
| Freshness | Fresh at read |

## Precompute ordinary feeds

```step
diagram:
  type: svg
  alt: "Author (in focus): Publishes posts. Post service (in focus): Writes source posts. Post store (in focus): Source posts and timelines. Reader (context): Reads a page of posts. Feed service (context): Builds and filters pages. Follow store (context): Follower relationships. Fan-out queue (added) (in focus): Buffers follower updates. Feed store (added) (in focus): Prepared feed references. One reference per follower. Flow: Author to Post service: Publish post. Post service to Post store: Persist the post. Post service to Fan-out queue: Emit fan-out event. Fan-out queue to Feed store: Write feed entries."
  caption: A worker consumes a post event and inserts a reference into each follower's feed.
  src: diagrams/design-news-feed/5.svg
```

1. Save the post.
2. Publish a durable event.
3. Insert a post reference into each follower's feed.

Reading a prepared list saves work at read time. The extra writes and references cost storage.

Use a **transactional outbox** or an equivalent mechanism to keep a committed post from losing its event. Make the worker safe to retry. Monitor queue age.

### Example state

| Item | State |
| --- | --- |
| Workload | **≈23,148 inserts/s average** |
| Feed strategy | **Fan-out on write** |
| Freshness | **Async · seconds target** |

## Handle popular authors

```step
diagram:
  type: svg
  alt: "Author (context): Publishes posts. Post service (in focus): Writes source posts. Post store (in focus): Source posts and timelines. Skip fan-out for popular authors. Reader (context): Reads a page of posts. Feed service (in focus): Builds and filters pages. Follow store (context): Follower relationships. Fan-out queue (in focus): Buffers follower updates. Feed store (in focus): Prepared feed references. Flow: Post service to Fan-out queue: Queue normal post. Fan-out queue to Feed store: Build normal feeds. Feed service to Post store: Pull popular feeds."
  caption: Ordinary posts are pushed to feeds; posts from very popular authors stay in an author timeline for read-time merge.
  src: diagrams/design-news-feed/6.svg
```

One post from an account with **10 million followers** needs **10 million insertions** if you push it to every feed.

At **20,000 insertions/s**, that takes **500 seconds** before retries or contention. The goal is seconds.

- **Ordinary authors:** Push references into follower feeds.
- **Popular authors:** Pull recent posts at read time.

Set the threshold from measured cost and latency. Test strategy changes for missing or duplicate posts.

### Example state

| Item | State |
| --- | --- |
| Workload | **Popular author: 10M followers** |
| Feed strategy | **Hybrid fan-out** |
| Freshness | **Merge at read** |

## Page without losing position

```step
diagram:
  type: svg
  alt: "Author (context): Publishes posts. Post service (context): Writes source posts. Post store (in focus): Source posts and timelines. Reader (in focus): Reads a page of posts. Feed service (in focus): Builds and filters pages. Merge and deduplicate. Follow store (context): Follower relationships. Fan-out queue (context): Buffers follower updates. Feed store (in focus): Prepared feed references. Flow: Reader to Feed service: Page + cursor. Feed service to Feed store: Read prepared feed. Feed service to Post store: Read popular feeds. Feed service to Reader: Return page + cursor."
  caption: The service merges candidate references and returns a cursor for the next page.
  src: diagrams/design-news-feed/7.svg
```

Use a stable cursor, such as **`(created_at, post_id)`**.

1. Fetch candidates from prepared feeds and popular timelines.
2. Merge the results and remove duplicates.
3. Return the next **20 permitted posts**.

Define a snapshot boundary for new posts. Store enough merge state in the cursor to resume across sources.

### Example state

| Item | State |
| --- | --- |
| Workload | **Page size 20** |
| Feed strategy | **Hybrid merge** |
| Freshness | **Cursor per page** |

## Enforce access and deletion

```step
diagram:
  type: svg
  alt: "Author (context): Publishes posts. Post service (context): Writes source posts. Post store (context): Source posts and timelines. Reader (in focus): Reads a page of posts. Feed service (in focus): Builds and filters pages. Follow store (context): Follower relationships. Fan-out queue (context): Buffers follower updates. Feed store (in focus): Prepared feed references. Policy service (added) (in focus): Checks current visibility. Fail closed if access is unknown. Flow: Reader to Feed service: Request next page. Feed service to Feed store: Read feed entries. Feed service to Policy service: Check access. Feed service to Reader: Return allowed posts."
  caption: Feed entries are candidate references; the service checks current visibility before returning a post.
  src: diagrams/design-news-feed/8.svg
```

A feed reference can outlive an unfollow, deletion, or privacy change. Treat it as a candidate. Check **current visibility** before returning the post.

> **Warning.** If the policy service is unavailable, withhold posts you cannot verify. Fetch more candidates only up to a defined limit.

Remove old entries in the background to reduce wasted work.

### Example state

| Item | State |
| --- | --- |
| Workload | Page size 20 |
| Feed strategy | Hybrid merge |
| Freshness | **Check access on read** |

## Recap: the feed design

```step
diagram:
  type: svg
  alt: "Author (context): Publishes posts. Post service (in focus): Writes source posts. Post store (in focus): Source posts and timelines. Reader (in focus): Reads a page of posts. Feed service (in focus): Builds and filters pages. Filter and paginate the merge. Follow store (context): Follower relationships. Fan-out queue (in focus): Buffers follower updates. Feed store (in focus): Prepared feed references. Policy service (in focus): Checks current visibility. Flow: Post service to Fan-out queue: Queue ordinary post. Fan-out queue to Feed store: Save feed entries. Reader to Feed service: Read feed. Feed service to Feed store: Read prepared feeds. Feed service to Post store: Merge popular feeds. Feed service to Policy service: Check access."
  caption: The push path builds ordinary feeds; the feed service also merges popular-author timelines and checks access.
  src: diagrams/design-news-feed/9.svg
```

| Decision | Benefit and cost |
| --- | --- |
| Push ordinary posts | Fewer read-time merges. More writes and queue lag. |
| Pull popular posts | Avoid millions of inserts for one post. Do more at read time. |
| Use stable cursors | Resume across pages. Define snapshot and duplicate rules. |
| Check current access | Protect private content. Adds a read-path dependency. |
| Make fan-out safe to retry | Recover from worker failure. Track lag and repeats. |

Measure follower counts, cache hit rates, queue delay, and page latency before choosing production thresholds.

### Example state

| Item | State |
| --- | --- |
| Workload | **116 posts/s · 1,157 reads/s** |
| Feed strategy | **Hybrid fan-out** |
| Freshness | **Async + read checks** |
