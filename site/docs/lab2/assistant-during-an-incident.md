---
sidebar_position: 2
---

# Lab 2 - Assistant During an Incident

Follow a single storefront outage from the first alert through to a fix and a reusable playbook. By the time the incident is closed you'll have touched **everything the Assistant can do**: quickstart prompts, `@` mentions, query authoring across PromQL / LogQL / TraceQL / SQL, Memories, structured triage, a Deep Investigation, collaboration and sharing, MCP-driven remediation, Dashboarding mode, IRM automation, and reusable Rules and Skills.

It runs as one continuous storyline. It's a single on-call shift, start to finish, with no disconnected exercises. Watch the Assistant change roles as the incident unfolds. It begins as a **guide** that knows your stack, then works as a **query translator**, a **triage partner**, a **root-cause investigator**, an **agent that acts**, a **communicator** for your team, and finally a **teacher** that turns the whole shift into reusable automation.

:::note
**This builds on Lab 1 rather than repeating it.** You already know how to ask the Assistant what it can do, navigate Grafana by prompting, find dashboards by concept, and read metrics, logs, and traces one signal at a time. You'll use every one of those here, but at incident speed, on a system that's actively broken, and without stopping to explain them again. Where a step assumes something from Lab 1, it says so.
:::

## Learning objectives

- Start a shift with the Assistant's suggested prompts and orient in an unfamiliar stack with Memories
- Point the Assistant at exactly the panel or dashboard you mean instead of describing it
- Author, explain, and refine queries in PromQL, LogQL, and TraceQL without knowing the syntax
- Run Lab 1's metrics, logs, and traces loop under pressure, as structured triage that produces a hypothesis
- Find what changed by asking historical rather than current-state questions
- Launch a Deep Investigation, follow its hypotheses to a root-cause report, and audit the sources behind it
- Package findings for different audiences and share a conversation as a read-only link
- Remediate with MCP safely and with human approval: restart failing pods, then file the fix
- Read an MCP server's configuration and see how its credential and tool list decide what it can do
- Build a monitoring dashboard in Dashboarding mode to catch the next occurrence
- Capture the whole shift as a Rule and a Skill, wire up IRM automation, and give feedback

:::note
**Before you start.** This lab goes deeper than Lab 1 and needs a few extra capabilities on your stack, which your facilitator has already arranged:

- **Assistant User**: for the whole lab
- **Assistant Investigation User**: for the Deep Investigation in Part 6
- **Assistant MCP User**: or higher, for the Kubernetes and Gitea actions in Part 8
- **Assistant Admin**: to save an org-wide Rule in Part 10 (a personal-scope Rule works without it)

**When the incident is live.** There's nothing to set up, and you'll never be asked to flip a feature flag. The scenario arms and disarms itself on a repeating schedule. The storefront breaks, stays broken for about 45 minutes, recovers, and the window comes round again a couple of hours later. So whenever you start, the incident is either firing right now or finished recently.

If you arrive to a healthy storefront with those alerts resolved, you've simply landed between windows. Point the Grafana time picker at the most recent one and carry on, because every querying, dashboard, and triage step in this lab behaves the same on historical data. Your facilitator can tell you when the last window was, or you can spot it as the most recent spike on any of the alert panels.
:::

:::info
**The numbers in this lab are real, and they'll drift.** Every figure below (error rates, latency, connection counts, restart counts) was pulled live from the workshop stack while the scenario was running. Your stack is the same environment, so you'll see the same *shape*, but the exact values will differ from run to run. Read them as "roughly this," not "exactly this."
:::

---

## Part 1 - Start of shift

Before the pager goes off, take thirty seconds to settle in. Open the Assistant (the sparkles icon, top-right of the navigation bar) and start a **new conversation**.

In Lab 1 you opened a shift by typing your first question. Look above the prompt input this time. The Assistant offers a few one-click suggestions, and on this stack they're the built-in contextual ones rather than anything your team wrote. Open it on a dashboard and you'll get suggestions about that dashboard, such as how to share it or add a panel. Open the full-page Workspace and you'll get generic starters like recent errors or CPU usage. Click one to see how a pre-written prompt arrives.

:::assistant-tip
Those built-ins are a placeholder for something far more useful. **Quickstart prompts**, under **AI → Settings → Quickstart prompts**, let you replace them with the checks your team actually runs at the top of a shift: health overview, top error rates, recent changes. You can save personal ones, and admins can publish them team-wide so every on-call engineer starts the same way instead of trying to remember what the checks were supposed to be.

The workshop stack ships with none configured, so that settings page is empty. That's exactly what a real stack looks like before someone does this work, and it's a five-minute win worth taking home.
:::

Everything is quiet, which never lasts long.

---

## Part 2 - The page

It's the middle of your afternoon. Your phone buzzes. In Grafana, a cluster of alerts has gone red at once:

> 🔴 **Firing:** `ProductCatalogServiceErrorRate` · `FrontendErrorRate` · `PostgreSQLHighConnections` · `Fast Firing FeO11y Error Rate - ecommerce`
>
> The storefront homepage is throwing errors, product listings are failing to load, and the browse-products customer journey is degraded. Customers are complaining. A `FeatureFlagChange` alert is firing too, so something changed earlier.

