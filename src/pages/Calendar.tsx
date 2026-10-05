import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import type { Entry } from "../types";
import { today, fmt, dateLabel } from "../lib/dates";
import "./Calendar.css";

const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const TARGET = 8;

export function Calendar({ entries }: { entries: Entry[] }) {
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
	const selectedEntries = entries.filter((entry) => entry.date === selected);
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
					selectedEntries.map((entry) => (
						<div className="calendar-detail" key={entry.id}>
							<div>
								<strong>{entry.description}</strong>
								<small>
									{entry.client} · {entry.projectName} · {entry.tag}
								</small>
							</div>
							<span>{fmt(entry.hours)} h</span>
						</div>
					))
				) : (
					<p>No activities logged for this day.</p>
				)}
			</div>
		</section>
	);
}
