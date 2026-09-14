---
sidebar_position: 4
---

# Lab 4 - Learning Grafana With Assistant

In the first three labs you did the driving. You decided what to ask, where to point the Assistant, and when to escalate to an investigation. This lab turns that around. In **Learn mode** the Assistant sets the agenda and teaches *you*, using the stack in front of you as the course material.

That matters because the hardest part of getting good at observability usually isn't the tooling, it's understanding exactly what to look for and what to monitor. Learn mode builds the lesson around the services you actually run, and stops after every step to check you're still with it.

## Learning objectives

- Switch into Learn mode and understand how it differs from the default chat mode
- Describe your role and your goal so the lessons come back grounded in your own infrastructure
- Work through a lesson step by step, approving hands-on actions before they run
- Steer a lesson while it's running: slow it down, change direction, go hands-on, or test yourself
- Know when Learn mode is the right tool, and what it deliberately isn't

---

## Part 1 - Switch into Learn mode

### Step 1.1 - Find the mode selector

Open the Assistant panel and start a **brand-new conversation**, then set the mode selector to **Learn**. You're looking for the green book icon, described as *Personalized observability lessons based on your role and infrastructure*.

Starting fresh isn't optional here. As you saw with Investigation mode in Lab 2, the mode selector is hidden in any chat that already has messages, so you can't convert a conversation you're halfway through into a lesson.

:::info
**The lesson may start without you.** In the Assistant panel, choosing Learn on a conversation you haven't typed into yet kicks things off on its own: the Assistant greets you and asks its opening questions before you've sent anything. The mode quietly sends a message on your behalf to get the ball rolling.

On the full-page **Workspace** that doesn't happen. Switch to Learn there and nothing moves until you send something yourself. If the panel just sits there, say hello and it'll pick up from the same place.

You can also land straight in the mode by adding `?mode=learn` to the Assistant's URL, which is a handy link to drop into an onboarding doc.
:::

### Step 1.2 - Read what it asks you

The opening message asks you three things: what your job is, which Grafana products or features you want to understand, and what problem you're actually trying to solve.

Answer in your own words. This stage is deliberately a text conversation rather than a menu of buttons, because the shape of your answer is what the rest of the lesson is built from.

:::assistant-tip
**Same Assistant, different brief.** Learn mode isn't a separate product, a different model, or a walled-off tutorial engine. It's the ordinary Assistant with a coaching instruction placed in front of its normal system prompt, plus a slightly different set of tools.

That's why everything from Lab 1 still works inside it. It can still query your metrics, read your logs, pull a trace, and navigate you around Grafana mid-lesson. It just paces itself, teaches as it goes, and asks before it acts.
:::

---

## Part 2 - Get a lesson built from your own stack

### Step 2.1 - Describe your role and your goal

Reply with both who you are and what you're trying to get out of it. Something like:

```text
I'm an SRE and I'm new to this stack. I want to get confident reading traces and using them to explain latency, so I can take an on-call shift on these e-commerce services.
```

The quality of what comes back tracks the specificity of what you send. *"Teach me Grafana"* is not a recommended answer, because it gives the Assistant nothing to personalize against and you'll get a lesson that could have been written for anyone.

Observe what the Assistant does before it answers. It goes looking at your environment: reading the infrastructure **Memories** from Lab 2 for a picture of your services and their dependencies, and falling back to searching your connected data sources directly if Memories aren't available. Only then does it come back with **three to five** lesson options, each a single line.

Read those options critically, the same way you read the health overview at the end of Lab 1:

- Do they name **your** services, like the `frontend`, the `productcatalogservice`, or the database?
- Do they reference **your** data sources and the technologies you're actually running?

That last question is the whole test. Personalization is the reason to use this mode over reading the documentation, so it's worth checking you got it.

### Step 2.2 - Ground it harder if you need to

If the suggestions came back vaguer than you wanted, pin them down the same way you did in Lab 2, by naming things explicitly and `@` mentioning the ones you want it to use:

```text
Build the lesson around the productcatalogservice, and use my Prometheus and Loki data sources for the examples.
```

You can also point it at what's on your screen. If you have a dashboard open, ask for a lesson that explains what you're looking at, and the crosshair and `@` mention precision tools from Lab 2 work here exactly as they did there.

---

## Part 3 - Work through a lesson

### Step 3.1 - Pick one and notice the pacing

Choose a lesson from the list:

```text
Let's do the traces one.
```

Then pay attention to the rhythm, because it's the main difference between this and simply asking a question. The Assistant introduces **one** concept, then stops and waits for you. It won't dump the whole topic in a single message, and a full lesson is designed to run about ten to fifteen minutes rather than being something you skim in thirty seconds.

Say `ready`, `next`, or ask a question about the step you're on. The pauses are the design, not the Assistant being slow.

