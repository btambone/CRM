import { Router } from "express";
import { db } from "../db.js";

export const companiesRouter = Router();

companiesRouter.get("/", (req, res) => {
  const search = (req.query.q as string) || "";
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id) AS contact_count,
        (SELECT COUNT(*) FROM leads l WHERE l.company_id = c.id) AS lead_count,
        (SELECT COALESCE(SUM(value), 0) FROM leads l WHERE l.company_id = c.id AND l.status = 'open') AS open_value
       FROM companies c
       WHERE c.name LIKE ? OR c.industry LIKE ?
       ORDER BY c.name ASC`
    )
    .all(`%${search}%`, `%${search}%`);
  res.json(rows);
});

companiesRouter.get("/:id", (req, res) => {
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id);
  if (!company) return res.status(404).json({ error: "Company not found" });

  const contacts = db
    .prepare("SELECT * FROM contacts WHERE company_id = ? ORDER BY first_name ASC")
    .all(req.params.id);

  const leads = db
    .prepare(
      `SELECT l.*, c.first_name, c.last_name FROM leads l
       LEFT JOIN contacts c ON c.id = l.contact_id
       WHERE l.company_id = ? ORDER BY l.created_at DESC`
    )
    .all(req.params.id);

  res.json({ ...company, contacts, leads });
});

companiesRouter.post("/", (req, res) => {
  const { name, industry, website, phone, address, size, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const result = db
    .prepare(
      `INSERT INTO companies (name, industry, website, phone, address, size, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, industry || null, website || null, phone || null, address || null, size || null, notes || null);

  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(company);
});

companiesRouter.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Company not found" });

  const { name, industry, website, phone, address, size, notes } = req.body;
  db.prepare(
    `UPDATE companies SET name = ?, industry = ?, website = ?, phone = ?, address = ?, size = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name ?? existing.name,
    industry ?? existing.industry,
    website ?? existing.website,
    phone ?? existing.phone,
    address ?? existing.address,
    size ?? existing.size,
    notes ?? existing.notes,
    req.params.id
  );

  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id);
  res.json(company);
});

companiesRouter.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Company not found" });
  db.prepare("DELETE FROM companies WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
