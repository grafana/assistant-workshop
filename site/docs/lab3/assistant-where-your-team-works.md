---
sidebar_position: 1
---

# Lab 3 - Assistant Where Your Team Works

Labs 1 and 2 both happened in the Assistant panel, with one person driving. That's where you learn the Assistant, but it isn't where most operational work actually happens. Your team lives in a Slack channel. Your engineers live in their own internal tools. And the most valuable work of all, the recurring checks nobody has time for, needs to happen when nobody is watching at all.

This lab moves the Assistant into those places. You'll see it answering inside an incident channel, build it into an application's own interface, put it on a schedule so it does the repetitive work for you, and have it start investigating the moment an alert fires. Then you'll finish by working out where the blast radius sits in each of those surfaces, which is what determines whether you can safely turn any of them on.

## Learning objectives

- Understand how the Assistant works inside a Slack incident channel, and whose permissions it acts with
- Embed the Assistant into an application's own UI, give it a tool that calls your code, and tell it what page the user is on
- Drive the Assistant from the command line with a scoped service account token, thread a conversation across calls, and see what the read-only boundary on that surface protects
- Build an Automation that runs a prompt on a schedule, trigger it on demand, and read the conversation it produced
- Compose an Automation on top of the Skill you wrote in Lab 2, so a playbook becomes recurring work
- Configure alert-triggered investigations so an incident starts analyzing itself
- Know where the blast radius sits in each surface you turn on, and which settings quietly trade away human approval

:::note
This lab assumes you've finished Lab 2, because three parts build directly on the Skill you saved (`Investigate storefront errors`), the Gitea MCP connection, and the incident you investigated. You'll need the **Assistant User** and **Assistant MCP User** roles throughout, plus Admin if you want to scope an Automation to **Everybody** in Part 3 or configure webhooks in Part 4. The CLI in Part 2 runs as a service account provisioned with your IDE, so it doesn't depend on your own roles.
:::

:::info
**Nothing in this lab requires you to install anything.** Every hands-on step runs in your own Grafana stack, your workshop Gitea, or the browser IDE that came with your environment, including the command-line part, because the CLI is already installed there. The one capability we can't hand you is Slack, which needs a workspace connected to the stack; that part is a read-along with the setup written out so you can follow it at home.
:::

:::info
**Grafana Cloud only.** The Slack integration, Automations, and alert-triggered investigations all require Grafana Cloud and aren't available in self-managed Grafana. Your workshop stack is Cloud, so everything here works, but it's worth knowing before you plan a rollout at home.
:::

---

## Part 1 - The Assistant in your incident channel

At the end of Lab 2 you asked the Assistant to write a paste-ready Slack message. That's useful, but notice what it implies. The investigation happened in one place and the conversation about it happened somewhere else, joined by a copy-paste. Every question a teammate asks in the channel sends you back to the browser to answer it.

The Slack integration closes that gap. The Assistant becomes a participant in the channel, so the investigation happens where the conversation already is.

:::warning
**This part is a read-along, not a hands-on exercise.** Connecting Slack is an admin action that installs a Slack app into a workspace, and no Slack workspace is connected to your workshop stack. Even with one, every attendee would need their own account in that workspace and would have to link it to their Grafana user individually. Read this part to understand the capability and its limits. The setup itself is a five-minute admin task you'll do once at home.
:::

### How it gets connected

A Grafana Cloud admin goes to **AI → Settings → External connections → Slack** and clicks **Connect with Slack**. That kicks off a normal Slack OAuth install, so there's no bot token to generate and paste anywhere. If your organization already connected Slack for Grafana IRM, the OAuth grant may already exist and the button reads **Enable Grafana Assistant** instead.

Then each person links their own account once. DM the bot the word `setup`, click the link it returns, and confirm in Grafana. The link is a short-lived token that expires in fifteen minutes, so click it while you're there.

That second step is not busywork, and the reason matters for the rest of this lab.

### Whose permissions it uses

