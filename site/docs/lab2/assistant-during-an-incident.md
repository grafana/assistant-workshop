---
sidebar_position: 2
---

# Lab 2 - Assistant During an Incident

Follow a single storefront outage from the first alert through to a fix and a reusable playbook. By the time the incident is closed you'll have used most of what the Assistant offers an on-call engineer:

- Suggested prompts to open a shift, and where team-wide Quickstart prompts live
- Infrastructure Memories, for orienting in a system you don't own
- Panels and dashboards handed over as context, with the crosshair and `@` mentions
- Queries written, explained, and refined for you, across PromQL, LogQL, TraceQL, and SQL
- Triage that works across every signal your stack collects, profiles included
- A Deep Investigation that works the problem in the background
- Audience-specific summaries and a shareable evidence trail
- Remediation through MCP, with a human approving every write
- Dashboarding mode and Assistant Watchers, to catch the next occurrence
- Rules, Skills, and IRM automation, so the next shift starts where this one finished

It runs as one continuous storyline. It's a single on-call shift, start to finish, with no disconnected exercises. Watch the Assistant change roles as the incident unfolds: it begins as a guide that knows your stack, then works as a query translator, a triage partner, a root-cause investigator, an agent that acts, a communicator for your team, and finally a teacher that turns the whole shift into reusable automation.

:::note
This builds on Lab 1 rather than repeating it. You already know how to ask the Assistant what it can do, navigate Grafana by prompting, find dashboards by concept, and open with a broad question before pulling on whichever signal the answer points at. You'll use every one of those here, but at incident speed, on a system that's actively broken, and without stopping to explain them again. Where a step assumes something from Lab 1, it says so.
:::

## Learning objectives

By the end of this lab you'll be able to:

- See how suggested prompts and Memories help you orient in an unfamiliar Grafana stack
- Hand the Assistant a panel or a dashboard as context, rather than describing what you're looking at
- Use the Assistant to write, explain, and refine queries so you can understand data in a language you don't speak
- Triage a live problem by asking for insight, instead of picking a telemetry type and working through it
- Find what changed, by asking historical questions rather than current-state ones
- Use and understand Deep Investigations, including how to audit the evidence behind a verdict
- Package one finding for the different audiences you have to update, and share it safely
- Remediate through MCP with a human in the loop, and judge what an MCP server is allowed to do
- Turn a shift into knowledge that lasts: a dashboard, a Watcher, a Rule, and a Skill

:::note
**When the incident is live.** The scenario arms and disarms itself on a repeating schedule, so there's nothing for you to set up or trigger. The storefront breaks, stays broken for about 45 minutes, recovers, and the window comes round again a couple of hours later. Whenever you start, the incident is either firing right now or finished recently.

If you arrive to a healthy storefront with those alerts resolved, you've simply landed between windows. Every querying, dashboard, and triage step in this lab behaves the same on historical data, so find the last window and work that instead:

1. Ask the Assistant `When did the ProductCatalogServiceErrorRate alert last fire, and how long did it stay firing?` It reads the alert's history and gives you the window. Your facilitator can also tell you.
2. Open the time picker in the top right of any dashboard or Explore page, choose **Absolute time range**, and enter a from and to that bracket that window with a few minutes either side. The Assistant reads the page's time range as context.
3. Say the window in your prompts as well, for example "between 14:05 and 14:50 today". A range in the message leaves no doubt, wherever you happen to be in Grafana.
:::

:::info
**Gitea, and where it fits.** Part 8 files the permanent fix into Gitea, a self-hosted Git service running in your workshop environment with an `assistant-workshop` repository on it. It's standing in for whatever tracks work at your organization. The pattern is identical for a code host, an issue tracker, or a project management tool such as Jira, Linear, ServiceNow, or GitHub, because MCP is a standard interface rather than a per-product integration: connect the server, scope its tools and its credential, and the Assistant can file into the system your team already uses.
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

