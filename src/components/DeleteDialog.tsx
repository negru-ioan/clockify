import { useState } from "react";
import "./Dialogs.css";

export function DeleteDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="overlay">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
      >
        <h2 id="delete-title">Delete this activity?</h2>
        <p>This activity will be removed from your local database.</p>
        <button className="secondary" disabled={deleting} onClick={onClose}>
          Cancel
        </button>
        <button
          className="primary"
          disabled={deleting}
          onClick={async () => {
            setDeleting(true);
            try {
              await onConfirm();
            } finally {
              setDeleting(false);
            }
          }}
        >
          {deleting ? "Deleting…" : "Delete activity"}
        </button>
      </section>
    </div>
  );
}
