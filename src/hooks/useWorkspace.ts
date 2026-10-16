import { useCallback, useEffect, useRef, useState } from "react";
import type { Data } from "../types";

export function useWorkspace() {
	const [data, setData] = useState<Data>({
		clients: [],
		projects: [],
		entries: [],
	});
	const [message, setMessage] = useState("");
	const notificationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const notify = useCallback((text: string) => {
		clearTimeout(notificationTimer.current);
		setMessage(text);
		if (text) {
			notificationTimer.current = setTimeout(() => setMessage(""), 4000);
		}
	}, []);
	useEffect(() => () => clearTimeout(notificationTimer.current), []);
	const reload = useCallback(async () => {
		const response = await fetch("/api/data");
		if (!response.ok) throw new Error("Server unavailable. Please try again.");
		setData(await response.json());
	}, []);
	useEffect(() => {
		void reload().catch((error) => notify(error.message));
	}, [reload, notify]);
	return { data, reload, message, notify };
}
