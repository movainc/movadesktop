# mova Privacy Notice

_Last updated: 28 September 2026_

> **Draft.** This notice describes how the current desktop app behaves. It must be reviewed by qualified legal counsel, and updated before accounts, sync or analytics are added. Items in [square brackets] need to be completed.

## Summary

- Your workspace (tasks, notes, files, code, calendar) is stored **on your device**. Mova Inc does not receive it.
- mova has **no account, no analytics and no tracking** in this version.
- Data leaves your device **only** when you use an optional AI feature, and then only to the AI provider.

## What mova stores on your device

| Data | Where |
|---|---|
| Your workspace | The app's local storage on your device |
| Settings (theme, AI on/off) | The app's local storage on your device |
| AI API key (if you save one) | `ai.json` in mova's app config folder, readable only by your user account on macOS/Linux |

Uninstalling mova and removing its app data deletes all of the above.

## What is sent off your device

**Only when you use an AI feature**, mova sends a request directly from your device to the AI provider (currently **OpenAI**) using the API key you provided. Each request includes only what that feature needs:

| Feature | Data sent |
|---|---|
| Assistant | Your question, the last few messages of that chat, today's schedule, up to 40 open task titles with project names and due dates, and project deadlines |
| Suggest tasks from a note | That note's title and text (up to 4,000 characters) |
| Break into steps | That task's title and its project name |

Mova Inc does not see or store these requests. The provider handles them under its own privacy policy and terms (see https://openai.com/policies). You can turn AI off at any time in **Settings → AI**.

Opening a link you saved opens it in your web browser, which is subject to that website's policies.

## Children

mova is intended for users aged 13 and over. Younger users need a parent or guardian's permission, as described in the [Terms of Use](TERMS.md). Because mova doesn't collect personal data on our servers, we don't knowingly collect children's data. The AI features should be used with a parent's or school's guidance.

## Your rights

Your data is on your device, so you control it directly. You can view, export (by copying), change or delete it at any time. For AI requests, contact the AI provider about their data handling.

## Changes

When mova adds accounts, sync or analytics, this notice will be updated before those features are released, with details of what is collected, why, the legal basis, retention and your rights.

## Contact

Mova Inc — [privacy contact email] — [postal address]
