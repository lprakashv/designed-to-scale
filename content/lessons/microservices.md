---
title: Monolith vs Microservices
summary: Choose service boundaries based on real needs.
data:
  original: true
  nodes: [["Client","Uses the public API"],["Application","Initial modular deployment"],["Data","Application-owned records"],["Invoice service","Extracted deployment"]]
  layout: [[0,0],[1,0],[2,0],[1.5,1]]
  statusLabels: ["Deployment","Call path","Design check"]
---

## Start with boundaries

```step
data:
  active: [0,1,2]
  links: [[0,1,"Request an invoice"],[1,2,"Read invoices"]]
  callouts: [[1,"Use a module interface"]]
  status: ["One application","In-process modules","Keep clear interfaces"]
  visualNote: "Module boundaries make it possible to understand the responsibilities inside a single deployment."
```

Start with order and invoice modules in **one deployment**.

Give each module a clear interface. This limits the effect of changes on the other module.

## Compare costs

```step
data:
  active: [0,1,2,3]
  links: [[0,1,"Request an invoice"],[1,3,"Request invoice"],[3,2,"Read owned data"]]
  callouts: [[3,"Own invoice behavior and data"]]
  status: ["Separate services","Network calls","Handle partial failure"]
  visualNote: "The invoice service is a separate deployment with ownership of invoice data."
```

Extract the invoice module if it needs independent releases or scaling.

- Assign data ownership.
- Define how to handle **timeouts and failures** between services.
- Add monitoring for the new request path.

## Evolve deliberately

```step
data:
  active: [1,3]
  links: [[1,3,"Measure call cost"]]
  callouts: [[1,"Compare release and runtime costs"]]
  status: ["Split if justified","Selected boundary","Measure the benefit"]
  visualNote: "A team can extract a part that needs its own release cycle or scaling policy."
```

Compare **release lead time** and **failure rates** before and after extraction.

Keep the modules together if the new deployment boundary adds more work than it saves.