Every message runs with the Grafana identity of the Slack user who sent it. Not a shared service account, and not the identity of whoever started the thread. If you and a teammate both ask the bot questions in the same thread, each question is answered under each person's own data access. Someone who can't query the production Loki datasource in the browser can't query it by asking in Slack either, and someone with no Grafana account on that stack can't use the bot at all.

This is the single most important thing to understand about the Slack surface. It means putting the Assistant in a channel does not widen anyone's access. It just changes where they ask.

### How you talk to it

| Entry point | How |
|:--|:--|
| Channel question | `@grafana <your question>`, with the mention at the **start** of the message |
| Private conversation | Direct message the bot, no mention needed |
| Follow-up in a thread | Mention it again, `@grafana` on each turn |
| Account linking | DM the bot `setup` |
| Capability reminder | `@grafana help` |
| Channel defaults | `@grafana settings`, or `@grafana settings set namespace=production env=prod` |
| Workspace defaults | `@grafana team settings` (Slack workspace admins only) |
| From an alert message | An **Ask Assistant** or **Investigate** button posted on the alert |
| From a Slack workflow | The `grafana_assistant` step in Workflow Builder |

The mention-at-the-start rule catches people out. If you write "hey `@grafana` can you look at this", the bot replies with a quiet tip and doesn't answer, because a mention buried mid-sentence is usually someone talking *about* the bot rather than *to* it.

There's one more behavior to know about. A plain thread reply with no mention does **not** invoke the Assistant. In a busy incident channel that's the behavior you want, since the bot doesn't interject on every message, but it does mean you re-mention it on each turn.

### What it can see in the thread

This is what makes it genuinely useful during an incident rather than just convenient. When you mention the bot inside a thread, it pulls in up to **100 prior messages from that thread** as context, including the original alert post, other bots' messages, and what your teammates have already said. If the channel is linked to a Grafana IRM incident, the incident ID comes along too.

So the realistic incident-channel moment looks like this. An alert bot posts that the storefront error rate is up. Two engineers trade three messages of "seeing 500s on the homepage" and "product listings are blank". Someone then writes:

```text
@grafana what's the error rate on productcatalogservice, and does it line up with a recent deploy?
```

The Assistant answers in the thread having already read that context, so nobody has to restate the symptom. It renders the range query as a chart image and uploads it right into the thread, so the evidence is in the channel rather than behind a link.

It does not read the wider channel outside the active thread. If you want to pull in a message from elsewhere, paste its Slack permalink into your question. It resolves up to five links per prompt.

### What it can and can't do there

It's the same Assistant backend with nearly the same toolset, so it queries your metrics, logs, and traces, searches dashboards, reads IRM incidents, runs your Skills, and can launch an Investigation. MCP tools work too, and when one needs approval you get **Approve** and **Deny** buttons in Slack, so the human-in-the-loop model from Lab 2 travels with it.

The differences are about rendering, not capability. Charts come through as uploaded images. Markdown tables get flattened into bullet lists and Mermaid diagrams aren't rendered, because Slack can't display them. And the canvas, the hypothesis board, and the full investigation report all stay in Grafana, with Slack giving you a link to open them.

:::assistant-tip
The pattern that gets the most value here isn't asking questions in Slack. It's the **Investigate** button on an alert. The alert arrives in the channel, someone clicks the button, and the investigation is already running before anyone has opened a laptop, which is exactly the idea you'll configure properly in Part 4.
:::

---

## Part 2 - The Assistant inside your own tools

Slack is where your team talks. But plenty of the places your team needs help aren't chat at all. They're your internal service catalog, your deploy tool, your runbook portal, a pipeline. For those, the Assistant isn't something you open. It's something you build in.

There are two ways to do that, and you'll do both by hand. First you'll embed the Assistant into an application's UI with the SDK. Then you'll drive it with no UI at all from a command line, the way a pipeline would, and finish by committing the pipeline step into your Gitea repo.

### Step 2.1 - Open the Integration hub

