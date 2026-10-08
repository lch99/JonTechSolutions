# JonTech AI worker

Small Cloudflare Worker that powers the website's AI features using Claude:

| Route | Used by | What it does |
|---|---|---|
| `POST /chat` | Chat assistant on every page | Answers visitor questions from `src/knowledge.js` (services + anonymised projects) |
| `POST /audit` | "Free AI UI/UX check" on the homepage | Fetches the visitor's public page, extracts a structural snapshot, returns a scored JSON report |
| `GET /health` | You | Liveness check |

Until it is deployed, the site still works: the assistant uses built-in quick answers and the UX check offers a WhatsApp request instead.

## Deploy (one time, ~5 minutes)

1. Create a free Cloudflare account, and an API key at <https://console.anthropic.com>.
2. In this folder:
   ```bash
   npm install
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY     # paste the key
   npx wrangler deploy
   ```
3. Wrangler prints a URL like `https://jontech-ai.<your-subdomain>.workers.dev`.
   Put it in `assets/ai.js` → `const AI_ENDPOINT = 'https://jontech-ai.<your-subdomain>.workers.dev';`, then push the site.

## Updating what the assistant knows

Edit `src/knowledge.js` and run `npx wrangler deploy`. **Never put client names in it** — describe projects by what was built.

## Cost and abuse controls

- Model: `claude-opus-5-5`; chat runs at `low` effort, audits at `medium`.
- Only origins listed in `ALLOWED_ORIGINS` (wrangler.toml) may call it.
- Per-IP limits: 20 chat messages/min, 3 audits/min (`[[ratelimits]]` in wrangler.toml).
- Chat history is capped at 12 turns × 1,200 characters; audited pages are capped at 1.5 MB.
- The audit refuses private/internal addresses.
- Set a monthly spend limit in the Anthropic Console as a backstop.

## Local test

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars
npx wrangler dev          # http://localhost:8787
```
Serve the site on `http://localhost:8080` (already allowed in `ALLOWED_ORIGINS`) and temporarily point `AI_ENDPOINT` at `http://localhost:8787`.
