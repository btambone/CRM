import { Router } from "express";
import { db } from "../db.js";
import { fetchHomeValue, isValuationConfigured } from "../valuations.js";

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

  const valuations = db
    .prepare("SELECT * FROM property_valuations WHERE contact_id = ? ORDER BY fetched_at DESC")
    .all(req.params.id);

  res.json({ ...contact, leads, valuations });
});

contactsRouter.post("/", (req, res) => {
  const { first_name, last_name, email, phone, title, company_id, property_address, notes } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: "First and last name are required" });
  }

  const result = db
    .prepare(
      `INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, property_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      first_name,
      last_name,
      email || null,
      phone || null,
      title || null,
      company_id || null,
      property_address || null,
      notes || null
    );

  const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(contact);
});

contactsRouter.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Contact not found" });

  const { first_name, last_name, email, phone, title, company_id, property_address, notes } = req.body;
  db.prepare(
    `UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, title = ?, company_id = ?, property_address = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    first_name ?? existing.first_name,
    last_name ?? existing.last_name,
    email ?? existing.email,
    phone ?? existing.phone,
    title ?? existing.title,
    company_id !== undefined ? company_id : existing.company_id,
    property_address !== undefined ? property_address : existing.property_address,
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

contactsRouter.post("/:id/valuation", async (req, res) => {
  const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(req.params.id) as any;
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  if (!contact.property_address) {
    return res.status(400).json({ error: "Add a property address to this contact first" });
  }
  if (!isValuationConfigured()) {
    return res.status(400).json({
      error: "Home value lookups aren't set up yet. Add RENTCAST_API_KEY to server/.env, then restart the server.",
    });
  }

  try {
    const estimate = await fetchHomeValue(contact.property_address);
    db.prepare(
      `INSERT INTO property_valuations (contact_id, address, estimated_value, range_low, range_high)
       VALUES (?, ?, ?, ?, ?)`
    ).run(contact.id, contact.property_address, estimate.price, estimate.rangeLow, estimate.rangeHigh);

    const valuations = db
      .prepare("SELECT * FROM property_valuations WHERE contact_id = ? ORDER BY fetched_at DESC")
      .all(contact.id);
    res.status(201).json(valuations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch home value" });
  }
});
