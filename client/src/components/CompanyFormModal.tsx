import { useState } from "react";
import Modal from "./Modal";
import { api } from "../lib/api";
import type { Company } from "../lib/types";

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function CompanyFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Company;
  onClose: () => void;
  onSaved: (company: Company) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [size, setSize] = useState(initial?.size ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        industry: industry.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        size: size || null,
        notes: notes.trim() || null,
      };
      const saved = initial
        ? await api.companies.update(initial.id, payload)
        : await api.companies.create(payload);
      onSaved(saved);
    } catch (err: any) {
      setError(err.message || "Failed to save company");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? "Edit Company" : "New Company"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="label" htmlFor="company-name">Company name</label>
          <input id="company-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="company-industry">Industry</label>
            <input id="company-industry" className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="company-size">Company size</label>
            <select id="company-size" className="input" value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">Unspecified</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s} employees
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="company-website">Website</label>
            <input id="company-website" className="input" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="company-phone">Phone</label>
            <input id="company-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="company-address">Address</label>
          <input id="company-address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="company-notes">Notes</label>
          <textarea id="company-notes" className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Company"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
