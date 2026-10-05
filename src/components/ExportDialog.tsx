import { useState } from "react";
import { Download, X } from "lucide-react";
import { api } from "../lib/api";
import { today } from "../lib/dates";
import "./Dialogs.css";
export function ExportDialog({ onClose, notify }: { onClose: () => void; notify: (message: string) => void }) {
	const [range, setRange] = useState({
		from: today().slice(0, 8) + "01",
		to: today(),
		password: "",
	});
	const [exporting, setExporting] = useState(false);
	const exportFile = async () => {
		setExporting(true);
		try {
			const r = await api("export", range);
			const blob = await r.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `Timesheet v1.0 - IN - ${range.to.split("-").reverse().join("-")}.xlsx`;
			a.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			onClose();
			setRange({ ...range, password: "" });
			notify("Password-protected Excel exported.");
		} catch (e) {
			notify((e as Error).message);
		} finally {
			setExporting(false);
		}
	};
	return (
		<div className="overlay">
			<section className="dialog" role="dialog" aria-modal="true" aria-label="Export timesheet">
				<button className="close" onClick={() => onClose()} aria-label="Close">
					<X size={20} />
				</button>
				<div className="dialog-icon">
					<Download size={24} />
				</div>
				<h2>Your timesheet, ready to send.</h2>
				<p>Export activities into the Excel template with an opening password.</p>
				<label>
					From
					<input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
				</label>
				<label>
					To
					<input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
				</label>
				<label>
					Opening password
					<input type="password" autoComplete="new-password" value={range.password} onChange={(e) => setRange({ ...range, password: e.target.value })} placeholder="Password agreed with Gianmario" />
				</label>
				<small>The password is used only for this export and is not saved.</small>
				<button className="primary" onClick={exportFile} disabled={exporting}>
					<Download size={17} />
					{exporting ? "Creating Excel…" : "Export protected Excel"}
				</button>
			</section>
		</div>
	);
}
