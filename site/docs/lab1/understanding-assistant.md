---
sidebar_position: 1
---

# Lab 1 - Understanding the Basics of Grafana Assistant


This is the everyday foundation for everything else in the workshop. Before you reach for Investigations, Skills, or MCP, you should be fluent in the three things you'll do with the Assistant every single day:

1. **Ask questions**: prompt the assistant in natural language and understand what the Assistant can see
2. **Find dashboards**: navigate and find dashbaords by concept and have the Assistant explain them
3. **Understand your telemetry**: read and correlate metrics, logs, and traces to understand your telemetry

## Learning objectives

- Orient yourself in an unfamiliar stack by asking the Assistant about it
- Query metrics, logs, and traces with plain-language prompts
- Navigate Grafana by asking instead of clicking through menus
- Find dashboards semantically and understand what their panels show
- Read each telemetry signal, and correlate across them for a full picture

:::note
Before you start, make sure you're logged into your Grafana Cloud stack, the Assistant panel opens from the sparkles icon (top-right of the navigation bar), and you can reach the AppEnv e-commerce storefront. This lab uses the `frontend`, `productcatalogservice`, and friends in the `ecommerce-prod` namespace, and is about normal, day-to-day exploration.
:::

## Part 1 - Ask questions and get oriented

The fastest way to learn a new environment is to ask the Assistant about it. Instead of reading runbooks or clicking through every menu, start a conversation.

### Step 1.1 - See what the Assistant can do

Open the Assistant panel (the sparkles icon, top-right) and start a **new conversation**. Ask it the following questions:

```text
What can you help me with in this Grafana stack?
```

![stack](/img/1-grafana-stack.png)

Read the response. The Assistant describes its capabilities and the kinds of questions it can answer. This is a low-stakes way to understand the surface area before you need it in an incident.

### Step 1.2 - Ask about your environment

Now get the lay of the land by prompting the assistant with more specific questions related to your environment. Ask these questions one at a time and read each answer:

```text
What data sources are connected to this stack?
```

![data sources](/img/2-data-sources.png)

```text
What services are running in the ecommerce-prod namespace, and what does each one do?
```

![services](/img/3-services.png)

```text
Which services currently have the most traffic?
```

![traffic](/img/4-traffic.png)

The Assistant uses the connected Prometheus, Loki, and Tempo data sources in your specific stack, rather than giving generic advice. The Assistant can see your environment, you just need to point it at what you care about.

:::tip
**Anchor your questions.** The more specific you are about the service, the signal, and the time range, the more concrete the answer. "How's the frontend?" is vague; "What's the error rate for the frontend over the last hour?" gets you a number.
:::

### Step 1.3 - Ask a follow-up

The Assistant remembers the conversation. Without restating anything, send:

```text
Of those, which one would you look at first if a customer reported the storefront was slow?
```

The Assistant uses the prior context to reason about your specific services. This back-and-forth - asking, then narrowing - is the core everyday rhythm.

## Part 2 - Navigate Grafana by asking

You don't have to hunt through the navigation bar to get where you're going. The Assistant can take you there.

### Step 2.1 - Jump to a place in Grafana

In a new conversation, try:

```text
Take me to the list of dashboards.
```

```text
Open Explore so I can query metrics.
```

The Assistant responds with a link (or navigates you) to the right part of Grafana. This is a small thing that saves dozens of clicks a day.

### Step 2.2 - Ask where something lives

When you don't know where a feature is, ask instead of searching the docs:

```text
Where do I configure alert rules in this Grafana instance?
```

```text
How do I create a new dashboard folder?
```

:::tip
Treat the Assistant as a navigator and a "how do I…?" guide for Grafana itself, not just a data query tool. New team members ramp far faster when they can ask the product how it works.
:::

## Part 3 - Find and understand dashboards

Most teams have more dashboards than anyone can remember. The Assistant finds them by **meaning**, not exact name, and explains what they show.

### Step 3.1 - Find dashboards by concept

In a new conversation, send:

```text
What dashboards do we have related to the storefront or the productcatalogservice?
```

Then try a broader concept:

```text
Find dashboards that show database or postgres health.
```

