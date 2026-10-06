import { useState } from "react";
import { Download, X } from "lucide-react";
import { api } from "../lib/api";
import { today } from "../lib/dates";
import "./Dialogs.css";
export function ExportDialog({
  onClose,
  notify,
}: {
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const [range, setRange] = useState({
    from: today().slice(0, 8) + "01",
    to: today(),
    password: "",
  });
  const [protect, setProtect] = useState(true);
  const [exporting, setExporting] = useState(false);
  const exportFile = async () => {
    setExporting(true);
    try {
      const r = await api("export", {
        ...range,
        protect,
        password: protect ? range.password : undefined,
      });
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        /filename="([^"]+)"/.exec(
          r.headers.get("Content-Disposition") || "",
        )?.[1] || "Timesheet.xlsx";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onClose();
      setRange({ ...range, password: "" });
      notify(
        protect
          ? "Password-protected Excel exported."
          : "Excel exported without a password.",
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="overlay">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Export timesheet"
      >
        <button className="close" onClick={() => onClose()} aria-label="Close">
          <X size={20} />
        </button>
        <div className="dialog-icon">
          <Download size={24} />
        </div>
        <h2>Your timesheet, ready to send.</h2>
        <p>
          Export activities into the Excel template. Matching activities on the
          same date are combined.
        </p>
        <label>
          From
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
          />
        </label>
        <label className="export-protection">
          <input
            type="checkbox"
            checked={protect}
            onChange={(event) => setProtect(event.target.checked)}
          />
          Protect with an opening password
        </label>
        {protect && (
          <label>
            Opening password
            <input
              type="password"
              autoComplete="new-password"
              value={range.password}
              onChange={(e) => setRange({ ...range, password: e.target.value })}
              placeholder="Password agreed with Gianmario"
            />
          </label>
        )}
        {protect && (
          <small>
            The password is used only for this export and is not saved.
          </small>
        )}
        <button className="primary" onClick={exportFile} disabled={exporting}>
          <Download size={17} />
          {exporting
            ? "Creating Excel…"
            : protect
              ? "Export protected Excel"
              : "Export Excel"}
        </button>
      </section>
    </div>
  );
}
