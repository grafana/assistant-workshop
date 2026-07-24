---
sidebar_position: 1
---

# Lab 5 - 📚 Rules and Skills

## Learning objectives

- Write an always-on Rule that shapes Assistant behavior across every conversation
- Create a Skill (formerly Playbook) that encodes a repeatable investigation workflow
- Trigger a Skill via slash command and via semantic discovery
- Understand the distinction: Rules **always apply**; Skills are **discovered at runtime**

:::info
"Skills" were renamed from "playbooks" on March 3, 2026. If you see "playbook" in older docs or in screenshots, it's the same thing.
:::

---

## The scenario

> "Every time the storefront has a problem, the on-call walks the same investigation flow: frontend errors → product catalog → postgres connections → recent deployments. We want the Assistant to know that flow and apply it automatically, without telling it from scratch in every conversation."

That's exactly what Rules and Skills are for.

---

## Step 1 - Write an org-wide Rule

Rules are always-on behavioral guidance. They apply to every conversation automatically.

1. Navigate to **Assistant → Settings → Custom rules** in the left sidebar
2. Click **+ Create rule**

<img src="/img/lab4-01a-custom-rules-page.png" alt="Custom rules page under Assistant Settings showing pre-baked rules and the + Create rule button" style={{maxWidth: '720px', display: 'block', margin: '0 auto 1.5rem'}} />

Fill out the form:

| Field | Value |
|:--|:--|
| Name | `Use RED method and check deployments first` |
| Rule Content | `When analyzing service health or troubleshooting performance, always follow the RED method: report Rate (requests/sec), Errors (error rate or count), and Duration (P95/P99 latency). Use container_cpu_usage_seconds_total instead of generic CPU references. Always ask about recent deployments first - they are the most common cause of production incidents.` |
| Scope | **Everybody** (requires Admin) |
| Applications | **Assistant** |
| Enabled | On |

<img src="/img/lab4-01b-create-rule-dialog.png" alt="Create rule dialog with the RED method rule filled in, scope set to Everybody, Applications set to Assistant" style={{maxWidth: '480px', display: 'block', margin: '0 auto 1.5rem'}} />

Click **Create rule**.

:::tip
**Why "Everybody" scope:** RED method is a team standard, not a personal preference. Scoping it org-wide means every SE on the stack gets the same baseline behavior. **Just me** scope is fine for testing - promote to Everybody once you're happy.
:::

---

## Step 2 - Test the Rule

Start a **new conversation** in the Assistant (the Rule applies to new conversations, not the in-flight one) and send:

```text
How is the frontend doing?
```

Read the response. It should now:

- Report Rate, Errors, and Duration explicitly
- Use specific Prometheus metric names rather than generic phrasing
- Ask about (or check for) recent deployments

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '460px'}}>
    <img src="/img/lab4-02a-frontend-red-summary.png" alt="Assistant response with RED health summary - Rate, Errors, Duration explicitly called out" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '460px'}}>
    <img src="/img/lab4-02b-frontend-red-charts.png" alt="Frontend Error Rate and P95 Latency charts with the Assistant flagging a 22:09 CT spike worth investigating" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

Compare this to the same prompt before the Rule existed - the structure should be tighter and more consistent.

:::info
**Rules don't guarantee behavior.** LLMs are non-deterministic. A Rule "strongly influences" the response, but on any given turn the Assistant might still drift. Treat Rules as steering, not as guarantees.
:::

---

## Step 3 - Create a Skill

Skills encode a specific repeatable workflow. Where Rules shape style and defaults, Skills are domain-specific runbooks the Assistant can run two ways: automatically via semantic search when your message matches, or on demand via a slash command.

1. In **Assistant → Settings → Skills**, click **+ New skill** then **Create new skill** (you can also browse pre-built templates from this dropdown - Prometheus alert investigation, Loki log spike analysis, Kubernetes CrashLoopBackOff triage, etc.)

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '320px'}}>
    <img src="/img/lab4-03a-skills-page-empty.png" alt="Skills settings page with no skills yet and the + New skill button" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '320px'}}>
    <img src="/img/lab4-03b-new-skill-templates.png" alt="New skill dropdown showing Create new skill, Browse templates, Import from GitHub, plus popular templates" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

2. Fill out the form:

| Field | Value | Notes |
|:--|:--|:--|
| Title | `Investigate frontend 500s` | The slash command auto-generates from this - if you want the slash to be `/investigate-frontend-500s`, the title needs to start with "Investigate frontend" |
| Scope | **Just me** for now | Start personal, promote to Everybody once validated |
| Agents toggle | **On** (purple) | Enables semantic discovery - the Assistant finds the Skill automatically when your message matches |
| Command toggle | **On** (orange) | Enables the slash-command invocation. The slash command is shown right under the title once you toggle this on |
| Body | (runbook below) | Be explicit; the Assistant follows these steps in order |

Body:

```text
Trigger: use this skill when asked to investigate storefront 500s, when the homepage is showing 500 errors, when products aren't loading, or when the frontend SLO is burning.

When asked about storefront errors, 500 responses, missing products, or SLO burn, follow this investigation order:

1. Check the frontend service error rate in the last hour. Identify whether errors are spread across endpoints or concentrated on specific routes (especially the homepage / product listing).
2. Trace the failing requests downstream. The frontend depends on productcatalogservice for product listings - check its error rate and request rate next.
3. If productcatalogservice is failing, check its logs in Loki for two specific patterns: "pq: sorry, too many clients already" (postgres connection exhaustion) and "invalid memory address or nil pointer dereference" (service crash).
4. Check postgres connection count metrics. A sawtooth pattern (spike → drop → spike) indicates the service is leaking connections, hitting the max, crashing, and restarting.
5. Check for recent deployments to productcatalogservice in the last 2 hours - this is the most common cause of regressions.
6. Summarize findings using the RED method (Rate, Errors, Duration) and explicitly state whether a rollback is recommended.
```

