import {
  Clock3,
  CalendarDays,
  BarChart3,
  FolderKanban,
  HardDrive,
} from "lucide-react";
import type { View } from "../types";
import "./Sidebar.css";
export function Sidebar({
  view,
  onNavigate: setView,
  userName,
}: {
  view: View;
  onNavigate: (view: View) => void;
  userName: string;
}) {
  return (
    <aside>
      <div className="brand">
        <a href="/">
          <img src="/logo.svg" alt="Clockify Logo" />
        </a>
      </div>
      <nav>
        <button
          className={view === "tracker" ? "active" : ""}
          onClick={() => setView("tracker")}
        >
          <Clock3 size={19} />
          Time tracker
        </button>
        <button
          className={view === "reports" ? "active" : ""}
          onClick={() => setView("reports")}
        >
          <BarChart3 size={19} />
          Report
        </button>
        <button
          className={view === "calendar" ? "active" : ""}
          onClick={() => setView("calendar")}
        >
          <CalendarDays size={19} />
          Calendar
        </button>
        <button
          className={view === "settings" ? "active" : ""}
          onClick={() => setView("settings")}
        >
          <FolderKanban size={19} />
          Directories
        </button>
      </nav>
      <div className="aside-bottom">
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
