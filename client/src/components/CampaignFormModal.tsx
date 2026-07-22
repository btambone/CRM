import { useEffect, useState } from "react";
import Modal from "./Modal";
import { api } from "../lib/api";
import type { AudienceOption, Campaign, Company } from "../lib/types";

export default function CampaignFormModal({
  companies,
  initial,
  onClose,
  onSaved,
}: {
  companies: Company[];
  initial?: Campaign;
  onClose: () => void;
  onSaved: (campaign: Campaign) => void;
}) {
  const [audienceTypes, setAudienceTypes] = useState<AudienceOption[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(
    initial?.body ??
      "Hi {{first_name}},\n\nJust checking in! Let us know if there's anything we can help with.\n\nBest,\nInflate AI"
  );
  const [audienceType, setAudienceType] = useState(initial?.audience_type ?? "all_contacts");
  const [audienceValue, setAudienceValue] = useState(initial?.audience_value ?? "");
  const [scheduleType, setScheduleType] = useState(initial?.schedule_type ?? "manual");
  const [intervalDays, setIntervalDays] = useState(String(initial?.interval_days ?? "7"));
  const [dayOfMonth, setDayOfMonth] = useState(String(initial?.day_of_month ?? "1"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.campaigns.audienceOptions().then((r) => setAudienceTypes(r.audienceTypes));
  }, []);

  const stageOption = audienceTypes.find((a) => a.key === "stage");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !body.trim()) {
      setError("Name, subject, and message body are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        subject: subject.trim(),
        body,
        audience_type: audienceType,
        audience_value: audienceType === "stage" || audienceType === "company" ? audienceValue || null : null,
        schedule_type: scheduleType,
        interval_days: scheduleType === "weekly" ? Number(intervalDays) || 7 : null,
        day_of_month: scheduleType === "monthly" ? Number(dayOfMonth) || 1 : null,
      };
      const saved = initial
        ? await api.campaigns.update(initial.id, payload)
        : await api.campaigns.create(payload);
      onSaved(saved);
    } catch (err: any) {
      setError(err.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? "Edit Campaign" : "New Campaign"} onClose={onClose} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <label className="label" htmlFor="campaign-name">Campaign name</label>
          <input
            id="campaign-name"
            className="input"
            placeholder="e.g. Monthly check-in"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="campaign-subject">Email subject</label>
          <input id="campaign-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="campaign-body">Message</label>
          <textarea
            id="campaign-body"
            className="input min-h-[160px] font-mono text-xs"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            Merge fields: <code>{"{{first_name}}"}</code> <code>{"{{last_name}}"}</code>{" "}
            <code>{"{{full_name}}"}</code> <code>{"{{company_name}}"}</code>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="campaign-audience">Send to</label>
            <select
              id="campaign-audience"
              className="input"
              value={audienceType}
              onChange={(e) => {
                setAudienceType(e.target.value as any);
                setAudienceValue("");
              }}
            >
              {audienceTypes.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {audienceType === "stage" && (
            <div>
              <label className="label" htmlFor="campaign-audience-stage">Pipeline stage</label>
              <select
                id="campaign-audience-stage"
                className="input"
                value={audienceValue}
                onChange={(e) => setAudienceValue(e.target.value)}
              >
                <option value="">Select a stage</option>
                {stageOption?.values?.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {audienceType === "company" && (
            <div>
              <label className="label" htmlFor="campaign-audience-company">Company</label>
              <select
                id="campaign-audience-company"
                className="input"
                value={audienceValue}
                onChange={(e) => setAudienceValue(e.target.value)}
              >
                <option value="">Select a company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="campaign-schedule">Schedule</label>
            <select id="campaign-schedule" className="input" value={scheduleType} onChange={(e) => setScheduleType(e.target.value as any)}>
              <option value="manual">Send manually only</option>
              <option value="weekly">Repeat every N days</option>
              <option value="monthly">Repeat monthly</option>
            </select>
          </div>
          {scheduleType === "weekly" && (
            <div>
              <label className="label" htmlFor="campaign-interval">Repeat every (days)</label>
              <input
                id="campaign-interval"
                className="input"
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
              />
            </div>
          )}
          {scheduleType === "monthly" && (
            <div>
              <label className="label" htmlFor="campaign-day-of-month">Day of month (1-28)</label>
              <input
                id="campaign-day-of-month"
                className="input"
                type="number"
                min="1"
                max="28"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Campaign"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
