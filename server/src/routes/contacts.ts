import { Router } from "express";
import { db } from "../db.js";

export const contactsRouter = Router();

contactsRouter.get("/", (req, res) => {
  const search = (req.query.q as string) || "";
  const rows = db
    .prepare(
      `SELECT ct.*, co.name AS company_name,
        (SELECT COUNT(*) FROM leads l WHERE l.contact_id = ct.id) AS lead_count
       FROM contacts ct
       LEFT JOIN companies co ON co.id = ct.company_id
       WHERE ct.first_name LIKE ? OR ct.last_name LIKE ? OR ct.email LIKE ? OR co.name LIKE ?
       ORDER BY ct.created_at DESC`
    )
    .all(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  res.json(rows);
});

contactsRouter.get("/:id", (req, res) => {
  const contact = db
    .prepare(
      `SELECT ct.*, co.name AS company_name FROM contacts ct
       LEFT JOIN companies co ON co.id = ct.company_id
       WHERE ct.id = ?`
    )
    .get(req.params.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  const leads = db
    .prepare("SELECT * FROM leads WHERE contact_id = ? ORDER BY created_at DESC")
    .all(req.params.id);

  res.json({ ...contact, leads });
});

contactsRouter.post("/", (req, res) => {
  const { first_name, last_name, email, phone, title, company_id, notes } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: "First and last name are required" });
  }

  const result = db
    .prepare(
      `INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(first_name, last_name, email || null, phone || null, title || null, company_id || null, notes || null);

  const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(contact);
});

contactsRouter.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Contact not found" });

  const { first_name, last_name, email, phone, title, company_id, notes } = req.body;
  db.prepare(
    `UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, title = ?, company_id = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    first_name ?? existing.first_name,
    last_name ?? existing.last_name,
    email ?? existing.email,
    phone ?? existing.phone,
    title ?? existing.title,
    company_id !== undefined ? company_id : existing.company_id,
    notes ?? existing.notes,
    req.params.id
  );

  const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id);
  res.json(contact);
});

contactsRouter.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Contact not found" });
  db.prepare("DELETE FROM contacts WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