Open the storefront in another tab and confirm it for yourself. The failure is intermittent. Refresh a few times and more than half the loads come back with an empty product grid or an error, while the rest render products perfectly. Expect that share to grow the longer the scenario runs, because the service starts by failing a fraction of requests outright and fails more of them as the connection pool genuinely exhausts. Partial, flickering failure like this is easy to talk yourself out of by eye, which is why you need the telemetry.

### Step 2.1 - Ask the obvious question first

Before you start forming theories, hand the whole thing over. Open one of the firing alerts in Grafana (from the notification, or through **Alerts & IRM → Alert rules**), open the Assistant beside it, and ask exactly what you'd ask a colleague who'd been staring at it for five minutes:

```text
What happened here? What is the productcatalogservice, what does it talk to, and what is this alert telling us about customer impact?
```

The Assistant reads the page you're on, so the alert's name, labels, query, and time window all arrive as context without you retyping any of them. One question gets you what the alert means, the service behind it, its dependencies, and a first read on impact. That's the ten minutes most people lose at the start of an incident, spent instead.

---

## Part 3 - Orient in seconds with Memories

That answer was about your services rather than about product catalogs in general, and the reason is worth a minute of your time.

The worst moment in any incident is the first one: *what even is this system?* If you're on-call for a service you don't own, you can lose that ten minutes just building a mental map. The Assistant skips the step, because it has already built the map for you with **Infrastructure Memories**.

Memories are an automatic knowledge base. The Assistant scans your connected data sources and writes structured notes about each service: what it does, its key metrics, its dependencies, and its log structure. That context is pre-loaded into every conversation, so you never start from zero. Your workshop environment ran the first scan when it was built, so the notes are already waiting for you.

### Step 3.1 - Map the blast radius

Stay in the same conversation and go one level deeper:

```text
Walk me through the request path from the frontend down to the database for product listings, and tell me which other services would feel it if the productcatalogservice failed.
```

Read the answer. It names your services (`frontend`, `productcatalogservice`, and the `productcatalog-postgres` database) and describes the actual dependency chain rather than offering generic advice. That's your incident's blast-radius diagram, produced in one prompt: the frontend renders product listings by calling `productcatalogservice`, which reads from its PostgreSQL database.

### Step 3.2 - See where the memories come from

Curious where that knowledge lives? Open the Assistant's **three-dot menu → Settings → Infrastructure memory**. Memories are grouped by **service group** rather than one per service, so on the workshop stack you'll see `Ecommerce` (covering all 39 services in `ecommerce-prod`) and `Internal Services`. Open `Ecommerce` and you'll find the three data sources it was built from, a dependency graph annotated with the protocol on each edge (gRPC, SQL, cache, HTTP), and a written breakdown of the service layers.

:::assistant-tip
Memories are why the Assistant's answers are specific to your environment instead of textbook generic. They refresh automatically each week and respect data source permissions, so you only ever see memories for data you're allowed to query. When an answer feels generic, a stale or missing memory is often why, and a manual refresh from this page usually fixes it.
:::

You now know the shape of the system. Next, find out whether the database underneath it is in trouble.

---

## Part 4 - Ask for insight, and point at what you mean

### Step 4.1 - Ask about the thing, not the chart

The alert named postgres connections, so ask about postgres connections. In the same conversation:

```text
How healthy is the postgres database behind the productcatalogservice? Is it running out of connections, how close to its limit is it, and is that getting worse?
```

You get a read on the database itself: the current backend connection count, the ceiling it's heading for, and the direction of travel. No dashboard, no panel, and no query on your part.

That's the habit worth taking home. A dashboard was always a means to a number and a judgement, and asking for the number and the judgement directly is faster than finding the board that holds them. Everything in Part 5 works this way too.

### Step 4.2 - Point at what's already on your screen

Insight-first works right up until the thing you care about is already in front of you, and then describing it is slower than pointing at it. That's what the context tools are for.

Ask the Assistant to take you to the board so you have something on screen to point at:

```text
Take me to the dashboard that shows postgres health for this database.
```

