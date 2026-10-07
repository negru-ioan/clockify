import { useEffect } from "react";
import { parseDuration, normalizeTime } from "../lib/duration";
import { Plus, ShieldCheck } from "lucide-react";
import type { Data } from "../types";
import type { ActivityForm as FormState } from "../hooks/useActivityForm";
import "./ActivityForm.css";
import { DescriptionSearch } from "./DescriptionSearch";
import { SelectSearch } from "./SelectSearch";

export function ActivityForm({
  data,
  state,
}: {
  data: Data;
  state: FormState;
}) {
  const { form, defaults, project: p, saving, changeTime, changeHours } = state;

  useEffect(() => {
		function submitShortcut(event: KeyboardEvent) {
			if (event.key !== "Enter" || !event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
				return;
			}

			// This component is mounted only on Time tracker. Leave dialogs to their own controls.
			if (document.querySelector('[role="dialog"]')) return;
			event.preventDefault();
			event.stopPropagation();
			if (!event.repeat && !saving && !form.isSubmitting) void form.submitForm();
		}
		window.addEventListener("keydown", submitShortcut, true);
		return () => window.removeEventListener("keydown", submitShortcut, true);
	}, [form.submitForm, form.isSubmitting, saving]);

  const fieldError = (name: keyof typeof defaults) =>
    form.touched[name] && form.errors[name] ? (
      <small className="error">{form.errors[name]}</small>
    ) : null;

  return (
    <section className="entry-card">
      <div className="section-heading">
        <div>
          <span className="mini-icon">
            <Plus size={18} />
          </span>
          <h2>{form.values.id ? "Edit activity" : "New activity"}</h2>
        </div>
        <span className="pill">Manual entry</span>
      </div>
      <form onSubmit={form.handleSubmit}>
        <DescriptionSearch
          value={form.values.description}
          entries={data.entries}
          excludeId={form.values.id}
          onChange={(description) => {
            void form.setFieldValue("description", description);
          }}
          onSelect={state.reuseTask}
          onBlur={() => {
            void form.setFieldTouched("description", true);
          }}
          error={form.touched.description ? form.errors.description : undefined}
        />
        <div className="form-grid">
          <label>
            Date
            <input
              type="date"
              name="date"
              value={form.values.date}
              onChange={form.handleChange}
            />
            {fieldError("date")}
          </label>
          <label>
            Start time (optional)
            <input
              type="text"
              inputMode="text"
              placeholder="19 or 19:30"
              name="startTime"
              value={form.values.startTime}
              onChange={(event) => changeTime("startTime", event.target.value)}
              onBlur={(event) => {
                const time = normalizeTime(form.values.startTime);
                if (time) changeTime("startTime", time);
                form.handleBlur(event);
              }}
            />
            {fieldError("startTime")}
          </label>
          <label>
            End time (optional)
            <input
              type="text"
              inputMode="text"
              placeholder="19 or 19:30"
              name="endTime"
              value={form.values.endTime}
              onChange={(event) => changeTime("endTime", event.target.value)}
              onBlur={(event) => {
                const time = normalizeTime(form.values.endTime);
                if (time) changeTime("endTime", time);
                form.handleBlur(event);
              }}
            />
            {fieldError("endTime")}
            <small className="duration-help">
              An earlier end time means the next day.
            </small>
          </label>
          <label>
            Hours spent
            <input
              name="hours"
              inputMode="text"
              placeholder="E.g. 2:30 or 2,5"
              value={form.values.hours}
              onChange={(event) => changeHours(event.target.value)}
              onBlur={form.handleBlur}
            />
            {fieldError("hours")}
            <small className="duration-help">
              {Number.isFinite(parseDuration(form.values.hours))
                ? `${parseDuration(form.values.hours).toLocaleString("it-IT", { maximumFractionDigits: 4 })} decimal hours`
                : "2:30 = 2,5 hours"}
            </small>
          </label>
        </div>

        <div className="form-grid form-grid-three">
          <SelectSearch
            label="Client"
            name="client"
            value={form.values.client}
            options={data.clients.map((c) => ({ value: c, label: c }))}
            onChange={(client) => {
              void form.setValues({
                ...form.values,
                client,
                project: "",
                tag: "",
              });
            }}
          />

          <SelectSearch
            label="Project"
            name="project"
            value={form.values.project}
            placeholder="Select a project"
            options={data.projects
              .filter((project) => project.client === form.values.client)
              .map((project) => ({
                value: String(project.id),
                label: project.name,
              }))}
            onChange={(project) => {
              void form.setValues({ ...form.values, project, tag: "" });
            }}
            onBlur={() => {
              void form.setFieldTouched("project", true);
            }}
            error={form.touched.project ? form.errors.project : undefined}
          />

          <SelectSearch
            label="Tag"
            name="tag"
            value={form.values.tag}
            placeholder="Select a tag"
            options={(p?.tags || []).map((tag) => ({ value: tag, label: tag }))}
            onChange={(tag) => {
              void form.setFieldValue("tag", tag);
            }}
            onBlur={() => {
              void form.setFieldTouched("tag", true);
            }}
            error={form.touched.tag ? form.errors.tag : undefined}
          />
        </div>
        <div className="form-footer">
          <p>
            <ShieldCheck size={15} />
            Use technical or professional descriptions only.
          </p>
          <div>
            {!!form.values.id && (
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  form.resetForm({
                    values: {
                      ...defaults,
                      project: String(
                        data.projects.find((p) => p.name === "OVERX Vendite")
                          ?.id || "",
                      ),
                    },
                  })
                }
              >
                Cancel
              </button>
            )}
            <button
              className="primary"
              disabled={saving || form.isSubmitting}
              type="submit"
              title="Submit activity (Shift+Enter)"
              aria-keyshortcuts="Shift+Enter"
            >
              <Plus size={17} />
              {saving
                ? "Saving…"
                : form.values.id
                  ? "Save changes"
                  : "Add activity"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
