import { useState } from "react";
import {
  Search,
  Clock3,
  ChevronRight,
  Tags,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Entry } from "../types";
import { today, fmt, dateLabel } from "../lib/dates";
import "./ActivityList.css";
type Props = {
  entries: Entry[];
  report?: boolean;
  onEdit: (entry: Entry) => void;
  onDelete: (id: number) => void;
};
export function ActivityList({
  entries,
  report = false,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const filtered = entries
    .filter((e) =>
      `${e.description} ${e.tag} ${e.projectName} ${e.client}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (a.startTime || "99:99").localeCompare(b.startTime || "99:99") ||
        a.id - b.id,
    );
  const days = [...new Set(filtered.map((e) => e.date))];
  return (
    <section className="activity">
      <div className="activity-heading">
        <div>
          <h2>{report ? "All activities" : "Your activities"}</h2>
          <span>{filtered.length} activities</span>
        </div>
        <div className="search">
          <Search size={16} />
          <input
            aria-label="Search activities"
            placeholder="Search activities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {!days.length ? (
        <div className="empty">
          <div className="empty-icon">
            <Clock3 size={28} />
          </div>
          <h3>Every day starts with an activity.</h3>
          <p>Add an activity in Time tracker to start your timesheet.</p>
          <span>
            REVO <ChevronRight size={12} /> OVERX Vendite
          </span>
        </div>
      ) : (
        days.map((day) => (
          <div className="day" key={day}>
            <div className="day-title">
              <span>
                {dateLabel(day)}
                {day === today() && <b>TODAY</b>}
              </span>
              <span>
                {fmt(
                  filtered
                    .filter((e) => e.date === day)
                    .reduce((s, e) => s + e.hours, 0),
                )}{" "}
                hours
              </span>
            </div>
            {filtered
              .filter((e) => e.date === day)
              .map((e) => (
                <div className="entry-row" key={e.id}>
                  <div className="row-mark" />
                  <div className="row-text">
                    <strong>{e.description}</strong>
                    <div>
                      <span className="project-dot" />
                      {e.projectName}
                      <span className="muted"> · {e.client}</span>
                      <span className="tag">
                        <Tags size={12} />
                        {e.tag}
                      </span>
                    </div>
                  </div>
                  <div
                    className="entry-time-range"
                    aria-label="Activity start and end times"
                  >
                    <Clock3 size={12} />
                    <span title="Start time">{e.startTime || "—"}</span>
                    <span aria-hidden="true">–</span>
                    <span title="End time">{e.endTime || "—"}</span>
                    {e.startTime && e.endTime && e.endTime < e.startTime && (
                      <span className="muted">(+1 day)</span>
                    )}
                  </div>
                  <strong className="hours">
                    {fmt(e.hours)}
                    <small> h</small>
                  </strong>
                  <button
                    className="icon-button"
                    aria-label="Edit activity"
                    onClick={() => onEdit(e)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Delete activity"
                    onClick={() => onDelete(e.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        ))
      )}
    </section>
  );
}
