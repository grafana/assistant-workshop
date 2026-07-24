---
sidebar_position: 1
---

# ATTENTION! - Session Setup

Complete these steps once at the start of the module.

## What you'll need

- Your **Grafana Cloud stack** - pre-provisioned with Brokkr
- A user that has the following capabilities:
  - **Assistant User** role (required for all labs)
  - **Investigation User** role (required for Lab 4)
  - **Admin** role on the stack (required to create org-wide Rules in Lab 5 and to configure MCP servers in Lab 6)

---

## Step 1 - Log into your Grafana Cloud stack

Open your stack URL and sign in with your workshop credentials.

---

## Step 2 - Open the Assistant

The Grafana Assistant lives in the right side panel of any Grafana page. Look for the **sparkles icon** in the top-right of the navigation bar to toggle the panel.

<img src="/img/setup-01-assistant-panel.png" alt="Assistant panel open in Grafana with the sparkles icon highlighted in the top navigation" style={{maxWidth: '480px', display: 'block', margin: '0 auto 1.5rem'}} />

If the Assistant doesn't appear:

- Confirm the plugin is enabled: **Administration → Plugins** and search for "Grafana Assistant"
- Confirm you have the **Assistant User** role: **Administration → Users and access → Users**, find your user, and check role assignments
- If neither resolves it, let your facilitator know

---

## Step 3 - Access the storefront

Several of the labs in this module investigate the AppEnv e-commerce storefront. Confirm you can reach it:

- Find the storefront URL under **App URL** on your environment details page (typically `https://<workshop_id>.field-eng-demo.grafana.net`)
- Open it - you should see the storefront homepage

![Storefront homepage showing the OpenTelemetry demo telescope shop](/img/setup-02-storefront-homepage.png)

If the page doesn't load at all, let your facilitator know.

---

## Step 4 - Turn on the Lab 4 scenario feature flag

Lab 4 (Investigations) walks through a postgres connection leak in the productcatalogservice. The scenario is controlled by a feature flag - you need to make sure it's on.

1. Open the Feature Flags dashboard: **your-stack-url**/`d/appenv-feature-flags/feature-flags?orgId=1&from=now-3h&to=now&timezone=browser&refresh=30s`
2. Find the `productCatalogStopClosingPostgresConnections` flag
3. Check its current state on the dashboard
4. If it's **off**, click **Enable** and confirm the action. If it's already on, no action needed

![Feature Flags dashboard with productCatalogStopClosingPostgresConnections highlighted and the Confirm action dialog open](/img/setup-03-feature-flag-toggle.png)

The **Flag State History** panel at the bottom of the dashboard shows the state of every flag over time. You should see `productCatalogStopClosingPostgresConnections` as **on** by the end of this step.

![Flag State History panel showing productCatalogStopClosingPostgresConnections enabled](/img/setup-04-feature-flag-history.png)

:::warning
This changes behavior for everyone on the stack. The flag causes the productcatalogservice to leak postgres connections, which leads to crashes and 500 errors on the storefront homepage - by design, for Lab 4.
:::

---

## ✅ Checklist

- [ ] Logged into Grafana Cloud stack
- [ ] Assistant panel opens from the sparkles icon
- [ ] Storefront URL loads
- [ ] `productCatalogStopClosingPostgresConnections` feature flag is on
