import { Router } from "express";
import { db, STAGES } from "../db.js";
import { HOME_VALUE_PATTERN, isEmailConfigured, mergeTemplate, sendEmail } from "../mailer.js";
import { fetchHomeValue, isValuationConfigured } from "../valuations.js";

export const campaignsRouter = Router();

const AUDIENCE_TYPES = ["all_contacts", "past_clients", "stage", "company"] as const;
const SCHEDULE_TYPES = ["manual", "weekly", "monthly"] as const;

function resolveAudience(audienceType: string, audienceValue: string | null): any[] {
  switch (audienceType) {
    case "past_clients":
      return db
        .prepare(
          `SELECT DISTINCT c.* FROM contacts c
           JOIN leads l ON l.contact_id = c.id
           WHERE l.status = 'won' AND c.email IS NOT NULL AND c.email != ''`
        )
        .all();
    case "stage":
      return db
        .prepare(
          `SELECT DISTINCT c.* FROM contacts c
           JOIN leads l ON l.contact_id = c.id
           WHERE l.stage = ? AND c.email IS NOT NULL AND c.email != ''`
        )
        .all(audienceValue);
    case "company":
      return db
        .prepare(
          `SELECT * FROM contacts WHERE company_id = ? AND email IS NOT NULL AND email != ''`
        )
        .all(audienceValue);
    case "all_contacts":
    default:
      return db.prepare(`SELECT * FROM contacts WHERE email IS NOT NULL AND email != ''`).all();
  }
}

// Formatted to match SQLite's own datetime('now') output (UTC, space-separated,
// no milliseconds) so string comparisons like `next_send_at <= datetime('now')`
// sort correctly. A raw toISOString() ("...T...Z") would sort after that format
// and never be considered due.
function toSqliteDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function computeNextSendAt(scheduleType: string, intervalDays: number | null, dayOfMonth: number | null): string | null {
  const now = new Date();
  if (scheduleType === "weekly") {
    const days = intervalDays && intervalDays > 0 ? intervalDays : 7;
    now.setDate(now.getDate() + days);
    return toSqliteDatetime(now);
  }
  if (scheduleType === "monthly") {
    const day = dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 28 ? dayOfMonth : now.getDate();
    now.setMonth(now.getMonth() + 1);
    now.setDate(Math.min(day, 28));
    return toSqliteDatetime(now);
  }
  return null;
}

const VALUATION_FRESHNESS_DAYS = 25;

function formatUsd(value: number | null): string | null {
  if (value == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

// Reuses a recent cached valuation for this contact if we have one, otherwise
// fetches a fresh one from RentCast (costs money per lookup) and caches it.
// Only called when a template actually references {{home_value}}, so
// campaigns that don't mention home values never trigger paid API calls.
async function resolveHomeValue(contact: any): Promise<string | null> {
  if (!contact.property_address) return null;

  const recent = db
    .prepare(
      `SELECT * FROM property_valuations WHERE contact_id = ? AND fetched_at >= datetime('now', ?) ORDER BY fetched_at DESC LIMIT 1`
    )
    .get(contact.id, `-${VALUATION_FRESHNESS_DAYS} days`);
  if (recent) return formatUsd((recent as any).estimated_value);

  if (!isValuationConfigured()) return null;

  try {
    const estimate = await fetchHomeValue(contact.property_address);
    db.prepare(
      `INSERT INTO property_valuations (contact_id, address, estimated_value, range_low, range_high) VALUES (?, ?, ?, ?, ?)`
    ).run(contact.id, contact.property_address, estimate.price, estimate.rangeLow, estimate.rangeHigh);
    return formatUsd(estimate.price);
  } catch {
    return null;
  }
}

campaignsRouter.get("/audience-options", (_req, res) => {
  res.json({
    audienceTypes: [
      { key: "all_contacts", label: "All Contacts" },
      { key: "past_clients", label: "Past Clients (won deals)" },
      { key: "stage", label: "By Pipeline Stage", values: STAGES },
      { key: "company", label: "By Company" },
    ],
  });
});

campaignsRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM campaign_sends s WHERE s.campaign_id = c.id) AS total_sent
       FROM campaigns c ORDER BY c.created_at DESC`
    )
    .all();
  const withCounts = rows.map((c: any) => ({
    ...c,
    audience_count: resolveAudience(c.audience_type, c.audience_value).length,
  }));
  res.json(withCounts);
});

campaignsRouter.get("/:id", (req, res) => {
  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  const sends = db
    .prepare(
      `SELECT s.*, c.first_name, c.last_name FROM campaign_sends s
       LEFT JOIN contacts c ON c.id = s.contact_id
       WHERE s.campaign_id = ? ORDER BY s.sent_at DESC LIMIT 100`
    )
    .all(req.params.id);

  const audience = resolveAudience((campaign as any).audience_type, (campaign as any).audience_value);

  res.json({ ...(campaign as any), sends, audience_count: audience.length });
});

campaignsRouter.post("/", (req, res) => {
  const { name, subject, body, audience_type, audience_value, schedule_type, interval_days, day_of_month } = req.body;
  if (!name || !subject || !body) {
    return res.status(400).json({ error: "Name, subject, and body are required" });
  }
  const audienceType = AUDIENCE_TYPES.includes(audience_type) ? audience_type : "all_contacts";
  const scheduleType = SCHEDULE_TYPES.includes(schedule_type) ? schedule_type : "manual";

  const result = db
    .prepare(
      `INSERT INTO campaigns (name, subject, body, audience_type, audience_value, schedule_type, interval_days, day_of_month, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
    )
    .run(
      name,
      subject,
      body,
      audienceType,
      audience_value || null,
      scheduleType,
      interval_days || null,
      day_of_month || null
    );

  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(campaign);
});