From the Assistant homepage, find the **Integration hub** tile and open it. It's the developer-facing side of the product, with SDK guides, integration examples, and a live playground.

Start with the question box at the top:

```text
How do I add the Assistant to a page in my own Grafana app plugin?
```

That search doesn't just do keyword matching. It pulls the relevant documentation into context and answers with it. It's the same trick you'd want on any internal docs site.

### Step 2.2 - Drive the Assistant from someone else's UI

Open the **Interactive playground** from the hub. Each demo on this page is live. It's running the real SDK against the real Assistant in your stack, not a recording.

Start with the **`openAssistant()`** demo under Core API. Click its button and watch the Assistant sidebar open with a prompt already in it, sent automatically. That single call is how an application hands a question to the Assistant on the user's behalf. Think about where that belongs in your own tooling, maybe a "why is this failing?" button next to a red build, or on a service in your catalog.

Now try the **`AITextInput`** and **`AITextArea`** demos, both under Components. Type a rough instruction, click the sparkle, and watch the field fill itself in. This is generation inside a form rather than a chat, so the user never leaves the page they were on. Notice how different the interaction feels from a conversation, even though the same Assistant is behind it.

The **Inline generation** group next to it takes the same idea further. **Form field generation** fills a set of related fields at once, and **JSON generator** produces a whole config object. Worth a look if your app has forms more complicated than a single box.

### Step 2.3 - Let the Assistant call your code

This is the demo to slow down on. Find **`createTool` - weather** under Tools.

The demo registers a tool with the Assistant from the browser. Click **Get Weather** and the Assistant decides on its own to call `get_weather`, your browser-side handler runs, and what it returns comes back in two forms: a **Response** in prose and an **Artifact (JSON)** with the structured result. Both appear on the demo page rather than in the sidebar conversation, which is the point of the artifact. Your app gets data back it can render itself, not just text.

The handler here returns a canned string, so the response says "Simulated response for Berlin". That's the demo standing in for a real weather API. The part that isn't simulated is the decision. The Assistant read your tool's description and its parameter, decided this question needed it, and called it with `city: "Berlin"`.

The implication is bigger than the demo makes it look. In Lab 2 you connected the Assistant to Kubernetes and Gitea through MCP servers, which are tools running somewhere on a server. `createTool` puts the same idea at the other end, in a tool that lives inside your own frontend with your app's existing session and permissions. If your internal portal already knows how to look up which team owns a service, you can hand the Assistant that capability in a few lines rather than building an MCP server for it.

Two ways in, same tool model. MCP for shared, server-side capabilities. `createTool` for things one application already knows how to do.

### Step 2.4 - Tell the Assistant what page the user is on

Find the **`providePageContext`** demo and click **Register context**. Two things happen. The demo confirms the context is registered for the URL pattern `/a/grafana-assistant-app/**`, and a **My Plugin Context** chip appears in the Assistant's message box at the bottom of the sidebar, next to the chip the hub registers for itself. That chip is the whole mechanism made visible. The page told the Assistant what it's looking at, without the user typing anything.

Now click **Test: Ask about registered context**, which appears once the context is registered. The Assistant comes back naming both attached contexts and reading the JSON you registered, down to the `feature` and `capabilities` values in the Props panel. Change one of those values, re-register, and ask again to watch the answer follow.

You've seen the other half of this already. In Lab 2 you attached one exact panel to your prompt, and the ambiguity disappeared. `providePageContext` is that mechanism from the application's side. Your page declares what the user is looking at, so a half-formed question still gets a specific answer and nobody has to describe their own screen.

Have a look at the **panel config autofill** demos too, which show the Assistant filling in a form it was handed rather than answering in prose.

:::assistant-tip
Every demo has a **Code** panel showing the SDK call behind it, and a **Refine code example with Assistant** box. Ask it to change a demo, something like *"make this button say 'Explain this alert' and pass the alert name as context"*, and watch the example update. That's the fastest way to work out what an integration would look like for your own app.
:::

