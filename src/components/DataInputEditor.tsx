import React, { useState } from 'react';
import { Check, FileSpreadsheet, Upload } from 'lucide-react';

interface DataInputEditorProps {
  title?: string;
  placeholder: string;
  value: string;
  onApply: (raw: string) => void;
  samples?: Array<{ label: string; csv: string }>;
}

export const DataInputEditor: React.FC<DataInputEditorProps> = ({
  title = 'Real Data Input (CSV / TSV / JSON)',
  placeholder,
  value,
  onApply,
  samples,
}) => {
  const [draft, setDraft] = useState(value);
  const [appliedFlash, setAppliedFlash] = useState(false);

  // Sync draft when switching selected block
  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const triggerApply = (rawText: string) => {
    setDraft(rawText);
    onApply(rawText);
    setAppliedFlash(true);
    setTimeout(() => setAppliedFlash(false), 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        triggerApply(reader.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800/90 dark:bg-zinc-950/80">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
          <FileSpreadsheet className="h-3.5 w-3.5 text-amber-600 dark:text-[#FFD100]" />
          {title}
        </span>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
          <Upload className="h-3 w-3" />
          Import CSV/JSON
          <input
            type="file"
            accept=".csv,.tsv,.txt,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <textarea
        rows={5}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-[11px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-[#FFD100] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100 dark:placeholder:text-zinc-600"
      />

      {samples && samples.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {samples.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => triggerApply(s.csv)}
              className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => triggerApply(draft)}
        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#FFD100] py-1.5 text-[11px] font-semibold text-[#09090B] transition-colors hover:bg-[#ffe033]"
      >
        {appliedFlash ? (
          <>
            <Check className="h-3.5 w-3.5" /> Data Drawn on Canvas
          </>
        ) : (
          'Draw From Real Data'
        )}
      </button>
    </div>
  );
};
