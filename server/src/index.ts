import express from "express";
import cors from "cors";
import { contactsRouter } from "./routes/contacts.js";
import { companiesRouter } from "./routes/companies.js";
import { leadsRouter } from "./routes/leads.js";
import { analyticsRouter } from "./routes/analytics.js";
import "./db.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.use("/api/contacts", contactsRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/analytics", analyticsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Inflate AI CRM server running on http://localhost:${PORT}`);
});
