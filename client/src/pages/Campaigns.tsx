import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import CampaignFormModal from "../components/CampaignFormModal";
import { api } from "../lib/api";
import type { Campaign, Company } from "../lib/types";
import { formatDateTime } from "../lib/format";

const AUDIENCE_LABELS: Record<string, string> = {
  all_contacts: "All Contacts",
  past_clients: "Past Clients",
  stage: "By Stage",
  company: "By Company",
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const [c, co, health] = await Promise.all([
      api.campaigns.list(),
      api.companies.list(),
      fetch("/api/health").then((r) => r.json()),
    ]);
    setCampaigns(c);
    setCompanies(co);
    setEmailConfigured(Boolean(health.emailConfigured));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Automated and one-off emails to your contacts and leads"
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New Campaign
          </button>
        }
      />
      <div className="p-8">
        {!emailConfigured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Email sending isn't set up yet. Add <code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code> and{" "}
            <code className="bg-amber-100 px-1 rounded">EMAIL_FROM</code> to <code className="bg-amber-100 px-1 rounded">server/.env</code>{" "}
            (copy <code className="bg-amber-100 px-1 rounded">server/.env.example</code> to start) and restart the
            server. You can still build and preview campaigns in the meantime.
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="card">
            <EmptyState
              title="No campaigns yet"
              description="Create a campaign to send a one-off or recurring email to a segment of your contacts."
              action={
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                  + New Campaign
                </button>
              }
            />
          </div>
        )}

        {campaigns.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Audience</th>
                  <th className="px-5 py-3">Schedule</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last sent</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.subject}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {AUDIENCE_LABELS[c.audience_type] ?? c.audience_type} · {c.audience_count ?? 0}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.schedule_type === "manual" ? "Manual" : c.schedule_type === "weekly" ? `Every ${c.interval_days ?? 7}d` : `Monthly (day ${c.day_of_month ?? 1})`}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.last_sent_at ? formatDateTime(c.last_sent_at) : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <CampaignFormModal
          companies={companies}
          onClose={() => setShowForm(false)}
          onSaved={(c) => {
            setShowForm(false);
            navigate(`/campaigns/${c.id}`);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    active: "bg-emerald-50 text-emerald-700",
    paused: "bg-amber-50 text-amber-700",
  };
  return <span className={`badge ${styles[status] ?? styles.draft}`}>{status}</span>;
}
