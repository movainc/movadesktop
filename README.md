# knoxus
tmp for knoxus -- created codespace for this repo by mistake

> **Knoxus** — the platform this repository is being built for — is at the **planning / pre-code**
> stage. All design work lives in [`docs/`](docs/README.md), and is also published as a static site.

**Documentation site:** open [`site/dist/index.html`](site/dist/index.html), or run it:

```sh
node site/serve.mjs          # preview on http://localhost:4173
node site/build.mjs          # regenerate the site from /docs
node site/tools/audit.mjs    # WCAG AAA contrast, structure, link and freshness checks
```

Plain HTML/CSS/JS with no dependencies, no build tooling and no external requests. See
[`site/README.md`](site/README.md).

>
> | Document | Contents |
> |---|---|
> | [`docs/PLAN.md`](docs/PLAN.md) | Product and delivery plan: scope, findings, subsystems, roadmap, kill criteria |
> | [`docs/architecture/STACK.md`](docs/architecture/STACK.md) | Web-first SPA + Rust core: crates, layout, budgets |
> | [`docs/adr/`](docs/adr/README.md) | Architecture decision records 0001–0010 |
> | [`docs/threat-model/THREAT-MODEL.md`](docs/threat-model/THREAT-MODEL.md) | Assets, abuse cases, red-team suite |
> | [`docs/compliance/DPIA.md`](docs/compliance/DPIA.md) | DPIA skeleton and the questions for counsel |
> | [`docs/economics/CREDITS-MODEL.md`](docs/economics/CREDITS-MODEL.md) | Credit rates, faucets/sinks, cost exposure |
>
> No source code has been written yet, by design. Phase 0 begins once the gating decisions in
> `docs/PLAN.md` §10 are answered and `rustup` is installed (see the toolchain note in
> [`docs/README.md`](docs/README.md)).
