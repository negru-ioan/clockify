import express from "express";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XlsxPopulate from "xlsx-populate";
const root = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(root, "../data"), { recursive: true });
const db = new DatabaseSync(process.env.DB_PATH || path.join(root, "../data/clockify.sqlite"));
db.exec(
	`PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS clients(name TEXT PRIMARY KEY); CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY,name TEXT NOT NULL,exportName TEXT NOT NULL,client TEXT REFERENCES clients(name),UNIQUE(name,client)); CREATE TABLE IF NOT EXISTS tags(project INTEGER REFERENCES projects(id),name TEXT,PRIMARY KEY(project,name)); CREATE TABLE IF NOT EXISTS entries(id INTEGER PRIMARY KEY,description TEXT,user TEXT,project INTEGER REFERENCES projects(id),tag TEXT,date TEXT,hours REAL);`,
);
if (!db.prepare("SELECT COUNT(*) n FROM clients").get().n) {
	for (const p of JSON.parse(fs.readFileSync(path.join(root, "seed.json"), "utf8"))) {
		db.prepare("INSERT OR IGNORE INTO clients VALUES(?)").run(p.client);
		const id = db.prepare("INSERT INTO projects(name,exportName,client) VALUES(?,?,?)").run(p.name, p.exportName, p.client).lastInsertRowid;
		for (const t of p.tags) db.prepare("INSERT INTO tags VALUES(?,?)").run(id, t);
	}
}
export const app = express();
app.use(express.json());
app.use((req, res, next) => {
	const origin = req.get("origin");
	if (origin && !/^http:\/\/localhost(?::\d+)?$|^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin)) return res.status(403).json({ error: "Origin not allowed" });
	next();
});
const entries = () => db.prepare("SELECT e.*,p.name projectName,p.exportName,p.client FROM entries e JOIN projects p ON p.id=e.project ORDER BY date DESC,id DESC").all();
app.get("/api/data", (_, res) =>
	res.json({
		clients: db
			.prepare("SELECT name FROM clients ORDER BY name")
			.all()
			.map((c) => c.name),
		projects: db
			.prepare("SELECT * FROM projects")
			.all()
			.map((p) => ({
				...p,
				tags: db
					.prepare("SELECT name FROM tags WHERE project=? ORDER BY name")
					.all(p.id)
					.map((t) => t.name),
			})),
		entries: entries(),
	}),
);
app.post("/api/choices", (req, res) => {
	const { type, name, client, project } = req.body;
	if (typeof name !== "string" || !name.trim() || name.length > 160) return res.status(400).json({ error: "Enter a valid name." });
	try {
		if (type === "client") db.prepare("INSERT INTO clients VALUES(?)").run(name.trim());
		else if (type === "project") db.prepare("INSERT INTO projects(name,exportName,client) VALUES(?,?,?)").run(name.trim(), name.trim(), client);
		else if (type === "tag") db.prepare("INSERT INTO tags VALUES(?,?)").run(project, name.trim());
		else throw Error();
		res.json({ ok: true });
	} catch {
		res.status(400).json({ error: "This choice already exists or its association is invalid." });
	}
});
function validate(v) {
	return (
		typeof v.description === "string" &&
		v.description.trim().length > 0 &&
		v.description.length <= 2000 &&
		typeof v.user === "string" &&
		v.user.trim() &&
		/^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
		!isNaN(Date.parse(v.date)) &&
		new Date(v.date).toISOString().slice(0, 10) === v.date &&
		Number.isFinite(Number(v.hours)) &&
		Number(v.hours) > 0 &&
		Number(v.hours) <= 24 &&
		db.prepare("SELECT 1 FROM tags WHERE project=? AND name=?").get(Number(v.project), v.tag)
	);
}
app.post("/api/entries", (req, res) => {
	const v = req.body;
	if (!validate(v)) return res.status(400).json({ error: "Complete all fields and choose a tag belonging to the project. Hours must be greater than 0 and up to 24." });
	if (v.id) {
		const r = db
			.prepare("UPDATE entries SET description=?,user=?,project=?,tag=?,date=?,hours=? WHERE id=?")
			.run(v.description.trim(), v.user.trim(), Number(v.project), v.tag, v.date, Number(v.hours), v.id);
		if (!r.changes) return res.status(404).json({ error: "Activity not found." });
	} else db.prepare("INSERT INTO entries(description,user,project,tag,date,hours) VALUES(?,?,?,?,?,?)").run(v.description.trim(), v.user.trim(), Number(v.project), v.tag, v.date, Number(v.hours));
	res.json({ ok: true });
});
app.delete("/api/entries/:id", (req, res) => {
	db.prepare("DELETE FROM entries WHERE id=?").run(Number(req.params.id));
	res.json({ ok: true });
});
app.post("/api/export", async (req, res, next) => {
	try {
		const { from, to, password } = req.body;
		if (!password || password.length < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to)
			return res.status(400).json({ error: "Select a valid date range and enter an opening password." });
		const rows = entries()
			.filter((e) => e.date >= from && e.date <= to)
			.reverse();
		if (!rows.length) return res.status(400).json({ error: "No activities in the selected period." });
		const wb = await XlsxPopulate.fromFileAsync(path.join(root, "template.xlsx"));
		const sheet = wb.sheet("Report");
		sheet.range("A2:G4").clear();
		rows.forEach((e, i) => {
			const date = new Date(e.date + "T00:00:00Z");
			sheet.cell(i + 2, 1).value([[e.exportName, e.client, e.description, e.user, e.tag, (date.getTime() - Date.UTC(1899, 11, 30)) / 86400000, e.hours]]);
			sheet.cell(i + 2, 6).style("numberFormat", "dd/mm/yyyy");
			sheet.cell(i + 2, 7).style("numberFormat", "0.00");
		});
		const clients = db.prepare("SELECT name FROM clients ORDER BY name").all();
		const map = wb.sheet("Mappa Cliente-Progetto");
		map.usedRange().clear();
		map.cell("A1").value("Clienti");
		map.cell("A2").value("Progetti");
		clients.forEach((c, i) => {
			map.cell(1, i + 2).value(c.name);
			db.prepare("SELECT exportName FROM projects WHERE client=?")
				.all(c.name)
				.forEach((p, j) => map.cell(j + 2, i + 2).value(p.exportName));
		});
		const tags = wb.sheet("Mappa Progetto-Tags");
		tags.usedRange().clear();
		db.prepare("SELECT * FROM projects")
			.all()
			.forEach((p, i) => {
				tags.cell(1, i + 1).value(p.name);
				db.prepare("SELECT name FROM tags WHERE project=? ORDER BY name")
					.all(p.id)
					.forEach((t, j) => tags.cell(j + 2, i + 1).value(t.name));
			});
		const buffer = await wb.outputAsync({ password });
		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
		res.setHeader("Content-Disposition", `attachment; filename="Timesheet v1.0 - IN - ${to.split("-").reverse().join("-")}.xlsx"`);
		res.send(buffer);
	} catch (e) {
		next(e);
	}
});
app.use(express.static(path.join(root, "../dist")));
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ error: "The operation failed. Please try again." });
});
const port = Number(process.env.PORT || 9999);
if (process.env.NODE_ENV !== "test") app.listen(port, "127.0.0.1", () => console.log(`Clockify: http://127.0.0.1:${port}`));