<img src="/img/lab4-03c-skill-form.png" alt="Saved Investigate frontend 500s Skill with /investigate-frontend-500s slash, Agents and Command toggles on, Trigger line plus 6-step runbook in body" style={{maxWidth: '720px', display: 'block', margin: '0 auto 1.5rem'}} />

Save.

:::info
**Title vs scenario language:** the Skill is titled `Investigate frontend 500s` to keep the slash command short and accurate to the service that returns the 500 (the frontend service). The body still uses "storefront" language because that's how the team talks about the symptom in incidents. The Assistant uses both for semantic matching - title and body - so this gets indexed under both phrasings.
:::

:::info
**Two ways to invoke a Skill:**

- **Semantic discovery** (Agents toggle on): the Assistant matches the user's natural-language prompt to the Skill's title, body, and any explicit `Trigger:` phrases. No specific phrasing required.
- **Slash command** (Command toggle on): type the `/command` directly in chat to run the Skill explicitly. Useful when you know exactly which Skill you want.

Most teams enable both. Semantic discovery is the powerful default; the slash command is the explicit override.
:::

---

## Step 4 - Trigger the Skill via slash command

In a new conversation, type:

```text
/investigate-frontend-500s
```

The slash command should auto-complete from the Skill you just created.

<img src="/img/lab4-04a-slash-autocomplete.png" alt="Slash command autocomplete showing /investigate-frontend-500s with the Skill name" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

Submit it (with or without additional context after the slash command). Watch the Assistant execute the workflow you wrote step by step. It should walk through frontend errors → product catalog dependency → logs for `pq:` errors → postgres connection metrics → recent deployments, then summarize.

<img src="/img/lab4-04b-slash-command-running.png" alt="Assistant running the Investigate frontend 500s Skill - the Skill pill is pinned at the top of the response and the 6-step runbook is being followed" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

---

## Step 5 - Trigger the Skill via semantic discovery

This is where Skills get powerful. The Assistant can discover Skills based on what you're asking about - you don't have to remember the slash command.

Start a new conversation and send:

```text
The homepage is showing 500 errors and products aren't loading. Can you take a look?
```

The Assistant should semantically match this to your `Investigate frontend 500s` Skill and run it - look for the "Found a relevant runbook" callout in the thinking trace before it dives into the investigation.

<img src="/img/lab4-05a-semantic-discovery.png" alt="Assistant matching the natural-language prompt to the Skill - thinking trace shows Found a relevant runbook and proceeds to follow it" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

This works because:

- The Skill's title mentions "frontend" and "500s", and the body mentions "storefront", "homepage", "products", and "SLO burn"
- The **Agents** toggle is on, which exposes it to the semantic search index
- The `Trigger:` line gives the Assistant explicit phrases to match against
- The user's prompt is on-topic

If the Skill doesn't get picked up:
- Confirm the **Agents** toggle is on for the Skill
- Try a more explicit phrase like `Investigate frontend 500s`
- Check that the Skill saved correctly under **Assistant → Settings → Skills**

:::info
**Why semantic discovery matters:** team members don't have to memorize slash commands. They ask a normal-language question and the right Skill gets pulled in. This is the single biggest reason to write Skills carefully - the title, body, and `Trigger:` line are also the semantic search keywords.
:::

---

## Step 6 - Iteratively improve the Skill

Skills are living documents, not write-once checklists. Real teams update them after every incident.

Paste a small recap of your last Assistant conversation into the chat and ask:

```text
Based on the investigation we just walked through, what should I add to my "Investigate frontend 500s" Skill to make the next investigation faster?
```

The Assistant should suggest concrete additions - maybe specific metric thresholds, additional log patterns to grep for, or k6 load test recommendations to prevent the same connection leak in CI.

<img src="/img/lab4-06a-skill-improvements.png" alt="Assistant proposing concrete Skill additions - datasource UIDs, service_name label, gRPC error correlation, mitigation step, plus Apply all updates / Add UIDs only / Preview first buttons" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

Notice the action buttons at the bottom of the suggestion: **Apply all updates**, **Add UIDs only**, **Preview first**. The Assistant doesn't just describe changes - it offers to write them straight back into the Skill body. Pick **Preview first** so you can see the diff before committing.

This is the iteration loop: every real investigation is an opportunity to improve the Skill that next investigation will use.

---

## Rules vs. Skills - the cheat sheet

| | Rules | Skills |
|:--|:--|:--|
| **When they apply** | Every conversation, automatically | Triggered at runtime via slash command or semantic search |
| **Best for** | Style, defaults, org-wide standards | Specific workflows, runbooks, investigation flows |
| **Scope** | Just me / Everybody | Just me / Everybody |
| **Discoverability** | Always applied | **Agents** toggle controls semantic discovery; **Command** toggle controls slash-command invocation |
| **Examples** | "Always use RED method", "Prefer Prometheus metric names", "Ask about recent deployments first" | "Investigate frontend 500s", "Check postgres connection health", "Validate deployment safety" |

---

## ✅ Checklist

- [ ] Created the RED-method-and-deployments Rule and confirmed new conversations follow it
- [ ] Created the `Investigate frontend 500s` Skill with **Agents** and **Command** toggles on, and a `Trigger:` line in the body
- [ ] Triggered the Skill via `/investigate-frontend-500s`
- [ ] Triggered the Skill via a natural-language prompt (semantic discovery)
- [ ] Asked the Assistant for improvements and added at least one update to the Skill body
