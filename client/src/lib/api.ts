import type { Activity, Analytics, Company, Contact, Lead, Stage } from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  contacts: {
    list: (q = "") => request<Contact[]>(`/contacts?q=${encodeURIComponent(q)}`),
    get: (id: number | string) => request<Contact>(`/contacts/${id}`),
    create: (data: Partial<Contact>) =>
      request<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number | string, data: Partial<Contact>) =>
      request<Contact>(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number | string) => request<void>(`/contacts/${id}`, { method: "DELETE" }),
  },
  companies: {
    list: (q = "") => request<Company[]>(`/companies?q=${encodeURIComponent(q)}`),
    get: (id: number | string) => request<Company>(`/companies/${id}`),
    create: (data: Partial<Company>) =>
      request<Company>("/companies", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number | string, data: Partial<Company>) =>
      request<Company>(`/companies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number | string) => request<void>(`/companies/${id}`, { method: "DELETE" }),
  },
  leads: {
    stages: () => request<Stage[]>("/leads/stages"),
    list: () => request<Lead[]>("/leads"),
    get: (id: number | string) => request<Lead>(`/leads/${id}`),
    create: (data: Partial<Lead>) =>
      request<Lead>("/leads", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number | string, data: Partial<Lead>) =>
      request<Lead>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    setStage: (id: number | string, stage: string) =>
      request<Lead>(`/leads/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) }),
    markLost: (id: number | string) =>
      request<Lead>(`/leads/${id}/lost`, { method: "PATCH" }),
    reopen: (id: number | string) =>
      request<Lead>(`/leads/${id}/reopen`, { method: "PATCH" }),
    addActivity: (id: number | string, description: string, type = "note") =>
      request<Activity[]>(`/leads/${id}/activities`, {
        method: "POST",
        body: JSON.stringify({ description, type }),
      }),
    remove: (id: number | string) => request<void>(`/leads/${id}`, { method: "DELETE" }),
  },
  analytics: {
    get: () => request<Analytics>("/analytics"),
  },
};
