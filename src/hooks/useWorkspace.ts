import { useCallback, useEffect, useState } from "react";
import type { Data } from "../types";

export function useWorkspace() {
	const [data, setData] = useState<Data>({
		clients: [],
		projects: [],
		entries: [],
	});
	const [message, setMessage] = useState("");
	const reload = useCallback(async () => {
		const response = await fetch("/api/data");
		if (!response.ok) throw new Error("Server unavailable. Please try again.");
		setData(await response.json());
	}, []);
	useEffect(() => {
		void reload().catch((error) => setMessage(error.message));
	}, [reload]);
	return { data, reload, message, notify: setMessage };
}
