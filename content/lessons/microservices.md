---
title: Monolith vs Microservices
summary: Choose service boundaries based on real needs.
data:
  original: true
---

## Start with boundaries

```step
diagram:
  type: svg
  alt: "Client (in focus): Uses the public API. Application (in focus): Initial modular deployment. Use a module interface. Data (in focus): Application-owned records. Flow: Client to Application: Request an invoice. Application to Data: Read invoices."
  caption: Module boundaries make it possible to understand the responsibilities inside a single deployment.
  src: diagrams/microservices/1.svg
```

Start with order and invoice modules in **one deployment**.

Give each module a clear interface. This limits the effect of changes on the other module.

### Example state

| Item | State |
| --- | --- |
| Deployment | One application |
| Call path | In-process modules |
| Design check | Keep clear interfaces |

## Compare costs

```step
diagram:
  type: svg
  alt: "Client (in focus): Uses the public API. Application (in focus): Initial modular deployment. Data (in focus): Application-owned records. Invoice service (added) (in focus): Extracted deployment. Own invoice behavior and data. Flow: Client to Application: Request an invoice. Application to Invoice service: Request invoice. Invoice service to Data: Read owned data."
  caption: The invoice service is a separate deployment with ownership of invoice data.
  src: diagrams/microservices/2.svg
```

Extract the invoice module if it needs independent releases or scaling.

- Assign data ownership.
- Define how to handle **timeouts and failures** between services.
- Add monitoring for the new request path.

### Example state

| Item | State |
| --- | --- |
| Deployment | **Separate services** |
| Call path | **Network calls** |
| Design check | **Handle partial failure** |

## Evolve deliberately

```step
diagram:
  type: svg
  alt: "Client (context): Uses the public API. Application (in focus): Initial modular deployment. Compare release and runtime costs. Data (context): Application-owned records. Invoice service (in focus): Extracted deployment. Flow: Application to Invoice service: Measure call cost."
  caption: A team can extract a part that needs its own release cycle or scaling policy.
  src: diagrams/microservices/3.svg
```

Compare **release lead time** and **failure rates** before and after extraction.

Keep the modules together if the new deployment boundary adds more work than it saves.

### Example state

| Item | State |
| --- | --- |
| Deployment | **Split if justified** |
| Call path | **Selected boundary** |
| Design check | **Measure the benefit** |
