export interface Company {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  size: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact_count?: number;
  lead_count?: number;
  open_value?: number;
  contacts?: Contact[];
  leads?: Lead[];
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_id: number | null;
  company_name?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead_count?: number;
  leads?: Lead[];
}

export type LeadStatus = "open" | "won" | "lost";

export interface Lead {
  id: number;
  title: string;
  contact_id: number | null;
  company_id: number | null;
  first_name?: string | null;
  last_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  company_name?: string | null;
  stage: string;
  status: LeadStatus;
  value: number;
  source: string | null;
  owner: string | null;
  notes: string | null;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  activities?: Activity[];
}

export interface Activity {
  id: number;
  lead_id: number;
  type: string;
  description: string;
  created_at: string;
  lead_title?: string;
}

export interface Stage {
  key: string;
  label: string;
}

export interface Analytics {
  totals: {
    contacts: number;
    companies: number;
    leads: number;
    openLeads: number;
    wonLeads: number;
    lostLeads: number;
  };
  pipelineValue: number;
  wonValue: number;
  winRate: number;
  avgDealSize: number;
  byStage: { stage: string; label: string; count: number; value: number }[];
  bySource: { source: string; c: number }[];
  leadsOverTime: { month: string; c: number }[];
  dealsWonOverTime: { month: string; c: number; v: number }[];
  recentActivity: Activity[];
  topOwners: { owner: string; c: number; won_value: number }[];
}
