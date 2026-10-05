import { useEffect, useState } from "react";
import { useFormik } from "formik";
import type { ActivityValues, Data, Entry } from "../types";
import { today } from "../lib/dates";
import { api } from "../lib/api";
export function useActivityForm(data: Data, onSaved: () => Promise<void>, notify: (message: string) => void) {
	const [saving, setSaving] = useState(false);
	const defaults: ActivityValues = {
		id: 0,
		description: "",
		user: "Ioan Negru",
		client: "REVO",
		project: "",
		tag: "",
		date: today(),
		hours: "",
	};
	const form = useFormik<ActivityValues>({
		initialValues: defaults,
		validate: (v) => {
			const e: Record<string, string> = {};
			if (!v.description.trim()) e.description = "Enter an activity description.";
			if (!v.user.trim()) e.user = "Enter your first and last name.";
			if (!v.project) e.project = "Choose a project.";
			if (!v.tag) e.tag = "Choose a tag.";
			if (!v.date) e.date = "Choose a date.";
			const h = Number(v.hours.replace(",", "."));
			if (!Number.isFinite(h) || h <= 0 || h > 24) e.hours = "Enter hours greater than 0 and up to 24.";
			return e;
		},
		onSubmit: async (v) => {
			setSaving(true);
			try {
				await api("entries", {
					...v,
					hours: Number(v.hours.replace(",", ".")),
				});
				await onSaved();
				form.resetForm({ values: { ...v, id: 0, description: "", hours: "" } });
				notify(v.id ? "Activity updated." : "Activity saved.");
			} catch (e) {
				notify((e as Error).message);
			} finally {
				setSaving(false);
			}
		},
	});
	useEffect(() => {
		if (data.projects.length && form.values.client === "REVO" && !form.values.project) {
			const p = data.projects.find((p) => p.client === "REVO" && p.name === "OVERX Vendite");
			if (p) void form.setFieldValue("project", String(p.id));
		}
	}, [data.projects]);
	const p = data.projects.find((p) => p.id === Number(form.values.project));
	const edit = (entry: Entry) => {
		void form.setValues({
			...entry,
			project: String(entry.project),
			hours: String(entry.hours),
		});
	};
	return { form, defaults, project: p, saving, edit };
}
export type ActivityForm = ReturnType<typeof useActivityForm>;
