import { Router } from "express";
import { db, STAGES, type StageKey } from "../db.js";

export const leadsRouter = Router();

const STAGE_KEYS = STAGES.map((s) => s.key) as string[];

function logActivity(leadId: number, type: string, description: string) {
  db.prepare("INSERT INTO activities (lead_id, type, description) VALUES (?, ?, ?)").run(
    leadId,
    type,
    description
  );
}

leadsRouter.get("/stages", (_req, res) => {
  res.json(STAGES);
});

leadsRouter.get("/", (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.*, c.first_name, c.last_name, co.name AS company_name
       FROM leads l
       LEFT JOIN contacts c ON c.id = l.contact_id
       LEFT JOIN companies co ON co.id = l.company_id
       ORDER BY l.created_at DESC`
    )
    .all();
  res.json(rows);
});

leadsRouter.get("/:id", (req, res) => {
  const lead = db
    .prepare(
      `SELECT l.*, c.first_name, c.last_name, c.email AS contact_email, c.phone AS contact_phone,
        co.name AS company_name
       FROM leads l
       LEFT JOIN contacts c ON c.id = l.contact_id
       LEFT JOIN companies co ON co.id = l.company_id
       WHERE l.id = ?`
    )
    .get(req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const activities = db
    .prepare("SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC")
    .all(req.params.id);

  res.json({ ...lead, activities });
});

leadsRouter.post("/", (req, res) => {
  const { title, contact_id, company_id, stage, value, source, owner, notes, expected_close_date } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const stageKey = STAGE_KEYS.includes(stage) ? stage : "new_lead";
  const isWon = stageKey === "closed_won";

  const result = db
    .prepare(
      `INSERT INTO leads (title, contact_id, company_id, stage, status, value, source, owner, notes, expected_close_date, closed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      contact_id || null,
      company_id || null,
      stageKey,
      isWon ? "won" : "open",
      value || 0,
      source || null,
      owner || null,
      notes || null,
      expected_close_date || null,
      isWon ? new Date().toISOString() : null
    );

  logActivity(Number(result.lastInsertRowid), "created", `Lead created in stage "${stageKey}"`);

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(lead);
});

leadsRouter.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Lead not found" });

  const { title, contact_id, company_id, value, source, owner, notes, expected_close_date } = req.body;
  db.prepare(
    `UPDATE leads SET title = ?, contact_id = ?, company_id = ?, value = ?, source = ?, owner = ?, notes = ?, expected_close_date = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    contact_id !== undefined ? contact_id : existing.contact_id,
    company_id !== undefined ? company_id : existing.company_id,
    value ?? existing.value,
    source ?? existing.source,
    owner ?? existing.owner,
    notes ?? existing.notes,
    expected_close_date ?? existing.expected_close_date,
    req.params.id
  );

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  res.json(lead);
});

// Move a lead to a different pipeline stage
leadsRouter.patch("/:id/stage", (req, res) => {
  const existing = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Lead not found" });

  const { stage } = req.body;
  if (!STAGE_KEYS.includes(stage)) return res.status(400).json({ error: "Invalid stage" });

  const isClosing = stage === "closed_won";
  db.prepare(
    `UPDATE leads SET stage = ?, status = ?, closed_at = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(stage, isClosing ? "won" : "open", isClosing ? new Date().toISOString() : null, req.params.id);

  const stageLabel = STAGES.find((s) => s.key === stage)?.label ?? stage;
  logActivity(Number(req.params.id), "stage_change", `Moved to "${stageLabel}"`);

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  res.json(lead);
});

// Mark a lead as lost (removes it from active pipeline consideration)
leadsRouter.patch("/:id/lost", (req, res) => {
  const existing = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Lead not found" });

  db.prepare(
    `UPDATE leads SET status = 'lost', closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
  ).run(req.params.id);

  logActivity(Number(req.params.id), "lost", "Lead marked as lost");

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  res.json(lead);
});

// Reopen a lost lead back into the active pipeline
leadsRouter.patch("/:id/reopen", (req, res) => {
  const existing = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Lead not found" });

  db.prepare(
    `UPDATE leads SET status = 'open', closed_at = NULL, updated_at = datetime('now') WHERE id = ?`
  ).run(req.params.id);

  logActivity(Number(req.params.id), "reopened", "Lead reopened");

  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  res.json(lead);
});

leadsRouter.post("/:id/activities", (req, res) => {
  const existing = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Lead not found" });

  const { type, description } = req.body;
  if (!description) return res.status(400).json({ error: "Description is required" });

  logActivity(Number(req.params.id), type || "note", description);
  const activities = db
    .prepare("SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC")
    .all(req.params.id);
  res.status(201).json(activities);
});

leadsRouter.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Lead not found" });
  db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