campaignsRouter.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Campaign not found" });

  const { name, subject, body, audience_type, audience_value, schedule_type, interval_days, day_of_month } = req.body;
  db.prepare(
    `UPDATE campaigns SET name = ?, subject = ?, body = ?, audience_type = ?, audience_value = ?,
       schedule_type = ?, interval_days = ?, day_of_month = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name ?? existing.name,
    subject ?? existing.subject,
    body ?? existing.body,
    audience_type ?? existing.audience_type,
    audience_value !== undefined ? audience_value : existing.audience_value,
    schedule_type ?? existing.schedule_type,
    interval_days !== undefined ? interval_days : existing.interval_days,
    day_of_month !== undefined ? day_of_month : existing.day_of_month,
    req.params.id
  );

  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
  res.json(campaign);
});

campaignsRouter.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Campaign not found" });
  db.prepare("DELETE FROM campaigns WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

campaignsRouter.post("/:id/test", async (req, res) => {
  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id) as any;
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "An email address is required" });
  if (!isEmailConfigured()) {
    return res.status(400).json({
      error: "Email isn't set up yet. Add RESEND_API_KEY and EMAIL_FROM to server/.env, then restart the server.",
    });
  }

  const needsHomeValue = HOME_VALUE_PATTERN.test(campaign.subject) || HOME_VALUE_PATTERN.test(campaign.body);
  const testContact = {
    first_name: "Test",
    last_name: "Recipient",
    email,
    company_name: "Your Company",
    home_value: needsHomeValue ? "$450,000 (sample)" : null,
  };
  try {
    await sendEmail(email, mergeTemplate(campaign.subject, testContact), mergeTemplate(campaign.body, testContact));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send test email" });
  }
});

async function sendCampaignNow(campaign: any) {
  const audience = resolveAudience(campaign.audience_type, campaign.audience_value);
  const needsHomeValue = HOME_VALUE_PATTERN.test(campaign.subject) || HOME_VALUE_PATTERN.test(campaign.body);
  let sent = 0;
  let failed = 0;

  for (const contact of audience) {
    const to = contact.email as string;
    try {
      if (!isEmailConfigured()) throw new Error("Email isn't set up yet (missing RESEND_API_KEY/EMAIL_FROM).");
      const mergeData = needsHomeValue ? { ...contact, home_value: await resolveHomeValue(contact) } : contact;
      await sendEmail(to, mergeTemplate(campaign.subject, mergeData), mergeTemplate(campaign.body, mergeData));
      db.prepare(
        `INSERT INTO campaign_sends (campaign_id, contact_id, email, status) VALUES (?, ?, ?, 'sent')`
      ).run(campaign.id, contact.id, to);
      sent++;
    } catch (err: any) {
      db.prepare(
        `INSERT INTO campaign_sends (campaign_id, contact_id, email, status, error) VALUES (?, ?, ?, 'failed', ?)`
      ).run(campaign.id, contact.id, to, err.message || "Unknown error");
      failed++;
    }
  }

  const nextSendAt = computeNextSendAt(campaign.schedule_type, campaign.interval_days, campaign.day_of_month);
  db.prepare(
    `UPDATE campaigns SET last_sent_at = datetime('now'), next_send_at = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(nextSendAt, campaign.id);

  return { sent, failed, audience: audience.length };
}

campaignsRouter.post("/:id/send", async (req, res) => {
  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id) as any;
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  if (!isEmailConfigured()) {
    return res.status(400).json({
      error: "Email isn't set up yet. Add RESEND_API_KEY and EMAIL_FROM to server/.env, then restart the server.",
    });
  }

  const result = await sendCampaignNow(campaign);
  res.json(result);
});

campaignsRouter.patch("/:id/activate", (req, res) => {
  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id) as any;
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  const nextSendAt =
    campaign.schedule_type === "manual"
      ? null
      : computeNextSendAt(campaign.schedule_type, campaign.interval_days, campaign.day_of_month);

  db.prepare(
    `UPDATE campaigns SET status = 'active', next_send_at = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(nextSendAt, req.params.id);

  const updated = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
  res.json(updated);
});

campaignsRouter.patch("/:id/pause", (req, res) => {
  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  db.prepare(`UPDATE campaigns SET status = 'paused', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  const updated = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// Exported for the background scheduler in index.ts
export async function runDueCampaigns(): Promise<void> {
  if (!isEmailConfigured()) return;
  const due = db
    .prepare(
      `SELECT * FROM campaigns WHERE status = 'active' AND schedule_type != 'manual' AND next_send_at IS NOT NULL AND next_send_at <= datetime('now')`
    )
    .all();
  for (const campaign of due as any[]) {
    await sendCampaignNow(campaign);
  }
}
