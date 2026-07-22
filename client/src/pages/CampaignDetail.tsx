import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CampaignFormModal from "../components/CampaignFormModal";
import { api } from "../lib/api";
import type { Campaign, Company } from "../lib/types";
import { formatDateTime } from "../lib/format";

const AUDIENCE_LABELS: Record<string, string> = {
  all_contacts: "All Contacts",
  past_clients: "Past Clients (won deals)",
  stage: "Contacts in pipeline stage",
  company: "Contacts at company",
};

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    const [c, co] = await Promise.all([api.campaigns.get(id), api.companies.list()]);
    setCampaign(c);
    setCompanies(co);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSendTest() {
    if (!campaign || !testEmail.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.campaigns.sendTest(campaign.id, testEmail.trim());
      setMessage({ type: "ok", text: `Test email sent to ${testEmail.trim()}.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to send test email" });
    } finally {
      setBusy(false);
    }
  }

  async function handleSendNow() {
    if (!campaign) return;
    if (!confirm(`Send this campaign to ${campaign.audience_count ?? 0} contacts now?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.campaigns.sendNow(campaign.id);
      setMessage({ type: "ok", text: `Sent to ${result.sent} contacts (${result.failed} failed).` });
      load();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to send campaign" });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive() {
    if (!campaign) return;
    setBusy(true);
    try {
      if (campaign.status === "active") await api.campaigns.pause(campaign.id);
      else await api.campaigns.activate(campaign.id);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!campaign) return;
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;
    await api.campaigns.remove(campaign.id);
    navigate("/campaigns");
  }

  if (loading || !campaign) {
    return <div className="p-8 text-slate-400 text-sm">Loading...</div>;
  }

  return (
    <div>
      <PageHeader
        title={campaign.name}
        subtitle={<Link to="/campaigns" className="text-brand-600 hover:underline">&larr; Back to campaigns</Link>}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowForm(true)}>
              Edit
            </button>
            {campaign.schedule_type !== "manual" && (
              <button className="btn-secondary" onClick={handleToggleActive} disabled={busy}>
                {campaign.status === "active" ? "Pause" : "Activate"}
              </button>
            )}
            <button className="btn-ghost text-rose-600" onClick={handleDelete}>
              Delete
            </button>
          </>
        }
      />

      <div className="p-8 grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Details</h3>
            <InfoRow label="Subject" value={campaign.subject} />
            <InfoRow label="Audience" value={`${AUDIENCE_LABELS[campaign.audience_type]}`} />
            <InfoRow label="Recipients" value={String(campaign.audience_count ?? 0)} />
            <InfoRow
              label="Schedule"
              value={
                campaign.schedule_type === "manual"
                  ? "Manual only"
                  : campaign.schedule_type === "weekly"
                  ? `Every ${campaign.interval_days ?? 7} days`
                  : `Monthly on day ${campaign.day_of_month ?? 1}`
              }
            />
            <InfoRow label="Next send" value={campaign.next_send_at ? formatDateTime(campaign.next_send_at) : "—"} />
            <InfoRow label="Last sent" value={campaign.last_sent_at ? formatDateTime(campaign.last_sent_at) : "Never"} />
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Message preview</h3>
            <p className="text-xs text-slate-500 mb-2 font-medium">{campaign.subject}</p>
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3">
              {campaign.body}
            </pre>
          </div>

          <div className="card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Send a test</h3>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button className="btn-secondary w-full justify-center" onClick={handleSendTest} disabled={busy || !testEmail.trim()}>
              Send Test Email
            </button>
            <button className="btn-primary w-full justify-center" onClick={handleSendNow} disabled={busy}>
              Send to All {campaign.audience_count ?? 0} Now
            </button>
            {message && (
              <p className={`text-sm ${message.type === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{message.text}</p>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Send History ({campaign.sends?.length ?? 0})</h3>
            </div>
            {(!campaign.sends || campaign.sends.length === 0) && (
              <div className="p-6 text-sm text-slate-400">No sends yet.</div>
            )}
            {campaign.sends && campaign.sends.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.sends.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-6 py-3 text-slate-900">
                        {s.first_name ? `${s.first_name} ${s.last_name}` : "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{s.email}</td>
                      <td className="px-6 py-3">
                        <span className={`badge ${s.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {s.status}
                        </span>
                        {s.error && <div className="text-xs text-rose-500 mt-0.5">{s.error}</div>}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{formatDateTime(s.sent_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <CampaignFormModal
          companies={companies}
          initial={campaign}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between text-sm gap-3">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-900 font-medium text-right truncate">{value || "—"}</span>
    </div>
  );
}