You have several alerts firing across the frontend, the product catalog, and postgres all at once, unhappy customers, and no idea yet how they connect. This is exactly the kind of multi-service, cross-signal problem the Assistant is built for. Time to work it.

Open the storefront in another tab and confirm it for yourself. The failure is **intermittent**. Refresh a few times and more than half the loads come back with an empty product grid or an error, while the rest render products perfectly. Expect that share to grow the longer the scenario runs, because the service starts by failing a fraction of requests outright and fails more of them as the connection pool genuinely exhausts. Partial, flickering failure like this is easy to talk yourself out of by eye, which is why you need the telemetry. Then come back to the Assistant.

---

## Part 3 - Orient in seconds with Memories

The worst moment in any incident is the first one: *what even is this system?* If you're on-call for a service you don't own, you can lose ten minutes just building a mental map. The Assistant skips that step, because it has already built the map for you with **Infrastructure Memories**.

Memories are an automatic knowledge base. The Assistant scans your connected Prometheus, Loki, and Tempo data sources and writes structured notes about each service -- what it does, its key metrics, its dependencies, and its log structure. That context is pre-loaded into every conversation, so you never start from zero.

:::warning
**Seed the memories before you start.** On a freshly provisioned workshop stack the memory store is empty, and the *first* scan has to be triggered by hand even though later refreshes are automatic. Open **Settings → Infrastructure memory** (`/a/grafana-assistant-app/settings/memories`); if you see a "Discover Your Infrastructure" panel with a **Start Discovery Scan** button, click it and let it finish before running the next step. It takes roughly two minutes and reports progress as it goes. Skip this and the Assistant will answer the next prompt from general knowledge instead of from your environment, which makes the whole point of the step invisible.
:::

### Step 3.1 - Ask what it already knows

Start a **new conversation** and send:

```text
What do you know about the productcatalogservice in the ecommerce-prod namespace and its dependencies? Focus on the request path from the frontend down to the database.
```

Read the answer. Notice that it names **your** services (`frontend`, `productcatalogservice`, and the `productcatalog-postgres` database) and describes the actual dependency chain rather than offering generic advice. That map is your incident's blast-radius diagram, produced in one prompt: the frontend renders product listings by calling `productcatalogservice`, which reads from its PostgreSQL database.

### Step 3.2 - See where the memories come from

Curious where that knowledge lives? Open the Assistant's **three-dot menu → Settings → Infrastructure memory**. Memories are grouped by **service group** rather than one per service, so on the workshop stack you'll see `Ecommerce` (covering all 39 services in `ecommerce-prod`) and `Internal Services`. Open `Ecommerce` and you'll find the three data sources it was built from, a dependency graph annotated with the protocol on each edge (gRPC, SQL, cache, HTTP), and a written breakdown of the service layers.

:::assistant-tip
Memories are why the Assistant's answers are specific to your environment instead of textbook generic. They refresh automatically each week and respect data source permissions, so you only ever see memories for data you're allowed to query. When an answer feels generic, a stale or missing memory is often why, and a manual refresh from this page usually fixes it.
:::

You now know the shape of the system. Before digging into raw signals, get yourself to the right place in Grafana by asking for it.

---

## Part 4 - Point at exactly the right panel

Finding a dashboard by concept and having its panels explained are both Lab 1 skills. Here they're the setup rather than the lesson: do both in one prompt, then learn the precision trick Lab 1 didn't cover.

### Step 4.1 - Get to the postgres board

In the same conversation:

```text
Find the dashboard that shows database or postgres health, then explain what its panels show and which one would tell me if the database is running out of connections.
```

The Assistant surfaces the dashboard and tells you which panel matters right now, almost certainly the one tracking active connections against the max. That's your first concrete lead about *where* to look.

### Step 4.2 - Pull that panel into the conversation

Open the dashboard so the connections panel is on screen. Panels are attached with the **crosshair button** in the prompt bar. Click the crosshair, then click the panel. It lands in the prompt bar as a `Panel: ...` pill. Hold Cmd/Ctrl while clicking to attach several panels at once.

With the panel attached, ask:

```text
What's the current value on this panel, what's the max, and is the trend climbing?
```

The Assistant reads both the panel's query **and** its live data, and tells you the backend connection count is climbing toward the database's limit.

:::tip
Two precision tools, two jobs. The **crosshair** attaches what's on the page in front of you, those being a panel, a template variable, and an annotation. An **`@` mention** pulls in things you *aren't* looking at, such as a dashboard, a folder, a data source, a metric, a label, or a Skill. Reach for whichever fits whenever "this one, specifically" matters, because "how's the database?" and pointing at the exact panel on your screen produce very different answers.
:::

In a few prompts you've gone from a blank map to a specific suspicion, postgres connections, without leaving the chat. Now confirm it with data.

---

## Part 5 - Triage: query and correlate