### Step 2.5 - Drive the Assistant from a command line

The SDK puts the Assistant in a UI. The opposite end is driving it with no UI at all, from a pipeline, a cron job, or a script, and that's the `grafana-assistant` CLI.

:::warning
`grafana-assistant` is deprecated. Grafana's replacement is `gcx`, which covers similar workflows and reaches more of Grafana, and the docs say `grafana-assistant` will be removed in a future release. This lab still uses it because it's what your browser IDE is provisioned with, and because everything you're about to learn here about credentials, threading, and where this surface fits carries straight over. Check [the CLI documentation](https://grafana.com/docs/grafana-cloud/platform/grafana-assistant/platform/cli/) before you build anything on it at home, and reach for `gcx` for new work.
:::

Open your **browser IDE** at the URL in your welcome email and log in with your workshop password. It's a full VS Code in a browser tab, running in the workshop cluster, and the CLI is already installed. Open a terminal with **Terminal → New Terminal** and confirm:

```bash
grafana-assistant --version
```

#### Look at the credential you already have

The CLI needs to know which stack to talk to and how to prove who it is, and both were set up for you. Your IDE was provisioned with a service account of its own and the CLI's config file was written against it, so the CLI is already pointed at your stack:

```bash
grafana-assistant config current
```

Open `~/.config/grafana-assistant/config.yaml` in the editor to see the whole thing. It's short:

```yaml
current-instance: workshop

instances:
  workshop:
    url: https://your-stack.grafana.net
    token: ${GRAFANA_ASSISTANT_TOKEN}
```

The entire configuration is a named instance, a URL, and a credential. Notice the token is a reference to an environment variable rather than the secret itself. That's the pattern you want anywhere this file gets committed to a repo or baked into an image.

Setting this up at home is a service account plus two commands. You'd create the account under **Administration → Users and access → Service accounts**, give it the **Editor** role, generate a token, and hand it over. Make sure it's a stack service account token, which starts with `glsa_`, and not a Grafana Cloud access policy token from grafana.com, which starts with `glc_`. The two look interchangeable and the second one gets you a flat `Invalid API key`:

```bash
grafana-assistant config set-instance workshop \
  --url "$WORKSHOP_GRAFANA_URL" \
  --token '<your-token>'

grafana-assistant config use-instance workshop
```

:::info
You might expect to skip the token entirely and run `grafana-assistant auth`, which signs you in through the browser instead. It can't work here, and the reason matters. `auth` starts a small callback server on `127.0.0.1` and waits for your browser to redirect to it. Your browser is on your laptop while the CLI is in a container in the cluster, so `127.0.0.1` is the wrong machine and the redirect has nowhere to land. Grafana pins that redirect to localhost deliberately, so there's no remote variant to reach for. A service account token is the right credential for anything non-interactive anyway, which is exactly the situation a pipeline is in.
:::

There's a page in the product for the credentials `auth` would have created, at **AI → Settings → External connections → Access tokens**. Have a look and you'll find it empty, saying no tokens exist. Your CLI works anyway, because a service account token and an Assistant access token are two different things. The access tokens page tracks what `grafana-assistant auth` and the tunnel daemon issue, and yours came from a service account instead. Useful to know which of the two you're looking at when you're working out why a CLI somewhere can't authenticate.

#### Ask it something

```bash
grafana-assistant prompt "What is the error rate for productcatalogservice in the last 15 minutes?"
```

The answer prints to standard output. Nothing else. There's no panel, no canvas, no conversation history in front of you. That's the whole point of this surface. It composes. You can pipe it, redirect it, put it in an `if` statement, or fail a build on it.

#### Thread a conversation

Ask a follow-up the naive way first:

```bash
grafana-assistant prompt "Now compare that with the previous hour"
```

It has no idea what "that" was. Each `prompt` is a fresh conversation unless you say otherwise. To thread it, capture the context ID:

