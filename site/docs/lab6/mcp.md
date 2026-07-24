---
sidebar_position: 1
---

# Lab 6 - 🔌 MCP

## Learning objectives

- Verify the two pre-configured MCP servers attached to your stack (Kubernetes, GitHub)
- Use the Kubernetes MCP to inspect AND remediate a failing service from inside the Assistant
- Use the GitHub MCP to file an issue for engineering directly from a conversation
- Understand the trade-offs: tool limits, auto-approve vs. human-in-the-loop, blast radius

:::info
**This lab has two parts that can be run independently.** Part A uses the Kubernetes MCP to remediate the issue you found in Lab 4. Part B uses the GitHub MCP to file an issue about the same problem. They share the same scenario but neither depends on the other - you can run both, or pick one based on what you want to demo to a customer.
:::

---

## Background

The Model Context Protocol (MCP) is the open standard for connecting LLM agents to external tools and systems. In Grafana, MCP lets the Assistant talk to systems outside of Grafana - Kubernetes clusters, issue trackers, code repos, documentation - through a standardized interface.

The appenv workshop stack ships with two MCP servers pre-configured:

| MCP server | What it does | Auth |
|:--|:--|:--|
| `Kubernetes [a]` | Read pod/deployment/service state, delete pods, scale workloads, update HPAs | Service account token (pre-configured) |
| `GitHub Repositories [a]` + `GitHub Issues [a]` + `GitHub Pull Requests [a]` | Read repos, file and comment on issues, manage PRs against `field-eng-appenv-mirror` | Workshop GitHub token (pre-configured) |

Both are wired up by Terraform when the stack is deployed - you don't have to configure them yourself.

---

## Step 1 - Verify the MCPs are connected

1. Navigate to **Assistant → Settings → Integrations** in the left sidebar
2. Find the **MCP servers** tab
3. Confirm you see at minimum:
   - `Kubernetes [a]`
   - `GitHub Repositories [a]`
   - `GitHub Issues [a]`
   - `GitHub Pull Requests [a]`
4. Each should show as connected/healthy with its tool count (e.g. `8 of 8 tools enabled`)

<img src="/img/lab5-01a-mcp-servers-page.png" alt="MCP servers tab under Assistant Settings Integrations showing GitHub Issues, GitHub Repositories, Kubernetes, and GitHub Pull Requests all healthy" style={{maxWidth: '720px', display: 'block', margin: '0 auto 1.5rem'}} />

If any are missing or show errors, let your facilitator know - the workshop stack should have all of them by default.

:::tip
**Why the `[a]` suffix?** The `[a]` stands for **AppEnv** - the workshop's application environment. The Terraform that provisions AppEnv registers these MCPs with the `[a]` tag so workshop facilitators can tell at a glance which integrations came from AppEnv provisioning vs. created manually by learners during the lab.
:::

---

## The scenario

Continuing from Lab 4: your Deep Investigation identified that `productcatalogservice` is leaking postgres connections, hitting the connection limit, and crashing. The pods are restarting in a sawtooth pattern. You have two follow-ups to make:

1. **Immediate**: get the storefront back to a working state by forcing a clean restart
2. **Longer-term**: file a GitHub issue so engineering can fix the connection leak in code

Part A handles the first, Part B handles the second.

---

## Part A - Remediate with Kubernetes MCP

### A1 - Inspect the failing pods

Open the Assistant. Start a new conversation and send:

```text
Using the Kubernetes MCP, list the productcatalogservice pods in the ecommerce-prod namespace. For each one, show its status, age, and restart count.
```

The Assistant should call the `pods_list_in_namespace` tool on the Kubernetes MCP and return a table. You're looking for:

- **Restart count** elevated (matches the sawtooth pattern from Lab 4)
- **Age** young - confirming the pods have been recently restarted
- **Status** likely `Running` (the crash loop is intermittent - postgres exhausts → crash → restart → run for a bit → repeat)

<img src="/img/lab5-a1-list-pods.png" alt="Assistant response listing productcatalogservice pods in ecommerce-prod - one with 17 restarts in the last 42m, plus follow-up buttons for crash logs, RED metrics, CPU/memory usage, recent deployments" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

### A2 - Get more detail on one pod

Ask the Assistant to drill in:

```text
Get the full details for the productcatalogservice pod with the highest restart count. Include recent events.
```

The Assistant calls `pods_get` and `events_list`. You should see:

