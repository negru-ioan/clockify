import { useEffect, useId, useRef, useState } from "react";
import type { Entry } from "../types";
import { suggestTasks } from "../lib/taskSuggestions";
import "./DescriptionSearch.css";

type Props = {
  value: string;
  entries: Entry[];
  excludeId?: number;
  onChange: (value: string) => void;
  onSelect: (entry: Entry) => void;
  onBlur: () => void;
  error?: string;
};
export function DescriptionSearch({
  value,
  entries,
  excludeId,
  onChange,
  onSelect,
  onBlur,
  error,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const suggestions = suggestTasks(value, entries, excludeId);
  const visible = open && suggestions.length > 0;
  useEffect(() => {
    if (visible)
      wrapper.current
        ?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" });
  }, [active, visible]);
  function choose(entry: Entry) {
    onSelect(entry);
    setOpen(false);
  }
  return (
    <div
      className="description-search"
      ref={wrapper}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false);
          onBlur();
        }
      }}
    >
      <label htmlFor={id}>Activity description</label>
      <input
        id={id}
        name="description"
        role="combobox"
        autoComplete="off"
        aria-expanded={visible}
        aria-controls={`${id}-suggestions`}
        aria-autocomplete="list"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-activedescendant={
          visible && suggestions[active] ? `${id}-option-${active}` : undefined
        }
        placeholder="What did you work on? E.g. OM-9235 - OCM 2222: Light endorsements"
        value={value}
        onFocus={() => {
          setActive(0);
          setOpen(true);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              Math.max(
                0,
                Math.min(
                  suggestions.length - 1,
                  index + (event.key === "ArrowDown" ? 1 : -1),
                ),
              ),
            );
          } else if (event.key === "Enter" && visible && suggestions[active]) {
            event.preventDefault();
            choose(suggestions[active]);
          }
        }}
      />
      {visible && (
        <div
          className="description-suggestions"
          role="listbox"
          id={`${id}-suggestions`}
          aria-label="Previous tasks"
        >
          <div className="description-suggestions-heading">
            Reuse a previous task · date and times stay unchanged
          </div>
          {suggestions.map((entry, index) => (
            <div
              key={entry.id}
              role="option"
              id={`${id}-option-${index}`}
              aria-selected={active === index}
              data-active={active === index}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(entry)}
            >
              <strong>{entry.description}</strong>
              <small>
                {entry.client} · {entry.projectName} · {entry.tag} ·{" "}
                {entry.user}
              </small>
            </div>
          ))}
        </div>
      )}
      {error && (
        <small id={`${id}-error`} className="error">
          {error}
        </small>
      )}
    </div>
  );
}