With the connections panel visible, click the **crosshair button** in the prompt bar, then click the panel. It lands in the prompt bar as a `Panel: ...` pill. Hold Cmd/Ctrl while clicking to attach several panels at once. Now ask about *that* panel:

```text
Is what this panel is showing consistent with the errors customers are seeing, and what value here should have woken somebody up?
```

The Assistant reads both the panel's query and its live data, so it answers about the exact series in front of you rather than about postgres in general.

You can hand over a whole dashboard the same way. Type `@` in the prompt bar, pick the dashboard by name, and ask:

```text
Does anything else on this dashboard support or contradict that, and what would you look at next?
```

:::tip
Two precision tools, two jobs. The **crosshair** attaches what's on the page in front of you: a panel, a template variable, or an annotation. An `@` mention pulls in things you *aren't* looking at, such as a dashboard, a folder, a data source, a metric, a label, or a Skill. Reach for whichever fits whenever "this one, specifically" matters, and let the Assistant pick the data the rest of the time.
:::

In a few prompts you've gone from a blank map to a specific suspicion, postgres connections. Now work out why.

---

## Part 5 - Triage: work the problem, not the signals

This is Lab 1's loop, run at incident speed: ask something broad, find the worst offender, go deeper on it, check whether the story holds together, then ask what changed.

The loop is worth naming, because this is what agent-assisted debugging looks like in practice. You keep the questions and the judgement. The Assistant takes the retrieval: which service, which data source, which query language, over which time range, and how to condense what comes back into something a human can act on. Each answer changes the next question you ask, which is why this is a conversation rather than a form.

So notice what you never do in this part. You never say "check the logs", or "now look at traces". You have a question and you want the answer; working out which signals hold it is part of the job you handed over. That matters beyond the workshop, because a real on-call engineer at 3am doesn't want a telemetry type, they want to know what's broken and whether they caused it.

Send each of these as a follow-up in the **same conversation** so the Assistant keeps the context.

:::note
Detach the panel from Step 4.2 first. Click the crosshair and click the panel again to toggle it off, or remove its pill from the prompt bar. A panel attached with the crosshair stays attached to *every* message until you remove it, and these next questions are about the whole namespace rather than one panel. An `@` mention behaves differently, because it lives in the message text and applies only to the message you typed it into.
:::

### Step 5.1 - Find the worst offender

```text
What are the services in the ecommerce-prod namespace? Which ones have the highest error rate in the last hour?
```

The `frontend` is near the top with a few percent errors, which is the symptom customers feel. Look past it at `productcatalogservice`: its error rate is far higher, up around 10% against a baseline of essentially zero. The frontend depends on it for product listings, so that's your lead.

### Step 5.2 - Go deeper on the suspect, and keep the query it wrote

```text
Go deeper on the productcatalogservice. What's happened to its error rate over the last hour, and when did it change?
```

The error rate sits flat near zero and then jumps, as a clean step change rather than a gradual ramp. Something changed at a specific moment.

The query behind that answer is yours to keep, so ask for it:

```text
What query did you run for that? Explain it line by line, then show me the same thing broken down per pod.
```

This is a real accessibility win. You no longer need to remember `rate()` versus `irate()`, or the exact label matchers, or which of PromQL, LogQL, TraceQL, and SQL a given answer needed. Ask for what you want, get a validated query back, then have it explain and refine what it wrote, and you pick the language up by example while you triage.

### Step 5.3 - Ask why it's failing

```text
Why is it failing? What's the actual error, and is it the same error every time?
```

Back comes the same message, over and over:

```text
level=error msg="pq: sorry, too many clients already"
```

That's the PostgreSQL driver (`pq`) telling you the database is out of connections. Note what you didn't do: you never mentioned logs, never opened Loki, and never wrote LogQL. You asked why, and the Assistant went where the answer lived and condensed a noisy stream into the one line that mattered.

### Step 5.4 - Follow it out to the customer

```text
Where does this break for a customer loading the storefront homepage, and what does one failing request look like end to end?
```

