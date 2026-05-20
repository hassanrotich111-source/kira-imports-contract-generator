import { useState } from "react";
import { Link, useLocation } from "react-router";
import { LayoutDashboard, FileText, History, Settings, Menu, X, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/new", label: "New Contract", icon: FileText },
  { path: "/history", label: "History", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn("fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-amber-500" />
            <span className="font-bold text-lg tracking-tight">KIRA IMPORTS</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const active = loc.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white")}>
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">KIRA IMPORTS v1.0 &bull; Personal Use</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="text-slate-600"><Menu className="w-6 h-6" /></button>
          <span className="font-semibold text-slate-900">KIRA IMPORTS</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
