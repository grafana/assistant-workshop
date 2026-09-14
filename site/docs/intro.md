---
sidebar_position: 1
slug: /
---

# Welcome

Welcome to this Grafana Labs Introduction to Grafana Assistant workshop.

Let's make sure you're all set up.

## What you'll need

The **workshop facilitator will provide** you with the following:

- A personal logon (username and password)
- A URL to a pre-provisioned Grafana Cloud stack - e.g. `https://nnnnnn.grafana.net`
- Access to the AppEnv e-commerce storefront running on that stack
- A URL to your own browser IDE, used for the command-line part of Lab 3

Your user needs the following roles on the stack. Lab 1 needs only the first; the rest are arranged for you before the workshop starts:

- **Assistant User** - every lab
- **Assistant Investigation User** - the Deep Investigation in Lab 2
- **Assistant MCP User** - the Kubernetes and Gitea actions in Labs 2 and 3
- **Assistant CLI User** - the command-line part of Lab 3
- **Assistant Admin** - to save org-wide Rules, Skills, and Automations (personal scope works without it)

:::info
Your logon has been sent to the email address you provided when you signed up. If you haven't received the email, please check your Spam or Junk Mail folder. Or, speak to your facilitator.
:::

**Nothing to install.** Every hands-on step in this workshop runs in your browser, against the Grafana stack, the workshop Gitea, and the browser IDE provisioned for you. Even the command-line part of Lab 3 runs in that IDE, with the CLI already installed. A browser and your logon are all you need.

## What's covered

This workshop builds from everyday fundamentals to a full incident investigation, then out to the rest of your team's workflow:

- **Lab 1 - Understanding Assistant:** the everyday workflows - asking questions in natural language, navigating Grafana by asking, finding dashboards by concept, and reading and correlating telemetry across metrics, logs, and traces.
- **Lab 2 - Assistant During an Incident:** follow a single storefront outage from alert to resolution, using the Assistant's power features together. These features include infrastructure Memories, structured prompting, a Deep Investigation, MCP-driven remediation, and reusable Rules and Skills.
- **Lab 3 - Assistant Where Your Team Works:** take those capabilities out of the Assistant panel - into an application's own interface with the SDK, onto the command line the way a pipeline would drive it, and into scheduled Automations that run unattended - then work out where the blast radius sits in each of those surfaces.
- **Lab 4 - Learning Grafana With Assistant:** turn the Assistant into a coach. Learn mode builds a lesson from your role, your goals, and your own infrastructure, then walks you through it a step at a time - which is how the next person on your team gets up to speed without waiting for a workshop.

Every step is hands-on. The one capability we can't hand you is Slack, which needs a workspace connected to the stack by an admin; it's covered as a read-along in Lab 3 with the setup written out so you can follow it at home.

Once you're ready to begin, click the Next button below to move to the first lab.