This is Lab 1's metrics, logs, and traces loop, but with a system that's actually on fire. Two things change under pressure. The first is the shape of the questions. Ask something broad, find the worst offender, drill into examples, look for a pattern, then ask what changed. That sequence is the backbone of agent-assisted debugging. The second is that you stop writing queries yourself and let the Assistant author them, then get it to teach you what it wrote.

Send each of these as a follow-up in the **same conversation** so the Assistant keeps the context.

:::note
Detach the panel from Step 4.2 first. Click the crosshair and click the panel again to toggle it off, or remove its pill from the prompt bar. A panel attached with the crosshair stays attached to *every* message until you remove it, and these next questions are about the whole namespace rather than one panel. An `@` mention behaves differently, because it lives in the message text and applies only to the message you typed it into.
:::

### Step 5.1 - Find the worst offender (metrics)

```text
List the services in ecommerce-prod by error rate over the last hour, highest first.
```

**List** gives you a ranked table. The `frontend` is near the top with a few percent errors, which is the symptom customers feel, but look at `productcatalogservice`: its error rate is far higher, up around **10%** against a baseline of essentially zero. The frontend depends on it for product listings, so that's your first lead.

### Step 5.2 - Zoom in, and learn the query while you're at it

```text
Show the error rate for the productcatalogservice over the last hour and highlight any spikes.
```

**Show** gives you a chart. The error rate sits flat near zero and then jumps. It appears as a clean step change rather than a gradual ramp. Something *changed* at a specific moment.

Now turn this into a learning moment. Ask the Assistant to hand you the query it just ran and explain it:

```text
What PromQL did you use for that? Explain it line by line, then make it a rate over 5 minutes grouped by pod.
```

This is a real accessibility win. You no longer need to remember `rate()` versus `irate()` or the exact label matchers. Ask for what you want, get a validated query, then ask it to **explain** and **refine** what it wrote, and you pick up PromQL by example while triaging.

### Step 5.3 - Drill into the detail (logs)

```text
Which operation on the productcatalogservice is failing, and show me example error logs for it. Then summarize those logs: group by message and tell me the most common one.
```

You used **summarize** in Lab 1; this is where it earns its keep. The most common message, over and over:

```text
level=error msg="pq: sorry, too many clients already"
```

That's the PostgreSQL driver (`pq`) telling you the database is **out of connections**. It's the smoking gun, but don't stop at one clue.

### Step 5.4 - Follow the request path (traces)

```text
Show me a slow or failed trace involving the frontend and productcatalogservice in the last hour, and explain where the time and the error were.
```

The frontend calls `productcatalogservice`, and the failing span is the database call. All three signals now point at the same place, which is the moment triage stops being a search and becomes a case.

### Step 5.5 - Line the three signals up

```text
For the productcatalogservice over the last hour, show me the error-rate spikes, the count of "too many clients" log lines, and the failing database spans across the same time range. Do the three line up, and when did they start?
```

In a handful of prompts you've gone from "the storefront is down" to a strong hypothesis, which is that the **productcatalogservice is exhausting its postgres connections, and all three signals turn bad at the same moment.** That's genuine progress, but what you've established is *what* is failing and *when* it started, not *why*. And one thread from the page is still hanging.

### Step 5.6 - Pull the thread from Part 2

Back in Part 2, a `FeatureFlagChange` alert was firing alongside the others, so something changed earlier. Three signals now agree on the shape of the failure, which makes this the moment to ask what moved. Pay attention to how the question is phrased:

```text
A FeatureFlagChange alert is firing for productcatalogservice. Which flag is it, and has it always been set that way?
```

It names the flags, `productCatalogReadFromPostgres` and `productCatalogStopClosingPostgresConnections`, both managed by flagd. Then it answers the second half from history: both sat off for the whole retained window and flipped on within minutes of each other a short time ago. You now have a **change with a timestamp**, landing just before your symptom onset.

:::tip
"Has it always been set that way" is doing the work here. Ask what a flag *is* set to and you get a configuration lookup: the present value, no history, no hint that anything ever moved. Ask whether it has *always* been that way and the Assistant goes to the `flag_state` metric instead, where every transition is recorded with a timestamp. Same subject, different tense, completely different answer.

The lesson generalizes well beyond feature flags: **current-state questions hide changes, historical questions expose them.** Most incidents are caused by something that changed, so the tense you ask in often decides whether you find the cause at all.
:::

You now have all four pieces -- what is failing, when it started, how it propagates, and a change that precedes it. Proving they're causally connected rather than coincidental is the part you'd rather not do by hand while customers are hitting errors.

This is the moment to hand it to a Deep Investigation.

:::note
**If the Assistant offers to start an investigation instead of answering, that's expected.** Ask it *why* something is broken, rather than what or when, and it stops triaging and hands the problem to the investigation agent, complete with the symptom, scope, and time range it worked out. That's the product recognizing you've crossed from reading data into finding a cause. You don't need a card to continue, since Part 6 launches an investigation deliberately, but if you have one, leave it where it is and Part 6 will tell you how to use it.
:::

