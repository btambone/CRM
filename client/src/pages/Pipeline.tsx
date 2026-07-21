import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import LeadFormModal from "../components/LeadFormModal";
import { api } from "../lib/api";
import type { Company, Contact, Lead, Stage } from "../lib/types";
import { formatCurrency } from "../lib/format";

export default function Pipeline() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showLost, setShowLost] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [defaultStage, setDefaultStage] = useState<string | undefined>();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function load() {
    setLoading(true);
    const [s, l, c, co] = await Promise.all([
      api.leads.stages(),
      api.leads.list(),
      api.contacts.list(),
      api.companies.list(),
    ]);
    setStages(s);
    setLeads(l);
    setContacts(c);
    setCompanies(co);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const visibleLeads = useMemo(
    () => leads.filter((l) => showLost || l.status !== "lost"),
    [leads, showLost]
  );

  const lostCount = useMemo(() => leads.filter((l) => l.status === "lost").length, [leads]);

  const columns = useMemo(() => {
    return stages.map((stage) => ({
      stage,
      leads: visibleLeads.filter((l) => l.stage === stage.key),
    }));
  }, [stages, visibleLeads]);

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === Number(event.active.id));
    setActiveLead(lead ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;
    const leadId = Number(active.id);
    const newStage = String(over.id);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
    try {
      await api.leads.setStage(leadId, newStage);
    } catch {
      load();
    }
  }

  const totalOpenValue = visibleLeads
    .filter((l) => l.status === "open")
    .reduce((sum, l) => sum + l.value, 0);

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Lead Pipeline"
        subtitle={`${visibleLeads.filter((l) => l.status !== "lost").length} active leads · ${formatCurrency(
          totalOpenValue
        )} open pipeline`}
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-slate-500 mr-2">
              <input type="checkbox" checked={showLost} onChange={(e) => setShowLost(e.target.checked)} />
              Show lost ({lostCount})
            </label>
            <button
              className="btn-primary"
              onClick={() => {
                setDefaultStage(undefined);
                setShowForm(true);
              }}
            >
              + New Lead
            </button>
          </>
        }
      />

      {!loading && (
        <div className="flex-1 overflow-x-auto p-6">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full min-w-max">
              {columns.map(({ stage, leads: stageLeads }) => (
                <Column
                  key={stage.key}
                  stage={stage}
                  leads={stageLeads}
                  onAddLead={() => {
                    setDefaultStage(stage.key);
                    setShowForm(true);
                  }}
                  onLeadClick={(id) => navigate(`/leads/${id}`)}
                />
              ))}
            </div>
            <DragOverlay>{activeLead && <LeadCard lead={activeLead} dragging />}</DragOverlay>
          </DndContext>
        </div>
      )}

      {showForm && (
        <LeadFormModal
          stages={stages}
          contacts={contacts}
          companies={companies}
          defaultStage={defaultStage}
          onClose={() => setShowForm(false)}
          onSaved={(lead) => {
            setShowForm(false);
            setLeads((prev) => [lead, ...prev]);
          }}
        />
      )}
    </div>
  );
}

function Column({
  stage,
  leads,
  onAddLead,
  onLeadClick,
}: {
  stage: Stage;
  leads: Lead[];
  onAddLead: () => void;
  onLeadClick: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const total = leads.reduce((sum, l) => sum + l.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col rounded-xl border ${
        isOver ? "border-brand-400 bg-brand-50/40" : "border-slate-200 bg-slate-100/60"
      }`}
    >
      <div className="px-4 py-3 border-b border-slate-200/70">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{stage.label}</h3>
          <span className="badge bg-white text-slate-600 border border-slate-200">{leads.length}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">{formatCurrency(total)}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px]">
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead.id)} />
        ))}
      </div>
      <div className="p-3 pt-0">
        <button className="w-full btn-ghost text-xs justify-center border border-dashed border-slate-300" onClick={onAddLead}>
          + Add lead
        </button>
      </div>
    </div>
  );
}

function DraggableCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={isDragging ? "opacity-30" : ""}
    >
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  return (
    <div
      className={`card p-3 cursor-grab active:cursor-grabbing ${
        dragging ? "shadow-lg rotate-1" : "hover:shadow-md"
      } ${lead.status === "lost" ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-slate-900 leading-snug">{lead.title}</h4>
        {lead.status === "lost" && <span className="badge bg-slate-200 text-slate-500 shrink-0">Lost</span>}
        {lead.status === "won" && <span className="badge bg-emerald-100 text-emerald-700 shrink-0">Won</span>}
      </div>
      {lead.company_name && <p className="text-xs text-slate-500 mt-1">{lead.company_name}</p>}
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm font-semibold text-brand-600">{formatCurrency(lead.value)}</span>
        {lead.first_name && <Avatar first={lead.first_name} last={lead.last_name} size="sm" />}
      </div>
    </div>
  );
}
