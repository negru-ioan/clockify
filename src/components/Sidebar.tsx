import {
  Clock3,
  CalendarDays,
  BarChart3,
  FolderKanban,
  HardDrive,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { View } from "../types";
import "./Sidebar.css";
export function Sidebar({
  view,
  onNavigate: setView,
  userName,
  collapsed,
  onToggle,
}: {
  view: View;
  onNavigate: (view: View) => void;
  userName: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`sidebar${collapsed ? " is-collapsed" : ""}`}>
      <div className="brand">
        <a href="/">
          <img src="/logo.svg" alt="Clockify Logo" />
        </a>
      </div>
      <nav id="sidebar-navigation" aria-label="Main navigation">
        <button
          className={view === "tracker" ? "active" : ""}
          onClick={() => setView("tracker")}
          aria-label="Time tracker"
          title="Time tracker"
          aria-current={view === "tracker" ? "page" : undefined}
        >
          <Clock3 size={19} />
          <span className="nav-text">Time tracker</span>
        </button>
        <button
          className={view === "calendar" ? "active" : ""}
          onClick={() => setView("calendar")}
          aria-label="Calendar"
          title="Calendar"
          aria-current={view === "calendar" ? "page" : undefined}
        >
          <CalendarDays size={19} />
          <span className="nav-text">Calendar</span>
        </button>
        <button
          className={view === "reports" ? "active" : ""}
          onClick={() => setView("reports")}
          aria-label="Report"
          title="Report"
          aria-current={view === "reports" ? "page" : undefined}
        >
          <BarChart3 size={19} />
          <span className="nav-text">Report</span>
        </button>
        <button
          className={view === "settings" ? "active" : ""}
          onClick={() => setView("settings")}
          aria-label="Directories"
          title="Directories"
          aria-current={view === "settings" ? "page" : undefined}
        >
          <FolderKanban size={19} />
          <span className="nav-text">Directories</span>
        </button>
      </nav>
      <div className="aside-bottom">
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="sidebar-navigation"
          aria-keyshortcuts="Control+b Meta+b"
          title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B / ⌘B)`}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
          <span className="nav-text">Collapse sidebar</span>
        </button>
        <div className="storage">
          <HardDrive size={18} />
          <div>
            <strong>Saved on your device</strong>
            <small>Local SQLite database</small>
          </div>
          <span className="dot" />
        </div>
        <div className="profile">
          <div className="avatar">IN</div>
          <div>
            <strong>{userName}</strong>
            <small>Personal workspace</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
