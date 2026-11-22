---
original: true
title: Design a News Feed
summary: Design a feed by estimating fan-out, choosing when to do work, and handling freshness and access.
nodes: [["Author","Publishes posts"],["Post service","Writes source posts"],["Post store","Source posts and timelines"],["Reader","Reads a page of posts"],["Feed service","Builds and filters pages"],["Follow store","Follower relationships"],["Fan-out queue","Buffers follower updates"],["Feed store","Prepared feed references"],["Policy service","Checks current visibility"]]
layout: [[0,0],[1,0],[0,1],[1,2],[1,1],[0,2],[2,0],[2,1],[2,2]]
statusLabels: [Workload, Feed strategy, Freshness]
---

## Define the product

```step
active: [0,1,3,4]
links: [[0,1,"Publish a post"],[3,4,"Request a feed page"],[4,3,"Return allowed posts"]]
callouts: [[4,"Start with chronological order"]]
status: ["Estimate next","Undecided","Undecided"]
visualNote: "Authors publish posts; readers request a feed of permitted posts."
```

Build a **chronological feed** of posts from followed accounts.

- People can publish, read, and page through posts.
- A post can become private or be deleted.
- New posts should appear within **seconds**. A short delay is acceptable.

Ranking, ads, and media storage are out of scope. Keep the read path available. Show only posts whose access you can verify.

## Estimate requests and fan-out

```step
active: [0,1,3,4]
links: [[0,1,"Submit new posts"],[3,4,"Read feed pages"]]
callouts: [[1,"116 posts/s average"],[4,"1,157 reads/s average"]]
status: ["116 posts/s · 1,157 reads/s","Undecided","Seconds target"]
visualNote: "Reads exceed posts, but each post can produce many feed updates."
```

Assume **10 million posts** and **100 million feed reads** per day. A day has **86,400 seconds**.

| Work | Average and 3× peak |
| --- | --- |
| Publish | **116/s** average, about 348/s peak |
| Read | **1,157/s** average, about 3,471/s peak |

With **200 followers per post**, fan-out creates **2 billion feed insertions/day**, about **23,148/s**. Measure the follower distribution before sizing workers.

## Start with a read-time merge

```step
active: [2,3,4,5]
links: [[3,4,"Open feed"],[4,5,"Read follows"],[4,2,"Fetch recent posts"],[4,3,"Merged page"]]
callouts: [[4,"Merge at read time"]]
status: ["1,157 reads/s average","Fan-out on read","Fresh at read"]
visualNote: "Each request finds followed authors, then merges their recent posts."
```

Store posts by author. Keep a record of who follows whom.

1. Fetch recent posts from followed authors.
2. Merge by creation time and a stable tie-breaker.
3. Return a page.

**Trade-off:** Publishing stays simple. Readers who follow many accounts make more work at read time. Indexes and batches help reduce lookup cost.

## Measure read amplification

```step
active: [2,4,5]
links: [[4,5,"Read 200 follows"],[4,2,"Read timelines"]]
callouts: [[2,"Measure reads per request"]]
status: ["1,157 reads/s × 200 authors","Fan-out on read","Fresh at read"]
visualNote: "The feed service reads from many author timelines for each feed request."
```

Assume each read looks up **200 author timelines**.

**1,157 reads/s × 200 ≈ 231,400 timeline lookups/s** before caching or batching.

> **Note.** This counts logical lookups. A batch can serve more than one lookup in a single database call. For ordinary authors, consider doing the merge work when they publish.

## Precompute ordinary feeds

```step
active: [0,1,2,6,7]
links: [[0,1,"Publish post"],[1,2,"Persist the post"],[1,6,"Emit fan-out event"],[6,7,"Write feed entries"]]
callouts: [[7,"One reference per follower"]]
status: ["≈23,148 inserts/s average","Fan-out on write","Async · seconds target"]
visualNote: "A worker consumes a post event and inserts a reference into each follower's feed."
```

1. Save the post.
2. Publish a durable event.
3. Insert a post reference into each follower's feed.

Reading a prepared list saves work at read time. The extra writes and references cost storage.

Use a **transactional outbox** or an equivalent mechanism to keep a committed post from losing its event. Make the worker safe to retry. Monitor queue age.

## Handle popular authors

```step
active: [1,2,4,6,7]
links: [[1,6,"Queue normal post"],[6,7,"Build normal feeds"],[4,2,"Pull popular feeds"]]
callouts: [[2,"Skip fan-out for popular authors"]]
status: ["Popular author: 10M followers","Hybrid fan-out","Merge at read"]
visualNote: "Ordinary posts are pushed to feeds; posts from very popular authors stay in an author timeline for read-time merge."
```

One post from an account with **10 million followers** needs **10 million insertions** if you push it to every feed.

At **20,000 insertions/s**, that takes **500 seconds** before retries or contention. The goal is seconds.

- **Ordinary authors:** Push references into follower feeds.
- **Popular authors:** Pull recent posts at read time.

Set the threshold from measured cost and latency. Test strategy changes for missing or duplicate posts.

## Page without losing position

```step
active: [2,3,4,7]
links: [[3,4,"Page + cursor"],[4,7,"Read prepared feed"],[4,2,"Read popular feeds"],[4,3,"Return page + cursor"]]
callouts: [[4,"Merge and deduplicate"]]
status: ["Page size 20","Hybrid merge","Cursor per page"]
visualNote: "The service merges candidate references and returns a cursor for the next page."
```

Use a stable cursor, such as **`(created_at, post_id)`**.

1. Fetch candidates from prepared feeds and popular timelines.
2. Merge the results and remove duplicates.
3. Return the next **20 permitted posts**.

Define a snapshot boundary for new posts. Store enough merge state in the cursor to resume across sources.

## Enforce access and deletion

```step
active: [3,4,7,8]
links: [[3,4,"Request next page"],[4,7,"Read feed entries"],[4,8,"Check access"],[4,3,"Return allowed posts"]]
callouts: [[8,"Fail closed if access is unknown"]]
status: ["Page size 20","Hybrid merge","Check access on read"]
visualNote: "Feed entries are candidate references; the service checks current visibility before returning a post."
```

A feed reference can outlive an unfollow, deletion, or privacy change. Treat it as a candidate. Check **current visibility** before returning the post.

> **Warning.** If the policy service is unavailable, withhold posts you cannot verify. Fetch more candidates only up to a defined limit.

Remove old entries in the background to reduce wasted work.

## Recap: the feed design

```step
active: [1,2,3,4,6,7,8]
links: [[1,6,"Queue ordinary post"],[6,7,"Save feed entries"],[3,4,"Read feed"],[4,7,"Read prepared feeds"],[4,2,"Merge popular feeds"],[4,8,"Check access"]]
callouts: [[4,"Filter and paginate the merge"]]
status: ["116 posts/s · 1,157 reads/s","Hybrid fan-out","Async + read checks"]
visualNote: "The push path builds ordinary feeds; the feed service also merges popular-author timelines and checks access."
```

| Decision | Benefit and cost |
| --- | --- |
| Push ordinary posts | Fewer read-time merges. More writes and queue lag. |
| Pull popular posts | Avoid millions of inserts for one post. Do more at read time. |
| Use stable cursors | Resume across pages. Define snapshot and duplicate rules. |
| Check current access | Protect private content. Adds a read-path dependency. |
| Make fan-out safe to retry | Recover from worker failure. Track lag and repeats. |

Measure follower counts, cache hit rates, queue delay, and page latency before choosing production thresholds.
