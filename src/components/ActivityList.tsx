import { useRef, useState } from "react";
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
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLElement>(null);
  const pageSize = 20;
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
  const taskKey = (entry: Entry) =>
    JSON.stringify([
      entry.project,
      entry.client,
      entry.description.trim().toLowerCase(),
      entry.tag,
      entry.user.trim().toLowerCase(),
    ]);
  const colors = [
    "#79c9ab",
    "#e8b56c",
    "#78b9ed",
    "#ed94b2",
    "#b5cd78",
    "#e6a17b",
    "#81cccd",
  ];
  const dayCounts = new Map<string, Map<string, number>>();
  // Count each day separately, using all entries so search does not alter colors.
  [...entries]
    .sort((a, b) => a.id - b.id)
    .forEach((entry) => {
      const counts = dayCounts.get(entry.date) || new Map<string, number>();
      const key = taskKey(entry);
      counts.set(key, (counts.get(key) || 0) + 1);
      dayCounts.set(entry.date, counts);
    });
  const dayColors = new Map<string, Map<string, string>>();
  dayCounts.forEach((counts, day) => {
    const groups = new Map<string, string>();
    counts.forEach((count, key) => {
      if (count > 1) groups.set(key, colors[groups.size % colors.length]);
    });
    dayColors.set(day, groups);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const days = [...new Set(visible.map((e) => e.date))];
  function changePage(next: number) {
    setPage(next);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <section className="activity" ref={listRef}>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      {!days.length ? (
        <div className="empty">
          <div className="empty-icon">
            <Clock3 size={28} />
          </div>
          <h3>
            {search
              ? "No matching activities"
              : "Every day starts with an activity."}
          </h3>
          <p>
            {search
              ? "Try a different search. All saved activities are searched."
              : "Add an activity in Time tracker to start your timesheet."}
          </p>
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
                hours {search ? "matching this day" : "total this day"}
              </span>
            </div>
            {visible
              .filter((e) => e.date === day)
              .map((e) => (
                <div className="entry-row" key={e.id}>
                  <div
                    className="row-mark"
                    style={{
                      backgroundColor:
                        dayColors.get(day)?.get(taskKey(e)) || "#aa98ef",
                    }}
                    title="Matching tasks on this day share a color"
                  />
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
      {filtered.length > 0 && (
        <div className="activity-pagination">
          <span aria-live="polite">
            Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of{" "}
            {filtered.length} activities
          </span>
          {pageCount > 1 && (
            <nav aria-label="Activity pagination">
              <button
                type="button"
                className="secondary"
                disabled={currentPage === 1}
                onClick={() => changePage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                className="secondary"
                disabled={currentPage === pageCount}
                onClick={() => changePage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
