---
sidebar_position: 2
---

# Lab 1 - 🎉 Get Ready

Goal: open the Assistant, send a baseline prompt, and notice what stock Assistant looks like before you apply any power-user techniques.

:::note
Complete the [Session Setup](/lab1/session-setup) steps first if you haven't already.
:::

---

## Step 1 - Open the Assistant

Open the Assistant panel using the sparkles icon in the top-right of the navigation bar.

You should see an empty conversation panel with a prompt input at the bottom.

---

## Step 2 - Send a deliberately vague prompt

In the Assistant, send this prompt as-is:

```text
What's wrong with my services?
```

The Assistant doesn't know which services you mean, what time range to look at, or what "wrong" looks like in your environment. It will either ask a clarifying question or guess broadly. Either way, the answer is generic.

<img src="/img/lab1-01b-vague-prompt-thinking.png" alt="Assistant thinking and tool calls" style={{maxWidth: '420px', display: 'block', margin: '0 auto 1.5rem'}} />

<img src="/img/lab1-01c-vague-prompt-response.png" alt="Assistant's broad services-with-errors response" style={{maxWidth: '360px', display: 'block', margin: '0.5rem auto 1.5rem'}} />

**Note what's missing:** the Assistant has no anchor to your data. It can see your stack but it has no idea where to start looking.

---

## Step 3 - Send a structured prompt for comparison

Start a **new conversation** (look for the conversation list or "New chat" button - keeping prior context out helps the Assistant focus). Send this:

```text
List the error rate and P95 latency for the productcatalogservice over the last hour.
```

Read the response. Even without any customization, this prompt gets you concrete numbers because it specifies:

- An **action verb** (`List`)
- **What** (error rate, P95 latency)
- **Which service** (productcatalogservice)
- **Time range** (last hour)

<div style={{display: 'flex', gap: '0.5rem', alignItems: 'stretch', maxWidth: '720px', margin: '0 auto 1.5rem'}}>
  <div style={{flex: 1, height: '420px'}}>
    <img src="/img/lab1-02a-structured-error-rate.png" alt="Error rate chart for productcatalogservice rising sharply" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
  <div style={{flex: 1, height: '420px'}}>
    <img src="/img/lab1-02b-structured-p95-latency.png" alt="P95 latency chart for productcatalogservice holding steady" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
</div>

This is the simplest form of advanced prompting - and it's the difference between a frustrated user and a useful one.

---

## Step 4 - Note your baseline

Before moving on, capture a few things from the second response. You'll come back to these in later labs:

- **What data source** did the Assistant use to answer? (Prometheus, Loki, the AI Observability API?)
- **How long** did the response take?
- **Did the Assistant ask follow-up questions** or jump straight to a chart/answer?

Take a screenshot of the response or jot the numbers in a scratch doc. You'll iterate on this prompt across the next labs.

---

## What just happened

You did two things:

1. **Demonstrated the floor**: vague prompts produce vague results, even with a fully-equipped Assistant
2. **Demonstrated the lift from prompt structure alone**: action verb + scope + time range immediately gets concrete output

Every advanced technique in the rest of this module builds on this baseline.

---

## ✅ Checklist

- [ ] Assistant panel opens from the sparkles icon
- [ ] Sent the vague prompt and observed a generic response
- [ ] Sent the structured prompt and got concrete numbers
- [ ] Captured the baseline response (screenshot or notes)
