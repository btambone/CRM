import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
  Cell,
} from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { api } from "../lib/api";
import type { Analytics } from "../lib/types";
import { formatCurrency, formatDateTime, formatPercent } from "../lib/format";
import { CHART } from "../lib/chartColors";

function monthLabel(ym: string) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.get().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const timeSeries = useMemo(() => {
    if (!data) return [];
    const months = new Set<string>([
      ...data.leadsOverTime.map((r) => r.month),
      ...data.dealsWonOverTime.map((r) => r.month),
    ]);
    return Array.from(months)
      .sort()
      .map((month) => ({
        month: monthLabel(month),
        leads: data.leadsOverTime.find((r) => r.month === month)?.c ?? 0,
        deals: data.dealsWonOverTime.find((r) => r.month === month)?.c ?? 0,
      }));
  }, [data]);

  if (loading || !data) {
    return <div className="p-8 text-slate-400 text-sm">Loading analytics...</div>;
  }

  const maxSourceCount = Math.max(1, ...data.bySource.map((s: any) => s.c));
  const maxOwnerCount = Math.max(1, ...data.topOwners.map((o) => o.c));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="A high-level view of Inflate AI's CRM performance" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-5">
          <StatCard label="Open Pipeline Value" value={formatCurrency(data.pipelineValue)} hint={`${data.totals.openLeads} active leads`} />
          <StatCard label="Win Rate" value={formatPercent(data.winRate)} hint={`${data.totals.wonLeads} won / ${data.totals.lostLeads} lost`} accent="emerald" />
          <StatCard label="Avg Deal Size" value={formatCurrency(data.avgDealSize)} hint="Across closed-won deals" accent="amber" />
          <StatCard label="Revenue Won" value={formatCurrency(data.wonValue)} hint="All-time closed-won value" accent="emerald" />
        </div>
        <div className="grid grid-cols-3 gap-5">
          <StatCard label="Total Contacts" value={String(data.totals.contacts)} />
          <StatCard label="Total Companies" value={String(data.totals.companies)} />
          <StatCard label="Total Leads" value={String(data.totals.leads)} />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Pipeline by Stage</h3>
            <p className="text-xs text-slate-400 mb-4">Active lead count per pipeline stage</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byStage} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={CHART.gridline} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: CHART.muted, fontSize: 12 }} axisLine={{ stroke: CHART.baseline }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={100}
                  tick={{ fill: CHART.textSecondary, fontSize: 12 }}
                  axisLine={{ stroke: CHART.baseline }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [name === "count" ? value : formatCurrency(value), name === "count" ? "Leads" : "Value"]}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${CHART.gridline}`, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {data.byStage.map((entry, idx) => (
                    <Cell key={entry.stage} fill={CHART.ordinal5[idx % CHART.ordinal5.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Leads Created vs. Deals Won</h3>
            <p className="text-xs text-slate-400 mb-4">Last 6 months</p>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={timeSeries} margin={{ left: -16, right: 16 }}>
                <CartesianGrid vertical={false} stroke={CHART.gridline} />
                <XAxis dataKey="month" tick={{ fill: CHART.muted, fontSize: 12 }} axisLine={{ stroke: CHART.baseline }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: CHART.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${CHART.gridline}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="leads" name="Leads Created" fill={CHART.categorical.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line dataKey="deals" name="Deals Won" stroke={CHART.categorical.orange} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Lead Sources</h3>
            <div className="space-y-3">
              {data.bySource.length === 0 && <p className="text-sm text-slate-400">No leads yet.</p>}
              {data.bySource.map((s: any) => (
                <div key={s.source}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{s.source}</span>
                    <span className="text-slate-400">{s.c}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(s.c / maxSourceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Team Performance</h3>
            <div className="space-y-3">
              {data.topOwners.length === 0 && <p className="text-sm text-slate-400">No leads assigned yet.</p>}
              {data.topOwners.map((o) => (
                <div key={o.owner}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{o.owner}</span>
                    <span className="text-slate-400">
                      {o.c} leads &middot; {formatCurrency(o.won_value)} won
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(o.c / maxOwnerCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="p-6 space-y-4">
            {data.recentActivity.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
            {data.recentActivity.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{a.lead_title}</span> — {a.description}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