```bash
grafana-assistant prompt --json "What is the error rate for productcatalogservice in the last 15 minutes?" | tee /tmp/first.json
```

Then continue it:

```bash
CONTEXT=$(grep -o '"contextId":"[^"]*"' /tmp/first.json | head -1 | cut -d'"' -f4)
grafana-assistant prompt --context "$CONTEXT" "Now compare that with the previous hour"
```

The `head -1` is load-bearing. `--json` streams an object per progress update rather than printing one at the end, so the same context ID appears a dozen times in that file. Without it you'd pass the CLI a dozen newline-separated copies and get `invalid control character in URL`, which is a confusing way to be told your variable has newlines in it.

Now the follow-up lands in the same conversation and the comparison works. Statelessness by default is usually right for a pipeline and almost never right for an investigation. `grafana-assistant chat` gives you an interactive session when you want the latter.

There's a shortcut worth knowing once you've seen the mechanism. `--continue` picks up the last conversation without you handling an ID at all:

```bash
grafana-assistant prompt "Now compare that with the previous hour" --continue
```

That's what you'd reach for day to day. Capturing the ID is still the version that works when a script juggles several conversations, or when something later needs to link back to the one it created.

#### Find the boundary yourself

Try asking it to change something:

```bash
grafana-assistant prompt "Create a new dashboard showing the RED metrics for productcatalogservice"
```

It won't. **This surface is read-only by design.** It queries every connected datasource, searches dashboards, and reads alert history, on-call schedules, and incidents, but it deliberately cannot create or modify dashboards, or manage alert rules and silences.

Note what that protects. The service account behind your CLI has the Editor role, so *in the Grafana API* it could write plenty. The read-only boundary is enforced on the headless Assistant surface itself, not by your token's permissions. A credential sitting in CI shouldn't be able to change production even if someone over-scopes it, and here it can't.

:::info
There's one more capability in that CLI you should know exists, because it inverts the direction. The **tunnel** lets the Assistant execute tools on *your* machine, so you can ask it to correlate a Grafana metric against a local log file or your checked-out source. Filesystem access is read-only and scoped to directories you register, with credentials like `~/.ssh` and `~/.aws/credentials` blocked outright, and terminal execution is off unless you explicitly enable it against an allow-list. It's the clearest example in the product of a boundary *you* choose rather than one you inherit.
:::

### Step 2.6 - Leave yourself the pipeline step

You've now run by hand the exact command a pipeline would run. The step left is committing it somewhere.

This one goes back in the **browser Assistant**, not the CLI. You just watched the headless surface refuse to write, and committing a file is a write, so this needs the Gitea MCP connection from Lab 2 and the approval prompt that comes with it. Open the Assistant in Grafana and ask:

```text
Write a CI workflow file for the assistant-workshop repo that runs a post-deploy health check using the grafana-assistant CLI. It should call the CLI in a container, prompt for the RED metrics of the frontend and productcatalogservice over the last 15 minutes, fail the job if the Assistant reports the services as unhealthy, and read the Grafana URL and service account token from CI secrets. Add comments explaining what a reader would need to change for their own stack. Then commit it to the repo at .gitea/workflows/post-deploy-health-check.yml and show me the file before you commit.
```

Read the draft properly before you let it commit, especially how it handles the token, which is the part you'd want a colleague to review. Then let it submit.

If the Assistant comes back saying it found more than one repository called `assistant-workshop`, tell it your Gitea username and it'll target yours.

Nothing will run. CI runners aren't enabled on your workshop Gitea, so there's no green check coming. That's fine, and it matters less than it would have half an hour ago, because you already proved the command works by running it yourself in the IDE. What you have now is a reviewed, concrete starting file in a repo you can reach, written into the repository through the same MCP connection you used in Lab 2.

---

## Part 3 - Automate the work nobody has time for

Everything so far still needs a person to start it, whether that's the panel, Slack, an embedded SDK button, or a pipeline step. **Automations** remove that. An Automation is a saved prompt that the Assistant runs on a schedule, and it's the most direct answer the product has to operational toil.