:::tip
Notice how the **verb** shaped each response. *List* produced a ranking, *Show* produced a chart, *Summarize* condensed the logs, and asking whether signals *line up* produced a correlation. Being specific about the verb, the service, the signal, and the time range is the single biggest lever on answer quality.
:::

---

## Part 6 - Root cause: launch a Deep Investigation

Manual triage got you a lead. A **Deep Investigation** confirms it. Instead of one Assistant answering in a chat, it works the problem in the background across metrics, logs, traces, and recent changes, keeping a running set of numbered **hypotheses** that it promotes, demotes, or rules out as evidence accumulates. It also cites every source it consulted, so you can check its reasoning instead of trusting a verdict.

### Step 6.1 - Start the investigation

Triage handed you a lead; now hand it to an investigation. Go to **AI → Investigations → New Investigation** and give it everything you worked out:

```text
The storefront homepage is showing errors and products aren't displaying. The ProductCatalogServiceErrorRate, FrontendErrorRate, and PostgreSQLHighConnections alerts are all firing. Investigate the full request chain (frontend, productcatalogservice, productcatalog-postgres), including any recent deployments or feature-flag changes. Don't just check what the feature flags are set to now. Find when they last changed state, from the flag_state metric rather than the current flagd config. Report the most likely root cause with supporting evidence.
```

Notice how much of Part 5 is in there. A good investigation prompt states the **symptom**, the **firing alerts**, and the **suspected dependency chain**, and asks for **evidence** rather than a bare verdict. Every one of those came out of triage, which is the payoff for working the problem in the open instead of opening with "what's broken?"

The flag line is the part worth adding by hand, and Step 5.6 is why. You already established in chat that those flags flipped recently, but **the investigation agent doesn't see your conversation.** It works from the prompt alone, so the historical framing that got you a timestamp has to be handed over deliberately.

A run of this lab without that line read the current flagd config and built its root-cause chain on the flag "shipping with `defaultVariant: on` since deploy." It concluded the service had leaked connections *by design* ever since its pod started, and dated the onset around ten hours earlier than the actual trigger. Every symptom it found was correct; the story it told about them was not. With the line, the same investigation reports the flags flipping from off to on at a specific minute, and uses the pod's age to *rule out* a deployment rather than to blame one. Same evidence, opposite conclusion, and only one of the two tells a team to revert something.

That's the general lesson about handing work to an agent that starts cold. Anything you learned *by how you asked* has to travel with the request, because none of your chat does.

:::note
**If the Assistant offered you a proposal card during Part 5, you can start from that instead.** The card already carries the symptom, the scope, and the time range it worked out from your conversation, so the only thing missing is the historical-flag instruction. Type that one sentence into the card's follow-up box to refine the proposal, then click **Start investigation**.

Whether a card shows up depends on how causal your wording was. Asking *why* something is broken triggers one; Part 5's what, when, and what-changed questions usually don't, so most people reach this step without one. Both routes end up in the same place.
:::

:::note
**The chat's mode selector won't offer Investigation mid-conversation.** It's hidden by design in any chat that already has messages. Once you're several prompts in, the product routes you through a proposal card rather than a mode switch. If you want the mode selector, open a brand-new chat first.

Starting from the card also promotes that conversation to the investigation, which pins its mode and means you can't launch a second investigation from it. To run Part 6 again with a different prompt, start a new chat.
:::

### Step 6.2 - Watch the hypotheses form

Within seconds the header fills with numbered chips (`H1`, `H2`, `H3`, `H4`), one per explanation worth testing, and three views appear above the report:

- **Report**: the verdict, written and rewritten as evidence lands
- **Hypotheses**: each candidate explanation and its current state
- **Sources**: every query, log line, and trace it consulted, numbered so the report can cite them

Open **Hypotheses**. Each starts as `open` and moves to `suspected`, `symptom`, or `disproven` as the investigation works. In the run this lab was captured from, the four were the nil-pointer panic in `readCatalogFromDatabase`, the postgres connection ceiling, the frontend errors being a downstream symptom rather than a defect of their own, and a recent deployment or feature-flag change as the trigger.

Watch the **Sources** count climb, which is the clearest sign it's still working. Every numbered citation in the report links back to the evidence behind that specific claim, and that's how you audit the reasoning instead of taking the conclusion on faith.

The investigation runs in the background, so you can keep working and come back to it. Expect roughly five minutes.

### Step 6.3 - Read the verdict

When it completes, the header shows the root-cause headline and the report goes to **Completed**.

Read the **Report** end to end and look for three things that should all connect:

1. **The smoking-gun log line**: `pq: sorry, too many clients already`, the same one you found in triage.
2. **The sawtooth pattern**: the postgres backend count (`pg_stat_activity_count`) climbs toward the database's limit of **100 connections** (runs have peaked anywhere from 75 to the full 100), the service crashes, connections drop, and the cycle repeats. That's the signature of a connection leak.
3. **The root-cause statement**: `productcatalogservice` stopped closing its postgres connections when the `productCatalogStopClosingPostgresConnections` flag was switched on. Connections accumulate until postgres approaches its max of 100, the service errors and restarts, and it happens all over again.

