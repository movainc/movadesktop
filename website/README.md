# mova — website

The marketing site, deployed to **https://movadesktop.vercel.app**.

A static site with no framework or npm install: `index.html`, `styles.css`, `main.js`, and `doc.html`, which renders `/terms`, `/privacy` and `/licenses` from the repository's Markdown files.

- **Downloads** (`main.js`): read the latest GitHub Release of `movainc/movadesktop` and link each button to the right file (Apple Silicon `.dmg`, Windows `-setup.exe`/`.msi`, Linux `.AppImage`/`.deb`). The visitor's platform is highlighted. Until a release is public, the buttons point to the Releases page.
  > The GitHub API only serves releases of **public** repositories to anonymous visitors. If `movainc/movadesktop` stays private, publish releases to a public repository and change `REPO` in `main.js`.
- **Sign in / Open in browser**: goes to the web app at https://movadesktopweb.vercel.app.

## Deploying on Vercel

Create a Vercel project from this repository with **Root Directory** set to `website`. `vercel.json` runs `build.sh`, which copies the logo, screenshots and legal documents in from the rest of the repo. No environment variables are needed.

## Local preview

```bash
cd website && sh build.sh && npx serve .     # or any static server
```
