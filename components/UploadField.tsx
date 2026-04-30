"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  UploadField Component
import { useRef, useState, useCallback } from "react";

interface UploadFieldProps {
  id?: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onChange: (file: File | null) => void;
  error?: string;
}

export default function UploadField({
  id = "upload-field",
  label = "Joindre un document",
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  maxSizeMB = 10,
  onChange,
  error,
}: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validate = useCallback(
    (f: File): string | null => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (f.size > maxBytes) return `Fichier trop volumineux (max ${maxSizeMB} Mo)`;
      const allowed = accept.split(",").map((a) => a.trim().toLowerCase());
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      if (!allowed.includes(ext)) return `Type non accepté. Formats : ${accept}`;
      return null;
    },
    [accept, maxSizeMB]
  );

  const handleFile = useCallback(
    (f: File) => {
      const err = validate(f);
      if (err) {
        setLocalError(err);
        onChange(null);
        return;
      }
      setLocalError(null);
      setFile(f);
      onChange(f);
    },
    [validate, onChange]
  );

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const remove = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent label from re-opening file dialog
    setFile(null);
    setLocalError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayError = error || localError;

  // ── File selected state ──
  if (file) {
    const isImage = file.type.startsWith("image/");
    const sizeKB = (file.size / 1024).toFixed(0);

    return (
      <div className="space-y-1.5">
        <p className="label">{label}</p>
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-3 animate-fade-in">
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt="Aperçu"
              className="h-12 w-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
              <svg className="h-6 w-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--fg)]">{file.name}</p>
            <p className="text-xs text-[var(--fg-muted)]">{sizeKB} Ko</p>
          </div>
          <button
            type="button"
            onClick={remove}
            id={`${id}-remove`}
            className="btn-icon btn text-[var(--fg-muted)] hover:text-danger hover:bg-danger/10"
            aria-label="Supprimer le fichier"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── Empty / drop zone state ──
  // FIX: use <label htmlFor> instead of div+onClick so clicking always opens
  // the native file dialog (no programmatic .click() needed).
  return (
    <div className="space-y-1.5">
      <p className="label">{label}</p>

      {/* Hidden file input — rendered OUTSIDE the label to avoid double-open */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
        // Prevent any click on the input itself from bubbling up to the form
        onClick={(e) => e.stopPropagation()}
      />

      <label
        htmlFor={id}
        id={`${id}-dropzone`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
        onDragLeave={(e) => { e.stopPropagation(); setDragging(false); }}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? "border-primary-500 bg-primary-500/5 scale-[1.01]"
            : displayError
            ? "border-danger/50 bg-danger/5"
            : "border-[var(--border)] hover:border-primary-500/50 hover:bg-primary-500/5"
          }`}
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200
          ${dragging ? "bg-primary-500/20" : "bg-[var(--surface)] border border-[var(--border)]"}`}
        >
          <svg
            className={`h-5 w-5 transition-colors ${dragging ? "text-primary-500" : "text-[var(--fg-muted)]"}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--fg)]">
            {dragging ? "Relâchez pour déposer" : "Glissez-déposez ou cliquez"}
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">
            {accept.toUpperCase().replace(/\./g, "").replace(/,/g, ", ")} — max {maxSizeMB} Mo
          </p>
        </div>
      </label>

      {displayError && (
        <p className="form-error">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {displayError}
        </p>
      )}
    </div>
  );
}
