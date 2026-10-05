import { Clock3, CalendarDays, FolderKanban } from "lucide-react";
import type { Entry } from "../types";
import { today, fmt } from "../lib/dates";
import "./StatsCards.css";
export function StatsCards({ entries }: { entries: Entry[] }) {
	const data = { entries };
	const total = data.entries.reduce((s, e) => s + e.hours, 0);
	const now = new Date(today() + "T12:00:00");
	const monday = new Date(now);
	monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
	const week = data.entries.filter((e) => new Date(e.date + "T12:00:00") >= monday && e.date <= today()).reduce((s, e) => s + e.hours, 0);
	return (
		<div className="stats">
			<div>
				<span>
					Today’s hours
					<Clock3 size={17} />
				</span>
				<strong>
					{fmt(data.entries.filter((e) => e.date === today()).reduce((s, e) => s + e.hours, 0))}
					<small>hours</small>
				</strong>
				<p>
					Activities on{" "}
					{new Date().toLocaleDateString("en-GB", {
						day: "numeric",
						month: "long",
					})}
				</p>
			</div>
			<div>
				<span>
					This week
					<CalendarDays size={17} />
				</span>
				<strong>
					{fmt(week)}
					<small>hours</small>
				</strong>
				<p>Monday through today</p>
			</div>
			<div>
				<span>
					Activities logged
					<FolderKanban size={17} />
				</span>
				<strong>
					{data.entries.length}
					<small>activities</small>
				</strong>
				<p>{fmt(total)} total hours in this workspace</p>
			</div>
		</div>
	);
}