### Step 3.2 - Approve a hands-on action

This is the step to slow down on, because it's where a lesson stops being a lecture.

When a concept is better shown than described, the Assistant proposes doing it for real and asks first. You'll get something along the lines of *"Let's create a dashboard for your productcatalogservice showing request rate, error rate, and latency. Should I go ahead and create this?"*

Confirm it, then watch what happens after the tool runs. It checks its own work: taking a screenshot of the dashboard it just built to confirm the panels render, or validating that a query actually returned data. If something came back broken, it says so and offers to fix it rather than moving on as though the demonstration worked.

:::warning
**Learn mode can write, not just read.** Its tool set includes the dashboard-building tools that the default chat mode doesn't have, so a lesson can genuinely create a board in your stack rather than showing you a picture of one.

It's instructed to describe the action and ask permission first, and in practice it does. Treat those confirmations as real approvals rather than **Next** buttons, exactly as you did with the MCP actions in Lab 2. And the Dashboarding-mode caution from Lab 2 Part 9 applies here too: if a lesson is heading towards building a dashboard, get yourself onto a blank canvas first rather than a board you care about.
:::

:::info
**Your Rules still apply.** A Rule is always-on guidance across every conversation, and a lesson is just a conversation. If you wrote the RED-method Rule in Lab 2, expect a metrics lesson to be framed around Rate, Errors, and Duration without your asking. That's worth knowing in both directions, because a Rule that's useful during an incident can quietly narrow how something gets taught.
:::

---

## Part 4 - Steer the lesson

A lesson is a conversation, which means you're allowed to interrupt it. This makes the mode genuinely useful rather than a slide deck that talks back. Try each of these in the lesson you're in the middle of.

**Slow it down.** If an explanation went over your head, say so rather than nodding along:

```text
Explain that TraceQL query again more slowly, and tell me what each part of it does.
```

**Change direction.** You're not locked into the syllabus it proposed:

```text
Skip ahead - I'd rather see this for logs than for metrics.
```

**Go and do it yourself.** Being shown something is not the same as having done it:

```text
Take me to that trace in Explore so I can click through it myself.
```

**Test yourself.** At the end of a lesson the Assistant offers a short assessment, and you can ask for it whenever you want:

```text
Give me a five-question assessment on what we just covered.
```

**Stop.** Say you're done and you're done:

```text
That's enough for today, thanks.
```

That last one is deliberate behavior rather than a happy accident. Learn mode is instructed to take "I'm finished" at face value and let you go.

---

## Part 5 - What Learn mode is, and what it isn't

Worth being straight about the shape of this feature, because the name invites a few wrong assumptions.

**It's a conversation, not a guided tour.** There are no highlighted buttons, no overlay pointing at the navigation bar, no progress bar, and no quiz interface. The lesson is messages and the assessment is messages. Don't confuse it with the *interactive tutorial* link on the Assistant's welcome screen, which is a separate onboarding widget and not this.

**Nothing is saved as a course.** There's no curriculum, no completion record, and no resume button. The conversation *is* the artifact: it sits in your chat history like any other, so if a lesson was good, keep the link and share it the way you shared the investigation in Lab 2.

**It can only teach what your stack shows it.** Point it at an empty environment with no traffic and the lessons will be thin. That's the trade you're making for lessons about your own services rather than someone else's example app.

Given all that, the three places it earns its slot are these:

- **A new team member on day one**, who needs to learn Grafana and your infrastructure at the same time, which is exactly the combination that documentation handles badly.
- **A Grafana feature your team has never picked up.** Everyone has one, whether that's SLOs, exemplars, recording rules, or alerting done properly.
- **The quiet hour after an incident**, when you want to actually understand the thing you just fumbled your way through under pressure.

:::assistant-tip
The highest-value thing you can do with this after the workshop is aim it at the gap you already know about. Pick the feature your team has been meaning to adopt for six months, open Learn mode, and describe your role and that goal. It turns "read the docs one day" into fifteen minutes against your own services..
:::

---

## What just happened

You spent three labs learning to prompt the Assistant well. In this one it did the teaching:

- **A lesson built from your environment**, discovered through Memories and your connected data sources rather than pulled from a generic syllabus
- **Paced, interactive delivery**, one concept at a time, with the Assistant waiting for you between steps
- **Real demonstrations in your own stack**, proposed and approved before they ran, then verified afterwards
- **A conversation you can steer**, slowing down, changing topic, going hands-on, or testing yourself at any point

That closes the loop the workshop opened. Lab 1 taught you to ask, Lab 2 put that to work on a live incident, Lab 3 moved it to where your team works, and this lab means the next person doesn't need any of us to get started. They can ask the Assistant to teach them, on the stack they've just been handed.
