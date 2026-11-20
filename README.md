# Sales AI Lab

AI tools that make B2B SaaS sellers faster and sharper, built by [Dante Estrada](https://www.linkedin.com/in/dante-estrada1) with Claude.

Every tool has to pass one test: it gives a seller back time, sharpens a decision, or both. Each one works for any company — AWS, Microsoft or a 40-person startup — because they all run on a shared company profile built by **Product Brain**.

## Tools

| Tool | What it does | Status |
| --- | --- | --- |
| Product Brain | Turns any company's website into an ICP, personas, value props, competitors and proof points, with every claim marked as sourced or inferred | Live |
| Deal Desk | Pipeline risk scoring, cut-bait calls, honest argue-back, and "The Meeting You're Not In" buyer simulation | In build |
| Champion Kit | The CFO-ready business case a champion forwards internally | Planned |
| Outreach Fact-Checker | Verifies every claim in outreach against live sources and scores relevance | Planned |
| ICP Prospector | Accounts that fit now, with reasons, verified contacts and a feedback loop | Planned |
| Live Call Coach | Voice practice against AI buyers, then live objection support on real calls | Planned |

## How it's built

- **Next.js** site hosted on **Vercel**.
- **Claude** (Anthropic API) does the reasoning. The API key lives only in server environment variables and never reaches the browser.
- Claude returns **structured output** (a fixed schema via tool use), so results are consistent and every claim carries a `site` or `inferred` label.
- **Guardrails:** a daily limit per visitor, a site-wide daily cap, a hard monthly spend limit at Anthropic, and checks that block the server from fetching private network addresses.

## Running it yourself

1. `npm install`
2. Create `.env.local` with `ANTHROPIC_API_KEY=your-key`
3. `npm run dev` and open http://localhost:3000

Optional settings: `PER_VISITOR_DAILY` (default 5), `SITE_DAILY_CAP` (default 150), `OWNER_KEY` (skips limits when sent as the `x-owner-key` header).
