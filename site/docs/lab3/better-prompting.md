---
sidebar_position: 1
---

# Lab 3 - 💬 Better Prompting

## Learning objectives

- Apply action verbs and explicit scope to get higher-quality Assistant responses
- Pick the right Assistant mode for the task at hand
- Use `@` mentions to pin the Assistant to specific data sources, dashboards, and panels
- Iteratively refine a debugging conversation
- Save a reusable prompt as a Quickstart and run it from a button
- Know when to reach for an Automation instead of a Quickstart
- Give feedback that actually gets routed to Grafana engineers

---

## The scenario

> "I keep getting mediocre answers from the Assistant. My prompts feel like a guessing game. What am I doing wrong?"

The Assistant's quality is largely controlled by what you put in. This lab walks through the techniques that move the needle most.

---

## Step 1 - Action verbs and explicit scope

Open the Assistant and start a **new conversation**.

Try this poor prompt first and observe the response:

```text
errors
```

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '460px'}}>
    <img src="/img/lab2-01a-errors-root-cause.png" alt="Assistant identifies postgres connection pool exhaustion as the root cause" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '460px'}}>
    <img src="/img/lab2-01b-errors-next-steps.png" alt="Continuation of the response with recommended next steps and follow-up buttons" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

Now compare with each of these prompts. Send them one at a time in **separate new conversations** so prior context doesn't leak:

```text
List the top 5 services by error rate in the last hour.
```

<img src="/img/lab2-02-list-top5-services.png" alt="Ranked table of the top 5 services by error rate" style={{maxWidth: '360px', display: 'block', margin: '0 auto 1.5rem'}} />

```text
Show error rates for the productcatalogservice over the last hour and highlight any spikes.
```

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '420px'}}>
    <img src="/img/lab2-03a-show-error-rates.png" alt="productcatalogservice error rate chart rising sharply" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '420px'}}>
    <img src="/img/lab2-03b-show-observations.png" alt="Key observations summary and gRPC error rate chart" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

<img src="/img/lab2-03c-show-request-rate.png" alt="Total request rate showing a 31 percent drop" style={{maxWidth: '360px', display: 'block', margin: '0.5rem auto 1.5rem'}} />

```text
Compare frontend error rates this hour vs the same hour yesterday.
```

<img src="/img/lab2-04a-compare-summary.png" alt="Comparison summary text" style={{maxWidth: '360px', display: 'block', margin: '0 auto 1rem'}} />

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '300px'}}>
    <img src="/img/lab2-04b-compare-today.png" alt="Frontend error rate this hour chart" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '300px'}}>
    <img src="/img/lab2-04c-compare-yesterday.png" alt="Frontend error rate same hour yesterday chart with summary" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

Notice how each verb shapes the output:

- **List** produces a ranked enumeration
- **Show** generates a visualization
- **Compare** triggers a side-by-side analysis

The Assistant is much better at responding to a specific verb + specific scope than a noun phrase alone.

---

## Step 2 - Pick the right mode

The Assistant has multiple **modes** you can pick from the dropdown at the bottom-left of the prompt input. Each mode loads a different system prompt and toolset, so picking the right one is the single biggest lever on response quality for non-default tasks. Click the mode selector and you'll see the full list:

<img src="/img/lab3-mode-selector.png" alt="Mode selector dropdown showing Assistant (default checked), Deep Investigation, Dashboarding, Learn, k6 Script Authoring, and Knowledge Graph (Preview)" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

| Mode | When to use it | Doc |
|:--|:--|:--|
| **Assistant** (default) | Broad questions and general tasks across Grafana - the right default for anything not covered by the specialist modes below | (no dedicated page - implied baseline across the [Get started](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/get-started/) workflows) |
| **Deep Investigation** | Incidents that span multiple services, require more than one signal type, or need a structured report. Swarms specialist agents (Prometheus, Loki, Tempo, Pyroscope) in the background. Requires the Investigations entitlement + `Assistant Investigation User` role | [Run investigations](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/guides/investigation/) |
| **Dashboarding** | Find, understand, create, or edit dashboards. Loads the dashboard-specific tools and prompts | [Manage dashboards](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/guides/dashboarding/) |
| **Learn** | Guided coach mode - suggests personalized observability lessons based on your role, the Grafana products you use, and the services in your environment | [Learn mode](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/guides/learn-mode/) |
| **k6 Script Authoring** | Create, analyze, or convert k6 performance test scripts. Can discover endpoints from your observability data | [k6 Script Authoring mode](https://grafana.com/docs/grafana-cloud/testing/k6/author-run/k6-script-authoring-mode/) |
| **Knowledge Graph** (Preview) | Troubleshoot entity relationships, diagnose connectivity issues, manage custom rules. Requires the knowledge graph to be configured | [Knowledge Graph mode](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/guides/knowledge-graph/) |

Try switching modes for the same prompt and notice the difference:

```text
Show me what's happening with the productcatalogservice.
```

Send it once in **Assistant** mode (default) and once in **Deep Investigation** mode (you'll explore this more in Lab 4). The Assistant-mode response is a quick chat-style summary; Deep Investigation kicks off a background multi-agent run that produces a structured report.

:::tip
**Naming mismatch worth knowing:** the docs call it "Investigation" mode, but the UI labels it "Deep Investigation." Same feature. The "Deep" prefix is UI-only and distinguishes it from the lighter inline investigation behavior in default Assistant mode.
:::

:::info
**There's no single "modes" reference page in the docs.** Each mode lives on its own guide page (linked above), and the default Assistant mode doesn't have a dedicated page at all. The list above is the consolidated reference until Grafana publishes one.
:::

---

## Step 3 - Pin context with `@` mentions

`@` mentions tell the Assistant exactly which data source, dashboard, or panel to use. This removes ambiguity when you have multiple data sources.

In a new conversation, type `@` in the prompt input. You should see a dropdown of available references - data sources first, then dashboards.

Try this prompt, selecting your Prometheus data source when the `@` dropdown appears:

```text
Using @<your-prometheus-datasource>, show me the request rate for the productcatalogservice in the last hour.
```

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '460px'}}>
    <img src="/img/lab2-05a-at-mention-datasources.png" alt="@ dropdown showing available data sources" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '460px'}}>
    <img src="/img/lab2-05b-at-mention-ds-response.png" alt="productcatalogservice request rate chart pinned to the selected data source" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

