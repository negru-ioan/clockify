export const today = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const fmt = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });
export const dateLabel = (s: string) =>
	new Date(s + "T12:00:00").toLocaleDateString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});