The Assistant walks the path from the frontend into `productcatalogservice` and down to the database call that fails. Traces are the signal people find most intimidating, and you got the useful part of one without opening a trace view or learning a span filter.

### Step 5.5 - Ask what else the stack knows

```text
What other signals do we have for this service? If there are profiles, tell me what's happening inside the process as it degrades. Is anything growing that shouldn't be?
```

The storefront ships continuous profiles alongside its metrics, logs, and traces, so this is a real question with a real answer, and a revealing one for a failure like this: resources inside the process accumulate instead of being handed back. It's also the moment most people realise the Assistant isn't a metrics chatbot with a log search bolted on. You asked one question and it reached for a fourth signal you hadn't thought to name.

### Step 5.6 - Check whether the story holds together

```text
Does all of that hold together as one explanation? When did it start, and what's your best account of what's happening?
```

In a handful of prompts you've gone from "the storefront is down" to a hypothesis with evidence behind it: `productcatalogservice` is exhausting its postgres connections, and everything the stack collects turns bad at the same moment. That's real progress, but what you've established is *what* is failing and *when*, not *why*. And one thread from the page is still hanging.

### Step 5.7 - Ask what changed

Back in Part 2, a `FeatureFlagChange` alert was firing alongside the others, so something changed earlier. Now that you know the shape of the failure, it's time to ask what moved. Pay attention to how the question is phrased:

```text
A FeatureFlagChange alert is firing for productcatalogservice. Which flag is it, and has it always been set that way?
```

It names the flags, `productCatalogReadFromPostgres` and `productCatalogStopClosingPostgresConnections`, both managed by flagd. Then it answers the second half from history: both sat off for the whole retained window and flipped on within minutes of each other a short time ago. You now have a change with a timestamp, landing just before your symptom onset.

:::tip
"Has it always been set that way" is doing the work here. Ask what a flag *is* set to and you get a configuration lookup: the present value, no history, no hint that anything ever moved. Ask whether it has *always* been that way and the Assistant goes to the `flag_state` metric instead, where every transition is recorded with a timestamp. Same subject, different tense, completely different answer.

The lesson generalizes well beyond feature flags: current-state questions hide changes, and historical questions expose them. Most incidents are caused by something that changed, so the tense you ask in often decides whether you find the cause at all.
:::

You now have all the pieces: what is failing, when it started, how it reaches the customer, and a change that precedes it. Proving they're causally connected rather than coincidental is the part you'd rather not do by hand while customers are hitting errors.

This is the moment to hand it to a Deep Investigation.

:::tip
**Ask for the answer, not for the data.** Every prompt in this part asked about the system, and none of them named a data source, a query language, or a signal. That's not a trick of phrasing, it's the whole proposition: you'd need to know your stack collects metrics, logs, traces, and profiles to ask for them by name, and needing to know that is exactly the barrier the Assistant removes.

Where precision does pay is in naming the service, the namespace, and the time range you care about, and in saying what you want to do with the answer. "How's the database?" and "is the postgres database behind productcatalogservice running out of connections in the last hour?" are both fine questions, and the second one is a much better answer.
:::

---

## Part 6 - Root cause: launch a Deep Investigation

Manual triage got you a lead. A **Deep Investigation** confirms it, and it's a different kind of thing from a chat answer.

Rather than one agent replying to one question, an investigation is agentic. An orchestrating agent plans the work, splits the problem into separate lines of enquiry, and delegates them to specialist agents that each interrogate one part of your estate and hand back a summarized result. The orchestrator holds the thread: it keeps a running set of numbered **hypotheses**, promotes, demotes, or rules each one out as evidence lands, and decides what to look at next. It works across all your telemetry and events, runs in the background for as long as the problem needs rather than as long as you're willing to wait for a reply, and cites every source it consulted so you can check its reasoning instead of trusting a verdict.

### Step 6.1 - Hand your own conversation to an investigation

You've just spent Part 5 building context: the symptom, the services, the failure path, the time range, and a flag that moved. Don't retype any of it. Ask the conversation you're already in to take the work further:

