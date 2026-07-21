import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import CompanyFormModal from "../components/CompanyFormModal";
import { api } from "../lib/api";
import type { Company } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/format";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal Sent",
  closed_won: "Closed Won",
};

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    setLoading(true);
    setCompany(await api.companies.get(id));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDelete() {
    if (!company) return;
    if (!confirm(`Delete ${company.name}? This cannot be undone.`)) return;
    await api.companies.remove(company.id);
    navigate("/companies");
  }

  if (loading || !company) {
    return <div className="p-8 text-slate-400 text-sm">Loading...</div>;
  }

  const openValue = (company.leads ?? [])
    .filter((l) => l.status === "open")
    .reduce((sum, l) => sum + l.value, 0);

  return (
    <div>
      <PageHeader
        title="Company Profile"
        subtitle={<Link to="/companies" className="text-brand-600 hover:underline">&larr; Back to companies</Link>}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowForm(true)}>
              Edit
            </button>
            <button className="btn-ghost text-rose-600" onClick={handleDelete}>
              Delete
            </button>
          </>
        }
      />
      <div className="p-8 grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="card p-6 text-center">
            <div className="h-16 w-16 mx-auto rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-2xl">
              {company.name.slice(0, 1).toUpperCase()}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{company.name}</h2>
            {company.industry && <p className="text-sm text-slate-500">{company.industry}</p>}
          </div>
          <div className="card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Company Info</h3>
            <InfoRow label="Website" value={company.website} />
            <InfoRow label="Phone" value={company.phone} />
            <InfoRow label="Address" value={company.address} />
            <InfoRow label="Size" value={company.size ? `${company.size} employees` : null} />
            <InfoRow label="Added" value={formatDate(company.created_at)} />
          </div>
          <div className="card p-6 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-semibold text-slate-900">{company.leads?.length ?? 0}</div>
              <div className="text-xs text-slate-400">Total Leads</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-brand-600">{formatCurrency(openValue)}</div>
              <div className="text-xs text-slate-400">Open Pipeline</div>
            </div>
          </div>
          {company.notes && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{company.notes}</p>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-6">
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Contacts ({company.contacts?.length ?? 0})
              </h3>
            </div>
            {(!company.contacts || company.contacts.length === 0) && (
              <div className="p-6 text-sm text-slate-400">No contacts linked to this company yet.</div>
            )}
            {company.contacts && company.contacts.length > 0 && (
              <div className="divide-y divide-slate-100">
                {company.contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/contacts/${c.id}`)}
                  >
                    <Avatar first={c.first_name} last={c.last_name} size="sm" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {c.first_name} {c.last_name}
                      </div>
                      <div className="text-xs text-slate-400">{c.title || c.email || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Leads ({company.leads?.length ?? 0})
              </h3>
            </div>
            {(!company.leads || company.leads.length === 0) && (
              <div className="p-6 text-sm text-slate-400">No leads linked to this company yet.</div>
            )}
            {company.leads && company.leads.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Lead</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Stage</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {company.leads.map((l: any) => (
                    <tr
                      key={l.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/leads/${l.id}`)}
                    >
                      <td className="px-6 py-3 font-medium text-slate-900">{l.title}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {l.first_name ? `${l.first_name} ${l.last_name}` : "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{STAGE_LABELS[l.stage] ?? l.stage}</td>
                      <td className="px-6 py-3 text-slate-600">{formatCurrency(l.value)}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <CompanyFormModal
          initial={company}
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-sky-50 text-sky-700",
    won: "bg-emerald-50 text-emerald-700",
    lost: "bg-slate-100 text-slate-500",
  };
  return <span className={`badge ${styles[status] ?? styles.open}`}>{status}</span>;
}
