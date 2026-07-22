import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: DashboardIcon, end: true },
  { to: "/pipeline", label: "Pipeline", icon: PipelineIcon },
  { to: "/contacts", label: "Contacts", icon: ContactsIcon },
  { to: "/companies", label: "Companies", icon: CompaniesIcon },
  { to: "/campaigns", label: "Campaigns", icon: CampaignsIcon },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 w-60 border-r border-slate-200 bg-white flex flex-col">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
            IA
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900 text-sm">Inflate AI</div>
            <div className="text-xs text-slate-400">CRM</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-200 text-xs text-slate-400">
          Inflate AI CRM &copy; {new Date().getFullYear()}
        </div>
      </aside>
      <main className="flex-1 ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="6" height="7" rx="1.2" />
      <rect x="11" y="3" width="6" height="4" rx="1.2" />
      <rect x="11" y="9" width="6" height="8" rx="1.2" />
      <rect x="3" y="12" width="6" height="5" rx="1.2" />
    </svg>
  );
}

function PipelineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 4h14" strokeLinecap="round" />
      <path d="M5 8h10" strokeLinecap="round" />
      <path d="M7 12h6" strokeLinecap="round" />
      <path d="M9 16h2" strokeLinecap="round" />
    </svg>
  );
}

function ContactsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
    </svg>
  );
}

function CompaniesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="7" width="14" height="10" rx="1.2" />
      <path d="M7 7V4.8A1.8 1.8 0 0 1 8.8 3h2.4A1.8 1.8 0 0 1 13 4.8V7" />
      <path d="M3 11h14" />
    </svg>
  );
}

function CampaignsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 5.5 10 10l7-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="5" width="14" height="10" rx="1.4" />
    </svg>
  );
}
