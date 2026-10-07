import { groupExportRows } from "./exportRows.js";
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
// Add optional time fields to existing databases without changing saved hours.
const entryColumns = db
	.prepare("PRAGMA table_info(entries)")
	.all()
	.map((column) => column.name);
for (const column of ["startTime", "endTime"]) {
	if (!entryColumns.includes(column)) db.exec(`ALTER TABLE entries ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`);
}
if (!db.prepare("SELECT COUNT(*) n FROM clients").get().n) {
	for (const p of JSON.parse(fs.readFileSync(path.join(root, "seed.json"), "utf8"))) {
		db.prepare("INSERT OR IGNORE INTO clients VALUES(?)").run(p.client);
		const id = db.prepare("INSERT INTO projects(name,exportName,client) VALUES(?,?,?)").run(p.name, p.exportName, p.client).lastInsertRowid;
		for (const t of p.tags) db.prepare("INSERT INTO tags VALUES(?,?)").run(id, t);
	}
}
db.exec("CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)");
db.prepare("INSERT OR IGNORE INTO settings VALUES('userName',?)").run(db.prepare("SELECT user FROM entries WHERE user IS NOT NULL AND user != '' ORDER BY id DESC LIMIT 1").get()?.user || "Ioan Negru");
const userName = () => db.prepare("SELECT value FROM settings WHERE key='userName'").get().value;
export const app = express();
app.use(express.json());
app.use((req, res, next) => {
	const origin = req.get("origin");
	if (origin && origin !== `${req.protocol}://${req.get("host")}` && !/^http:\/\/localhost(?::\d+)?$|^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin))
		return res.status(403).json({ error: "Origin not allowed" });
	next();
});
const entries = () => db.prepare("SELECT e.*,p.name projectName,p.exportName,p.client FROM entries e JOIN projects p ON p.id=e.project ORDER BY date DESC,id DESC").all().map(entry => ({...entry,user:userName()}));
app.post("/api/profile", (req,res) => {
 const name = req.body.userName;
 if(typeof name !== "string" || !name.trim() || name.length > 160) return res.status(400).json({error:"Enter your first and last name."});
 db.prepare("UPDATE settings SET value=? WHERE key='userName'").run(name.trim());
 res.json({ok:true});
});
app.get("/api/data", (_, res) =>
	res.json({
		userName: userName(),
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
				/^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
		!isNaN(Date.parse(v.date)) &&
		new Date(v.date).toISOString().slice(0, 10) === v.date &&
		Number.isFinite(Number(v.hours)) &&
		Number(v.hours) > 0 &&
		Number(v.hours) <= 24 &&
		[v.startTime, v.endTime].every((time) => time == null || time === "" || (typeof time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) &&
		db.prepare("SELECT 1 FROM tags WHERE project=? AND name=?").get(Number(v.project), v.tag)
	);
}
app.post("/api/entries", (req, res) => {
	const v = req.body;
	if (!validate(v)) return res.status(400).json({ error: "Complete all fields and choose a tag belonging to the project. Hours must be greater than 0 and up to 24." });
	if (v.id) {
		const r = db
			.prepare("UPDATE entries SET description=?,user=?,project=?,tag=?,date=?,hours=?,startTime=?,endTime=? WHERE id=?")
			.run(v.description.trim(), null, Number(v.project), v.tag, v.date, Number(v.hours), v.startTime || "", v.endTime || "", v.id);
		if (!r.changes) return res.status(404).json({ error: "Activity not found." });
	} else
		db.prepare("INSERT INTO entries(description,user,project,tag,date,hours,startTime,endTime) VALUES(?,?,?,?,?,?,?,?)").run(
			v.description.trim(),
			null,
			Number(v.project),
			v.tag,
			v.date,
			Number(v.hours),
			v.startTime || "",
			v.endTime || "",
		);
	res.json({ ok: true });
});
app.delete("/api/entries/:id", (req, res) => {
	db.prepare("DELETE FROM entries WHERE id=?").run(Number(req.params.id));
	res.json({ ok: true });
});
app.post("/api/export", async (req, res, next) => {
	try {
		const { from, to, password, protect = true } = req.body;
		if (typeof protect !== "boolean" || (protect && (typeof password !== "string" || password.length < 1)) || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
			return res.status(400).json({ error: "Select a valid date range and enter an opening password." });
		}
		const rows = groupExportRows(
			entries()
				.filter((e) => e.date >= from && e.date <= to)
				.reverse(),
		);
		if (!rows.length) return res.status(400).json({ error: "No activities in the selected period." });
		const wb = await XlsxPopulate.fromFileAsync(path.join(root, "template.xlsx"));
		const sheet = wb.sheet("Report");
		if (!sheet) return res.status(400).json({ error: 'The template must contain a "Report" sheet.' });
        // Keep the template header; discard old examples and their inherited styles.
        const lastRow = Math.max(sheet.usedRange()?.endCell().rowNumber() || 1, rows.length + 1);
        sheet.range(`A2:G${lastRow}`).clear();
        sheet.range(`A2:G${rows.length + 1}`).style({fontFamily:"Calibri",fontSize:11,bold:false,italic:false,fontColor:"000000",verticalAlignment:"center",wrapText:true});
		rows.forEach((e, i) => {
			const date = new Date(e.date + "T00:00:00Z");
			sheet.cell(i + 2, 1).value([[e.exportName, e.client, e.description, e.user, e.tag, (date.getTime() - Date.UTC(1899, 11, 30)) / 86400000, e.hours]]);
			sheet.cell(i + 2, 6).style("numberFormat", "dd/mm/yyyy");
			sheet.cell(i + 2, 7).style("numberFormat", "0.00");
		});
        // Exports contain only the report, even if an older template has mapping sheets.
        for (const name of ["Mappa Cliente-Progetto", "Mappa Progetto-Tags"]) {
            if (wb.sheet(name)) wb.deleteSheet(name);
        }
		const buffer = await wb.outputAsync(protect ? { password } : {});
		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
		res.setHeader("Content-Disposition", `attachment; filename="Timesheet v1.0 - ${userName().split(/\s+/).map(part=>part[0]).join("").replace(/[^a-zA-Z]/g,"").toUpperCase() || "IN"} - ${to.split("-").reverse().join("-")}.xlsx"`);
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
const host = process.env.HOST || "0.0.0.0";
if (process.env.NODE_ENV !== "test") app.listen(port, host, () => console.log(`Clockify listening on ${host}:${port}`));
