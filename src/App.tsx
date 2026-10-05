import { useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Download,
  ShieldCheck,
  X,
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { ExportDialog } from "./components/ExportDialog";
import { DeleteDialog } from "./components/DeleteDialog";
import { TimeTracker } from "./pages/TimeTracker";
import { Calendar } from "./pages/Calendar";
import { Report } from "./pages/Report";
import { Directories } from "./pages/Directories";
import { useWorkspace } from "./hooks/useWorkspace";
import { useActivityForm } from "./hooks/useActivityForm";
import { api } from "./lib/api";
import type { Entry, View } from "./types";
import "./App.css";

const pages = {
  calendar: {
    label: "Calendar",
    title: "Calendar",
    description: "Review daily hours and your 8-hour target.",
  },
  tracker: {
    label: "Time tracker",
    title: "Time tracker",
    description: "Log your activities. Let your timesheet handle the rest.",
  },
  reports: {
    label: "Report",
    title: "Activity report",
    description: "Review your logged activities and total hours.",
  },
  settings: {
    label: "Directories",
    title: "Directories",
    description: "Manage the clients, projects and tags in your timesheet.",
  },
};

export default function App() {
  const { data, reload, message, notify } = useWorkspace();
  const [view, setView] = useState<View>("tracker");
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const form = useActivityForm(data, reload, notify);
  const page = pages[view];

  function edit(entry: Entry) {
    form.edit(entry);
    setView("tracker");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove() {
    try {
      await api(`entries/${deleteId}`, undefined, "DELETE");
      await reload();
      setDeleteId(null);
      notify("Activity deleted.");
    } catch (error) {
      notify((error as Error).message);
    }
  }

  return (
    <div className="app">
      <Sidebar view={view} onNavigate={setView} />
      <main>
        <header>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <span>{page.label}</span>
          </div>
          <button
            className="secondary"
            onClick={() => setExportOpen(true)}
            aria-label="Export Excel"
          >
            <Download size={17} />
            Export Excel
            <ArrowUpRight size={15} />
          </button>
        </header>
        <div className="content">
          {/* <div className="page-title">
            <div>
              <div className="eyebrow">YOUR TIME, ORGANIZED</div>
              <h1>{page.title}</h1>
              <p>{page.description}</p>
            </div>
            <button
              className="secondary"
              onClick={() => setExportOpen(true)}
              aria-label="Export Excel"
            >
              <Download size={17} />
              Export Excel
              <ArrowUpRight size={15} />
            </button>
          </div> */}
          {message && (
            <div className="toast" role="status">
              {message}
              <button onClick={() => notify("")} aria-label="Dismiss message">
                <X size={16} />
              </button>
            </div>
          )}
          {view === "tracker" && (
            <TimeTracker
              data={data}
              form={form}
              onEdit={edit}
              onDelete={setDeleteId}
            />
          )}
          {view === "reports" && (
            <Report
              entries={data.entries}
              onEdit={edit}
              onDelete={setDeleteId}
            />
          )}
          {view === "calendar" && <Calendar entries={data.entries} />}
          {view === "settings" && (
            <Directories data={data} onSaved={reload} notify={notify} />
          )}
          {view !== "settings" && (
            <div className="bottom-note">
              <ShieldCheck size={14} />
              Your data stays on this device.
              <span>Weekly submission · Friday by 5:00 PM</span>
            </div>
          )}
        </div>
      </main>
      {exportOpen && (
        <ExportDialog onClose={() => setExportOpen(false)} notify={notify} />
      )}
      {deleteId !== null && (
        <DeleteDialog onClose={() => setDeleteId(null)} onConfirm={remove} />
      )}
    </div>
  );
}