Then try this one, selecting a dashboard if any are available (look for a Postgres or storefront dashboard):

```text
Look at @<a-dashboard>. Which panel has the most concerning trend right now?
```

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '460px'}}>
    <img src="/img/lab2-06a-at-mention-dashboards.png" alt="@ dropdown showing available dashboards" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '460px'}}>
    <img src="/img/lab2-06b-at-mention-dash-response.png" alt="Assistant analyzing the selected dashboard and surfacing the most concerning panel" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

`@` mentions are especially useful when:

- The same metric name exists in multiple data sources
- You want the Assistant to read a specific dashboard before answering
- You're debugging and want to anchor the conversation to one panel

---

## Step 4 - Iterative refinement

The biggest mistake users make is treating each prompt as a one-shot. Real investigations are conversations.

In a new conversation, walk through this sequence. **Send each prompt as a separate message in the same conversation** - building on the previous response:

```text
What's the error rate for the productcatalogservice over the last hour?
```

```text
Which endpoint or operation is producing those errors?
```

```text
Show me example log lines for the worst endpoint.
```

```text
What do those errors have in common - is there a pattern in the messages, timing, or upstream dependency?
```

Each follow-up narrows the investigation. The Assistant uses the prior context to keep getting more specific without you re-stating the setup. This pattern - **broad question → identify the worst offender → drill into examples → look for patterns** - is the bread and butter of agent-assisted debugging.

<img src="/img/lab2-07-iterative-refinement.png" alt="Final iteration response naming connection pool exhaustion as the root cause" style={{maxWidth: '360px', display: 'block', margin: '0 auto 1.5rem'}} />

:::tip
**When to start a new conversation:** if you're switching topics (e.g., from latency to authentication), start a new chat. Context from a prior topic can confuse the model and produce stale answers.
:::

---

## Step 5 - Save a Quickstart prompt

If you find yourself sending the same prompt repeatedly, save it as a Quickstart. Quickstart prompts become one-click buttons in the Assistant.

1. Navigate to **Assistant → Settings** in the left sidebar
2. Find the **Quickstart prompts** section
3. Click **Add quickstart prompt**

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '300px'}}>
    <img src="/img/lab2-08a-quickstart-settings.png" alt="Quickstart prompts settings page with no prompts yet" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '300px'}}>
    <img src="/img/lab2-08b-quickstart-create-dialog.png" alt="Create Quickstart Prompt dialog with Storefront health check filled in" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

4. Title it `Storefront health check`
5. Body:

   ```text
   For the e-commerce storefront over the last hour, summarize: frontend request rate and error rate, productcatalogservice request rate and error rate, checkout success rate, and any noticeable spikes or drops. Highlight anything outside normal range and call out any service that looks unhealthy.
   ```

6. Scope: **Just me** for testing (later, an admin can promote it to **Everybody** for the team)
7. Save

Close the settings panel and open a new conversation - your Quickstart should now appear as a one-click button. Click it and you should get the full storefront health summary without typing anything.

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '280px'}}>
    <img src="/img/lab2-08c-quickstart-button.png" alt="New conversation view with the Storefront health check Quickstart highlighted" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '280px'}}>
    <img src="/img/lab2-08d-quickstart-running.png" alt="The Quickstart prompt running with the full body sent automatically" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

If you don't see it, confirm the **Enabled** toggle is on for the Quickstart under **Assistant Settings → Quickstart prompts**.

:::info
**Why this matters:** Quickstarts encode your team's "how to start a check" knowledge into the Assistant's UI. New team members get expert-level prompts for free. Promote successful personal Quickstarts to team-wide as they prove themselves.
:::

---

## Step 6 - Schedule recurring runs with Automations