Expect the report to lead with the *proximate* cause: an unchecked error that leaves `*sql.Rows` nil, so the next read panics and takes the pod down. That's a genuine code defect and it belongs in the story. The flag is what exhausts the pool; the missing error check is what turns exhaustion into a crash loop. A good report names both and says which one it can prove.

### Step 6.4 - Walk the timeline

Scroll the report to its **Incident timeline** section, where the investigation reconstructs the sequence with timestamps. It marks when the flag changed, when connections started climbing, when the ceiling was hit, when the first panic landed, and when the frontend error rate broke its threshold. Below it, **Failure propagation** redraws the same story as a request chain, from the flag at one end to the storefront homepage at the other.

Read the timeline against what you found by hand in Part 5. The timestamps are checkable, and comparing them is how you build a sense of when to trust this and when to dig.

You'll also notice a **Rules** chip in the header, alongside any applied Skills, showing the guidance the investigation followed while working. Your environment ships with several already. By the end of this lab one of them will be yours, and future investigations of this kind will start smarter because of it.

:::info
**What "good" looks like:** the report should tie the frontend errors, the productcatalogservice failures and restarts, and the postgres connection exhaustion into one causal story, with the flag change as the trigger. The exact percentages vary a lot with how long the incident has been running: a freshly armed one sits in the single digits, while one left armed for hours drives productcatalogservice to 100% and the frontend near 30%. That's cross-signal correlation that would take an on-call engineer 20-30 minutes by hand. If it only surfaced one piece, treat it as a partial result and follow up.

If the report calls the flag a long-standing default rather than a recent change, it read the flagd config instead of the `flag_state` metric. Put Step 5.6's question to it directly: *has productCatalogStopClosingPostgresConnections always been set that way?* And if it describes the flag as *flapping* rather than changing once, it read every series at once (each `flagapi` pod emits its own), so ask it to narrow to a single flag name.
:::

You've gone from a page to a **confirmed, evidence-backed root cause** in minutes. Before you stop the bleeding, tell the humans.

---

## Part 7 - Communicate: package it for people

A finding trapped in your chat helps no one. The report is a collaborative artifact, and the Assistant will repackage it for whatever audience needs it. In the **Workspace conversation** beside the report, ask for the audiences you actually have to update.

### Step 7.1 - A message for the incident channel

```text
Turn the root cause and recommended remediation into a short message I can paste into a Slack channel for the incident.
```

### Step 7.2 - A briefing for leadership

Same facts, different audience:

```text
Now write a two-sentence, non-technical status update for a VP: customer impact, what we've confirmed, and the ETA to mitigation.
```

Notice how the Assistant adjusts register, dropping the `pq` internals for the exec version while keeping them for the engineering channel. Asking for **audience-specific summaries** is one of its most underrated everyday moves.

### Step 7.3 - Share the whole investigation

Sometimes the most useful thing to send is the artifact itself. Click the **share icon** in the conversation header, then **Generate share link**, and drop that link in the incident channel so responders can see the full evidence trail without you re-explaining it. What you're sharing is a **snapshot**: anything you ask after generating the link isn't added to it automatically.

Beside the share icon is a **three-dot menu** (*More conversation options*) holding two things worth knowing about. **Download conversation** saves it as a file for a postmortem attachment. **Hand off conversation** is the one people mistake for sharing: it's aimed at a *coding agent* rather than a colleague, and it hands over a ready-made prompt, the conversation ID, and a read-only command that pulls the transcript so the agent starts with everything you learned. That's the "an agent starting cold sees none of your chat" problem from Step 6.1, packaged instead of retyped. Lab 3 puts that command line in your hands, which is where the option starts to earn its keep.

:::info
**Sharing respects access.** The dialog spells it out: the link is *only accessible within your Grafana organization*. Someone outside your stack can't open it, so this doesn't leak telemetry. It's a read-only snapshot for colleagues who could already sign in, not a way around RBAC.
:::

The team is informed. Now stop the bleeding.

---

## Part 8 - Remediate with MCP

Up to now the Assistant has been *reading* your systems. With **MCP (Model Context Protocol)** it can also *act* on them, talking to Kubernetes, Gitea, and other tools through a standard interface. Your workshop stack runs a Kubernetes MCP server inside the cluster (you can even see it as the `kubernetes-mcp-server` service in your telemetry) and has a Gitea MCP connected to an `assistant-workshop` repo on your workshop Gitea.

You have two follow-ups from the investigation: get the storefront working again **now** by restarting the leaking pods, and get the leak fixed **for good** by filing a ticket for engineering.

If the incident window has closed by the time you get here and the pods have settled, both steps still work unchanged. The restart count the leak left behind is your evidence either way, and what this part really teaches is the loop of read, approve, write, verify.

### Step 8.1 - Inspect the failing pods

Start a new conversation and send:

```text
Use the Kubernetes MCP to list the productcatalogservice pods in ecommerce-prod, with the status, age, and restart count for each one.
```