- Container restart events
- Exit codes pointing to OOM or crashes (in this stack you'll often see `exit 137` for OOMKilled - the connection leak inflates memory before postgres rejects)
- Possibly the `pq: sorry, too many clients already` error from container logs (depending on what's surfaced via events)

<img src="/img/lab5-a2-pod-details.png" alt="Pod details for highest-restart productcatalogservice pod showing OOMKilled exit 137, 17 restarts in 10 days, Pyroscope profiling enabled, recent OOMKilled and Pulling image events" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

### A3 - Restart the pod via MCP

Now the remediation. Send:

```text
Delete the productcatalogservice pod with the highest restart count to force a fresh start. Show me the result before I confirm.
```

The Assistant will draft the action - showing pod, namespace, restart count, and current state in a tidy table - and (depending on the auto-approve settings) ask for confirmation via **Confirm delete** / **Investigate first** buttons before executing. Approve.

<img src="/img/lab5-a3-delete-confirm.png" alt="Delete-pod draft from the Assistant showing what will be deleted, a note that it's a symptomatic fix only, and Confirm delete / Investigate first action buttons" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

The Assistant calls `pods_delete`. Kubernetes' deployment controller will spin up a replacement pod, which starts with a clean connection pool to postgres.

Verify the action took effect:

```text
List the productcatalogservice pods again and tell me which one is new.
```

The new pod should appear with age in seconds and a restart count of 0.

<img src="/img/lab5-a3-verify-new-pod.png" alt="Assistant confirming the new pod is 19 seconds old with 0 restarts, scheduled on a different node, plus Memory profiles / Monitor memory / Check RED metrics follow-up buttons" style={{maxWidth: '720px', display: 'block', margin: '0 auto 1.5rem'}} />

:::warning
**This is a real action on the cluster.** You just deleted a pod via an LLM-orchestrated call. In production, the safety questions are:

- **Auto-approve vs. confirm**: by default, MCP actions surface a confirmation prompt. Auto-approve removes the prompt and is appropriate only for well-tested workflows
- **RBAC scope**: the workshop service account is scoped to the ecommerce-prod namespace and a fixed verb set. In your customer environments, scope is the most important guardrail
- **Blast radius**: deleting one pod is recoverable. Scaling a deployment to zero, or deleting a deployment, is not. Match the RBAC verbs available to the actual risk tolerance
:::

### A4 - Talk through what just happened

Pause and think through what the Assistant did:

1. **Read** cluster state (pods, events) without you writing kubectl commands
2. **Reasoned** about which pod was the worst offender
3. **Wrote** to the cluster (deleted the pod) after confirmation
4. **Verified** the action by re-reading state

That's the full read-reason-write-verify loop, orchestrated by natural language. It's the difference between Assistant-as-chatbot and Assistant-as-agent.

### A5 - How the Kubernetes MCP server is set up

Now that you've used the MCP, here's how it got here. There are three pieces to a working Kubernetes MCP integration:

**1. The MCP server runs inside the cluster**

A Kubernetes MCP server is deployed as a pod in the target cluster. In this workshop, it's already running as `kubernetes-mcp-server-*` in the `ecommerce-prod` namespace, installed via the `kubernetes-mcp-server-0.1.0` Helm chart.

**2. An Ingress exposes it to Grafana**

The MCP server needs to be reachable over HTTP so the Grafana Assistant can communicate with it via SSE or Streamable HTTP. The workshop cluster has a `kubernetes-mcp-server` Ingress already configured for this.

**3. It's registered in the Assistant**

Navigate to **Assistant > Settings > Integrations > MCP servers**. Click **Edit** on `Kubernetes [a]` and you'll see the registration that was created for you: the Ingress URL, an `Authorization` custom header, and the **Enabled** toggle. The Tools tab lists each tool the MCP server exposes - `events_list` (Read), `pods_get` (Read), `pods_delete` (Write), `pods_list_in_namespace` (Read), etc. - with per-tool **Default / Auto-approve / Always ask** approval modes:

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '440px'}}>
    <img src="/img/lab5-a5-k8s-mcp-settings.png" alt="Edit MCP server Settings tab for Kubernetes [a] - Name, Enabled toggle, Server URL pointing at the in-cluster Ingress, Authorization header configured" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '440px'}}>
    <img src="/img/lab5-a5-k8s-mcp-tools.png" alt="Edit MCP server Tools tab for Kubernetes [a] - 8 of 8 tools enabled including events_list, pods_get, pods_delete, pods_list_in_namespace with Read/Write tags and per-tool approval modes" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

