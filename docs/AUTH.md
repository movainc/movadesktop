# Google sign-in

mova requires a Google account. This page explains how sign-in works and how to set up the Google Cloud project behind it.

## How it works

### Desktop

mova uses Google's recommended flow for installed apps — **OAuth 2.0 authorization code with PKCE and a loopback redirect** ([Google's guide](https://developers.google.com/identity/protocols/oauth2/native-app)):

1. mova starts a temporary listener on `http://127.0.0.1:<random port>`.
2. It opens your default browser at Google's sign-in page.
3. After you choose your account, Google redirects to that local address with a one-time code.
4. mova's native layer exchanges the code (with the PKCE verifier) for tokens and reads your name, email and picture.

All of this happens in the Rust layer (`src-tauri/src/auth.rs`). Tokens are stored in `session.json` in mova's app config folder (permissions `0600` on macOS/Linux) and **never reach the web UI**. Signing out revokes the token with Google and deletes the file.

Permissions requested:

| Scope | When | Why |
|---|---|---|
| `openid email profile` | Always | Your name, email and picture for the account menu |
| `…/auth/drive.appdata` | If you choose **This device + Google Drive** | Sync your workspace to a hidden, mova-only folder in your Drive |
| `…/auth/drive` | Only when you press **Connect Google Drive** in Files | Browse and edit your own Drive files ([more](DRIVE.md)) |

Extra permissions are requested **incrementally** — only when you use the feature that needs them.

### Web

The web app uses [Sign in with Google](https://developers.google.com/identity/gsi/web) (Google Identity Services). Google returns a signed ID token; mova reads your profile from it and uses the account ID to keep a separate workspace for you in that browser. The web app doesn't request Drive access.

### Workspaces per account

Each account's workspace is stored separately on the device (`mova-workspace:<account>`). Signing in with a different account shows that account's own workspace; signing out hides it.

## Setting up the Google Cloud project

You need one Google Cloud project with **two OAuth clients** — one for the web app and one for the desktop app.

### 1. Branding (Google Auth Platform → Branding)

- **App name:** mova · **User support email:** your email
- **App home page:** `https://movadesktop.vercel.app`
- **Privacy policy:** `https://movadesktop.vercel.app/privacy` · **Terms of service:** `https://movadesktop.vercel.app/terms`
- **Authorized domains:** `movadesktop.vercel.app`, `movadesktopweb.vercel.app`

### 2. Audience

- **User type:** External
- **Publishing status:** Testing, while you build. Add your Google accounts as **test users** — only test users can sign in until the app is published.

### 3. Data access (scopes)

Add `openid`, `…/auth/userinfo.email`, `…/auth/userinfo.profile`, `…/auth/drive.appdata` and `…/auth/drive`.

> `drive` is a **restricted** scope. It works for test users straight away; to publish mova to everyone with Drive-file editing, Google requires verification and an annual security assessment. `drive.appdata` (sync) is not restricted.

### 4. Enable the Drive API

**APIs & Services → Library → Google Drive API → Enable.**

### 5. Web client → web app

**Clients → Create client → Web application**

- **Name:** mova web
- **Authorized JavaScript origins:** `https://movadesktopweb.vercel.app` and `http://localhost:1420`
- **Authorized redirect URIs:** none

Copy the **Client ID** into the Vercel project for the web app as the environment variable **`VITE_GOOGLE_CLIENT_ID`**, then redeploy.

### 6. Desktop client → desktop app

**Clients → Create client → Desktop app**

- **Name:** mova desktop — there is nothing else to configure; Google allows the `127.0.0.1` loopback redirect automatically.
- Press **Download JSON**.

Give it to the app in either way:

- **In the app:** on the sign-in screen, choose **Set up Google sign-in** and paste the JSON (or just the client ID). It's saved to `google-oauth.json` in mova's config folder on that computer. You can change it later in **Settings → Account → Google sign-in configuration**.
- **Environment variables** (for development or managed installs): `MOVA_GOOGLE_CLIENT_ID` and `MOVA_GOOGLE_CLIENT_SECRET`.

> For desktop apps Google treats the client secret as non-confidential, but **never commit it to the repository** — keep it in the app's config or your environment.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Access blocked: mova has not completed the Google verification process" | Your account isn't a test user — add it under **Audience → Test users** |
| "Error 400: redirect_uri_mismatch" on the web | Add the exact site origin to the web client's **Authorized JavaScript origins**; changes can take a few minutes |
| Sign-in timed out on desktop | Finish signing in within 5 minutes, and make sure nothing blocks `127.0.0.1` |
| "Google sign-in isn't set up yet" | Paste the Desktop client JSON on the sign-in screen, or set `MOVA_GOOGLE_CLIENT_ID` |
| Signed out after a week | In Testing status Google expires refresh tokens after 7 days — publish the app to remove the limit |
