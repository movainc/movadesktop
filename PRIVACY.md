# mova Privacy Notice

_Last updated: 28 September 2026_

> **Draft.** This notice describes how the mova desktop and web apps behave. It must be reviewed by qualified legal counsel before public release. Items in [square brackets] need to be completed.

## Summary

- You sign in with your **Google account**. mova uses your name, email address and profile picture to show who is signed in and to keep a separate workspace for your account.
- Your workspace (tasks, notes, files, code, calendar) is stored **on your device** (desktop) or **in your browser** (web). If you turn on sync, it is also saved in a private app folder in **your own Google Drive**. Mova Inc does not run servers that receive your workspace.
- mova has **no analytics, no ads and no tracking**.
- Data leaves your device only to Google (sign-in, and Drive if you use it) and, if you use the optional AI features, to the AI provider.

## What mova stores on your device

| Data | Where |
|---|---|
| Your workspace, per account | The app's local storage on your device (desktop), or your browser's storage (web) |
| Settings (theme, sync choice, AI on/off) | The app's local storage |
| Google sign-in tokens (desktop) | `session.json` in mova's app config folder, readable only by your user account on macOS/Linux |
| Google OAuth client configuration (desktop) | `google-oauth.json` in mova's app config folder |
| AI API key (if you save one) | `ai.json` in mova's app config folder |

Uninstalling mova and removing its app data deletes all of the above.

## Google sign-in and Google Drive

- **Sign-in.** mova asks Google for your basic profile (name, email, picture) using the `openid email profile` permissions. On desktop this happens in your browser, and the resulting tokens stay in mova's native layer; on the web, Google's sign-in button gives mova a signed token containing your profile.
- **Workspace sync (optional, desktop).** With the `drive.appdata` permission, mova saves one file, `mova-workspace.json`, to a hidden app folder in your Google Drive. mova can't see your other Drive files through this permission.
- **Editing Drive files (optional, desktop).** If you press **Connect Google Drive**, mova asks for the `drive` permission, which lets it list, open, create and save files in your Drive. mova only reads a file when you open it and only writes a file when you edit or create it. Nothing is copied anywhere except onto your device, as part of your workspace, for files you open.
- **Limited use.** mova's use of information received from Google APIs follows the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements. mova does not sell Google user data, use it for advertising, or let people read it.
- **Revoking access.** Sign out in mova (which revokes its token), or remove mova at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## What is sent off your device for AI

**Only when you use an AI feature** (desktop only), mova sends a request directly from your device to the AI provider (currently **OpenAI**) using the API key you provided. Each request includes only what that feature needs:

| Feature | Data sent |
|---|---|
| Assistant | Your question, the last few messages of that chat, today's schedule, up to 40 open task titles with project names and due dates, and project deadlines |
| Suggest tasks from a note | That note's title and text (up to 4,000 characters) |
| Break into steps | That task's title and its project name |

Mova Inc does not see or store these requests. The provider handles them under its own privacy policy and terms (see https://openai.com/policies). You can turn AI off at any time in **Settings → AI**.

Opening a link you saved opens it in your web browser, which is subject to that website's policies.

## Data retention and deletion

Your workspace stays until you delete it: **Settings → Workspace → Clear** deletes the current account's workspace (and, with sync on, the synced copy is replaced by the empty workspace). Uninstalling mova and removing its app data, or clearing the site data in your browser, removes everything on that device. To delete the synced file, delete mova's hidden app data in Google Drive (**Settings → Manage apps → mova → Delete hidden app data**).

## Children

mova is intended for users aged 13 and over. Younger users need a parent or guardian's permission, as described in the [Terms of Use](TERMS.md). Because mova doesn't collect personal data on our servers, we don't knowingly collect children's data. The AI features should be used with a parent's or school's guidance.

## Your rights

Your data is on your device, so you control it directly. You can view, export (by copying), change or delete it at any time. For AI requests, contact the AI provider about their data handling.

## Changes

If mova adds its own servers, analytics or new data uses, this notice will be updated before those features are released, with details of what is collected, why, the legal basis, retention and your rights.

## Contact

Mova Inc — [privacy contact email] — [postal address]
