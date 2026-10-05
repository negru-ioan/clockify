import { Plus, ShieldCheck } from "lucide-react";
import type { Data } from "../types";
import type { ActivityForm as FormState } from "../hooks/useActivityForm";
import "./ActivityForm.css";
import { SelectSearch } from "./SelectSearch";

export function ActivityForm({
  data,
  state,
}: {
  data: Data;
  state: FormState;
}) {
  const { form, defaults, project: p, saving } = state;
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
        <label className="description">
          Activity description
          <input
            name="description"
            placeholder="What did you work on? E.g. OM-9235 - OCM 2222: Light endorsements"
            value={form.values.description}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />
          {fieldError("description")}
        </label>
        <div className="form-grid">
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
            Hours spent
            <input
              name="hours"
              inputMode="decimal"
              placeholder="E.g. 2.5"
              value={form.values.hours}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
            />
            {fieldError("hours")}
          </label>
          <label>
            User
            <input
              name="user"
              value={form.values.user}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
            />
            {fieldError("user")}
          </label>
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
            <button className="primary" disabled={saving} type="submit">
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