```text
Go and investigate this properly. Work out why the productcatalogservice is exhausting its postgres connections, and confirm or rule out the flag change as the trigger. I want evidence, not just a verdict.
```

Asking *why* is what changes the behaviour. The Assistant stops triaging and offers to hand the problem to the investigation agent, in a proposal card carrying the symptom, the scope, and the time range it worked out from your conversation. Read what it's proposing, add anything it's missed in the card's follow-up box, then click **Start investigation**.

That pattern is worth taking home, and it's more than a shortcut. Assembling a brief is grunt work, and grunt work is what you have an agent for. Summarizing your own findings by hand so that a second agent can catch up is a habit from a world where these tools couldn't talk to each other: ask the thing that already knows to start the thing that needs to know.

:::note
**If no card appears, ask more directly**, for example `Start a deep investigation into why the productcatalogservice is exhausting its postgres connections`. Two mechanics are worth knowing. The chat's mode selector doesn't offer Investigation once a conversation has messages in it, by design, so mid-conversation the product routes you through a proposal card instead of a mode switch. And starting from a card promotes that conversation to the investigation, which pins its mode and means you can't launch a second one from the same chat. To run Part 6 again with a different prompt, start a new chat.

You can also launch cold from **AI → Investigations → New Investigation**, which is what you'd do when you've been handed an alert and haven't triaged anything yet. An investigation started that way sees only what you type into it, so state the symptom, the firing alerts, and the suspected dependency chain, and ask for evidence rather than a bare verdict.
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

You'll also notice a **Rules** chip in the header, alongside any applied Skills, showing the guidance the investigation followed while working. Your environment ships with several already, and one of them is why the report dated the flag change correctly: it tells investigations to establish when a flag last changed state from its history rather than reading the current flag configuration, which reports a value with no history behind it. That's Step 5.7's tense lesson, written down once so nobody has to remember it under pressure. By the end of this lab one of those Rules will be yours.

:::info
**What "good" looks like:** the report should tie the frontend errors, the productcatalogservice failures and restarts, and the postgres connection exhaustion into one causal story, with the flag change as the trigger. The exact percentages vary a lot with how long the incident has been running: a freshly armed one sits in the single digits, while one left armed for hours drives productcatalogservice to 100% and the frontend near 30%. That's cross-signal correlation that would take an on-call engineer 20-30 minutes by hand. If it only surfaced one piece, treat it as a partial result and follow up.

If the report calls the flag a long-standing default rather than a recent change, it read the current flag configuration instead of the flag's history, and dated the onset from the pod's age. Put Step 5.7's question to it directly: *has productCatalogStopClosingPostgresConnections always been set that way?* And if it describes the flag as *flapping* rather than changing once, it read every series at once (each `flagapi` pod emits its own), so ask it to narrow to a single flag name.
:::

You've gone from a page to a confirmed, evidence-backed root cause in minutes. Before you stop the bleeding, tell the humans.

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

Notice how the Assistant adjusts register, dropping the `pq` internals for the exec version while keeping them for the engineering channel. Asking for audience-specific summaries is one of its most underrated everyday moves.

### Step 7.3 - Share the whole investigation

Sometimes the most useful thing to send is the artifact itself. Click the **share icon** in the conversation header, then **Generate share link**, and drop that link in the incident channel so responders can see the full evidence trail without you re-explaining it. What you're sharing is a snapshot: anything you ask after generating the link isn't added to it automatically.

Beside the share icon is a **three-dot menu** (*More conversation options*) holding two things worth knowing about. **Download conversation** saves it as a file for a postmortem attachment. **Hand off conversation** is the one people mistake for sharing: it's aimed at a *coding agent* rather than a colleague, and it hands over a ready-made prompt, the conversation ID, and a read-only command that pulls the transcript so the agent starts with everything you learned. It's the same idea as launching the investigation from your own conversation in Step 6.1: the context travels with the request instead of being retyped, just aimed at an agent outside Grafana. Lab 3 puts that command line in your hands, which is where the option starts to earn its keep.

