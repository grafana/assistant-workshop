---
sidebar_position: 1
---

# Lab 1 - Understanding the Basics of Grafana Assistant


The slides introduced the whole of Grafana Assistant, including Memories, Investigations, MCP, Rules, and Skills. Labs 2 to 5 put those to work on a real incident, on the command line, and in your own tooling. This lab stays with the everyday Assistant, because every one of those capabilities is built on the same three habits you'll use dozens of times a day:

1. **Ask questions**: prompt the Assistant in natural language and understand what it can see
2. **Navigate and find things**: get to the right dashboard, alert, or schedule by asking for it
3. **Understand your telemetry**: ask a real question and let the Assistant work across metrics, logs, traces, profiles, and your other data sources to answer it

## Learning objectives

- Orient yourself in an unfamiliar stack by asking the Assistant about it
- Query your telemetry with plain-language prompts instead of query syntax
- Navigate Grafana by asking instead of clicking through menus
- Find dashboards semantically and understand what their panels show
- Ask one broad question about a system's health and drill into the evidence behind the answer

:::note
Before you start, make sure you're logged into your Grafana Cloud stack, the Assistant panel opens from the sparkles icon (top-right of the navigation bar), and you can reach the e-commerce storefront. This lab uses the `frontend`, `productcatalogservice`, and the other services in the `ecommerce-prod` namespace, and is about normal, day-to-day exploration.
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
Which services in ecommerce-prod are handling the most traffic right now?
```

The Assistant answers from the data sources connected to your stack rather than giving generic advice, and it works out which ones to reach for from the question you asked.

:::assistant-tip
**You don't have to know the metric name, or even be precise.** The Assistant doesn't only run the query you asked for. Memories give it a picture of your estate built from your own telemetry: which services exist, what they're called in conversation, how they depend on each other, and where each one's metrics, logs, and traces live. That pooled knowledge is what lets it turn "which services have the most traffic" into the right query against the right data source, and "how's checkout doing?" into the services and signals that actually make up checkout.

So being vague is a reasonable place to start. Ask the question you'd ask a teammate, see what it infers, and correct it if it reached for the wrong thing. Being specific about the service, the signal, and the time range is how you sharpen an answer, not a prerequisite for getting one. "How's the frontend?" gets you a readout; "What's the error rate for the frontend over the last hour?" gets you a number.
:::

### Step 1.3 - Ask a follow-up

The Assistant remembers the conversation. Without restating anything, send:

```text
Of those, which one would you look at first if a customer reported the frontend was slow?
```

![frontend](/img/5-slow-frontend.png)

The Assistant uses the prior context to reason about your specific services.

## Part 2 - Navigate Grafana by asking

You don't have to hunt through the navigation bar to get where you're going. The Assistant can take you there, and it works across the whole of Grafana Cloud, not just the parts you already use.

### Step 2.1 - Jump to a place in Grafana

In a new conversation, send these one at a time, following each link before you send the next:

```text
Take me to the on-call schedules so I can see who's on call at the moment.
```

```text
Take me to alerting so I can see what's firing right now.
```

```text
Show me the executive ecommerce dashboard.
```

Each one lands you somewhere different: IRM, Alerting, and a business dashboard. Note what the third one did. You didn't give it a dashboard name; the storefront's board is called **Executive Overview**, and the Assistant matched your description to it. That's the same semantic matching you'll use properly in Part 3.

:::note
If nothing is firing when you ask, you've caught the storefront on a good day. Ask `What alerts have fired in the last 24 hours?` instead, and you'll get the recent history rather than an empty page.
:::

This is a small thing that saves dozens of clicks a day, and a useful one on parts of the stack you touch rarely. Most people can find their own team's dashboards in their sleep, and still can't remember where the on-call schedule lives.

### Step 2.2 - Ask where something lives

When you don't know where a feature is, ask instead of searching the docs:

```text
Where do I configure alert rules in this Grafana instance?
```

![alert rules](/img/8-alert-rules.png)

```text
How do I create a new dashboard folder?
```

:::tip
Treat the Assistant as a navigator and a "how do I…?" guide for Grafana itself, not just a data query tool. New team members ramp far faster when they can ask the product how it works.
:::

## Part 3 - Find and understand dashboards

Most teams have more dashboards than anyone can remember. The Assistant finds them by meaning rather than exact name, and explains what they show.

### Step 3.1 - Find dashboards by concept

In a new conversation, send:

```text
What dashboards do we have related to the frontend or the productcatalogservice?
```

![find dashboards](/img/9-find-dashboards.png)

Then try a broader concept:

```text
Find dashboards that show database or postgres health.
```

![find dashboards](/img/10-find-dashboards-2.png)

The Assistant uses semantic search, so a dashboard called "Catalog Service Overview" can match a query about "product listings" even without the exact words.

### Step 3.2 - Understand what a dashboard shows

Pick one of the dashboards the Assistant returned and ask it to explain the contents:

```text
Explain what the panels on the frontend success rate dashboard show, and what "good" looks like for each one.
```

![](/img/11-explain.png)

This turns an unfamiliar wall of charts into something you can actually read.

### Step 3.3 - Ask about a specific panel

Drill into a single visualization:

```text
On this dashboard, which data source powers the Error Budget Burndown panel, and what query is it running?
```

![](/img/12-data-source.png)

```text
What is the current value in the SLO panel, and is that normal?
```

![](/img/13-slo.png)

The Assistant can read both the panel's **configuration** (its query and data source) and the **data** it's currently returning.

:::info
For deeper dashboard work like creating new boards, editing panels, or changing visualizations, there's a dedicated **Dashboarding** mode. This lab stays in default mode and focuses on *finding and understanding* dashboards that already exist, which is the more common job.
:::

## Part 4 - Understand your telemetry

Most teams already have a dashboard that shows the RED metrics for a service, whether that's Application Observability or something they built themselves. Reading one chart isn't the hard part. The hard part is holding metrics, logs, traces, profiles, and whatever else you've connected in your head at the same time, across a dozen services, and working out what actually matters.

That's where the Assistant earns its place. It reaches across everything your stack collects, in whatever combination the question needs, and hands you back an opinion rather than a chart.

So this part doesn't walk one signal at a time. You'll ask one broad question, the way you'd ask a colleague, and then pull on the threads in the answer. The different signals show up as you go, because the Assistant reached for them, not because a step told you to.

### Step 4.1 - Ask the question you'd actually ask

Start a new conversation and send:

```text
Tell me about the services running in ecommerce-prod. Give me the health of each one over the last hour, and anything I should pay attention to when it comes to reliability.
```

That's deliberately broad. There's no metric name, no query, and no instruction about which signals to use.

While it works, expand the activity row above the answer (**Thought…**, **Queries…**, **Searched…**) and watch what it actually did. You'll see it identify the services, run queries against more than one data source, and pull the results together. Note which data sources it chose, because you never named one.

Then read the answer for what it's really giving you: a ranked view of where to look, not a wall of charts.

### Step 4.2 - Pull the first thread

Pick whichever service the Assistant flagged as most worth attention. If everything looks healthy, use the `productcatalogservice`. In the same conversation, send:

```text
Go deeper on the productcatalogservice. Show me its request rate, error rate, and latency over the last hour, and tell me what's driving the shape.
```

![](/img/14-rate.png)

Now push it past description and into judgement:

```text
Is any of that outside the normal range? What would you keep an eye on?
```

![](/img/15-normal.png)

Notice what changed between the two answers. The first one reports; the second one takes a position on what's normal for *this* service. The second is the one worth having.

### Step 4.3 - Ask why, not just what

The metrics gave you the shape. Ask for the reason behind it, still in the same conversation:

```text
What's behind that? Show me what the logs say for the productcatalogservice.
```

![](/img/16-logs.png)

Then ask for one of the most useful things it does, which is reading a noisy stream so you don't have to:

```text
Summarize those errors. Group them by message and tell me which is most common.
```

You never switched to Loki or wrote LogQL. You asked a follow-up question, and the Assistant moved from metrics to logs because that's where the answer was.

### Step 4.4 - Follow the request, and see what else is there

Keep going down the same thread:

```text
Which requests were slowest, and where did the time actually go? Walk me through a trace that shows it.
```

Traces are the signal people find most intimidating, and having the Assistant narrate the span breakdown makes them approachable. Then find out what else the stack holds on this service:

```text
What other signals do we have for this service? If there are profiles, use them to tell me where its CPU and memory are going.
```

The storefront ships continuous profiles alongside its metrics, logs, and traces, so this is a real question with a real answer. It's also the moment most people realise the Assistant isn't a metrics chatbot with a log search bolted on.

### Step 4.5 - Ask it to reconcile the picture

One conversation, one thread, four signals. Close it by asking whether they agree:

```text
Put that together. Do the metrics, logs, traces, and profiles tell the same story for this service, and what's your best explanation for what's going on?
```

Correlating signals is exactly what a manual investigation does by hand, one query at a time, in a different tool per signal. Doing it as a conversation is what makes the later labs, and Investigations in particular, click.

:::tip
**Start broad, then pull threads.** Ask the question you actually have, then follow whatever the answer surfaces. You don't need to decide up front whether this is a metrics problem or a logs problem; deciding that for you is part of the job you're handing over.
:::

## Part 5 - Put it all together

You've got an opinion about one service. Finish by turning the conversation into something you'd hand to somebody else.

In the **same conversation**, send:

```text
Summarize this conversation as a short update I could post to my team: what's healthy, what's worth watching, which dashboard to look at, and what you'd check next.
```

Read the response critically:

- Did it use **more than one signal**, or quietly fall back to metrics?
- Did it point you at a **real dashboard** you could open?
- Did it **flag** something specific, or stay generic?
- Would you actually send it?

That's your baseline. When you can open with one broad question, drill into any part of the answer with a follow-up, and finish with something worth sharing, you have the foundation everything else in the workshop builds on.

## What just happened

In this lab you practised the three habits that underpin everything else:

- **Asking questions**: orienting in a stack, querying data, and following up in a conversation
- **Navigating and finding things**: reaching dashboards, alerts, and schedules by describing them
- **Understanding telemetry**: one broad question, answered across every signal the stack collects, and drilled into thread by thread

Memories, Investigations, Skills, and MCP all build on these three. They're force multipliers on the fundamentals, not replacements for them.
