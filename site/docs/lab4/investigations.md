---
sidebar_position: 1
---

# Lab 4 - 🔎 Investigations

## Learning objectives

- Run a Deep Investigation against the storefront
- Watch a multi-agent swarm fan out across metrics, logs, traces, and profiles
- Read the structured investigation report and refine it through the Workspace conversation
- Understand where Investigations fits in the incident response workflow

:::info
**Investigations is in Public Preview** as of April 2026. Breaking changes may occur before GA. Treat the workflow as roughly stable but expect UI details to shift.
:::

---

## The scenario

> "We just got a page: the storefront 'Frontend Success 99.5%' SLO is burning fast. The homepage is showing 500 errors, products are missing, and customers are complaining. We deployed something earlier today. What broke, and what do we need to roll back?"

This is the canonical use case for Investigations - a problem that touches multiple services (frontend → product catalog → postgres), needs cross-signal correlation, and a team that doesn't have 30 minutes to do it by hand.

:::tip
This scenario is a real Grafana Labs production incident from the "Day in the Life" demo - a connection pool exhaustion that took the on-call team 28 minutes to root-cause manually. Assistant Investigations found it in 8 minutes at 0.91 confidence.
:::

---

## Step 1 - Start a Deep Investigation

In the left sidebar, navigate to **Assistant → Investigations**. You'll land on the workbooks list where past investigations live.

<img src="/img/lab3-01a-investigations-page.png" alt="Investigations workbooks list under Assistant → Investigations" style={{maxWidth: '720px', display: 'block', margin: '0 auto 1.5rem'}} />

Click **+ New Investigation** to open the **Assistant Investigations** prompt. At the bottom-left of the input, confirm the **Deep Investigation** mode is selected (it should be the default).

You'll be prompted to describe the problem. Use this:

```text
The storefront homepage is showing 500 errors and products aren't displaying. The "Frontend Success 99.5%" SLO is burning. Investigate the full request chain - frontend, productcatalogservice, postgres - including recent deployments. Report the most likely root cause with supporting evidence.
```

<img src="/img/lab3-01b-deep-investigation-prompt.png" alt="Assistant Investigations splash with Deep Investigation mode selected and storefront prompt filled in" style={{maxWidth: '480px', display: 'block', margin: '0 auto 1.5rem'}} />

Submit the investigation.

:::tip
**Why this prompt works:**
- States the symptom (500 errors, missing products) and the business impact (SLO burning)
- Names the suspected dependency chain (frontend → productcatalog → postgres)
- Explicitly asks about recent deployments (a leading cause of incidents)
- Asks for both a conclusion AND the supporting evidence
:::

---

## Step 2 - Watch the multi-agent fan-out

Investigations kicks off a Lead investigator first, which then spawns specialized sub-agents that work the problem in parallel - a Prometheus Specialist for metrics, a Loki Error Specialist and Loki Specialist for logs, a Tempo Specialist for traces, and an MCP Specialist for things like recent code changes. The Workspace conversation alongside the report shows progress as they work.

<img src="/img/lab3-02a-investigation-starting.png" alt="Investigation kicking off with the Lead agent planning the next steps" style={{maxWidth: '720px', display: 'block', margin: '0 auto 1.5rem'}} />

As the investigation advances, more specialist agents join the Agent activity timeline and you can watch each one's work bars fill in:

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '400px'}}>
    <img src="/img/lab3-02b-multi-agent-fanout.png" alt="Multiple specialist agents working in parallel - Prometheus, Loki Error, Loki" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '400px'}}>
    <img src="/img/lab3-02c-fanout-timeline.png" alt="Full agent activity timeline with 17 agents and 103 messages exchanged" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

Hover any agent's bar in the Agent activity timeline to see exactly what that agent was checking, and what kind of cause it ended up attributing - **Local Cause** (a symptom in one component), **Systemic Cause** (a contributing factor across the chain), or **Root Cause** itself.

For example, hovering the Prometheus Specialist surfaces a `[Local Cause]` finding for productcatalogservice memory usage:

<img src="/img/lab3-02d-agent-local-cause.png" alt="Hovering an agent in the Agent activity timeline reveals the Prometheus Specialist tooltip with a [Local Cause] label for productcatalogservice memory usage" style={{maxWidth: '480px', display: 'block', margin: '0 auto 1.5rem'}} />

Other agents land on broader causes - here the Prometheus Specialist's Postgres query error check is flagged as a `[Systemic Cause]`, and the MCP Specialist's check of productcatalogservice v3.73.0 code changes ends up labeled as the `[Root Cause]`:

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '180px'}}>
    <img src="/img/lab3-02f-agent-systemic-cause.png" alt="Tooltip showing Prometheus Specialist [Systemic Cause] Postgres query errors" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '180px'}}>
    <img src="/img/lab3-02e-agent-root-cause.png" alt="Tooltip showing MCP Specialist [Root Cause] productcatalogservice v3.73.0 code changes" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

For this scenario, the most useful signals to watch for:

- **Logs**: `pq: sorry, too many clients already` (postgres connection exhaustion) and `invalid memory address or nil pointer dereference` (service crash)
- **Metrics**: postgres connection count over time, productcatalogservice request rate dropping, frontend error rate climbing
- **Traces**: 500 responses from productcatalogservice and failed downstream calls from frontend
- **Deployments**: any recent deployment annotations on productcatalogservice in the last few hours

This usually takes a few minutes. The investigation runs in the background, so you can navigate elsewhere in Grafana and return - find your in-progress and completed runs under **Assistant → Investigations**.

---

## Step 3 - Read the report