To register a new one from scratch:

1. Click **Add MCP server**
2. Enter the server URL (the Ingress endpoint)
3. Add an `Authorization` header with the service account or PAT token
4. Save

**RBAC controls what the MCP server can do**

The MCP server runs under a Kubernetes service account. That account's ClusterRole/RoleBinding determines which namespaces and resources it can access. In this workshop, the service account has access to the `ecommerce-prod` namespace with a fixed set of verbs - it can list pods, get details, delete pods, and scale deployments, but nothing more.

:::info
MCP server configuration requires the **Assistant MCP User** role or higher. If the settings page is unavailable, check with your Grafana admin. See the [Grafana MCP documentation](https://grafana.com/docs/grafana-cloud/ai/configure-llm/mcp-servers/) for full setup details.
:::

---

## Part B - File a GitHub issue with the GitHub MCP

### B1 - Draft the issue

In a new conversation (or continuing the one from Part A), send:

```text
Using the GitHub MCP, draft an issue in the field-eng-appenv-mirror repo titled "productcatalogservice leaks postgres connections - causes crash loop". The body should summarize:

- The symptom: 500 errors on the homepage, products missing
- The root cause: productcatalogservice is not closing postgres connections
- The signature: sawtooth pattern in pg_stat_activity, restarts on the productcatalog deployment, "pq: sorry, too many clients already" in logs
- The recommended fix: review connection handling in the postgres client code, add a k6 load test that holds 100 concurrent users to prevent recurrence in CI

Don't submit yet - show me the draft first.
```

The Assistant should produce a draft issue with a structured body and ask whether to submit it to `grafana/field-eng-appenv-mirror`. Read it - the LLM may inflate the wording or miss a key fact. If anything needs changing, work with the Assistant to edit and update the draft.

<img src="/img/lab5-b1-draft-issue.png" alt="Assistant draft GitHub issue with Summary and Symptom sections, asking whether to submit it to grafana/field-eng-appenv-mirror" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

### B2 - Submit the issue

Once you're happy with the draft:

```text
Submit the issue.
```

The Assistant calls the GitHub MCP's create-issue tool. You should get back the issue URL.

Click through to verify the issue actually appeared on GitHub. You can also check the [issues list](https://github.com/grafana/field-eng-appenv-mirror/issues) directly.

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '320px'}}>
    <img src="/img/lab5-b2-issues-list.png" alt="field-eng-appenv-mirror issues list showing the newly created productcatalogservice issue at the top" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '320px'}}>
    <img src="/img/lab5-b2-issue-detail.png" alt="The created GitHub issue page with Summary, Symptom, and Root Cause sections" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

:::tip
**The default repo is set via a baked-in Rule.** The appenv stack has a Rule called "Default GitHub Repo" that points all GitHub MCP actions at `field-eng-appenv-mirror` unless you explicitly override. This is why you didn't have to specify the org and repo every time. Customer setups should do the same - use a Rule to anchor the default target so users don't have to remember it.
:::

### B3 - Connect it to the Skill from Lab 5

Now combine everything you've built. Update your `Investigate frontend 500s` Skill from Lab 5 with a new final step:

```text
7. If the root cause is confirmed, draft a GitHub issue in field-eng-appenv-mirror summarizing the symptom, root cause, and recommended fix. Show me the draft before submitting.
```

Save the Skill. Now the next time anyone triggers this Skill - or asks a natural-language version of "storefront is broken" - the Assistant will run the full investigation AND draft a follow-up ticket automatically.

This is the pattern customers find most valuable: encode the entire end-to-end workflow once, then run it any time the symptom recurs.

### B4 - How the GitHub MCP server is set up

Unlike the Kubernetes MCP (which runs inside the cluster), the GitHub MCP is hosted by GitHub. You don't run anything yourself - you just register the hosted endpoint with Grafana and supply a token. There are two paths:

**Option A - Remote MCP server (recommended, and what this workshop uses)**

GitHub hosts MCP endpoints at `https://api.githubcopilot.com/mcp/*`. Grafana Assistant connects directly:

1. Navigate to **Assistant → Settings → Integrations → MCP servers**
2. Click **Add MCP server**
3. Enter the URL (e.g. `https://api.githubcopilot.com/mcp/x/issues` for the Issues toolset)
4. Set transport to **Streamable HTTP**
5. Add an auth header: `Authorization: Bearer <GITHUB_PAT>`
6. Save - the GitHub tools (issues, PRs, repos) will appear in the Assistant

