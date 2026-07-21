import { useState } from "react";
import Modal from "./Modal";
import { api } from "../lib/api";
import type { Company, Contact, Lead, Stage } from "../lib/types";

const SOURCE_OPTIONS = ["Referral", "Website", "Cold Outreach", "LinkedIn", "Event", "Partner", "Other"];

export default function LeadFormModal({
  stages,
  contacts,
  companies,
  defaultStage,
  onClose,
  onSaved,
}: {
  stages: Stage[];
  contacts: Contact[];
  companies: Company[];
  defaultStage?: string;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}) {
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [stage, setStage] = useState(defaultStage ?? stages[0]?.key ?? "new_lead");
  const [value, setValue] = useState("");
  const [source, setSource] = useState("");
  const [owner, setOwner] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Deal title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await api.leads.create({
        title: title.trim(),
        contact_id: contactId ? Number(contactId) : null,
        company_id: companyId ? Number(companyId) : null,
        stage,
        value: value ? Number(value) : 0,
        source: source || null,
        owner: owner.trim() || null,
        expected_close_date: expectedCloseDate || null,
        notes: notes.trim() || null,
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err.message || "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Lead" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="label" htmlFor="lead-title">Deal title</label>
          <input
            id="lead-title"
            className="input"
            placeholder="e.g. Website redesign package"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="lead-contact">Contact</label>
            <select id="lead-contact" className="input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lead-company">Company</label>
            <select id="lead-company" className="input" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">None</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="lead-stage">Stage</label>
            <select id="lead-stage" className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
              {stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lead-value">Deal value ($)</label>
            <input
              id="lead-value"
              className="input"
              type="number"
              min="0"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="lead-source">Source</label>
            <select id="lead-source" className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">Unspecified</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lead-owner">Owner</label>
            <input
              id="lead-owner"
              className="input"
              placeholder="Assigned to"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="lead-close-date">Expected close date</label>
          <input
            id="lead-close-date"
            className="input"
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="lead-notes">Notes</label>
          <textarea id="lead-notes" className="input min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