:::info
**Sharing respects access.** The dialog spells it out: the link is *only accessible within your Grafana organization*. Someone outside your stack can't open it, so this doesn't leak telemetry. It's a read-only snapshot for colleagues who could already sign in, not a way around RBAC.
:::

The team is informed. Now stop the bleeding.

---

## Part 8 - Remediate with MCP

Up to now the Assistant has been *reading* your systems. With **MCP (Model Context Protocol)** it can also *act* on them, talking to Kubernetes, Gitea, and other tools through a standard interface. Your workshop stack runs a Kubernetes MCP server inside the cluster (you can even see it as the `kubernetes-mcp-server` service in your telemetry) and has a Gitea MCP connected to an `assistant-workshop` repo on your workshop Gitea.

You have two follow-ups from the investigation: get the storefront working again now by restarting the leaking pods, and get the leak fixed for good by filing a ticket for engineering.

If the incident window has closed by the time you get here and the pods have settled, both steps still work unchanged. The restart count the leak left behind is your evidence either way, and what this part really teaches is the loop of read, approve, write, verify.

### Step 8.1 - Inspect the failing pods

Start a new conversation and send:

```text
Use the Kubernetes MCP to list the productcatalogservice pods in ecommerce-prod, with the status, age, and restart count for each one.
```

Look at the restart count. One pod is clearly the culprit, and it's young: 5 restarts in the run this lab was captured from, 14 in a later one. The separate `productcatalogservice-europe` pod sits at zero restarts and is unaffected, which makes the contrast stark. That's the crash-restart-crash sawtooth from the investigation, now visible directly in the cluster, and it makes the next step unambiguous.

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

The new pod is seconds old with **0 restarts**, and the storefront should start recovering. What you just watched is the full agent loop: it read the cluster state, reasoned about which pod was worst, wrote the change once you approved it, then verified the result. That's the Assistant working as an agent rather than a chatbot.

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
The Assistant can also draft the k6 load test itself. Ask *"write a k6 script that ramps to ~100 concurrent users hitting the product listing endpoint, so this connection leak would fail CI"* and paste the result into the repo. Generating and explaining k6, PromQL, LogQL, TraceQL, and SQL are all part of its query-authoring toolkit.
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

## Part 9 - Build a safety net

You mitigated the incident and filed the fix. Now make sure nobody gets surprised the same way again. There are two ways to do that, and they answer different questions.

A dashboard answers "what does this look like right now" for whoever thinks to open it. A **Watcher** answers "is anything wrong, and tell me if it is" without anyone opening anything at all. You'll build one of each, in that order, and the contrast is the point: one waits to be read, the other comes to you.

### Step 9.1 - Build the dashboard in Dashboarding mode

Everything so far has been in default (chat) mode. For building dashboards there's a dedicated **Dashboarding mode** with a focused, iterative experience.

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

### Step 9.2 - Set a Watcher so nobody has to watch it

A dashboard still needs a human to look at it, and the alerts that did fire only covered the symptoms somebody had already thought to write a rule for. The failure mode you now understand, a connection pool leaking toward its ceiling, is the one nobody had written down. A **Watcher** is an always-on agent that checks a scoped part of your telemetry on a schedule. You describe what it should keep an eye on, the Assistant calibrates concrete checks and a baseline against your own data, and from then on it decides for itself whether the latest run is worth telling you about.

Go to **AI → Watchers → New watcher** and fill in:

| Field | Value |
|:--|:--|
| Name | `Productcatalogservice postgres connections` |
| Give the watcher context | `Watch the productcatalogservice in ecommerce-prod for postgres connection exhaustion. Its database allows 100 connections. Connections climbing steadily toward that ceiling, "pq: sorry, too many clients already" errors, or the service restarting repeatedly all mean the connection pool is leaking and customers are seeing errors on the storefront homepage. Brief error spikes during a deployment are expected and fine.` |
| Datasources | The Prometheus and Loki data sources for the storefront |
| Repeats | 15 minutes, the shortest interval available |
| Sensitivity | Balanced |

