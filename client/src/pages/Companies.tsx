import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import CompanyFormModal from "../components/CompanyFormModal";
import { api } from "../lib/api";
import type { Company } from "../lib/types";
import { formatCurrency } from "../lib/format";

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setCompanies(await api.companies.list());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => `${c.name} ${c.industry ?? ""}`.toLowerCase().includes(q));
  }, [companies, query]);

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle={`${companies.length} total compan${companies.length === 1 ? "y" : "ies"}`}
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New Company
          </button>
        }
      />
      <div className="p-8">
        <div className="mb-4">
          <input
            className="input max-w-sm"
            placeholder="Search companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {!loading && filtered.length === 0 && (
          <div className="card">
            <EmptyState
              title={companies.length === 0 ? "No companies yet" : "No matches"}
              description={
                companies.length === 0
                  ? "Add a company profile to start tracking accounts."
                  : "Try a different search term."
              }
              action={
                companies.length === 0 && (
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    + New Company
                  </button>
                )
              }
            />
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/companies/${c.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 font-semibold">
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                  {c.size && <span className="badge bg-slate-100 text-slate-600">{c.size}</span>}
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{c.name}</h3>
                <p className="text-sm text-slate-500">{c.industry || "—"}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{c.contact_count ?? 0}</div>
                    <div className="text-xs text-slate-400">Contacts</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{c.lead_count ?? 0}</div>
                    <div className="text-xs text-slate-400">Leads</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatCurrency(c.open_value ?? 0)}
                    </div>
                    <div className="text-xs text-slate-400">Open Value</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CompanyFormModal
          onClose={() => setShowForm(false)}
          onSaved={(c) => {
            setShowForm(false);
            setCompanies((prev) => [{ ...c, contact_count: 0, lead_count: 0, open_value: 0 }, ...prev]);
          }}
        />
      )}
    </div>
  );
}
