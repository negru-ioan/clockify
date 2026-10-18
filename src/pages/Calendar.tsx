import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import type { Entry } from "../types";
import { today, fmt, dateLabel } from "../lib/dates";
import "./Calendar.css";

const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const TARGET = 8;
const minutes = (time: string) => {
	const [hours, mins] = time.split(":").map(Number);
	return hours * 60 + mins;
};
const clockLabel = (minute: number) => `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:00${minute >= 1440 ? " +1d" : ""}`;

export function Calendar({ entries, onEdit }: { entries: Entry[]; onEdit: (entry: Entry) => void }) {
	const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
	const [selected, setSelected] = useState(today());
	const totals = useMemo(
		() =>
			entries.reduce<Record<string, number>>((result, entry) => {
				result[entry.date] = (result[entry.date] || 0) + entry.hours;
				return result;
			}, {}),
		[entries],
	);
	const first = (month.getDay() + 6) % 7;
	const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
	const cells = Math.ceil((first + length) / 7) * 7;
	const prefix = key(month).slice(0, 7);
	const monthlyHours = entries.filter((entry) => entry.date.startsWith(prefix)).reduce((sum, entry) => sum + entry.hours, 0);
	const selectedEntries = entries.filter((entry) => entry.date === selected).sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99") || a.id - b.id);
	const activityColors = useMemo(() => {
    // One assignment for the whole workspace, shared by all dates.
    const palette = ["#729b8b", "#bd9564", "#799bc0", "#af7d95", "#a1aa70", "#8e80ad", "#b67e6c", "#6fa5a8", "#b2a184", "#83916b", "#a8757a", "#7d89a5"];
    const taskKey = (entry: Entry) => JSON.stringify([
      entry.project,
      entry.description.trim().toLowerCase().replace(/\s+/g, " "),
      entry.tag.trim().toLowerCase(),
    ]);
    const tasks = new Map<string, Set<string>>();
    [...entries].sort((a, b) => a.id - b.id).forEach((entry) => {
      const task = taskKey(entry);
      if (!tasks.has(task)) tasks.set(task, new Set());
      tasks.get(task)!.add(entry.date);
    });
    const assigned = new Map<string, number>();
    const dayColors = new Map<string, Set<number>>();
    const usage = palette.map(() => 0);
    const rgb = (hex: string) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    const distance = (a: number, b: number) => Math.hypot(...rgb(palette[a]).map((value, index) => value - rgb(palette[b])[index]));
    tasks.forEach((days, task) => {
      const neighbors = [...days].flatMap((day) => [...(dayColors.get(day) || [])]);
      // Avoid reusing a color on the same day, then maximize visual separation.
      const candidates = palette.map((_, index) => ({
        index,
        conflicts: neighbors.filter((color) => color === index).length,
        contrast: neighbors.length ? Math.min(...neighbors.map((color) => distance(index, color))) : 0,
      })).sort((a, b) => a.conflicts - b.conflicts || b.contrast - a.contrast || usage[a.index] - usage[b.index] || a.index - b.index);
      const color = candidates[0].index;
      assigned.set(task, color);
      usage[color]++;
      days.forEach((day) => {
        if (!dayColors.has(day)) dayColors.set(day, new Set());
        dayColors.get(day)!.add(color);
      });
    });
    return new Map(entries.map((entry) => [entry.id, palette[assigned.get(taskKey(entry))!]]));
  }, [entries]);
	const selectedHours = totals[selected] || 0;
	const timedEntries = selectedEntries
		.filter((entry) => entry.startTime && entry.endTime)
		.map((entry) => {
			const start = minutes(entry.startTime!);
			let end = minutes(entry.endTime!);
			if (end < start) end += 1440;
			return { entry, start, end };
		});
	const timelineStart = timedEntries.length ? Math.floor(Math.min(...timedEntries.map((item) => item.start)) / 60) * 60 : 0;
	const timelineEnd = timedEntries.length ? Math.max(timelineStart + 60, Math.ceil(Math.max(...timedEntries.map((item) => item.end)) / 60) * 60) : 60;
	const timelineSpan = timelineEnd - timelineStart;
	const ticks = Array.from({ length: (timelineEnd - timelineStart) / 60 + 1 }, (_, index) => timelineStart + index * 60);
	function navigate(offset: number) {
		const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
		setMonth(next);
		setSelected(key(next));
	}
	return (
		<section className="calendar-page">
			<div className="calendar-heading">
				<div>
					<h1>Calendar</h1>
					<p>Your daily hours at a glance · 8-hour daily target</p>
				</div>
				<span className="calendar-total">
					{fmt(monthlyHours)} <small>hours this month</small>
				</span>
			</div>
			<div className="calendar-panel">
				<div className="calendar-toolbar">
					<h2>
						{month.toLocaleDateString("en-GB", {
							month: "long",
							year: "numeric",
						})}
					</h2>
					<div>
						<button
							className="secondary"
							onClick={() => {
								setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
								setSelected(today());
							}}>
							Today
						</button>
						<button className="icon-button" aria-label="Previous month" onClick={() => navigate(-1)}>
							<ChevronLeft size={20} />
						</button>
						<button className="icon-button" aria-label="Next month" onClick={() => navigate(1)}>
							<ChevronRight size={20} />
						</button>
					</div>
				</div>
				<div className="calendar-weekdays">
					{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
						<span key={day}>{day}</span>
					))}
				</div>
				<div className="calendar-grid">
					{Array.from({ length: cells }, (_, index) => {
						const day = index - first + 1;
						if (day < 1 || day > length) return <div className="calendar-blank" key={index} />;
						const date = new Date(month.getFullYear(), month.getMonth(), day);
						const dateKey = key(date);
						const hours = totals[dateKey] || 0;
						const weekend = date.getDay() === 0 || date.getDay() === 6;
						const warning = dateKey <= today() && !weekend && hours < TARGET;
						return (
							<button
								key={index}
								type="button"
								aria-pressed={selected === dateKey}
								aria-label={`${dateLabel(dateKey)}: ${fmt(hours)} hours${warning ? ", below 8-hour target" : ""}`}
								className={`calendar-day${warning ? " under-target" : ""}${hours >= TARGET ? " target-met" : ""}${weekend ? " weekend" : ""}${selected === dateKey ? " selected" : ""}`}
								onClick={() => setSelected(dateKey)}>
								<span className={`calendar-number${dateKey === today() ? " is-today" : ""}`}>{day}</span>
								<strong>
									{fmt(hours)} <small>h</small>
								</strong>
								<span className="calendar-status">
									{warning ? (
										<>
											<AlertTriangle size={12} />
											<span>{fmt(TARGET - hours)}h remaining</span>
										</>
									) : hours >= TARGET ? (
										"Target met"
									) : weekend ? (
										"Weekend"
									) : (
										"—"
									)}
								</span>
							</button>
						);
					})}
				</div>
				<p className="calendar-legend">
					<AlertTriangle size={14} />
					Warnings apply to weekdays up to today, including days with no entries. Weekends and future dates are not flagged.
				</p>
			</div>
			<div className="calendar-details">
				<div className="calendar-details-heading">
					<h2>{dateLabel(selected)}</h2>
					<strong>{fmt(totals[selected] || 0)} hours</strong>
				</div>
				{selectedEntries.length ? (
					<div className="calendar-day-breakdown">
						<div className="calendar-day-activities">
							{selectedEntries.map((entry) => (
								<div className="calendar-detail" key={entry.id} style={{ borderLeftColor: activityColors.get(entry.id) }}>
									<div>
										<strong>{entry.description}</strong>
										<small>
											{entry.client} · {entry.projectName} · {entry.tag}
										</small>
										<small>
											Start: {entry.startTime || "—"} · End: {entry.endTime || "—"}
											{entry.startTime && entry.endTime && entry.endTime < entry.startTime && " (+1 day)"}
										</small>
									</div>
									<span>{fmt(entry.hours)} h</span>
									<button type="button" className="secondary" aria-label={`Edit activity: ${entry.description}`} onClick={() => onEdit(entry)}>
										<Pencil size={14} />
										Edit
									</button>
								</div>
							))}
						</div>
						{selectedHours > 0 && (
							<figure className="calendar-time-tower">
								<div className="calendar-timeline">
									<div
										className={`calendar-time-stack${timedEntries.length ? " is-timeline" : ""}`}
										role="img"
										aria-label={timedEntries.length ? "Activity timeline; gaps show unlogged time" : "Activity durations"}>
										{timedEntries.length
											? timedEntries.map(({ entry, start, end }) => (
													<div
														key={entry.id}
														className="calendar-time-segment"
														style={{
															position: "absolute",
															top: `${((start - timelineStart) / timelineSpan) * 100}%`,
															height: `${((end - start) / timelineSpan) * 100}%`,
															backgroundColor: activityColors.get(entry.id),
														}}
														title={`${entry.description} · ${entry.startTime}–${entry.endTime} · ${fmt(entry.hours)} h`}
													/>
												))
											: selectedEntries
													.filter((entry) => entry.hours > 0)
													.map((entry) => (
														<div
															key={entry.id}
															className="calendar-time-segment"
															style={{ flexGrow: entry.hours, backgroundColor: activityColors.get(entry.id) }}
															title={`${entry.description} · ${fmt(entry.hours)} h`}
														/>
													))}
									</div>
									{timedEntries.length > 0 && (
										<div className="calendar-time-axis" aria-label="Hours">
											{ticks.map((tick) => (
												<span key={tick} style={{ top: `${((tick - timelineStart) / timelineSpan) * 100}%` }}>
													{clockLabel(tick)}
												</span>
											))}
										</div>
									)}
								</div>
								{timedEntries.length > 0 && <small className="calendar-gap-legend">Striped = unlogged time</small>}
								{timedEntries.length > 0 && timedEntries.length < selectedEntries.length && <small>Untimed activities listed on the left</small>}
							</figure>
						)}
					</div>
				) : (
					<p>No activities logged for this day.</p>
				)}
			</div>
		</section>
	);
}
