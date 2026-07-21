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

The database starts empty — no sample leads/contacts are seeded. Add your own
data through the UI.

## Tech stack

- **Client**: React + TypeScript + Vite, Tailwind CSS, React Router,
  `@dnd-kit` for drag-and-drop, Recharts for charts.
- **Server**: Node + Express + TypeScript, `better-sqlite3` (file-based, zero
  setup — no external database required).

## Getting started

```bash
npm run install:all   # installs server + client dependencies
npm run dev            # runs the API (port 4000) and the client (port 5173)
```

Then open http://localhost:5173.

The SQLite database file is created automatically at
`server/data/crm.sqlite3` on first run.

## Project structure

```
server/   Express API (contacts, companies, leads, analytics)
client/   React app (Vite)
```
