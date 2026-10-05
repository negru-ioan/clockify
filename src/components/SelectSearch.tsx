import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { fuzzyFilter } from "../lib/fuzzy";
import "./SelectSearch.css";

export type SelectSearchOption = { value: string; label: string };
type Props = {
	label: string;
	name?: string;
	value: string;
	options: SelectSearchOption[];
	onChange: (value: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	error?: string;
	disabled?: boolean;
	required?: boolean;
};

export function SelectSearch({ label, name, value, options, onChange, onBlur, placeholder = "Select an option", error, disabled, required }: Props) {
	const id = useId();
	const wrapper = useRef<HTMLDivElement>(null);
	const input = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const selected = options.find((option) => option.value === value);
	const matches = useMemo(
		() =>
			fuzzyFilter(query.trim(), options, {
				extract: (option) => option.label,
			}).map((match) => match.original),
		[query, options],
	);

	useEffect(() => {
		if (open) wrapper.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
	}, [active, open, query]);

	useEffect(() => {
		if (!open) return;
		const outside = (event: PointerEvent) => {
			if (!wrapper.current?.contains(event.target as Node)) {
				setOpen(false);
				setQuery("");
				onBlur?.();
			}
		};
		document.addEventListener("pointerdown", outside);
		return () => document.removeEventListener("pointerdown", outside);
	}, [open, onBlur]);

	function choose(option: SelectSearchOption) {
		onChange(option.value);
		setOpen(false);
		setQuery("");
		input.current?.focus();
	}

	return (
		<div
			className="select-search"
			ref={wrapper}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node)) {
					setOpen(false);
					setQuery("");
					onBlur?.();
				}
			}}>
			<label htmlFor={id}>{label}</label>
			<div className={`select-search-control${error ? " invalid" : ""}`}>
				<input
					ref={input}
					id={id}
					name={name}
					role="combobox"
					autoComplete="off"
					disabled={disabled}
					aria-expanded={open}
					aria-controls={`${id}-options`}
					aria-autocomplete="list"
					aria-activedescendant={open && matches[active] ? `${id}-option-${active}` : undefined}
					aria-invalid={!!error}
					aria-describedby={error ? `${id}-error` : undefined}
					aria-
					placeholder={open ? "Search options…" : placeholder}
					value={open ? query : selected?.label || ""}
					onClick={() => {
						setOpen(true);
						setActive(0);
					}}
					onChange={(event) => {
						setQuery(event.target.value);
						setOpen(true);
						setActive(0);
					}}
					onKeyDown={(event) => {
						if (event.key === "ArrowDown" || event.key === "ArrowUp") {
							event.preventDefault();
							if (!open) {
								setOpen(true);
								setActive(0);
							} else setActive((index) => Math.max(0, Math.min(matches.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
						} else if (event.key === "Enter") {
							event.preventDefault();
							if (open && matches[active]) choose(matches[active]);
							else if (!open) {
								setOpen(true);
								setActive(0);
							}
						} else if (event.key === "Escape") {
							event.preventDefault();
							setOpen(false);
							setQuery("");
						}
					}}
				/>
				<ChevronDown size={16} className={open ? "open" : ""} />
			</div>
			{open && !disabled && (
				<div className="select-search-menu" id={`${id}-options`} role="listbox" aria-label={`${label} options`}>
					{matches.length ? (
						matches.map((option, index) => (
							<div
								key={option.value}
								id={`${id}-option-${index}`}
								role="option"
								aria-selected={option.value === value}
								data-active={index === active}
								onPointerDown={(event) => event.preventDefault()}
								onPointerMove={() => setActive(index)}
								onClick={() => choose(option)}>
								<span>{option.label}</span>
								{option.value === value && <Check size={14} />}
							</div>
						))
					) : (
						<div className="select-search-empty" role="status">
							No matching options
						</div>
					)}
				</div>
			)}
			{error && (
				<small className="error" id={`${id}-error`}>
					{error}
				</small>
			)}
		</div>
	);
}
