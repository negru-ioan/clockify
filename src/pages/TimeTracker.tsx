import type { Data, Entry } from "../types";
import type { ActivityForm as FormState } from "../hooks/useActivityForm";
import { ActivityForm } from "../components/ActivityForm";
import { ActivityList } from "../components/ActivityList";
import { StatsCards } from "../components/StatsCards";
import "./TimeTracker.css";

type Props = {
	data: Data;
	form: FormState;
	onEdit: (entry: Entry) => void;
	onDelete: (id: number) => void;
};
export function TimeTracker({ data, form, onEdit, onDelete }: Props) {
	return (
		<div className="time-tracker-page">
			<StatsCards entries={data.entries} />
			<ActivityForm data={data} state={form} />
			<ActivityList entries={data.entries} onEdit={onEdit} onDelete={onDelete} />
		</div>
	);
}