When the investigation completes, the page header shows the Assistant's Root Cause headline and the workbook status flips to **Completed**.

<img src="/img/lab3-03a-completed-report.png" alt="Completed investigation with Root Cause: ProductCatalogService v3.73.0 PostgreSQL Connection Pool Exhaustion" style={{maxWidth: '720px', display: 'block', margin: '0 auto 1.5rem'}} />

You get three views you can switch between:

- **Detailed report** - the synthesized findings, key observations, and recommended next steps
- **Tree View** - the hypothesis tree showing how each specialist's findings combined into a single root cause
- **Timeline** - the chronological event sequence the investigation reconstructed, with the relevant charts attached to each event

Start in the **Detailed report** view. Read it end-to-end - don't just scan. For this scenario, look for these three things explicitly:

1. **The smoking-gun log line.** The `pq: sorry, too many clients already` error should show up in the findings - that's postgres telling you it's out of connections.
2. **The sawtooth pattern.** Look for evidence the postgres connection count spikes, the product catalog crashes, connections drop, and the cycle repeats. That pattern is the signature of a connection leak.
3. **The root cause statement.** The expected finding: productcatalogservice is not closing its postgres connections. Connections accumulate until postgres hits its max (100), the service errors out, restarts (which closes connections), and the cycle repeats.

<img src="/img/lab3-03b-detailed-report.png" alt="Detailed report findings list - SLO misconfiguration, deployment-triggered connection pool exhaustion, HTTP 500 traces, cascading frontend failures" style={{maxWidth: '480px', display: 'block', margin: '0 auto 1.5rem'}} />

Then switch to **Tree View** to see what else the Assistant considered. Each node shows which agent ran which check and what cause level it found - Local Cause, Systemic Cause, or Root Cause. This is the alternatives view - useful evidence when you're explaining to the team why *this* is the cause and not something else.

Click into **Timeline** to see the chronological sequence the investigation reconstructed - which symptoms appeared first, when the deployment fired, when the connection pool exhausted, and how it cascaded to frontend 500s. Each event has the relevant chart attached.

<img src="/img/lab3-03c-timeline-view.png" alt="Timeline view showing 04:42:08 latency changepoint, 04:42:46 deployment triggering connection pool exhaustion, 04:44:00 frontend HTTP 500 errors peaking" style={{maxWidth: '480px', display: 'block', margin: '0 auto 1.5rem'}} />

:::info
**What "good" looks like for this investigation:** the report should connect three things explicitly - the frontend 500 errors, the product catalog restarts, and the postgres connection exhaustion. If it only finds one piece, that's a partial result you'd need to follow up on. If it correlates all three with a clear hypothesis (connection leak), the Assistant did the cross-signal correlation that's hard to do manually.
:::

---

## Step 4 - Refine the report

The report isn't directly editable - but the investigation is still a collaborative artifact, not a one-shot AI output. You can refine it through the **Workspace conversation** alongside the report.

Try adding a hint or correction. In the conversation panel, send something like:

```text
The report missed that this same connection-leak pattern caused an incident two weeks ago - the rollback was the right call. Add a "Prior incidents" section referencing the recurrence and recommend a k6 load test against postgres connection limits to prevent regression in CI.
```

Then click **Regenerate report**. The Assistant uses your additional context to produce an updated version.

<img src="/img/lab3-04a-refine-prior-incidents.png" alt="Workspace conversation response adding Prior Incidents section and k6 regression suite recommendations" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

You can also ask the Assistant to convert findings into another artifact:

```text
Turn the root cause and remediation into a Slack message I can paste into #incident-storefront.
```

```text
Draft the rollback steps as a backlog item I can paste into our issue tracker.
```

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '500px'}}>
    <img src="/img/lab3-04b-convert-slack-message.png" alt="Paste-ready Slack message generated from the investigation findings" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '500px'}}>
    <img src="/img/lab3-04c-convert-backlog-item.png" alt="Paste-ready backlog item with title, description, priority, component, and acceptance criteria" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

:::info
**Why this matters:** the LLM output is a strong starting point but it's not always exactly right. Treating the report as a draft you tighten through conversation - rather than a verdict - is how teams use Investigations in real incidents.
:::

---

:::info
**Worth knowing: MCP now works in Investigations.** Earlier versions of this lab (and earlier guidance to customers) said MCP actions weren't available in Investigations. That's no longer true - the Workspace conversation can call MCP servers like any regular Assistant chat, so you can ask it to file a GitHub issue, post to Slack, etc. directly from the workbook. We're not exercising that flow in this lab, but it's worth knowing for customer conversations. See the [Grafana Assistant docs on MCP actions in Skills](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/guides/skills/#take-action-with-mcp) for the supported environments (Slack, web Assistant, investigation mode, and backend agents).
:::

---

## Limitations worth knowing

- **Investigations is Cloud-only** - not available on self-managed Grafana Enterprise/OSS
- **Coverage depends on data sources** - Investigations is most useful when you have metrics + logs + traces at minimum. With only metrics, it degrades to a fancier metric query helper.
- **It's still LLM output** - high-confidence findings can be wrong. Verify before acting, and capture what you actually confirmed by adding corrections through the Workspace conversation (then regenerating) or by writing the verified version into your incident tool / ticket.

---

## ✅ Checklist

- [ ] Launched a Deep Investigation against the storefront
- [ ] Watched the multi-agent fan-out complete and hovered an agent to see its cause-level attribution
- [ ] Read the Detailed report, scanned Tree View and Timeline, and identified the root cause
- [ ] Refined the report via the Workspace conversation (added a hint or asked the Assistant to convert findings into another artifact)
