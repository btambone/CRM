import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import ContactFormModal from "../components/ContactFormModal";
import { api } from "../lib/api";
import type { Company, Contact } from "../lib/types";

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const [c, co] = await Promise.all([api.contacts.list(), api.companies.list()]);
    setContacts(c);
    setCompanies(co);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.email ?? ""} ${c.company_name ?? ""}`.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length} total contact${contacts.length === 1 ? "" : "s"}`}
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New Contact
          </button>
        }
      />
      <div className="p-8">
        <div className="mb-4">
          <input
            className="input max-w-sm"
            placeholder="Search contacts, companies, emails..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {!loading && filtered.length === 0 && (
          <div className="card">
            <EmptyState
              title={contacts.length === 0 ? "No contacts yet" : "No matches"}
              description={
                contacts.length === 0
                  ? "Add your first contact to start building your CRM."
                  : "Try a different search term."
              }
              action={
                contacts.length === 0 && (
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    + New Contact
                  </button>
                )
              }
            />
          </div>
        )}

        {filtered.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Leads</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/contacts/${c.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar first={c.first_name} last={c.last_name} size="sm" />
                        <div>
                          <div className="font-medium text-slate-900">
                            {c.first_name} {c.last_name}
                          </div>
                          {c.title && <div className="text-xs text-slate-400">{c.title}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.company_name || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.email || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.phone || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.lead_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ContactFormModal
          companies={companies}
          onClose={() => setShowForm(false)}
          onSaved={(c) => {
            setShowForm(false);
            setContacts((prev) => [{ ...c, lead_count: 0 }, ...prev]);
          }}
        />
      )}
    </div>
  );
}
