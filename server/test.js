import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import XlsxPopulate from "xlsx-populate";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clockify-test-"));
process.env.DB_PATH = path.join(dir, "test.sqlite");
process.env.NODE_ENV = "test";
const { app } = await import("./index.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}/api/`;

const request = (url, body, method = "POST") => fetch(base + url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

test("entry CRUD, associations, period filtering and encrypted template export", async () => {
	try {
		const data = await (await fetch(base + "data")).json();
		const p = data.projects.find((p) => p.name === "OVERX Vendite");
		assert.equal(p.client, "REVO");
		assert.ok(p.tags.includes("Basket"));
		const entry = { description: "OM-9235 - OCM 2222: Appendici Light", user: "Ioan Negru", project: p.id, tag: "Basket", date: "2026-10-05", hours: 2.5 };
		assert.equal((await request("entries", { ...entry, tag: "invalid" })).status, 400);
		assert.equal((await request("entries", { ...entry, hours: 25 })).status, 400);
		assert.equal((await request("entries", { ...entry, date: "2026-02-30" })).status, 400);
		assert.equal((await request("entries", entry)).status, 200);
		let entries = (await (await fetch(base + "data")).json()).entries;
		assert.equal(entries[0].hours, 2.5);
		const id = entries[0].id;
		assert.equal((await request("entries", { ...entry, id, hours: 3.25 })).status, 200);
		assert.equal((await request("choices", { type: "tag", name: "New task", project: p.id })).status, 200);
		const range = { from: "2026-10-01", to: "2026-10-09", password: "test-password" };
		assert.equal((await request("export", { ...range, password: "" })).status, 400);
		assert.equal((await request("export", { ...range, from: "2026-11-01", to: "2026-11-09" })).status, 400);
		const r = await request("export", range);
		assert.equal(r.status, 200);
		const buf = Buffer.from(await r.arrayBuffer());
		await assert.rejects(XlsxPopulate.fromDataAsync(buf, { password: "wrong" }));
		const wb = await XlsxPopulate.fromDataAsync(buf, { password: range.password });
		const sheet = wb.sheet("Report");
		assert.equal(sheet.cell("A2").value(), "OVERX_Vendite");
		assert.equal(sheet.cell("D2").value(), "Ioan Negru");
		assert.equal(sheet.cell("G2").value(), 3.25);
		assert.equal(typeof sheet.cell("F2").value(), "number");
		assert.equal(sheet.cell("A4").value(), undefined);
		assert.equal(wb.sheets().length, 3);
		assert.equal((await request("entries/" + id, undefined, "DELETE")).status, 200);
		assert.equal((await (await fetch(base + "data")).json()).entries.length, 0);
	} finally {
		server.close();
		fs.rmSync(dir, { recursive: true, force: true });
	}
});