Go to **AI → Automations** in the left navigation.

:::note
Automations are a Grafana Cloud feature and are hidden on trial stacks. A tenant can have up to 50 enabled at once, and the fastest schedule is every 15 minutes.
:::

The page opens with two shortcuts we're deliberately skipping. A **Describe your automation** box generates one from a sentence, and **Suggested automations** offers ready-made cards under Incident, Alerts, Reports, and Personal. Both are the right choice on a Monday morning. We're writing this one by hand because the point of the exercise is the Instructions, and you can't judge a generated prompt until you've written one.

### Step 3.1 - Create a morning health digest

Click **+ New automation** and fill it in:

| Field | Value |
|:--|:--|
| Name | `Storefront morning health digest` |
| Scope | **Just me**, using the unlabelled toggle to the right of Name |
| Instructions | see below |
| Schedule | **Daily**, 09:00, your timezone (already the default) |
| Notifications | **None** |
| Enable now | On |

That scope toggle defaults to **Everybody**, so you have to switch it. Worth noticing, because the safer habit is the opposite: prove something at personal scope first, then promote it once you've lived with it.

For the Instructions, describe the data you want, the shape of the output, and who it's for. It's the same specificity that made your prompts work in Lab 1:

```text
Report the RED metrics (rate, errors, P95 duration) for the frontend, productcatalogservice, and postgres services in the ecommerce-prod namespace over the last 24 hours.

Call out anything that got materially worse compared with the previous 24 hours, and name the specific service and metric rather than saying "some services degraded".

Finish with a one-line verdict: healthy, watch, or investigate.

Keep the whole thing under 200 words. This gets read over coffee, not in an incident.
```

Click **Create automation**.

:::tip
The **Improve** button next to Instructions has the Assistant rewrite your prompt into something more precise. It's greyed out until you've typed something, so the order is: write yours roughly, hit Improve, then read what changed. That diff is a fast lesson in what a well-structured prompt looks like.
:::

### Step 3.2 - Don't wait until tomorrow

A daily schedule won't fire during this workshop, so trigger it by hand. Click **Run** on the automation.

Give it about three minutes, and note that **Run history doesn't update on its own**. The row will sit at "In progress" with one step until you click **Refresh**, then jump forward. Refresh a couple of times rather than assuming it hung. A finished run reports its **Duration** and **Steps**, and this one lands around three minutes and ten steps.

The history logs each execution with a **Method** column, so `Manual` for this one and `Scheduled` for the ones that fire on their own. Click **View** on the row to open the run.

What opens is an ordinary Assistant conversation, titled from its content rather than from the automation, something like "RED metrics comparison across services". You'll see the Assistant working through exactly the tools you'd have watched it use in the panel, with the same thought and query counts and the same **Sources** tab. That's the real lesson. An Automation is not a separate, lesser engine. It's the Assistant you already know, running unattended.

Read the output critically, the way you read its answers in Lab 1. Did it compare against the previous 24 hours, or quietly skip that? Did it name specific services and metrics? A good run does both, and the best ones add a caveat you didn't ask for, like noting that a P95 figure isn't trustworthy because the sample volume behind it was near zero. If yours skips something, tighten the Instructions and run it again. An Automation you don't trust is worse than no Automation, because it becomes a mail rule everyone filters away.

### Step 3.3 - Compose an Automation on top of your Skill

This is the part that ties the whole workshop together.

In Lab 2 you saved a Skill called `Investigate storefront errors` and turned on its Command toggle, which gave it a slash command. Go to **AI → Settings → Skills** and open it to read that command off the badge under the title.

Copy it exactly rather than typing what you'd expect. Grafana derives the command from the title and then truncates it, so this one is `/investigate-storefront-er`, not `/investigate-storefront-errors`. An Automation pointed at a command that doesn't exist won't tell you it missed.