The Assistant uses semantic search, so a dashboard called "Catalog Service Overview" can match a query about "product listings" even without the exact words.

### Step 3.2 - Understand what a dashboard shows

Pick one of the dashboards the Assistant returned and ask it to explain the contents:

```text
Explain what the panels on the productcatalogservice dashboard show, and what "good" looks like for each one.
```

This turns an unfamiliar wall of charts into something you can actually read.

### Step 3.3 - Ask about a specific panel

Drill into a single visualization:

```text
On that dashboard, which data source powers the latency panel, and what query is it running?
```

```text
What is the current value in the request rate panel, and is that normal?
```

The Assistant can read both the panel's **configuration** (its query and data source) and the **data** it's currently returning.

:::info
For deeper dashboard work - creating new dashboards, editing panels, changing visualizations - there's a dedicated **Dashboarding** mode. This lab stays in default mode and focuses on *finding and understanding* existing dashboards, which is the everyday case.
:::

## Part 4 - Understand your telemetry

This is the heart of everyday observability: reading the three signals and connecting them. You'll look at metrics, then logs, then traces - each with the Assistant's help - and finish by correlating them.

### Step 4.1 - Metrics: the shape of the system

Metrics tell you *what* is happening and *how much*. Start a new conversation and send:

```text
Show me the request rate, error rate, and P95 latency for the productcatalogservice over the last hour.
```

Read the charts. Ask the Assistant to interpret them for you:

```text
Is any of that outside the normal range? What would you keep an eye on?
```

This is the RED method (Rate, Errors, Duration) in practice - the everyday starting point for "how healthy is this service?"

### Step 4.2 - Logs: the detail behind the shape

Logs tell you *why*. Send:

```text
Show me recent error logs for the productcatalogservice.
```

Now use one of the Assistant's most useful everyday tricks - **summarize** a noisy log stream instead of reading it line by line:

```text
Summarize those errors - group them by message and tell me which is most common.
```

The Assistant condenses hundreds of log lines into a handful of patterns, so you can see the signal instead of scrolling.

### Step 4.3 - Traces: the path of a request

Traces tell you *where* time went and *which* dependency failed. Send:

```text
Show me a slow or failed trace involving the frontend in the last hour.
```

Then have the Assistant walk you through it:

```text
Explain what this trace shows - which service was slow, and where the time went.
```

Traces are the signal people find most intimidating; having the Assistant narrate the span breakdown makes them approachable.

### Step 4.4 - Correlate across signals

The real power is connecting the three. In the **same conversation**, tie them together:

```text
Bring it together: for the productcatalogservice over the last hour, do the error rate spikes in the metrics line up with the errors in the logs and the failures in the traces?
```

Correlating metrics → logs → traces is exactly what a manual investigation does by hand. Doing it conversationally is the everyday skill that makes the advanced labs (Investigations especially) click.

:::tip
**Metrics → Logs → Traces is the everyday loop.** Metrics show you *that* something changed, logs tell you *why*, and traces show you *where*. Get comfortable moving between them by asking, and most day-to-day questions answer themselves.
:::

## Part 5 - Put it all together

Finish with a single everyday prompt that exercises everything above: questions, dashboards, and all three signals at once.

Start a new conversation and send:

```text
Give me a quick health overview of the storefront right now. Cover the frontend and the productcatalogservice. Use metrics, logs, and traces, point me at the most relevant dashboard, and flag anything that looks off.
```

Read the response critically:

- Did it use **more than one signal** (not just metrics)?
- Did it point you at a **real dashboard** you could open?
- Did it **flag** something specific, or stay generic?

This is your everyday baseline. When you can get a useful health overview in one prompt and drill into any part of it with a follow-up, you've have the foundation of what the Assistant can do.

## What just happened

In this lab you practiced the three everyday workflows that underpin everything else:

- **Asking questions** - orienting in a stack, querying data, and following up in a conversation
- **Finding dashboards** - locating them by concept and understanding their panels
- **Understanding telemetry** - reading metrics, logs, and traces, and correlating across them

Every advanced capability - Memories, Investigations, Skills, MCP - is a force multiplier on top of these fundamentals.
