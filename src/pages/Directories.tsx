import { useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import type { Data } from "../types";
import { api } from "../lib/api";
import "./Directories.css";
import { SelectSearch } from "../components/SelectSearch";
export function Directories({
  data,
  onSaved,
  notify,
}: {
  data: Data;
  onSaved: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [choice, setChoice] = useState({
    type: "client",
    name: "",
    client: "REVO",
    project: "",
  });
  return (
    <>
      <section className="entry-card">
        <div className="section-heading">
          <h2>Add a choice</h2>
          <span className="pill">Template directories</span>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (choice.type === "tag" && !choice.project) {
              notify("Choose a project.");
              return;
            }
            try {
              await api("choices", choice);
              await onSaved();
              setChoice({ ...choice, name: "" });
              notify("Choice added.");
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        >
          <div className="form-grid">
            <SelectSearch
              label="Type"
              value={choice.type}
              options={[
                { value: "client", label: "Client" },
                { value: "project", label: "Project" },
                { value: "tag", label: "Tag" },
              ]}
              onChange={(type) => setChoice({ ...choice, type })}
            />
            {choice.type === "project" && (
              <SelectSearch
                label="Client"
                value={choice.client}
                options={data.clients.map((client) => ({
                  value: client,
                  label: client,
                }))}
                onChange={(client) => setChoice({ ...choice, client })}
              />
            )}
            {choice.type === "tag" && (
              <SelectSearch
                required
                label="Project"
                value={choice.project}
                placeholder="Select a project"
                options={data.projects.map((project) => ({
                  value: String(project.id),
                  label: `${project.client} / ${project.name}`,
                }))}
                onChange={(project) => setChoice({ ...choice, project })}
              />
            )}

            <label>
              Name
              <input
                required
                maxLength={160}
                value={choice.name}
                onChange={(e) => setChoice({ ...choice, name: e.target.value })}
                placeholder="New choice name"
              />
            </label>
          </div>
          <div className="form-footer">
            <p>New choices will also be included in the Excel export.</p>
            <button className="primary">
              <Plus size={16} />
              Add
            </button>
          </div>
        </form>
      </section>
      {data.clients.map((c) => (
        <section className="catalog" key={c}>
          <h2>{c}</h2>
          {data.projects
            .filter((p) => p.client === c)
            .map((p) => (
              <div key={p.id}>
                <h3>
                  <FolderKanban size={16} />
                  {p.name}
                  <small>{p.tags.length} tags</small>
                </h3>
                <div className="tag-list">
                  {p.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </section>
      ))}
    </>
  );
}
