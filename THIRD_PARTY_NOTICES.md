# Third-party notices

mova includes the open-source software below. Each component is licensed under its own terms. Those licences apply to that component only, and nothing in mova's own licence restricts your rights under them.

## Code editor — Monaco Editor

The **Code** view is built on the **Monaco Editor**, the code editor that powers **Code - OSS**, the open-source project behind Visual Studio Code.

- Project: https://github.com/microsoft/monaco-editor (Code - OSS: https://github.com/microsoft/vscode)
- Version: 0.57.0
- License: MIT
- Copyright (c) 2016 - present Microsoft Corporation

The full licence is in [`licenses/monaco-editor-LICENSE.txt`](licenses/monaco-editor-LICENSE.txt). Monaco's own third-party notices are in [`licenses/monaco-editor-ThirdPartyNotices.txt`](licenses/monaco-editor-ThirdPartyNotices.txt).

mova is not affiliated with or endorsed by Microsoft. "Visual Studio Code" and "VS Code" are trademarks of Microsoft Corporation.

The React integration is **@monaco-editor/react** 4.7.0 (MIT, Copyright (c) 2018 Suren Atoyan): https://github.com/suren-atoyan/monaco-react

## File-type icons — Material Icon Theme

File icons in mova (Python, TypeScript, PDF and so on) come from the **Material Icon Theme**.

- Project: https://github.com/material-extensions/vscode-material-icon-theme
- Version: 5.38.1 (a subset of the icons, unmodified, in `src/assets/file-icons/`)
- License: MIT, Copyright (c) 2025 Material Extensions. Full text in [`licenses/material-icon-theme-LICENSE.txt`](licenses/material-icon-theme-LICENSE.txt).

## Application

| Component | Version | Licence | Copyright / project |
|---|---|---|---|
| Tauri (`tauri`, `@tauri-apps/api`, `@tauri-apps/cli`) | 2.12 | MIT OR Apache-2.0 | The Tauri Programme within The Commons Conservancy — https://tauri.app |
| React, React DOM | 19.3.0 | MIT | Meta Platforms, Inc. and affiliates — https://react.dev |
| Zustand | 5.0.15 | MIT | Paul Henschel — https://github.com/pmndrs/zustand |
| Lucide icons (`lucide-react`) | 1.48.0 | ISC | Lucide Contributors (portions Feather, MIT, Cole Bemis) — https://lucide.dev |
| Inter typeface (`@fontsource-variable/inter`) | 5.3.0 | SIL Open Font License 1.1 | The Inter Project Authors (Rasmus Andersson) — https://rsms.me/inter |
| tauri-plugin-opener | 2 | MIT OR Apache-2.0 | The Tauri Programme — https://tauri.app |
| reqwest | 0.12 | MIT OR Apache-2.0 | Sean McArthur — https://github.com/seanmonstar/reqwest |
| tokio | 1 | MIT | Tokio Contributors — https://tokio.rs |
| sha2, base64, rand, url | — | MIT OR Apache-2.0 | RustCrypto, Marshall Pierce, The Rand Project Developers, The rust-url developers |
| marked (docs site and website build) | 12.0.2 | MIT | Christopher Jeffrey and the Marked contributors — https://github.com/markedjs/marked |
| serde, serde_json | 1.x | MIT OR Apache-2.0 | Erick Tryzelaar, David Tolnay — https://serde.rs |

## Build and development tools

These are used to build mova and are not shipped in the app: Vite (MIT), TypeScript (Apache-2.0), @vitejs/plugin-react (MIT), Playwright (Apache-2.0).

## Services

Sign-in uses **Google Identity** (Google Identity Services on the web, OAuth 2.0 on desktop), and sync and file editing use the **Google Drive API**. These are Google services governed by Google's terms; "Google" and "Google Drive" are trademarks of Google LLC. mova is not affiliated with or endorsed by Google.

## Licence texts

### MIT License

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### ISC License

```
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### Apache License 2.0

Full text: https://www.apache.org/licenses/LICENSE-2.0

### SIL Open Font License 1.1

Full text: https://openfontlicense.org/open-font-license-official-text/. The Inter font is bundled unmodified and is not sold on its own.
