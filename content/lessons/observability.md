---
title: Observability
summary: Use metrics, logs, and traces to understand system behavior.
data:
  original: true
---

## Measure symptoms

```step
diagram:
  type: svg
  alt: "Services (in focus): User request paths. Telemetry (in focus): Metrics, traces, logs. Measure user-visible success. Flow: Services to Telemetry: Latency and errors."
  caption: Measure the rate of failed and slow requests from the caller’s point of view.
  src: diagrams/observability/1.svg
```

Measure what the shopper sees:

- **Success rate:** The share of valid checkout requests that succeed.
- **Latency:** How long the shopper waits.

Use traffic and resource saturation to diagnose problems.

### Example state

| Item | State |
| --- | --- |
| Signal | Metrics |
| Scope | Service health |
| Operator action | Check errors and latency |

## Follow a request

```step
diagram:
  type: svg
  alt: "Services (in focus): User request paths. Telemetry (in focus): Metrics, traces, logs. Carry a trace ID. Operators (added) (in focus): Investigate and respond. Flow: Services to Telemetry: Emit trace spans. Telemetry to Operators: Inspect trace."
  caption: Follow the same request across components to see where it waited.
  src: diagrams/observability/2.svg
```

Send a **trace ID** between services. Use it to match spans and logs for a slow checkout.

> **Warning.** Keep secrets out of telemetry.

### Example state

| Item | State |
| --- | --- |
| Signal | **Trace** |
| Scope | **One request** |
| Operator action | **Find the slow span** |

## Act on signals

```step
diagram:
  type: svg
  alt: "Services (context): User request paths. Telemetry (in focus): Metrics, traces, logs. Operators (in focus): Investigate and respond. Trace user impact. Flow: Telemetry to Operators: Alert on errors."
  caption: Alert on a symptom that needs a response. Use traces and logs to investigate it.
  src: diagrams/observability/3.svg
```

Alert when checkout failures spend the error budget too fast.

Use traces and logs to find the affected dependency. Test that telemetry still works during outages.

### Example state

| Item | State |
| --- | --- |
| Signal | **Alert and dashboard** |
| Scope | **User impact** |
| Operator action | **Confirm the cause** |