Look at the **restart count**. One pod is clearly the culprit, and it's young: 5 restarts in the run this lab was captured from, 14 in a later one. The separate `productcatalogservice-europe` pod sits at zero restarts and is unaffected, which makes the contrast stark. That's the crash-restart-crash sawtooth from the investigation, now visible directly in the cluster, and it makes the next step unambiguous.

### Step 8.2 - Remediate, with a human in the loop

A fresh pod starts with a clean connection pool, which buys you time while engineering fixes the leak. Ask the Assistant to do it, but to show you first:

```text
Delete the productcatalogservice pod with the highest restart count to force a fresh start. Show me the result before I confirm.
```

The Assistant drafts the action (which pod, which namespace, current state) and waits for your approval before doing anything.

Approve it. The deployment controller spins up a replacement. Verify it worked:

```text
List the productcatalogservice pods again and tell me which one is new.
```

The new pod is seconds old with **0 restarts**, and the storefront should start recovering. What you just watched is the full agent loop: it **read** the cluster state, **reasoned** about which pod was worst, **wrote** the change once you approved it, then **verified** the result. That's the Assistant working as an agent rather than a chatbot.

:::warning
**That was a real action on a real cluster.** In production the guardrails are what matter. MCP actions surface a confirmation prompt by default, which is the human-in-the-loop step you just used. The service account is scoped to one namespace and a fixed set of verbs. And blast radius counts: deleting one pod is recoverable, scaling a deployment to zero is not. Match the permissions you grant to the risk you can tolerate.
:::

### Step 8.3 - File the fix for engineering

A restart is a bandage. It clears the connection pool but changes nothing in the code, so the leak comes back the moment the triggering flag is on again, and on this environment's schedule that's a couple of hours away at most. The real fix belongs to the owning team, so file it without leaving the Assistant:

```text
Use the Gitea MCP to draft an issue in the assistant-workshop repo, titled "productcatalogservice leaks postgres connections and crash-loops". The symptom is homepage errors and missing products. The root cause is that connections are never closed, so the postgres pool exhausts at its max of 100. For evidence, use the "pq: sorry, too many clients already" log line, the sawtooth in pg_stat_activity_count, and the restarts that started after the flag change. For the fix, suggest reviewing the postgres client connection handling and adding a k6 load test that holds around 100 concurrent users so CI catches this next time. Show me the draft before you submit it.
```

Read the draft, because the Assistant may over-word things or miss a fact, then tighten it in conversation. When you're happy, tell it to submit, and it returns the issue URL. The immediate outage is handled and the permanent fix is now tracked.

:::assistant-tip
The Assistant can also draft the **k6 load test** itself. Ask *"write a k6 script that ramps to ~100 concurrent users hitting the product listing endpoint, so this connection leak would fail CI"* and paste the result into the repo. Generating and explaining k6, PromQL, LogQL, TraceQL, and SQL are all part of its query-authoring toolkit.
:::

:::info
Gitea is standing in for whatever tracks work at your organization. The pattern is identical for a code host, an issue tracker, or a project management tool such as Jira, Linear, ServiceNow, or GitHub, because MCP is a standard interface rather than a per-product integration. Connect the server, scope its tools and its credential, and the Assistant can file into the system your team already uses.
:::

### Step 8.4 - What it takes to add an MCP server

Both servers you just used were registered before the workshop started. At a customer nobody does that for you, so it's worth seeing what registering one involves and which decisions you'd be the one making.

Go to **AI → Settings → Integrations → MCP servers**. You'll see `Gitea [a]` and `Kubernetes [a]`, each with its scope, a health state, and a tool count. Open **Edit** on `Gitea [a]` to see how it's assembled, then close it with the **X** rather than **Update**. Further down the page, under **Available MCP servers**, an **Add custom server** card with an **Add** button opens the same form empty, which is what you'd start from for a server of your own.

:::warning
**Read, don't change.** Everyone in this workshop shares one Grafana stack, and these servers are registered at *tenant* scope. Disabling one, or changing which tools it exposes, changes it for every other attendee mid-lab. Leave both exactly as you found them.
:::

The dialog has a **Settings** tab and a **Tools** tab. Settings holds four fields, and the last one carries most of the weight:

| Field | What it decides |
|:--|:--|
| Name | What this server is called in the settings list and in the tool picker |
| Enabled | Whether the Assistant can reach it at all |
| Server URL | Which MCP server to talk to, ending in `/mcp`. This one points at a server running inside your own cluster |
| HTTP Headers (required) | A Header Name and Header Value pair, here `Authorization` and `Bearer <token>`, which is the credential the server acts as |

The form spells out why that last field is mandatory here: an authentication header is required whenever a server is scoped to **Everybody**, because there's no individual user for it to authenticate as.

That last row is the entire security model. **An MCP server acts with exactly the identity and permissions of the credential behind it.** `Gitea [a]` carries a token for a dedicated `assistant-mcp` account, which is why the issue you filed in Step 8.3 is attributed to that account rather than to you. Put a token of your own there instead and every action would carry your name and stop at your permissions. It's also how you'd give one team write access and another read-only against the very same server URL.

