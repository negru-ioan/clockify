import { useState } from "react";
import { api } from "../lib/api";
export function ProfileSettings({
  name,
  onSaved,
  notify,
}: {
  name: string;
  onSaved: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  return (
    <section className="entry-card">
      <div className="section-heading">
        <h2>Your profile</h2>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          try {
            await api("profile", { userName: value });
            await onSaved();
            notify("Profile saved.");
          } catch (error) {
            notify((error as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <label>
          Full name
          <input
            required
            maxLength={160}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <div className="form-footer">
          <p>Saved once. Used for all timesheet rows and export filenames.</p>
          <button className="primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
