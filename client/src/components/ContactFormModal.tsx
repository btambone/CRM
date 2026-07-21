import { useState } from "react";
import Modal from "./Modal";
import { api } from "../lib/api";
import type { Company, Contact } from "../lib/types";

export default function ContactFormModal({
  companies,
  initial,
  onClose,
  onSaved,
}: {
  companies: Company[];
  initial?: Contact;
  onClose: () => void;
  onSaved: (contact: Contact) => void;
}) {
  const [firstName, setFirstName] = useState(initial?.first_name ?? "");
  const [lastName, setLastName] = useState(initial?.last_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [companyId, setCompanyId] = useState(initial?.company_id ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        title: title.trim() || null,
        company_id: companyId ? Number(companyId) : null,
        notes: notes.trim() || null,
      };
      const saved = initial
        ? await api.contacts.update(initial.id, payload)
        : await api.contacts.create(payload);
      onSaved(saved);
    } catch (err: any) {
      setError(err.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? "Edit Contact" : "New Contact"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="contact-first-name">First name</label>
            <input id="contact-first-name" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="contact-last-name">Last name</label>
            <input id="contact-last-name" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="contact-email">Email</label>
            <input id="contact-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="contact-phone">Phone</label>
            <input id="contact-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="contact-title">Job title</label>
            <input id="contact-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="contact-company">Company</label>
            <select id="contact-company" className="input" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="contact-notes">Notes</label>
          <textarea id="contact-notes" className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