**Option B - Self-hosted MCP server**

Run the GitHub MCP server container in your own infrastructure (useful for GitHub Enterprise or stricter network policies), expose it via HTTP/SSE, then register its URL the same way.

**Token scopes needed on the GitHub PAT:**

- `repo` - for issues, PRs, code
- `read:org` - if querying org-level data

**How appenv deploys this for the workshop**

The workshop stack registers **three separate MCP integrations** rather than one - one per GitHub toolset, so each can be enabled/disabled independently and so the Assistant's tool count per server stays well below the 16-tool quality threshold:

| Name | Endpoint |
|:--|:--|
| `GitHub Repositories [a]` | `https://api.githubcopilot.com/mcp/x/repos` |
| `GitHub Issues [a]` | `https://api.githubcopilot.com/mcp/x/issues` |
| `GitHub Pull Requests [a]` | `https://api.githubcopilot.com/mcp/x/pull_requests` |

Each is created by `appenv-deploy/assistant.tf` via a `shell_script` resource that loops over the three toolsets and POSTs to the Grafana Assistant integrations API. The PAT comes from a sensitive Terraform variable (`assistant_github_token`) and gets injected as `Authorization: Bearer <token>` in the custom headers. Scope is tenant-wide and applications is `all`, so every user on the stack sees them by default.

Open **Edit** on `GitHub Issues [a]` in the MCP servers settings to see this in practice - the hosted Copilot endpoint as the Server URL, the `Authorization` header (value shown as `configured` once saved), and the **Tools** tab listing the 8 issue tools (`add_issue_comment`, `get_label`, `issue_read`, `issue_write`, etc.) with their Read/Write tags and approval modes:

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '440px'}}>
    <img src="/img/lab5-b4-github-mcp-settings.png" alt="Edit MCP server Settings tab for GitHub Issues [a] - URL set to https://api.githubcopilot.com/mcp/x/issues, Authorization header configured, MCP Server Requirements callout" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '440px'}}>
    <img src="/img/lab5-b4-github-mcp-tools.png" alt="Edit MCP server Tools tab for GitHub Issues [a] - 8 of 8 tools enabled including add_issue_comment, get_label (Read), issue_read (Read), issue_write with per-tool approval modes" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

:::info
MCP server configuration requires the **Assistant MCP User** role or higher. If the **Integrations** tab is not visible at `/a/grafana-assistant-app/settings/integrations/mcp-servers`, contact your Grafana admin to grant that role. See the [Grafana MCP documentation](https://grafana.com/docs/grafana-cloud/ai/configure-llm/mcp-servers/) for full setup details.
:::

---

## When NOT to use MCP

A few things to know that will come up in customer conversations:

- **More than 16 tools enabled significantly degrades quality.** Each MCP server contributes multiple tools. Enable only what you need.
- **Only remote MCP servers are supported** - no local MCP servers (yet). The K8s MCP works because it's deployed remotely to the cluster, even though it's "in the same network" as the workshop stack.
- **Auth scopes matter**: "Just me" allows OAuth. "Everybody" (team-wide) requires an Auth Header token.
- **Privacy**: MCP tool calls go through the same LLM provider as regular Assistant chat. Sensitive data shouldn't be passed to tools whose providers you don't trust.

---

## ✅ Checklist

**Setup**

- [ ] Verified `Kubernetes [a]` and the three GitHub MCP servers are connected in Assistant Settings > Integrations > MCP servers

**Part A - Kubernetes MCP**

- [ ] Listed productcatalogservice pods and identified the one with the most restarts
- [ ] Got detailed pod and event info via MCP
- [ ] Deleted a pod via MCP and verified the replacement came up clean

**Part B - GitHub MCP**

- [ ] Drafted a GitHub issue for the postgres connection leak
- [ ] Submitted the issue and clicked through to verify it was created
- [ ] Updated the `Investigate frontend 500s` Skill from Lab 5 to include the GitHub follow-up step
- [ ] Closed your generated issue (see cleanup below)

---

## Cleanup

This is a shared repo. After verifying your issue was created, close it to avoid clutter. You can see all open issues at [field-eng-appenv-mirror/issues](https://github.com/grafana/field-eng-appenv-mirror/issues). Find yours and close it, or ask the Assistant to close it for you.