:::warning
**A shared token is a shared identity.** `Gitea [a]` is scoped to everybody on this stack, so every action through it lands under one account and inherits that account's permissions, with no way to tell from Gitea which of you asked for it. Team-wide servers need an auth-header token like this one, while a server scoped to a single user can use OAuth instead so each person acts as themselves. When you register a server for a whole org, the token you paste decides the blast radius for every user on it. Scope the credential, not just the server.
:::

Now open the **Tools** tab. Grafana makes the next point for you, in a banner at the top: *"You have 13 tools enabled. Having many tools enabled may impact performance and make the Assistant slower to respond."* Below it, every tool is listed with a **Read** or **Write** label and its own approval setting of **Default**, **Auto-approve**, or **Always ask**, which is where the confirmation prompt you saw in Step 8.2 is configured.

**Tool budgets are real, and this is the part people skip and regret.** Every enabled tool across *every* server competes for the model's attention, and the two servers on this stack already total 21. Registering this for real, you'd leave on only the handful you actually need: the issue tools, if filing tickets is the job. The Read and Write labels make that easy to reason about, and the **Enable read-only** quick action does most of the work in one click. GitHub's hosted MCP solves the same problem by publishing a separate endpoint per toolset (`/repos`, `/issues`, `/pull_requests`) so you subscribe only to the slices you want. Doing it by hand achieves the same thing, and fewer, better-chosen tools beat a long list every time.

---

## Part 9 - Build a safety net in Dashboarding mode

You mitigated the incident and filed the fix. Now make it **visible** so nobody gets surprised the same way again. Everything so far has been in default (chat) mode; for building dashboards there's a dedicated **Dashboarding mode** with a focused, iterative experience.

First get yourself onto a blank canvas: go to **Dashboards → New → New dashboard**. Dashboarding mode writes to whichever dashboard is currently open, so prompting while you're still on the service dashboard from Part 4 lands your panels there, usually as a new tab, rather than giving you a board of your own.

Now switch the mode selector to **Dashboarding** and describe the goal rather than the panels:

```text
Build me a dashboard called "Productcatalogservice DB health" so we catch this earlier next time. It needs postgres active connections against the max of 100, the productcatalogservice error rate, and pod restart count. Put a threshold marker at 80 connections so we get a warning before the pool exhausts.
```

The Assistant scaffolds the dashboard from your intent: picking the right queries against your data sources, laying out the panels, and adding the threshold you asked for. Refine it conversationally:

```text
Make the connections panel a time series with the max as a dashed red line, and move the restart-count panel to the top row.
```

Then have it explain its own work so you trust what shipped:

```text
Explain each panel on this dashboard and what value should trigger a page.
```

In a few prompts you've turned "we didn't see it coming" into a purpose-built board that would have caught this incident at 80 connections instead of 100. Save it.

:::info
Dashboarding mode is for *creating and editing*: scaffolding new boards, refining panels, changing queries and visualizations. The everyday case of *finding and understanding* existing dashboards (Part 4) stays in default mode. Switch modes to match the job.

It also never creates a dashboard or navigates for you. It edits the one that's open, and opens a fresh one only when nothing is. That's why this part starts on a blank canvas, and it's Part 4's lesson from the other direction: what's on your screen *is* context, whether you attached it deliberately or not.
:::

---

## Part 10 - Prevent: turn the shift into reusable knowledge

Here's the part most teams miss. You just did good work, but if the storefront breaks the same way next month, whoever's on call starts from scratch. The final move is to **capture this incident as reusable knowledge** so the Assistant runs the playbook automatically next time. This is where an incident stops being a fire drill and becomes a compounding asset.

### Step 10.1 - Set a standing Rule

**Rules** are always-on behavioral guidance. They apply to every conversation without being asked, and you can also apply them to Investigations. Encode the lesson this incident taught: check recent changes first, and report health consistently.

Go to **AI → Settings → Rules → Create rule** and fill in:

| Field | Value |
|:--|:--|
| Name | `Use RED method and check recent changes first` |
| Scope | The **Just me** / **Everybody** pair sits beside the Name field and starts on **Just me**. Switch it to **Everybody** if you're an Admin, otherwise leave it |
| Rule Content | `When analyzing service health or troubleshooting, always follow the RED method: report Rate, Errors, and Duration (P95/P99). Always check for recent deployments and feature-flag changes first, because they are the most common cause of production incidents.` |
| Applications | `Assistant` is already selected. Add `Investigations` so the rule applies to both, or pick `All` |
| Enabled | On |

That **Applications** field is worth noticing. A rule can also target `Infrastructure memories`, so the same mechanism that shapes a chat answer can shape how your environment gets summarized in the first place.

From now on, every triage conversation and every future investigation starts with the habit that would have found this incident faster.

### Step 10.2 - Save the investigation as a Skill

**Skills** are repeatable runbooks the Assistant can trigger on demand (a `/slash-command`) or discover automatically when your message matches. Turn the exact path you just walked into one.

Go to **AI → Settings → Skills** and click **New skill**. That opens a menu rather than the form. Choose **Create new skill**. The other entries are worth noting, because **Browse templates** ships runbooks for things like Prometheus alert investigation and CrashLoopBackOff triage, and **Import from GitHub** pulls skills straight from a repo.

