#!/usr/bin/env sh
# Lets all three Vercel projects deploy from the repository root without a custom Root Directory.
#   MOVA_SITE=web      → web app      (movadesktopweb.vercel.app)
#   MOVA_SITE=website  → website      (movadesktop.vercel.app)
#   MOVA_SITE=docs     → docs site    (movadocs.vercel.app, static files in docs/)
# Without MOVA_SITE, the project's own domain decides.
set -e
SITE="${MOVA_SITE:-}"
if [ -z "$SITE" ]; then
  case "${VERCEL_PROJECT_PRODUCTION_URL:-}${VERCEL_URL:-}" in
    *movadesktopweb*) SITE=web ;;
    *movadocs*) SITE=docs ;;
    *) SITE=website ;;
  esac
fi
rm -rf .vercel-out
case "$SITE" in
  web)
    echo "Building the mova web app"
    npm run build:web
    cp -r web/dist .vercel-out ;;
  docs)
    echo "Building the mova docs"
    cp -r docs .vercel-out ;;
  *)
    echo "Building the mova website"
    node website/build.mjs
    cp -r website/dist .vercel-out ;;
esac
