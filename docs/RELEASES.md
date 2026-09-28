# Downloads & releases

## Downloading

Get the latest version from **[movadesktop.vercel.app/download](https://movadesktop.vercel.app/download)**. The page detects your computer and links straight to the right file:

| Platform | File |
|---|---|
| macOS, Apple Silicon (M1 and later) | `mova_<version>_aarch64.dmg` |
| Windows 10/11, 64-bit | `mova_<version>_x64-setup.exe` (or `.msi`) |
| Linux x86-64 | `mova_<version>_amd64.AppImage` (or `.deb`) |

Install notes for each platform are on the download page. Release notes are on the [changelog](https://movadesktop.vercel.app/changelog).

## How releases are made

Releases are fully automated by GitHub Actions (`.github/workflows/release.yml`):

1. Bump `version` in `package.json` (the desktop app reads its version from there) and, to match, in `src-tauri/Cargo.toml`.
2. Commit, then tag and push:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
3. The workflow builds mova on macOS (Apple Silicon), Windows and Linux with [tauri-action](https://github.com/tauri-apps/tauri-action) and publishes the installers to a GitHub Release named after the tag.
4. The website's Download and Changelog pages read the latest release from the GitHub API, so they update on their own.

You can also start the workflow by hand from **Actions → Release → Run workflow**.

## Code signing (recommended before a public launch)

Unsigned apps show a warning the first time they open (Gatekeeper on macOS, SmartScreen on Windows). To sign:

- **macOS:** add `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` and `APPLE_TEAM_ID` as repository secrets and pass them to the tauri-action step. See [Tauri's macOS signing guide](https://v2.tauri.app/distribute/sign/macos/).
- **Windows:** see [Tauri's Windows signing guide](https://v2.tauri.app/distribute/sign/windows/).

## Public downloads from a private repository

The website fetches releases anonymously from the GitHub API, which only works for **public** repositories. If `movainc/movadesktop` is private, either make it public or publish releases to a separate public repository and change `REPO` in `website/main.js`.