:::note
If Skills is empty, the Lab 2 Skill didn't save or you're on a different stack. Create it now. Go to **New skill → Create new skill**, title it `Investigate storefront errors`, put a few triage steps in the body, save, then turn on **Command**. Or start from **Browse templates** and adapt something like Prometheus alert investigation. Any Skill with a slash command works for this step.
:::

Now create a second Automation whose Instructions are *just that slash command*:

| Field | Value |
|:--|:--|
| Name | `Storefront check - hourly` |
| Instructions | the exact command from your Skill, for example `/investigate-storefront-er` |
| Schedule | **Hourly** |
| Notifications | **None** |

The Instructions field advertises this itself. Under the box it reads "Start with `/` to use a skill". When Instructions begin with a slash command, the Assistant expands the Skill body and runs the whole runbook. Hit **Run** and watch your Lab 2 playbook execute with nobody driving it.

Sit with what just happened. In Lab 2 you turned one engineer's shift into a reusable Skill. Here you turned that Skill into recurring work. The knowledge went from *in one person's head* to *written down* to *running on its own*, and each step was a few minutes of effort.

:::warning
Every Automation run consumes Assistant usage against the allowance of whoever created it, and a 15-minute schedule is 96 runs a day. The product says so in two places: the form warns that each scheduled run counts against the creator's allowance, and the automation's detail page grows an **Estimated usage** panel once it has a successful run to measure. Check that estimate before you speed up a schedule. Start on the slowest schedule that's still useful, and speed it up only if someone acts on the output. This is the most common way teams waste budget with Automations.
:::

---

## Part 4 - Start the investigation before anyone reads the alert

An Automation on a schedule handles predictable work. Incidents aren't predictable. They need a trigger, not a clock. For those, Grafana IRM can start an Investigation the moment something fires.

Go to **AI → Settings → Investigations**.

:::note
This is a read-and-inspect part rather than a build-it-yourself one. The workshop stack already has this wired up, and changing shared IRM webhooks mid-workshop would affect everyone on the stack. You'll do this once as an admin in your own environment, not repeatedly.
:::

Start at the top card, **Is an alert source covered?**. It reports how many IRM integrations are already investigated, which on the workshop stack should be all of them, and lets you search any integration to see whether a webhook already covers it. That search is the thing to remember, because the failure mode here isn't forgetting to set a webhook up, it's three people setting up overlapping ones.

Below it, the **IRM webhooks** card should be badged **Active**, with two triggers that answer different questions.

**Alert group webhooks** start an investigation when an alert group fires. Expand the section and you'll find a config already there, named something like `Grafana Assistant - Frontend Error Rate`, covering all alert sources. This is the storefront case from Lab 2. The error-rate alert fires, and the investigation is already running when the on-call engineer opens their laptop.

Look at the row properly, because two details explain the whole model. Each config is really a **pair of IRM webhooks, one per trigger**, which is why the counter reads "1 config · 1 IRM webhook" rather than matching numbers. And this one carries a warning, **"Missing the status change trigger"**, meaning it starts investigations when an alert group is created but doesn't react when one changes status. Expand the row for the IDs, endpoint, teams, and severity behind it.

Click **Add webhook** to see what creating one asks for, then collapse it again without saving. You choose **Integrations**, optionally a **Severity** so a low-priority alert doesn't spin up an investigation, and a **Webhook name**. Selecting several integrations creates a webhook for each.

**Investigations from Grafana IRM** is the second trigger, and it starts an investigation when an incident is declared. It's off here. The description is the honest part. Incidents are investigated "when sufficient context is available", and one declared with nothing but a title may never trigger at all. That's the right default. A freshly declared incident is often just a name and a panicked reporter, and there's nothing for an agent to work with yet.

Now scroll back to **Investigation behavior** at the top, which decides how long an investigation stays alive. **Continue on alert updates** and **Continue on IRM updates** resume a completed investigation when the alert group or incident changes, so a long-running incident keeps getting fresh analysis instead of one snapshot from the first minute. The **Continuation window**, six hours by default, sets how long those updates keep feeding the existing investigation before a new one starts, and the guidance is to match it to your notification policy's repeat interval. **Enable loops** goes further again, letting an investigation continue on a schedule through the `/loop` command and agent tool.

