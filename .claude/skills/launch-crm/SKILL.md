---
name: launch-crm
description: Steps to start and open the Inflate AI CRM (this repo) on a local Windows machine. Use this whenever the user asks how to run, launch, start, open, or access their Inflate AI CRM, or asks what to do "when I get on my computer" regarding this project.
---

# Launch the Inflate AI CRM

This project is a local full-stack app (Express + SQLite API in `server/`,
React + Vite client in `client/`). It only runs while a terminal window is
open and the dev servers are active — there is no separate "start" step
beyond this.

## First time only

If `node_modules` folders don't exist yet under `server/` and `client/`,
install dependencies first:

```
npm run install:all
```

## Easiest way: double-click start-crm.bat

The repo root has `start-crm.bat`. Double-clicking it (or a desktop
shortcut to it) opens a terminal, starts both servers, and automatically
opens http://localhost:5173 in the browser after a few seconds. To make a
desktop shortcut: right-click `start-crm.bat` in File Explorer → *Send to*
→ *Desktop (create shortcut)*.

## Manual way (PowerShell)

1. Open PowerShell.
2. Go to the project folder:
   ```
   cd C:\Users\User\Documents\CRM
   ```
3. Start both servers:
   ```
   npm run dev
   ```
4. Wait until the terminal shows **both** of these lines:
   - `VITE ready`
   - `Inflate AI CRM server running on http://localhost:4000`
5. Open a browser to **http://localhost:5173**.

## Notes to pass along to the user

- Keep the PowerShell window open the whole time they're using the CRM —
  closing it stops both servers.
- Data is saved automatically. Every Save/Create button in the app writes
  immediately to `server/data/crm.sqlite3` on disk — there is no manual
  "save" step, and data survives closing the terminal or restarting the
  computer.
- `http://localhost:5173` only works while `npm run dev` is running on
  that same computer — it is not a public link and won't work from another
  device or after the terminal is closed.
- If a command seems to error strangely (e.g. two commands appear glued
  together on one line), it's usually a paste issue in PowerShell — have
  them type the command manually or paste one line at a time.
