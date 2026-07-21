import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { api } from "../lib/api";
import type { Lead, Stage } from "../lib/types";
import { formatCurrency, formatDate, formatDateTime } from "../lib/format";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    const [l, s] = await Promise.all([api.leads.get(id), api.leads.stages()]);
    setLead(l);
    setStages(s);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function moveStage(stage: string) {
    if (!lead) return;
    const updated = await api.leads.setStage(lead.id, stage);
    setLead((prev) => (prev ? { ...prev, ...updated } : updated));
    load();
  }

  async function markLost() {
    if (!lead) return;
    if (!confirm("Mark this lead as lost?")) return;
    await api.leads.markLost(lead.id);
    load();
  }

  async function reopen() {
    if (!lead) return;
    await api.leads.reopen(lead.id);
    load();
  }

  async function addNote() {
    if (!lead || !note.trim()) return;
    setSaving(true);
    await api.leads.addActivity(lead.id, note.trim());
    setNote("");
    await load();
    setSaving(false);
  }

  async function handleDelete() {
    if (!lead) return;
    if (!confirm(`Delete lead "${lead.title}"? This cannot be undone.`)) return;
    await api.leads.remove(lead.id);
    navigate("/pipeline");
  }

  if (loading || !lead) {
    return <div className="p-8 text-slate-400 text-sm">Loading...</div>;
  }

  const currentStageIdx = stages.findIndex((s) => s.key === lead.stage);

  return (
    <div>
      <PageHeader
        title={lead.title}
        subtitle={<Link to="/pipeline" className="text-brand-600 hover:underline">&larr; Back to pipeline</Link>}
        actions={
          <>
            {lead.status === "lost" ? (
              <button className="btn-secondary" onClick={reopen}>
                Reopen Lead
              </button>
            ) : (
              lead.status === "open" && (
                <button className="btn-secondary text-rose-600" onClick={markLost}>
                  Mark Lost
                </button>
              )
            )}
            <button className="btn-ghost text-rose-600" onClick={handleDelete}>
              Delete
            </button>
          </>
        }
      />

      <div className="p-8 space-y-6">
        {lead.status !== "lost" && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">Pipeline Stage</h3>
              <StatusPill status={lead.status} />
            </div>
            <div className="flex items-center">
              {stages.map((s, idx) => (
                <div key={s.key} className="flex-1 flex items-center">
                  <button
                    onClick={() => moveStage(s.key)}
                    className={`flex flex-col items-center gap-1.5 group ${
                      idx <= currentStageIdx ? "" : "opacity-50"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                        idx < currentStageIdx
                          ? "bg-brand-600 border-brand-600 text-white"
                          : idx === currentStageIdx
                          ? "bg-brand-50 border-brand-600 text-brand-700"
                          : "bg-white border-slate-300 text-slate-400 group-hover:border-brand-300"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        idx === currentStageIdx ? "text-brand-700" : "text-slate-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                  {idx < stages.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${idx < currentStageIdx ? "bg-brand-600" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-6">
            <div className="card p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Deal Info</h3>
              <InfoRow label="Value" value={formatCurrency(lead.value)} />
              <InfoRow label="Source" value={lead.source} />
              <InfoRow label="Owner" value={lead.owner} />
              <InfoRow label="Expected close" value={formatDate(lead.expected_close_date)} />
              <InfoRow label="Created" value={formatDate(lead.created_at)} />
            </div>

            <div className="card p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
              {lead.contact_id ? (
                <>
                  <Link to={`/contacts/${lead.contact_id}`} className="text-brand-600 hover:underline font-medium text-sm">
                    {lead.first_name} {lead.last_name}
                  </Link>
                  <InfoRow label="Email" value={lead.contact_email} />
                  <InfoRow label="Phone" value={lead.contact_phone} />
                </>
              ) : (
                <p className="text-sm text-slate-400">No contact linked</p>
              )}
            </div>

            <div className="card p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Company</h3>
              {lead.company_id ? (
                <Link to={`/companies/${lead.company_id}`} className="text-brand-600 hover:underline font-medium text-sm">
                  {lead.company_name}
                </Link>
              ) : (
                <p className="text-sm text-slate-400">No company linked</p>
              )}
            </div>

            {lead.notes && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>

          <div className="col-span-2">
            <div className="card">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
              </div>
              <div className="p-6 flex gap-2">
                <input
                  className="input"
                  placeholder="Log a call, email, or update..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <button className="btn-primary shrink-0" onClick={addNote} disabled={saving || !note.trim()}>
                  Add
                </button>
              </div>
              <div className="px-6 pb-6 space-y-4">
                {(lead.activities ?? []).length === 0 && (
                  <p className="text-sm text-slate-400">No activity logged yet.</p>
                )}
                {(lead.activities ?? []).map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-800">{a.description}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-sky-50 text-sky-700",
    won: "bg-emerald-50 text-emerald-700",
    lost: "bg-slate-100 text-slate-500",
  };
  return <span className={`badge ${styles[status] ?? styles.open}`}>{status}</span>;
}
