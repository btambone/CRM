import { Router } from "express";
import { db, STAGES } from "../db.js";

export const analyticsRouter = Router();

analyticsRouter.get("/", (_req, res) => {
  const totalContacts = (db.prepare("SELECT COUNT(*) AS c FROM contacts").get() as any).c;
  const totalCompanies = (db.prepare("SELECT COUNT(*) AS c FROM companies").get() as any).c;
  const totalLeads = (db.prepare("SELECT COUNT(*) AS c FROM leads").get() as any).c;

  const openLeads = (
    db.prepare("SELECT COUNT(*) AS c FROM leads WHERE status = 'open'").get() as any
  ).c;
  const wonLeads = (
    db.prepare("SELECT COUNT(*) AS c FROM leads WHERE status = 'won'").get() as any
  ).c;
  const lostLeads = (
    db.prepare("SELECT COUNT(*) AS c FROM leads WHERE status = 'lost'").get() as any
  ).c;

  const openPipelineValue = (
    db.prepare("SELECT COALESCE(SUM(value), 0) AS v FROM leads WHERE status = 'open'").get() as any
  ).v;
  const wonValue = (
    db.prepare("SELECT COALESCE(SUM(value), 0) AS v FROM leads WHERE status = 'won'").get() as any
  ).v;

  const closedTotal = wonLeads + lostLeads;
  const winRate = closedTotal > 0 ? wonLeads / closedTotal : 0;

  const avgDealSize = wonLeads > 0 ? wonValue / wonLeads : 0;

  const byStage = STAGES.map((s) => {
    const row = db
      .prepare(
        "SELECT COUNT(*) AS c, COALESCE(SUM(value),0) AS v FROM leads WHERE stage = ? AND status != 'lost'"
      )
      .get(s.key) as any;
    return { stage: s.key, label: s.label, count: row.c, value: row.v };
  });

  const bySource = db
    .prepare(
      `SELECT COALESCE(NULLIF(source, ''), 'Unknown') AS source, COUNT(*) AS c
       FROM leads GROUP BY source ORDER BY c DESC`
    )
    .all();

  // Leads created per month for the last 6 months
  const leadsOverTime = db
    .prepare(
      `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS c
       FROM leads
       WHERE created_at >= datetime('now', '-6 months')
       GROUP BY month ORDER BY month ASC`
    )
    .all();

  // Deals won per month for the last 6 months
  const dealsWonOverTime = db
    .prepare(
      `SELECT strftime('%Y-%m', closed_at) AS month, COUNT(*) AS c, COALESCE(SUM(value),0) AS v
       FROM leads
       WHERE status = 'won' AND closed_at >= datetime('now', '-6 months')
       GROUP BY month ORDER BY month ASC`
    )
    .all();

  const recentActivity = db
    .prepare(
      `SELECT a.*, l.title AS lead_title FROM activities a
       LEFT JOIN leads l ON l.id = a.lead_id
       ORDER BY a.created_at DESC LIMIT 15`
    )
    .all();

  const topOwners = db
    .prepare(
      `SELECT COALESCE(NULLIF(owner, ''), 'Unassigned') AS owner, COUNT(*) AS c, COALESCE(SUM(CASE WHEN status='won' THEN value ELSE 0 END),0) AS won_value
       FROM leads GROUP BY owner ORDER BY c DESC`
    )
    .all();

  res.json({
    totals: {
      contacts: totalContacts,
      companies: totalCompanies,
      leads: totalLeads,
      openLeads,
      wonLeads,
      lostLeads,
    },
    pipelineValue: openPipelineValue,
    wonValue,
    winRate,
    avgDealSize,
    byStage,
    bySource,
    leadsOverTime,
    dealsWonOverTime,
    recentActivity,
    topOwners,
  });
});
