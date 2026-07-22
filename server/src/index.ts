import "dotenv/config";
import express from "express";
import cors from "cors";
import { contactsRouter } from "./routes/contacts.js";
import { companiesRouter } from "./routes/companies.js";
import { leadsRouter } from "./routes/leads.js";
import { analyticsRouter } from "./routes/analytics.js";
import { campaignsRouter, runDueCampaigns } from "./routes/campaigns.js";
import { initDb } from "./db.js";
import { isEmailConfigured } from "./mailer.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.use("/api/contacts", contactsRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/campaigns", campaignsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true, emailConfigured: isEmailConfigured() }));

await initDb();

app.listen(PORT, () => {
  console.log(`Inflate AI CRM server running on http://localhost:${PORT}`);
  if (!isEmailConfigured()) {
    console.log(
      "Email campaigns are not configured yet — add RESEND_API_KEY and EMAIL_FROM to server/.env to enable sending."
    );
  }
});

// Checks once a minute for scheduled campaigns whose next_send_at has arrived.
// Only relevant while this process stays running (see start-crm.bat).
setInterval(() => {
  runDueCampaigns().catch((err) => console.error("Scheduled campaign send failed:", err));
}, 60_000);
