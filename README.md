# Inflate AI CRM

A custom-built CRM for Inflate AI: contacts, company profiles, a 5-stage lead
pipeline, and a business analytics dashboard.

## Features

- **Contacts** — store and search contact profiles, linked to a company, with
  full detail pages showing associated leads.
- **Companies** — dedicated company profiles with linked contacts, leads, and
  open pipeline value.
- **Lead Pipeline** — a drag-and-drop kanban board across 5 stages:
  1. New Lead
  2. Contacted
  3. Qualified
  4. Proposal Sent
  5. Closed Won

  Leads can also be marked **Lost** at any point without cluttering the active
  board. Each lead has its own detail page with a stage tracker, linked
  contact/company, deal info, and an activity log.
- **Analytics** — a high-level dashboard covering open pipeline value, win
  rate, average deal size, revenue won, pipeline-by-stage funnel, leads
  created vs. deals won over time, lead sources, and team performance.
- **Campaigns** — one-off or recurring (weekly/monthly) emails to a segment
  of your contacts (all contacts, past clients, a pipeline stage, or a
  company), with mail-merge fields, a test-send option, and a send history
  log. Requires a free [Resend](https://resend.com) account — see
  "Enabling email campaigns" below. Until that's set up, campaigns can still
  be created and previewed, just not sent.

The database starts empty — no sample leads/contacts are seeded. Add your own
data through the UI.

## Tech stack

- **Client**: React + TypeScript + Vite, Tailwind CSS, React Router,
  `@dnd-kit` for drag-and-drop, Recharts for charts.
- **Server**: Node + Express + TypeScript, `sql.js` (a WASM build of SQLite,
  file-based — no external database, and no native build tools/Python
  required to install it, unlike native SQLite bindings).

## Getting started

```bash
npm run install:all   # installs server + client dependencies
npm run dev            # runs the API (port 4000) and the client (port 5173)
```

Then open http://localhost:5173.

On Windows, after the first `npm run install:all`, you can just
double-click `start-crm.bat` (or a desktop shortcut to it) to start both
servers and open the browser automatically.

The SQLite database file is created automatically at
`server/data/crm.sqlite3` on first run.

## Enabling email campaigns

1. Sign up for a free account at [resend.com](https://resend.com) and
   create an API key.
2. Copy `server/.env.example` to `server/.env`.
3. Fill in `RESEND_API_KEY` (from step 1) and `EMAIL_FROM` (an email
   address you've verified with Resend — their free tier lets you send from
   `onboarding@resend.dev` with no verification for testing).
4. Restart the server (`npm run dev` again, or re-launch `start-crm.bat`).

Recurring campaigns (weekly/monthly) only fire while the server process is
running — there's no separate always-on scheduler, so the computer needs to
be on with the CRM running for scheduled sends to go out on time.

## Project structure

```
server/   Express API (contacts, companies, leads, analytics)
client/   React app (Vite)
```