Click **Calibrate** and watch what it does. It inspects your telemetry, dashboards, and alert rules, proposes the checks it intends to save, and asks you about anything ambiguous. Read the proposed checks before you accept them, because these are what every unattended run from here on will evaluate. When calibration finishes the watcher is **Ready**; click **Run now** to see one result immediately rather than waiting for the schedule, then **Start** to turn on scheduled runs.

Open the run it produced. You get an assessment of **All clear**, **Flagged**, or **Escalated**, the reasoning behind it, and the current-versus-baseline evidence that informed it. That's the difference from the dashboard you just built: the judgement has already been made for you.

:::assistant-tip
Watchers can act on what they find, which is where this closes the loop on the whole lab. A watcher can notify Slack, post to a webhook, publish findings into Grafana Alerting so your existing notification policies and IRM escalation handle them, and launch a Deep Investigation on a critical finding. That last one means the next occurrence of this incident can be investigated before anybody has read a page.
:::

:::info
**Dashboards aren't obsolete, but you need fewer of them.** Teams have historically built a dashboard for every question anyone might ask, because a chart was the only way to answer one. With the Assistant you can ask the question directly, and with a Watcher you don't have to ask at all. Keep the dashboards people genuinely read together, in an incident review or on a wall, and let insight and Watchers cover the rest.

Watchers are a Grafana Cloud public preview feature and need the Watchers permissions on your account. If **Watchers** isn't in your Assistant navigation, read this step rather than working it, and take the pattern home instead.
:::

---

## Part 10 - Prevent: turn the shift into reusable knowledge

Here's the part most teams miss. You just did good work, but if the storefront breaks the same way next month, whoever's on call starts from scratch. The final move is to capture this incident as reusable knowledge so the Assistant runs the playbook automatically next time. This is where an incident stops being a fire drill and becomes a compounding asset.

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

The Assistant recognizes the problem, finds your Skill on its own, and runs the whole investigation you built, without anyone having to remember a command. The next person on call gets your expertise for free.

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

You ran an entire incident with the Assistant as your partner at every stage, and along the way you touched most of the product:

1. **Orientation**: opened the shift from the Assistant's suggested prompts, saw where team-wide Quickstart prompts live, then asked one question from the firing alert and let Memories map an unfamiliar system in seconds.
2. **Precision**: attached the exact panel with the crosshair and `@` mentioned the dashboard you meant, instead of describing them and hoping.
3. **Triage**: asked for insight rather than for a telemetry type, and got answers drawn from metrics, logs, traces, and profiles without naming one, then had the Assistant explain the queries it wrote along the way.
4. **What changed**: asked the historical question that surfaced the flag behind the failure, rather than the current-state one that hides it.
5. **Deep Investigation**: launched it from the conversation that found the lead, followed the hypotheses to a root cause, audited the sources, and walked the timeline.
6. **Collaboration**: packaged the finding for an incident channel and a VP, and shared the investigation as a read-only link.
7. **MCP**: let the Assistant *act*, restarting the failing pods and filing the fix with you approving every write, then read a server's configuration to see how its credential and tool list bound what it can do.
8. **A safety net**: built a dashboard for the humans and a Watcher that checks without them.
9. **Rules, Skills, and automation**: captured the whole playbook, wired up IRM automation, and closed the feedback loop.

Orient, navigate, triage, root-cause, communicate, remediate, prevent: that arc is the full incident lifecycle, and you worked it conversationally, with a human in the loop on every action that mattered. The value of the Assistant isn't answering one question. It's working the whole problem alongside you and leaving the team better equipped than it found them.

All of it happened in the Assistant panel, driven by you. In **Lab 3** you take the same capabilities to where your team already works, including a Slack incident channel, your own internal tools and pipelines, and a schedule that runs without anyone asking, and turn the Skill you just wrote into recurring work.
