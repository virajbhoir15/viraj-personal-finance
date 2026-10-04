# Finance AI backend setup

The GitHub Pages app is static, so the AI provider key must stay on a server-side backend. OpenAI recommends never shipping API keys in browsers or mobile apps.

## Cloudflare Worker

This repo contains:
- `ai-worker.js` — secure proxy to Cloudflare Workers AI (Gemma)
- `wrangler.toml` — Worker configuration

From a local clone of this repository:

```bash
npx wrangler login
npx wrangler deploy
```

An optional `AI_SHARED_TOKEN` can still be configured on the Worker to restrict requests.

Cloudflare will return a Worker URL similar to:

`https://viraj-finance-ai.<your-subdomain>.workers.dev`

Paste that URL into **Finance AI → AI backend URL** in the app. If you created `AI_SHARED_TOKEN`, paste the same token into **Backend access token**.

Never put the OpenAI API key into GitHub Pages, `ai.js`, localStorage, or the AI endpoint field.

## What the AI receives

For each question the app sends a compact finance snapshot containing relevant planning data such as:
- spendable EUR
- recurring EUR commitments
- recent monthly income/spending
- education-loan model
- goals
- credit-card planning data
- recent transactions
- EUR/INR planning rate

It does not send the Google password or the OpenAI API key.

The Worker uses Cloudflare Workers AI; no OpenAI API key is required. This app's AI is a planning assistant; it does not access live bank accounts or execute transactions.
