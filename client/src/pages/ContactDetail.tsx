import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import ContactFormModal from "../components/ContactFormModal";
import { api } from "../lib/api";
import type { Company, Contact } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/format";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal Sent",
  closed_won: "Closed Won",
};

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    setLoading(true);
    const [c, co] = await Promise.all([api.contacts.get(id), api.companies.list()]);
    setContact(c);
    setCompanies(co);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDelete() {
    if (!contact) return;
    if (!confirm(`Delete ${contact.first_name} ${contact.last_name}? This cannot be undone.`)) return;
    await api.contacts.remove(contact.id);
    navigate("/contacts");
  }

  if (loading || !contact) {
    return <div className="p-8 text-slate-400 text-sm">Loading...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Contact Profile"
        subtitle={<Link to="/contacts" className="text-brand-600 hover:underline">&larr; Back to contacts</Link>}
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
            <Avatar first={contact.first_name} last={contact.last_name} size="lg" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              {contact.first_name} {contact.last_name}
            </h2>
            {contact.title && <p className="text-sm text-slate-500">{contact.title}</p>}
            {contact.company_id && (
              <Link
                to={`/companies/${contact.company_id}`}
                className="inline-block mt-2 text-sm text-brand-600 hover:underline"
              >
                {contact.company_name}
              </Link>
            )}
          </div>
          <div className="card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Contact Info</h3>
            <InfoRow label="Email" value={contact.email} />
            <InfoRow label="Phone" value={contact.phone} />
            <InfoRow label="Added" value={formatDate(contact.created_at)} />
          </div>
          {contact.notes && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        <div className="col-span-2">
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Associated Leads ({contact.leads?.length ?? 0})
              </h3>
            </div>
            {(!contact.leads || contact.leads.length === 0) && (
              <div className="p-6 text-sm text-slate-400">No leads linked to this contact yet.</div>
            )}
            {contact.leads && contact.leads.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Lead</th>
                    <th className="px-6 py-3">Stage</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contact.leads.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/leads/${l.id}`)}
                    >
                      <td className="px-6 py-3 font-medium text-slate-900">{l.title}</td>
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
        <ContactFormModal
          companies={companies}
          initial={contact}
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
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium">{value || "—"}</span>
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