**Auto approve broad and expensive Loki queries** is one more toggle in that card, and it's worth arguing about with your team rather than inheriting its default. It trades an approval prompt for speed on exactly the queries most likely to be costly.

When these fire, findings post back to the incident or alert group. And critically, they run under the Rule and Skill you saved in Lab 2, so the automated first responder follows *your team's* playbook, not a generic one. That's the compounding effect. Every Rule and Skill you write makes every future automated investigation better.

:::info
Automations and IRM-triggered investigations are separate features and it's worth keeping them straight. Automations run a **chat** prompt on a **schedule** from the Automations page. IRM webhooks start an **Investigation** from an **event**, configured here in Investigations settings. An Automation can't be triggered by an alert, and a webhook can't be put on a cron.
:::

---

## What just happened

You took the Assistant out of the Assistant panel:

1. **Slack**: saw how it joins an incident channel, reads the thread it's mentioned in, renders charts inline, and acts with each asker's own permissions.
2. **SDK**: opened the Assistant from an application's own button, generated into a form field, gave it a tool that called your code, and told it what page the user was on.
3. **CLI**: drove the Assistant headlessly with a scoped token, threaded a conversation with a context ID, found the read-only boundary by hitting it, and committed the pipeline step to your Gitea repo.
4. **Automations**: built a scheduled digest, ran it on demand, then composed one on top of your Lab 2 Skill so a playbook became recurring work.
5. **Alert-triggered investigations**: read how IRM webhooks make an incident start analyzing itself under your Rules and Skills, and what keeps one alive as it changes.

One thing to take with you before you go.

### Know where your blast radius is

Each surface you just met carries its own security model, and confusing them is how teams get burned.

In **Slack**, each message runs as the mapped Grafana identity of whoever sent it. Adding the bot to a channel doesn't widen anyone's access.

For **MCP servers**, the credential in the configuration *is* the identity. In Lab 2 you read how `Gitea [a]` is assembled, then watched the issue you filed land under the `assistant-mcp` account rather than your own name. That was the whole security model in one observation. A shared team server means every action is attributed to one account with that account's permissions, and Gitea can't tell you which of you asked for it, so scope the credential, not just the server. And keep enabled tools trimmed, because tool count competes for the model's attention regardless of security.

For the **SDK**, a tool you register with `createTool` runs in your application with your application's session. That's convenient and it's also the trap. The Assistant can now do anything that function can do, so the function is where you put the check, not the prompt.

For the **CLI, the HTTP API, and the tunnel**, the credential and the surface are two separate limits, and Part 2 showed you the gap between them. Your token had the Editor role, but the headless surface still refused to create a dashboard, because the read-only boundary lives on the surface, not on the token. Don't rely on only one of those. Scope a service account to the data a pipeline actually needs rather than cloning an admin, *and* take the surface's read-only guarantee as the backstop. The tunnel is read-only and project-scoped unless you explicitly enable terminal access.

Across all of them, the human-in-the-loop approval on writes is the backstop, where the Assistant shows what it intends to do and waits. Two settings quietly trade that away, and both are worth a deliberate decision rather than an inherited default. A Skill's **Auto-approved tools** list pre-approves specific MCP tools for everyone who runs it, and **Auto approve broad and expensive Loki queries** in Investigations settings skips the prompt on the queries most likely to be costly. Neither is wrong. Just don't let convenience erode approval for actions you can't undo.

Across all three labs the arc is a single one. Lab 1 taught you to **ask**. Lab 2 taught you to **investigate and capture what you learned**. Lab 3 took what you captured and put it everywhere your team already works, running whether or not anyone is watching.

That's the difference between a tool that helps and a tool that compounds. A helper answers whatever question is put in front of it, once. What you built over these three labs means the next person doesn't have to ask.
