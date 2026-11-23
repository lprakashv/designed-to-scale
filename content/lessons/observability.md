---
title: Observability
summary: Use metrics, logs, and traces to understand system behavior.
data:
  original: true
  nodes: [["Services","User request paths"],["Telemetry","Metrics, traces, logs"],["Operators","Investigate and respond"]]
  statusLabels: ["Signal","Scope","Operator action"]
---

## Measure symptoms

```step
data:
  active: [0,1]
  links: [[0,1,"Latency and errors"]]
  callouts: [[1,"Measure user-visible success"]]
  status: ["Metrics","Service health","Check errors and latency"]
  visualNote: "Measure the rate of failed and slow requests from the caller’s point of view."
```

Measure what the shopper sees:

- **Success rate:** The share of valid checkout requests that succeed.
- **Latency:** How long the shopper waits.

Use traffic and resource saturation to diagnose problems.

## Follow a request

```step
data:
  active: [0,1,2]
  links: [[0,1,"Emit trace spans"],[1,2,"Inspect trace"]]
  callouts: [[1,"Carry a trace ID"]]
  status: ["Trace","One request","Find the slow span"]
  visualNote: "Follow the same request across components to see where it waited."
```

Send a **trace ID** between services. Use it to match spans and logs for a slow checkout.

> **Warning.** Keep secrets out of telemetry.

## Act on signals

```step
data:
  active: [1,2]
  links: [[1,2,"Alert on errors"]]
  callouts: [[2,"Trace user impact"]]
  status: ["Alert and dashboard","User impact","Confirm the cause"]
  visualNote: "Alert on a symptom that needs a response. Use traces and logs to investigate it."
```

Alert when checkout failures spend the error budget too fast.

Use traces and logs to find the affected dependency. Test that telemetry still works during outages.