On the form, title it `Investigate storefront errors`, turn on the **Agents** toggle so the Assistant can find this Skill from a description, and give it the steps in the order you worked them:

```text
Trigger: use this skill when the storefront homepage shows errors, products aren't loading, or the ProductCatalogServiceErrorRate / FrontendErrorRate / PostgreSQLHighConnections alerts are firing.

Follow this order:
1. Check the frontend error rate, then the productcatalogservice it depends on.
2. Pull example error logs and look for "pq: sorry, too many clients already" (postgres connection exhaustion).
3. Check the postgres backend count (pg_stat_activity_count) against the max of 100 for a sawtooth pattern (leak -> exhaust -> crash -> restart).
4. Check for recent deployments or feature-flag changes to productcatalogservice (for example productCatalogStopClosingPostgresConnections).
5. Summarize with the RED method and state clearly whether a rollback, flag revert, or pod restart is recommended.
```

Below the body you'll see **Auto-approved tools**, listing the same `Gitea [a]` and `Kubernetes [a]` servers from Part 8. A new Skill starts at "No tools allowed", so every write still stops for your approval. Leave it that way.

Save it, and now turn on the **Command** toggle sitting next to Agents. It's greyed out until the Skill exists, which is why this is a second step rather than something you set on the blank form.

A slash command appears under the title once Command is on. Don't guess it: Grafana derives it from your title and then truncates it, so `Investigate storefront errors` becomes `/investigate-storefront-er`. Copy it down, because you'll need the exact string in Lab 3.

### Step 10.3 - Prove it works

This is the payoff. Start a **new conversation** and, without mentioning the Skill by name, describe the symptom the way a panicked teammate would:

```text
The homepage is showing errors and products aren't loading. Can you take a look?
```

The Assistant recognizes the problem, **finds your Skill on its own**, and runs the whole investigation you built, without anyone having to remember a command. The next person on call gets your expertise for free.

### Step 10.4 - Automate the first responder

You can go one step further and remove the human from the *starting* line entirely. Under **AI → Settings → Investigations**, the **IRM webhooks** section lets an admin add **alert group webhooks**. Each one starts a Deep Investigation the moment a matching alert fires, already following the Rule and Skill you just saved, and posts its findings back to the alert group. Toggles above it decide whether a *completed* investigation resumes when the alert group or incident changes instead of a new one starting from scratch.

This isn't hypothetical on your stack. A webhook is already configured for the frontend error rate, and if you go back to **AI → Investigations** you'll see entries marked **Triggered automatically**. Several of the investigations sitting in that list were started by an alert, with nobody watching.

That's the compounding effect of the last two steps: the automated first responder runs *your* playbook rather than a generic one. You'll configure this properly, alongside scheduled Automations, in **Lab 3**.

:::assistant-tip
Skills are living documents. After every incident, ask the Assistant *"based on what we just found, what should I add to this Skill?"* and it can write the improvement straight back into the runbook. Over time your Skills become the accumulated muscle memory of the whole team.
:::

### Step 10.5 - Close the feedback loop

One last habit worth building: when a response is especially good or noticeably off, use the **thumbs up / thumbs down** on it and add a short note. That feedback improves the Assistant over time, and it costs you five seconds at the end of a shift.

---

## What just happened

You ran an entire incident with the Assistant as your partner at every stage, and along the way you touched the whole product:

1. **Quickstart and orientation**: started the shift from the Assistant's suggested prompts, saw where team-wide quickstarts would live, and let **Memories** map an unfamiliar system in seconds.
2. **Precision**: attached the exact panel with the crosshair and `@` mentioned the dashboard you meant, instead of describing them and hoping.
3. **Querying and correlation**: had the Assistant author and explain PromQL, LogQL, and TraceQL, correlated metrics, logs, and traces into a hypothesis, then asked the historical question that surfaced the change behind it.
4. **Deep Investigation**: proved the root cause across all signals and changes, read the report and timeline, and saw how Rules and Skills feed back into it.
5. **Collaboration**: packaged the finding for an incident channel and a VP, and shared the investigation as a read-only link.
6. **MCP**: let the Assistant *act*, restarting the failing pods and filing the fix with you approving every write, then read a server's configuration to see how its credential and tool list bound what it can do.
7. **Dashboarding mode**: built a monitoring board so the next occurrence is caught early.
8. **Rules, Skills, and automation**: captured the whole playbook, wired up IRM automation, and closed the feedback loop.

Orient, navigate, triage, root-cause, communicate, remediate, prevent: that arc is the full incident lifecycle, and you worked it conversationally, with a human in the loop on every action that mattered. The value of the Assistant isn't answering one question. It's working the whole problem alongside you and leaving the team better equipped than it found them.

All of it happened in the Assistant panel, driven by you. In **Lab 3** you take the same capabilities to where your team already works, including a Slack incident channel, your own internal tools and pipelines, and a schedule that runs without anyone asking, and turn the Skill you just wrote into recurring work.
