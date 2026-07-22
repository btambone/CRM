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
  property_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead_count?: number;
  leads?: Lead[];
  valuations?: PropertyValuation[];
}

export interface PropertyValuation {
  id: number;
  contact_id: number;
  address: string;
  estimated_value: number | null;
  range_low: number | null;
  range_high: number | null;
  source: string;
  fetched_at: string;
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

export type AudienceType = "all_contacts" | "past_clients" | "stage" | "company";
export type ScheduleType = "manual" | "weekly" | "monthly";
export type CampaignStatus = "draft" | "active" | "paused";

export interface Campaign {
  id: number;
  name: string;
  subject: string;
  body: string;
  audience_type: AudienceType;
  audience_value: string | null;
  schedule_type: ScheduleType;
  interval_days: number | null;
  day_of_month: number | null;
  status: CampaignStatus;
  next_send_at: string | null;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
  audience_count?: number;
  total_sent?: number;
  sends?: CampaignSend[];
}

export interface CampaignSend {
  id: number;
  campaign_id: number;
  contact_id: number | null;
  email: string;
  status: "sent" | "failed";
  error: string | null;
  sent_at: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface AudienceOption {
  key: AudienceType;
  label: string;
  values?: Stage[];
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
