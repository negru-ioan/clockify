import { useEffect, useState } from "react";
import { useFormik } from "formik";
import type { ActivityValues, Data, Entry } from "../types";
import { today } from "../lib/dates";
import { api } from "../lib/api";
import {
  parseDuration,
  elapsedMinutes,
  durationText,
  normalizeTime,
} from "../lib/duration";
import { applyTaskSuggestion } from "../lib/taskSuggestions";
export function useActivityForm(
  data: Data,
  onSaved: () => Promise<void>,
  notify: (message: string) => void,
) {
  const [saving, setSaving] = useState(false);
  const defaults: ActivityValues = {
    id: 0,
    description: "",
    user: data.userName || "Ioan Negru",
    client: "REVO",
    project: "",
    tag: "",
    date: today(),
    hours: "",
    startTime: "",
    endTime: "",
  };
  const form = useFormik<ActivityValues>({
    initialValues: defaults,
    validate: (v) => {
      const e: Record<string, string> = {};
      if (!v.description.trim())
        e.description = "Enter an activity description.";

      if (!v.project) e.project = "Choose a project.";
      if (!v.tag) e.tag = "Choose a tag.";
      if (!v.date) e.date = "Choose a date.";
      for (const field of ["startTime", "endTime"] as const) {
        if (v[field] && !normalizeTime(v[field]))
          e[field] = "Enter an hour (19) or HH:MM (19:30).";
      }
      const h = parseDuration(v.hours);
      if (!Number.isFinite(h) || h <= 0 || h > 24)
        e.hours =
          "Enter decimal hours or H:MM (minutes 00–59), greater than 0 and up to 24.";
      if (
        v.startTime &&
        v.endTime &&
        elapsedMinutes(v.startTime, v.endTime) === 0
      )
        e.endTime = "Start and end times must differ.";
      return e;
    },
    onSubmit: async (v) => {
      setSaving(true);
      try {
        await api("entries", {
          ...v,
          hours: parseDuration(v.hours),
          startTime: normalizeTime(v.startTime) || "",
          endTime: normalizeTime(v.endTime) || "",
        });
        await onSaved();
        form.resetForm({
          values: {
            ...v,
            id: 0,
            description: "",
            tag: "",
            hours: "",
            startTime: "",
            endTime: "",
          },
        });

        notify(v.id ? "Activity updated." : "Activity saved.");
      } catch (e) {
        notify((e as Error).message);
      } finally {
        setSaving(false);
      }
    },
  });
  useEffect(() => {
    if (
      data.projects.length &&
      form.values.client === "REVO" &&
      !form.values.project
    ) {
      const p = data.projects.find(
        (p) => p.client === "REVO" && p.name === "OVERX Vendite",
      );
      if (p) void form.setFieldValue("project", String(p.id));
    }
  }, [data.projects]);
  const p = data.projects.find((p) => p.id === Number(form.values.project));
  const edit = (entry: Entry) => {
    void form.setValues({
      ...entry,
      startTime: entry.startTime || "",
      endTime: entry.endTime || "",
      project: String(entry.project),
      hours: String(entry.hours),
    });
  };
  const changeHours = (hours: string) => {
    void form.setFieldValue("hours", hours);
  };
  const changeTime = (field: "startTime" | "endTime", value: string) => {
    const values = { ...form.values, [field]: value };
    const minutes = elapsedMinutes(values.startTime, values.endTime);
    if (minutes !== null) values.hours = durationText(minutes);
    void form.setValues(values);
  };
  const reuseTask = (entry: Entry) => {
    void form.setValues(applyTaskSuggestion(form.values, entry));
  };
  return {
    form,
    defaults,
    project: p,
    saving,
    edit,
    changeHours,
    changeTime,
    reuseTask,
  };
}
export type ActivityForm = ReturnType<typeof useActivityForm>;
