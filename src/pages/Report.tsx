import type { Entry } from "../types";
import { ActivityList } from "../components/ActivityList";
import { StatsCards } from "../components/StatsCards";
import "./Report.css";

type Props = {
	entries: Entry[];
	onEdit: (entry: Entry) => void;
	onDelete: (id: number) => void;
};
export function Report({ entries, onEdit, onDelete }: Props) {
	return (
		<div className="report-page">
			<StatsCards entries={entries} />
			<ActivityList report entries={entries} onEdit={onEdit} onDelete={onDelete} />
		</div>
	);
}