:::note
**This step is a walk-through only - do not create an automation in the workshop stack.** Automation runs consume Assistant tokens from a shared monthly limit, and an enabled schedule keeps consuming them after the session ends. Read through and explore the settings UI, but stop before saving anything.
:::

For prompts you want to run on a schedule (daily summary, weekly health check, end-of-week status report) rather than on demand, reach for an **Automation** instead of a Quickstart. Full feature reference: [Grafana Assistant Automations docs](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/guides/automations/).

Navigate to **Assistant → Settings → Automations** (sibling to Quickstart prompts). When you have none yet, the page looks like this:

<img src="/img/lab3-automation-01-settings-page.png" alt="Automations settings page with the 'No automations have been created yet' empty state and the + New automation button" style={{maxWidth: '720px', display: 'block', margin: '0 auto 1.5rem'}} />

Click **+ New automation** to open the 3-step Create automation wizard.

### Step 6a - Basics

Give the automation a name, optional description, and choose visibility - **Everybody** (team-wide) or **Just me** (personal).

<img src="/img/lab3-automation-02-basics-step.png" alt="Create automation - Basics step with Name, Description, and Everybody / Just me visibility toggle" style={{maxWidth: '540px', display: 'block', margin: '0 auto 1.5rem'}} />

### Step 6b - Schedule

Set a recurring schedule, or leave it empty for manual-only runs. You can build the schedule visually (Repeat / on / at / Timezone) or switch to **Expression** to paste a cron string directly. The dialog shows you both the human-readable summary and the cron expression as you build it.

<img src="/img/lab3-automation-03-schedule-step.png" alt="Create automation - Schedule step showing visual cron builder set to Once a day at 9 AM America/Chicago, with the resolved cron expression 0 9 * * *" style={{maxWidth: '540px', display: 'block', margin: '0 auto 1.5rem'}} />

**Minimum interval is 15 minutes between runs.** The dialog enforces it.

### Step 6c - Prompt

Type the prompt that gets sent each time the automation fires. Type `/` at the start to invoke a Skill instead of an inline prompt. The **Start enabled** toggle controls whether the automation runs immediately after saving. The **Notifications** section lets you post each run's update to a Slack channel or DM yourself.

<img src="/img/lab3-automation-04-prompt-step.png" alt="Create automation - Prompt step with the prompt textarea, the 'Start with / to use a skill' hint, the Start enabled toggle, and a Post updates to Slack notification toggle" style={{maxWidth: '540px', display: 'block', margin: '0 auto 1.5rem'}} />

Each scheduled run creates a dedicated Assistant conversation, so you can inspect results after the fact, follow each run back to its full conversation, and compare runs over time.

### Example use cases worth saving as Automations

- **Daily morning summary** (`0 9 * * 1-5`, weekdays): `Summarize the top 5 errors and slowest endpoints across all services in the last 24 hours. Flag anything outside normal range.`
- **Weekly capacity check** (`0 9 * * 1`, Monday morning): `For each productcatalogservice pod, list current CPU, memory, and restart count over the past 7 days. Flag any pod above 80% CPU.`

:::warning
**Token consumption matters.** Automation runs count against your monthly Assistant token limits, and frequent schedules accumulate fast across the team. Default to longer intervals and tighten only when there's a clear reason.
:::

:::info
**Public preview.** Breaking changes may occur before GA. Personal automations need the `grafana-assistant-app.automations.user:*` role; team-wide ("Everybody" visibility) needs `grafana-assistant-app.automations.tenant:*`. Either way, plugin access (`plugins.app:access`) is required. See the [Automations doc](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/guides/automations/) for full setup.
:::

---

## Step 7 - Give feedback that engineers actually see

Every Assistant response has thumbs-up and thumbs-down buttons. Scroll back to any response from this lab and locate the feedback controls - you don't need to submit anything right now. The point is to know they're there.

<img src="/img/lab2-09-feedback-buttons.png" alt="Thumbs-up and thumbs-down feedback buttons highlighted on an Assistant response" style={{maxWidth: '480px', display: 'block', margin: '0 auto 1.5rem'}} />

In practice: clicking thumbs-down and adding a specific note (e.g., "Picked the wrong data source - I expected Loki not Prometheus") routes that feedback to the team improving the Assistant's prompt handling. Thumbs-up with notes about what worked is equally valuable.

:::note
Quality feedback with concrete notes is one of the highest-leverage things you can do as an SE. The Assistant team uses these to refine system prompts, tool selection, and tuning. Even one well-written thumbs-down can change how the Assistant responds to a class of queries.
:::

---

## ✅ Checklist

- [ ] Sent prompts with different action verbs and compared the output styles
- [ ] Opened the mode selector and can name when you'd reach for each mode
- [ ] Used `@` to reference a data source and a dashboard
- [ ] Walked through an iterative investigation in one conversation
- [ ] Saved a Quickstart prompt and ran it from the button
- [ ] Located Assistant → Settings → Automations and can name one prompt worth scheduling
- [ ] Located the thumbs-up / thumbs-down feedback controls on an Assistant response
